import { vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useCart } from "@/hooks/useCart";
import type { ChatMessage, ContentBlock, CartState } from "@/lib/types";

/* ------------------------------------------------------------------ */
/*  Mock the heavy parseToolResult so we control what it returns       */
/* ------------------------------------------------------------------ */

vi.mock("@/lib/parsers", () => ({
  parseToolResult: vi.fn(),
}));

import { parseToolResult } from "@/lib/parsers";
const mockedParseToolResult = vi.mocked(parseToolResult);

beforeEach(() => {
  vi.clearAllMocks();
});

/* ------------------------------------------------------------------ */
/*  helpers                                                            */
/* ------------------------------------------------------------------ */

function makeCartMessage(toolName: string, cart: CartState): ChatMessage {
  const blocks: ContentBlock[] = [
    { type: "mcp_tool_use", id: "tu-1", name: toolName },
    { type: "mcp_tool_result", tool_use_id: "tu-1", content: { cart } },
  ];
  return { role: "assistant", content: blocks, timestamp: Date.now() };
}

const sampleCart: CartState = {
  items: [
    { id: "i1", name: "Milk", price: 50, quantity: 2 },
    { id: "i2", name: "Bread", price: 30, quantity: 1 },
  ],
  subtotal: 130,
  deliveryFee: 20,
  total: 150,
};

/* ------------------------------------------------------------------ */
/*  tests                                                              */
/* ------------------------------------------------------------------ */

describe("useCart", () => {
  it("returns null cart and zero itemCount when messages are empty", () => {
    const { result } = renderHook(() => useCart([], "instamart"));
    expect(result.current.cart).toBeNull();
    expect(result.current.itemCount).toBe(0);
  });

  it("returns null cart when messages contain no cart tool results", () => {
    const messages: ChatMessage[] = [
      { role: "user", content: "show me milk", timestamp: 1 },
      {
        role: "assistant",
        content: [{ type: "text", text: "Here is milk" }],
        timestamp: 2,
      },
    ];
    const { result } = renderHook(() => useCart(messages, "instamart"));
    expect(result.current.cart).toBeNull();
    expect(result.current.itemCount).toBe(0);
  });

  it("extracts cart when a cart tool result is present", () => {
    mockedParseToolResult.mockReturnValue({ type: "cart", cart: sampleCart });

    const messages: ChatMessage[] = [makeCartMessage("get_cart", sampleCart)];
    const { result } = renderHook(() => useCart(messages, "instamart"));

    expect(result.current.cart).toEqual(sampleCart);
    expect(result.current.itemCount).toBe(3); // 2 + 1
  });

  it("picks the latest cart from multiple messages", () => {
    const olderCart: CartState = {
      items: [{ id: "i1", name: "Milk", price: 50, quantity: 1 }],
      subtotal: 50,
      deliveryFee: 20,
      total: 70,
    };
    const newerCart: CartState = {
      items: [
        { id: "i1", name: "Milk", price: 50, quantity: 3 },
        { id: "i3", name: "Eggs", price: 60, quantity: 1 },
      ],
      subtotal: 210,
      deliveryFee: 20,
      total: 230,
    };

    // The hook scans in reverse, so the second call to parseToolResult is
    // actually the first message checked (the newer one).
    mockedParseToolResult.mockReturnValue({ type: "cart", cart: newerCart });

    const messages: ChatMessage[] = [
      makeCartMessage("get_cart", olderCart),
      makeCartMessage("get_cart", newerCart),
    ];
    const { result } = renderHook(() => useCart(messages, "instamart"));

    expect(result.current.cart).toEqual(newerCart);
    expect(result.current.itemCount).toBe(4); // 3 + 1
  });

  it("ignores tool results whose name does not match cart/basket", () => {
    // The tool name "search_products" won't match /cart|basket/i,
    // so parseToolResult should never be called.
    const messages: ChatMessage[] = [
      {
        role: "assistant",
        content: [
          { type: "mcp_tool_use", id: "tu-1", name: "search_products" },
          { type: "mcp_tool_result", tool_use_id: "tu-1", content: "stuff" },
        ],
        timestamp: 1,
      },
    ];
    const { result } = renderHook(() => useCart(messages, "instamart"));
    expect(result.current.cart).toBeNull();
    expect(mockedParseToolResult).not.toHaveBeenCalled();
  });

  it("ignores user messages (only processes assistant messages)", () => {
    mockedParseToolResult.mockReturnValue({ type: "cart", cart: sampleCart });

    const messages: ChatMessage[] = [
      { role: "user", content: "add milk to cart", timestamp: 1 },
    ];
    const { result } = renderHook(() => useCart(messages, "instamart"));
    expect(result.current.cart).toBeNull();
  });

  it("isOpen defaults to false and can be toggled via setIsOpen", () => {
    const { result } = renderHook(() => useCart([], "instamart"));
    expect(result.current.isOpen).toBe(false);

    act(() => {
      result.current.setIsOpen(true);
    });
    expect(result.current.isOpen).toBe(true);

    act(() => {
      result.current.setIsOpen(false);
    });
    expect(result.current.isOpen).toBe(false);
  });

  it("handles assistant messages with string content gracefully", () => {
    const messages: ChatMessage[] = [
      { role: "assistant", content: "Just a string", timestamp: 1 },
    ];
    const { result } = renderHook(() => useCart(messages, "instamart"));
    expect(result.current.cart).toBeNull();
  });
});
