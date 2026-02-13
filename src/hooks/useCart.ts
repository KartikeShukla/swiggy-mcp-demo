import { useMemo, useState } from "react";
import type { ChatMessage, CartState, ContentBlock, McpToolUseBlock } from "@/lib/types";
import { findPrecedingToolName } from "@/lib/content-blocks";
import { logger } from "@/lib/logger";
import { parseToolResult } from "@/lib/parsers";

export function useCart(messages: ChatMessage[], verticalId: string) {
  const cart = useMemo(
    () => findLatestCartState(messages, verticalId),
    [messages, verticalId],
  );
  const [isOpen, setIsOpen] = useState(false);

  const itemCount = cart?.items.reduce((sum, i) => sum + i.quantity, 0) ?? 0;

  return { cart, isOpen, setIsOpen, itemCount };
}

function findLatestCartState(
  messages: ChatMessage[],
  verticalId: string,
): CartState | null {
  // Scan messages in reverse to find the most recent cart-related tool result
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
      logger.debug("[useCart] Checking tool result", {
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
