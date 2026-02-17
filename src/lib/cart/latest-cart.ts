import type { ChatMessage, CartState, ContentBlock, McpToolUseBlock } from "@/lib/types";
import { findPrecedingToolName } from "@/lib/content-blocks";
import { parseToolResult } from "@/lib/parsers";
import { logger } from "@/lib/logger";

/**
 * Finds the most recent authoritative cart snapshot in assistant tool results.
 * Never throws; returns null when no cart payload can be parsed.
 */
export function findLatestCartState(
  messages: ChatMessage[],
  verticalId: string,
): CartState | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    if (msg.role !== "assistant" || typeof msg.content === "string") continue;

    const blocks = msg.content as ContentBlock[];
    const toolUseById = new Map<string, McpToolUseBlock>();
    for (const block of blocks) {
      if (block.type !== "mcp_tool_use") continue;
      const id = block.id?.trim();
      if (!id) continue;
      toolUseById.set(id, block);
    }

    for (let j = blocks.length - 1; j >= 0; j--) {
      const block = blocks[j];
      if (block.type !== "mcp_tool_result") continue;

      const useId = block.tool_use_id?.trim();
      const matchedUse = useId ? toolUseById.get(useId) : undefined;
      const toolName = matchedUse?.name ?? findPrecedingToolName(blocks, j);
      const toolInput = matchedUse?.input;

      const parsed = parseToolResult(toolName, block.content, verticalId, toolInput);
      logger.debug("[Cart Snapshot] Checking tool result", {
        toolName,
        parsedType: parsed.type,
        hasCart: parsed.type === "cart",
        messageIndex: i,
        blockIndex: j,
      });
      if (parsed.type === "cart") {
        return parsed.cart;
      }
    }
  }

  return null;
}
