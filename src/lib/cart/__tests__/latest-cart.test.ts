import type { CartItem, ChatMessage, ContentBlock } from "@/lib/types";
import { findLatestCartState } from "@/lib/cart/latest-cart";

function buildCartPayload(items: CartItem[]) {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  return {
    cart: {
      items,
      subtotal,
      delivery_fee: 0,
      total: subtotal,
    },
  };
}

function assistantCartMessage(toolName: string, payload: unknown, timestamp: number): ChatMessage {
  const blocks: ContentBlock[] = [
    { type: "mcp_tool_use", id: `u-${timestamp}`, name: toolName },
    { type: "mcp_tool_result", tool_use_id: `u-${timestamp}`, content: payload },
  ];
  return {
    role: "assistant",
    content: blocks,
    timestamp,
  };
}

function getQuantitiesByName(items: CartItem[]): Record<string, number> {
  return Object.fromEntries(items.map((item) => [item.name, item.quantity]));
}

describe("findLatestCartState", () => {
  it.each(["food", "style", "foodorder"] as const)(
    "merges partial add snapshots for %s",
    (verticalId) => {
      const messages: ChatMessage[] = [
        assistantCartMessage(
          "get_cart",
          buildCartPayload([
            { id: "a1", name: "Apple", price: 50, quantity: 1 },
          ]),
          1,
        ),
        assistantCartMessage(
          "add_item",
          buildCartPayload([
            { id: "b1", name: "Banana", price: 30, quantity: 1 },
          ]),
          2,
        ),
      ];

      const cart = findLatestCartState(messages, verticalId);
      expect(cart).not.toBeNull();
      expect(cart?.items).toHaveLength(2);
      expect(getQuantitiesByName(cart!.items)).toEqual({
        Apple: 1,
        Banana: 1,
      });
    },
  );

  it("does not force additive merge for non-add cart tools", () => {
    const messages: ChatMessage[] = [
      assistantCartMessage(
        "get_cart",
        buildCartPayload([
          { id: "a1", name: "Apple", price: 50, quantity: 1 },
          { id: "b1", name: "Banana", price: 30, quantity: 1 },
        ]),
        1,
      ),
      assistantCartMessage(
        "update_item",
        buildCartPayload([
          { id: "a1", name: "Apple", price: 50, quantity: 2 },
        ]),
        2,
      ),
    ];

    const cart = findLatestCartState(messages, "food");
    expect(cart).not.toBeNull();
    expect(cart?.items).toHaveLength(1);
    expect(cart?.items[0]).toMatchObject({ name: "Apple", quantity: 2 });
  });

  it("keeps legacy latest-snapshot behavior for non-cart verticals", () => {
    const messages: ChatMessage[] = [
      assistantCartMessage(
        "get_cart",
        buildCartPayload([
          { id: "a1", name: "Apple", price: 50, quantity: 1 },
        ]),
        1,
      ),
      assistantCartMessage(
        "add_item",
        buildCartPayload([
          { id: "b1", name: "Banana", price: 30, quantity: 1 },
        ]),
        2,
      ),
    ];

    const cart = findLatestCartState(messages, "dining");
    expect(cart).not.toBeNull();
    expect(cart?.items).toHaveLength(1);
    expect(cart?.items[0]).toMatchObject({ name: "Banana", quantity: 1 });
  });
});
