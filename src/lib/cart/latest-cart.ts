import type { ChatMessage, CartState, ContentBlock, McpToolUseBlock } from "@/lib/types";
import { findPrecedingToolName } from "@/lib/content-blocks";
import { parseToolResult } from "@/lib/parsers";
import { logger } from "@/lib/logger";

const RECONCILIATION_VERTICALS = new Set(["food", "style", "foodorder"]);
const ADD_LIKE_TOOL_RE = /\b(add|insert|append)\b|add[_-]?item|add[_-]?to[_-]?cart/i;

interface CartSnapshot {
  cart: CartState;
  toolName: string;
  toolInput?: Record<string, unknown>;
}

function normalizeName(value: string | undefined): string {
  return (value || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function isLikelySyntheticId(id: string | undefined): boolean {
  if (!id) return true;
  return /^\d+$/.test(id.trim());
}

function findMatchingCartItemIndex(
  items: CartState["items"],
  target: CartState["items"][number],
): number {
  const targetId = target.id?.trim();
  const targetName = normalizeName(target.name);
  if (!targetName) return -1;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const itemId = item.id?.trim();
    const itemName = normalizeName(item.name);
    if (!itemName) continue;

    if (targetId && itemId && targetId === itemId) {
      if (itemName === targetName) return i;
      if (!isLikelySyntheticId(targetId) && !isLikelySyntheticId(itemId)) {
        return i;
      }
    }
  }

  for (let i = 0; i < items.length; i++) {
    if (normalizeName(items[i].name) === targetName) return i;
  }

  return -1;
}

function hasMissingPreviousItems(previous: CartState, latest: CartState): boolean {
  if (previous.items.length === 0 || latest.items.length === 0) return false;
  return previous.items.some((item) => findMatchingCartItemIndex(latest.items, item) === -1);
}

function isAddLikeTool(
  toolName: string,
  toolInput?: Record<string, unknown>,
): boolean {
  if (ADD_LIKE_TOOL_RE.test(toolName)) return true;

  const action =
    (typeof toolInput?.action === "string" && toolInput.action) ||
    (typeof toolInput?.operation === "string" && toolInput.operation) ||
    "";
  return /\b(add|append|increment|increase)\b/i.test(action);
}

function mergeAddDeltaCart(previous: CartState, latest: CartState): CartState {
  const mergedItems = previous.items.map((item) => ({ ...item }));

  for (const item of latest.items) {
    const matchIndex = findMatchingCartItemIndex(mergedItems, item);
    if (matchIndex === -1) {
      mergedItems.push({ ...item });
      continue;
    }

    const existing = mergedItems[matchIndex];
    mergedItems[matchIndex] = {
      ...existing,
      ...item,
      quantity: Math.max(existing.quantity, item.quantity),
      price: item.price > 0 ? item.price : existing.price,
      image: item.image || existing.image,
    };
  }

  const subtotal = mergedItems.reduce(
    (sum, item) => sum + Math.max(0, item.price) * Math.max(0, item.quantity),
    0,
  );
  const deliveryFee = Number.isFinite(latest.deliveryFee)
    ? Math.max(0, latest.deliveryFee)
    : Math.max(0, previous.deliveryFee);
  const fallbackTotal = subtotal + deliveryFee;
  const total = Number.isFinite(latest.total)
    ? Math.max(fallbackTotal, latest.total)
    : fallbackTotal;

  return {
    items: mergedItems,
    subtotal,
    deliveryFee,
    total,
  };
}

/**
 * Finds the most recent authoritative cart snapshot in assistant tool results.
 * Never throws; returns null when no cart payload can be parsed.
 */
export function findLatestCartState(
  messages: ChatMessage[],
  verticalId: string,
): CartState | null {
  const snapshots: CartSnapshot[] = [];

  for (let i = 0; i < messages.length; i++) {
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

    for (let j = 0; j < blocks.length; j++) {
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
        snapshots.push({
          cart: parsed.cart,
          toolName,
          toolInput,
        });
      }
    }
  }

  if (snapshots.length === 0) return null;
  if (!RECONCILIATION_VERTICALS.has(verticalId)) {
    return snapshots[snapshots.length - 1]?.cart ?? null;
  }

  let resolvedCart = snapshots[0]!.cart;
  for (let i = 1; i < snapshots.length; i++) {
    const snapshot = snapshots[i]!;
    const nextCart = snapshot.cart;
    if (
      isAddLikeTool(snapshot.toolName, snapshot.toolInput) &&
      hasMissingPreviousItems(resolvedCart, nextCart)
    ) {
      resolvedCart = mergeAddDeltaCart(resolvedCart, nextCart);
      continue;
    }
    resolvedCart = nextCart;
  }

  return resolvedCart;
}
