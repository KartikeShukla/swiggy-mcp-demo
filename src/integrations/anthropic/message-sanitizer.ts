import type {
  ChatMessage,
  ContentBlock,
  McpToolResultBlock,
  McpToolUseBlock,
} from "@/lib/types";
import {
  KEEP_RECENT_MESSAGES_FULL,
  MAX_OLD_USER_MESSAGE_CHARS,
} from "@/lib/constants";
import { smartTruncateJsonContent, extractQueryFromToolInput, MAX_TOOL_RESULT_CHARS } from "./tool-result-truncation";

export interface BlockSanitizeResult {
  blocks: ContentBlock[];
  droppedBlocksCount: number;
}

export interface MessageSanitizeResult {
  sanitizedMessages: ChatMessage[];
  droppedBlocksCount: number;
}

function isToolUse(block: ContentBlock): block is McpToolUseBlock {
  return block.type === "mcp_tool_use";
}

function isToolResult(block: ContentBlock): block is McpToolResultBlock {
  return block.type === "mcp_tool_result";
}

function incrementCount(map: Map<string, number>, id: string): void {
  map.set(id, (map.get(id) ?? 0) + 1);
}

/**
 * Ensures every `mcp_tool_use` block has a matching `mcp_tool_result` and
 * vice-versa, using a two-pass pairing algorithm.
 *
 * **Pass 1 (forward scan):** counts the total `mcp_tool_result` blocks per
 * `tool_use_id` so we know how many results are available.
 *
 * **Pass 2 (forward scan):** walks blocks in order.  For each `tool_use`,
 * it is kept only if at least one unmatched result still exists for that id
 * (reserving a slot via `openUses`).  For each `tool_result`, it is kept
 * only if a prior `tool_use` reserved a slot for it.  Text blocks always
 * pass through.
 *
 * Blocks that fail pairing are counted in `droppedBlocksCount` so callers
 * can detect and log sanitization activity.
 */
export function sanitizeAssistantBlocks(blocks: ContentBlock[]): BlockSanitizeResult {
  const remainingResults = new Map<string, number>();
  for (const block of blocks) {
    if (!isToolResult(block)) continue;
    const id = block.tool_use_id?.trim();
    if (!id) continue;
    incrementCount(remainingResults, id);
  }

  const openUses = new Map<string, number>();
  const sanitized: ContentBlock[] = [];
  let droppedBlocksCount = 0;

  for (const block of blocks) {
    if (block.type === "text") {
      sanitized.push(block);
      continue;
    }

    if (isToolUse(block)) {
      const id = block.id?.trim();
      if (!id) {
        droppedBlocksCount++;
        continue;
      }

      const remaining = remainingResults.get(id) ?? 0;
      const open = openUses.get(id) ?? 0;
      // Reserve only if there is at least one future result left for this use id.
      if (remaining - open <= 0) {
        droppedBlocksCount++;
        continue;
      }

      openUses.set(id, open + 1);
      sanitized.push(block);
      continue;
    }

    if (isToolResult(block)) {
      const id = block.tool_use_id?.trim();
      if (!id) {
        droppedBlocksCount++;
        continue;
      }

      const remaining = remainingResults.get(id) ?? 0;
      if (remaining > 0) {
        remainingResults.set(id, remaining - 1);
      }

      const open = openUses.get(id) ?? 0;
      if (open <= 0) {
        droppedBlocksCount++;
        continue;
      }

      openUses.set(id, open - 1);
      sanitized.push(block);
      continue;
    }
  }

  return { blocks: sanitized, droppedBlocksCount };
}

/**
 * Strips tool_use and tool_result blocks from older assistant messages,
 * keeping only their text content to reduce token usage.
 *
 * Messages within the `keepRecent` tail of the array are left untouched.
 * For older assistant messages with block-array content, tool blocks are
 * removed.  If no text blocks remain after removal, a placeholder
 * `"[Earlier tool interaction]"` text block is inserted so the message
 * stays valid for the API.
 *
 * User messages and string-content assistant messages are never modified.
 */
export function compactOldMessages(
  messages: ChatMessage[],
  keepRecent = KEEP_RECENT_MESSAGES_FULL,
): ChatMessage[] {
  if (messages.length <= keepRecent) return messages;

  const cutoff = messages.length - keepRecent;
  const result: ChatMessage[] = [];

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];

    if (i >= cutoff || msg.role !== "assistant" || typeof msg.content === "string") {
      result.push(msg);
      continue;
    }

    const textBlocks = msg.content.filter(
      (block): block is ContentBlock & { type: "text" } => block.type === "text",
    );

    if (textBlocks.length === msg.content.length) {
      result.push(msg);
      continue;
    }

    const compacted: ContentBlock[] = textBlocks.length > 0
      ? textBlocks
      : [{ type: "text" as const, text: "[Earlier tool interaction]" }];

    result.push({ ...msg, content: compacted });
  }

  return result;
}

function compactTextMessageContent(content: string, maxChars: number): string {
  const normalized = content.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxChars) return normalized;
  return `${normalized.slice(0, maxChars - 1)}…`;
}

/**
 * Truncates the text of older user messages to `maxChars` characters to
 * reduce context window consumption.
 *
 * Messages within the `keepRecent` tail are preserved verbatim.  For
 * older user messages with string content, whitespace is first normalized
 * to single spaces, then the text is truncated with a trailing ellipsis
 * if it exceeds `maxChars`.
 *
 * Non-user messages and messages with block-array content are left as-is.
 * Returns the original array reference if no truncation was needed.
 */
