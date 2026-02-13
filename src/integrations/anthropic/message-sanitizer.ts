import type {
  ChatMessage,
  ContentBlock,
  McpToolResultBlock,
  McpToolUseBlock,
} from "@/lib/types";
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

const KEEP_RECENT_MESSAGES_FULL = 2;

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

export function truncateToolResultsInMessages(
  messages: ChatMessage[],
): ChatMessage[] {
  let changed = false;
  const result: ChatMessage[] = [];

  for (const msg of messages) {
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
