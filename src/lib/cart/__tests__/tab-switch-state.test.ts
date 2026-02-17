import { describe, expect, it, beforeEach } from "vitest";
import type { ChatMessage } from "@/lib/types";
import { setChatHistory } from "@/lib/storage";
import {
  hasClearableInstamartState,
  isInstamartCrossTabSwitch,
  isInstamartSwitchVerticalId,
} from "@/lib/cart/tab-switch-state";

describe("tab switch state helpers", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("identifies supported Nutrition/Style ids", () => {
    expect(isInstamartSwitchVerticalId("food")).toBe(true);
    expect(isInstamartSwitchVerticalId("style")).toBe(true);
    expect(isInstamartSwitchVerticalId("dining")).toBe(false);
  });

  it("flags only Nutrition<->Style as guarded cross-tab switches", () => {
    expect(isInstamartCrossTabSwitch("food", "style")).toBe(true);
    expect(isInstamartCrossTabSwitch("style", "food")).toBe(true);
    expect(isInstamartCrossTabSwitch("food", "food")).toBe(false);
    expect(isInstamartCrossTabSwitch("food", "dining")).toBe(false);
    expect(isInstamartCrossTabSwitch("foodorder", "style")).toBe(false);
  });

  it("returns false when no local state exists", () => {
    expect(hasClearableInstamartState("food")).toBe(false);
    expect(hasClearableInstamartState("style")).toBe(false);
  });

  it("returns true when source tab has persisted chat history", () => {
    const history: ChatMessage[] = [
      { role: "user", content: "find protein cereal", timestamp: 1 },
    ];
    setChatHistory("food", history);

    expect(hasClearableInstamartState("food")).toBe(true);
  });

  it("returns true when source tab has a non-empty cart snapshot", () => {
    const history: ChatMessage[] = [
      {
        role: "assistant",
        timestamp: 1,
        content: [
          { type: "mcp_tool_use", id: "tu-1", name: "get_cart" },
          {
            type: "mcp_tool_result",
            tool_use_id: "tu-1",
            content: {
              cart: {
                items: [{ id: "p1", name: "Oats", price: 120, quantity: 2 }],
                subtotal: 240,
                deliveryFee: 0,
                total: 240,
              },
            },
          },
        ],
      },
    ];
    setChatHistory("style", history);

    expect(hasClearableInstamartState("style")).toBe(true);
  });

  it("returns false for non-Instamart vertical ids", () => {
    const history: ChatMessage[] = [
      { role: "user", content: "book table for two", timestamp: 1 },
    ];
    setChatHistory("dining", history);

    expect(hasClearableInstamartState("dining")).toBe(false);
  });
});
