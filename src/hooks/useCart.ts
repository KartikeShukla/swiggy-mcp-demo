import { useMemo, useState } from "react";
import type { ChatMessage, CartState, ContentBlock } from "@/lib/types";
import { findPrecedingToolName } from "@/lib/content-blocks";
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
    for (let j = blocks.length - 1; j >= 0; j--) {
      const block = blocks[j];
      if (block.type !== "mcp_tool_result") continue;

      // Find the preceding tool_use to get the tool name
      const toolName = findPrecedingToolName(blocks, j);
      if (!/cart|basket/i.test(toolName)) continue;

      const parsed = parseToolResult(toolName, block.content, verticalId);
      if (parsed.type === "cart") {
        return parsed.cart;
      }
    }
  }
  return null;
}
