import { vi } from "vitest";
import {
  getApiKey,
  setApiKey,
  removeApiKey,
  getSwiggyToken,
  setSwiggyToken,
  removeSwiggyToken,
  getSwiggyTokenAge,
  getSelectedAddress,
  getValidatedSelectedAddress,
  isValidPersistedAddressId,
  setSelectedAddress,
  getChatHistory,
  setChatHistory,
  clearChatHistory,
  clearAllChatHistory,
} from "@/lib/storage";
import type { ChatMessage } from "@/lib/types";

/* ------------------------------------------------------------------ */
/*  Use jsdom's built-in localStorage (provided by vitest env: jsdom)  */
/* ------------------------------------------------------------------ */

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

/* ------------------------------------------------------------------ */
/*  API key                                                            */
/* ------------------------------------------------------------------ */

describe("API key helpers", () => {
  it("getApiKey returns null when nothing is stored", () => {
    expect(getApiKey()).toBeNull();
  });

  it("setApiKey stores and getApiKey retrieves the key", () => {
    setApiKey("sk-test-123");
    expect(getApiKey()).toBe("sk-test-123");
  });

  it("removeApiKey removes the stored key", () => {
    setApiKey("sk-test-123");
    removeApiKey();
    expect(getApiKey()).toBeNull();
  });
});

/* ------------------------------------------------------------------ */
/*  Swiggy token                                                       */
/* ------------------------------------------------------------------ */

describe("Swiggy token helpers", () => {
  it("getSwiggyToken returns null when nothing is stored", () => {
    expect(getSwiggyToken()).toBeNull();
  });

  it("setSwiggyToken stores the token and a timestamp", () => {
    setSwiggyToken("tok-abc");
    expect(getSwiggyToken()).toBe("tok-abc");
    // Timestamp key should also be set
    expect(localStorage.getItem("mcp-demo:swiggy-token-ts")).not.toBeNull();
  });

  it("removeSwiggyToken removes both token and timestamp", () => {
    setSwiggyToken("tok-abc");
    removeSwiggyToken();
    expect(getSwiggyToken()).toBeNull();
    expect(localStorage.getItem("mcp-demo:swiggy-token-ts")).toBeNull();
  });
});

describe("selected address helpers", () => {
  it("validates persisted address IDs", () => {
    expect(isValidPersistedAddressId("addr_123")).toBe(true);
    expect(isValidPersistedAddressId("chat-home-123")).toBe(false);
    expect(isValidPersistedAddressId("Address")).toBe(false);
    expect(isValidPersistedAddressId("")).toBe(false);
  });

  it("returns persisted selected address when ID is valid", () => {
    setSelectedAddress({
      id: "addr_123",
      label: "Home",
      address: "Sector 37, Gurugram",
    });

    expect(getValidatedSelectedAddress()).toEqual(getSelectedAddress());
  });

  it("clears invalid selected address IDs from storage", () => {
    setSelectedAddress({
      id: "chat-home-123",
      label: "Home",
      address: "Sector 37, Gurugram",
    });

    expect(getValidatedSelectedAddress()).toBeNull();
    expect(getSelectedAddress()).toBeNull();
  });
});

/* ------------------------------------------------------------------ */
/*  Swiggy token age                                                   */
/* ------------------------------------------------------------------ */

describe("getSwiggyTokenAge", () => {
  it("returns null when no token has been stored", () => {
    expect(getSwiggyTokenAge()).toBeNull();
  });

  it("returns the elapsed ms since the token was stored", () => {
    const now = Date.now();
    vi.spyOn(Date, "now")
      .mockReturnValueOnce(now)       // called inside setSwiggyToken
      .mockReturnValueOnce(now + 5000); // called inside getSwiggyTokenAge

    setSwiggyToken("tok");
    const age = getSwiggyTokenAge();
    expect(age).toBe(5000);
  });
});

/* ------------------------------------------------------------------ */
/*  Chat history                                                       */
/* ------------------------------------------------------------------ */

describe("chat history helpers", () => {
  const vertical = "instamart";
  const sampleMessages: ChatMessage[] = [
    { role: "user", content: "hello", timestamp: 1000 },
    { role: "assistant", content: "hi!", timestamp: 1001 },
  ];

  it("getChatHistory returns [] when nothing is stored", () => {
    expect(getChatHistory(vertical)).toEqual([]);
  });

  it("setChatHistory stores and getChatHistory retrieves messages", () => {
    setChatHistory(vertical, sampleMessages);
    expect(getChatHistory(vertical)).toEqual(sampleMessages);
  });

  it("getChatHistory returns [] for invalid JSON", () => {
    localStorage.setItem("mcp-demo:chat:instamart", "NOT-JSON");
    expect(getChatHistory(vertical)).toEqual([]);
  });

  it("clearChatHistory removes only the specified vertical", () => {
    setChatHistory("instamart", sampleMessages);
    setChatHistory("dining", sampleMessages);
    clearChatHistory("instamart");
    expect(getChatHistory("instamart")).toEqual([]);
    expect(getChatHistory("dining")).toEqual(sampleMessages);
  });

  it("clearAllChatHistory removes all chat keys", () => {
    setChatHistory("instamart", sampleMessages);
    setChatHistory("dining", sampleMessages);
    // Also set a non-chat key to make sure it survives
    localStorage.setItem("mcp-demo:api-key", "sk-test");

    clearAllChatHistory();

    expect(getChatHistory("instamart")).toEqual([]);
    expect(getChatHistory("dining")).toEqual([]);
    // Non-chat key should still be present
    expect(localStorage.getItem("mcp-demo:api-key")).toBe("sk-test");
  });

  it("different verticals have isolated histories", () => {
    const msgs1: ChatMessage[] = [{ role: "user", content: "food", timestamp: 1 }];
    const msgs2: ChatMessage[] = [{ role: "user", content: "dine", timestamp: 2 }];
    setChatHistory("food", msgs1);
    setChatHistory("dining", msgs2);
    expect(getChatHistory("food")).toEqual(msgs1);
    expect(getChatHistory("dining")).toEqual(msgs2);
  });
});
