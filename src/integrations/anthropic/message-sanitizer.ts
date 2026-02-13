import type {
  ChatMessage,
  ContentBlock,
  McpToolResultBlock,
  McpToolUseBlock,
} from "@/lib/types";

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

const KEEP_RECENT_MESSAGES_FULL = 4;

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