export function compactOldUserMessages(
  messages: ChatMessage[],
  options?: {
    keepRecent?: number;
    maxChars?: number;
  },
): ChatMessage[] {
  const keepRecent = Math.max(0, options?.keepRecent ?? KEEP_RECENT_MESSAGES_FULL);
  const maxChars = Math.max(40, options?.maxChars ?? MAX_OLD_USER_MESSAGE_CHARS);
  if (messages.length <= keepRecent) return messages;

  const cutoff = messages.length - keepRecent;
  let changed = false;
  const compacted = messages.map((message, index) => {
    if (index >= cutoff || message.role !== "user" || typeof message.content !== "string") {
      return message;
    }

    const nextContent = compactTextMessageContent(message.content, maxChars);
    if (nextContent === message.content) return message;
    changed = true;
    return { ...message, content: nextContent };
  });

  return changed ? compacted : messages;
}

/**
 * Truncates oversized `mcp_tool_result` payloads within assistant messages
 * using query-aware relevance scoring.
 *
 * For each assistant message (outside the optional `preserveRecentToolResultMessages`
 * tail), tool result blocks whose content exceeds `MAX_TOOL_RESULT_CHARS` are
 * passed through `smartTruncateJsonContent`.  The truncation strategy:
 * 1. Extracts query terms from the paired `mcp_tool_use` input.
 * 2. Scores each item in the JSON array by how many query terms appear in
 *    its searchable fields (name, brand, cuisine, etc.).
 * 3. Greedily selects highest-scoring items that fit within the character
 *    budget, preserving original order.
 *
 * Both string-typed and array-of-text-block-typed result content are handled.
 * Returns the original array reference if no truncation was needed.
 */
export function truncateToolResultsInMessages(
  messages: ChatMessage[],
  options?: {
    preserveRecentToolResultMessages?: number;
  },
): ChatMessage[] {
  const preserveRecentToolResultMessages = Math.max(
    0,
    options?.preserveRecentToolResultMessages ?? 0,
  );
  let changed = false;
  const result: ChatMessage[] = [];
  const assistantIndexesWithToolResults: number[] = [];

  for (let index = 0; index < messages.length; index++) {
    const msg = messages[index];
    if (msg.role !== "assistant" || typeof msg.content === "string") continue;
    if (msg.content.some((block) => block.type === "mcp_tool_result")) {
      assistantIndexesWithToolResults.push(index);
    }
  }

  const preservedMessageIndexes = new Set(
    assistantIndexesWithToolResults.slice(
      Math.max(0, assistantIndexesWithToolResults.length - preserveRecentToolResultMessages),
    ),
  );

  for (let messageIndex = 0; messageIndex < messages.length; messageIndex++) {
    const msg = messages[messageIndex];
    if (msg.role !== "assistant" || typeof msg.content === "string") {
      result.push(msg);
      continue;
    }

    // Build map of tool_use_id → input from mcp_tool_use blocks in this message
    const toolInputMap = new Map<string, Record<string, unknown> | undefined>();
    for (const block of msg.content) {
      if (isToolUse(block)) {
        toolInputMap.set(block.id, block.input);
      }
    }

    let msgChanged = false;
    const truncatedBlocks: ContentBlock[] = [];

    for (const block of msg.content) {
      if (block.type !== "mcp_tool_result") {
        truncatedBlocks.push(block);
        continue;
      }

      if (preservedMessageIndexes.has(messageIndex)) {
        truncatedBlocks.push(block);
        continue;
      }

      const queryTerms = extractQueryFromToolInput(toolInputMap.get(block.tool_use_id));
      const { content } = block;

      if (typeof content === "string") {
        if (content.length > MAX_TOOL_RESULT_CHARS) {
          truncatedBlocks.push({ ...block, content: smartTruncateJsonContent(content, queryTerms) });
          msgChanged = true;
        } else {
          truncatedBlocks.push(block);
        }
        continue;
      }

      if (Array.isArray(content)) {
        let arrayChanged = false;
        const mapped = (content as Array<Record<string, unknown>>).map((tb) => {
          if (
            typeof tb === "object" &&
            tb.type === "text" &&
            typeof tb.text === "string" &&
            tb.text.length > MAX_TOOL_RESULT_CHARS
          ) {
            arrayChanged = true;
            return { ...tb, text: smartTruncateJsonContent(tb.text as string, queryTerms) };
          }
          return tb;
        });
        if (arrayChanged) {
          truncatedBlocks.push({ ...block, content: mapped });
          msgChanged = true;
        } else {
          truncatedBlocks.push(block);
        }
        continue;
      }

      truncatedBlocks.push(block);
    }

    if (msgChanged) {
      result.push({ ...msg, content: truncatedBlocks });
      changed = true;
    } else {
      result.push(msg);
    }
  }

  return changed ? result : messages;
}

/**
 * Entry point for message sanitization before sending to the Anthropic API.
 *
 * Iterates over all messages and applies `sanitizeAssistantBlocks` to each
 * assistant message with block-array content, removing orphaned tool_use
 * and tool_result blocks that would cause API validation errors.
 *
 * User messages and string-content assistant messages pass through unchanged.
 * Returns the sanitized message array along with a total count of dropped
 * blocks for diagnostics.
 */
export function sanitizeMessagesForApi(messages: ChatMessage[]): MessageSanitizeResult {
  const sanitizedMessages: ChatMessage[] = [];
  let droppedBlocksCount = 0;

  for (const message of messages) {
    if (message.role !== "assistant" || typeof message.content === "string") {
      sanitizedMessages.push(message);
      continue;
    }

    const result = sanitizeAssistantBlocks(message.content);
    droppedBlocksCount += result.droppedBlocksCount;
    if (result.droppedBlocksCount === 0) {
      sanitizedMessages.push(message);
      continue;
    }

    sanitizedMessages.push({
      ...message,
      content: result.blocks,
    });
  }

  return { sanitizedMessages, droppedBlocksCount };
}
