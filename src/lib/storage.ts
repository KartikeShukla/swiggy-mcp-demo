import { STORAGE_KEYS } from "./constants";
import type { ChatMessage, ParsedAddress } from "./types";
import { sanitizeMessagesForApi } from "@/integrations/anthropic/message-sanitizer";

export function getApiKey(): string | null {
  return localStorage.getItem(STORAGE_KEYS.apiKey);
}

export function setApiKey(key: string): void {
  localStorage.setItem(STORAGE_KEYS.apiKey, key);
}

export function removeApiKey(): void {
  localStorage.removeItem(STORAGE_KEYS.apiKey);
}

export function getSwiggyToken(): string | null {
  return localStorage.getItem(STORAGE_KEYS.swiggyToken);
}

export function setSwiggyToken(token: string): void {
  localStorage.setItem(STORAGE_KEYS.swiggyToken, token);
  localStorage.setItem(STORAGE_KEYS.swiggyTokenTs, Date.now().toString());
}

export function removeSwiggyToken(): void {
  localStorage.removeItem(STORAGE_KEYS.swiggyToken);
  localStorage.removeItem(STORAGE_KEYS.swiggyTokenTs);
}

export function getSwiggyTokenAge(): number | null {
  const ts = localStorage.getItem(STORAGE_KEYS.swiggyTokenTs);
  if (!ts) return null;
  return Date.now() - parseInt(ts, 10);
}

export function getSelectedAddress(): ParsedAddress | null {
  const raw = localStorage.getItem(STORAGE_KEYS.selectedAddress);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setSelectedAddress(address: ParsedAddress): void {
  localStorage.setItem(STORAGE_KEYS.selectedAddress, JSON.stringify(address));
}

export function removeSelectedAddress(): void {
  localStorage.removeItem(STORAGE_KEYS.selectedAddress);
}

export function isValidPersistedAddressId(id: string): boolean {
  const normalized = id.trim();
  if (!normalized) return false;
  if (/^chat-/i.test(normalized)) return false;
  if (/^address$/i.test(normalized)) return false;
  return true;
}

export function getValidatedSelectedAddress(): ParsedAddress | null {
  const selected = getSelectedAddress();
  if (!selected) return null;

  // "Skip for now" is allowed and intentionally carries an empty address.
  if (!selected.address?.trim()) return selected;

  if (!isValidPersistedAddressId(selected.id)) {
    removeSelectedAddress();
    return null;
  }

  return selected;
}

export function getChatHistory(verticalId: string): ChatMessage[] {
  const raw = localStorage.getItem(STORAGE_KEYS.chatHistory(verticalId));
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function setChatHistory(
  verticalId: string,
  messages: ChatMessage[],
): void {
  localStorage.setItem(
    STORAGE_KEYS.chatHistory(verticalId),
    JSON.stringify(messages),
  );
}

export function sanitizeStoredChatHistory(verticalId: string): number {
  const raw = localStorage.getItem(STORAGE_KEYS.chatHistory(verticalId));
  if (!raw) return 0;

  try {
    const parsed = JSON.parse(raw) as ChatMessage[];
    if (!Array.isArray(parsed)) return 0;
    const { sanitizedMessages, droppedBlocksCount } = sanitizeMessagesForApi(parsed);
    if (droppedBlocksCount > 0) {
      setChatHistory(verticalId, sanitizedMessages);
    }
    return droppedBlocksCount;
  } catch {
    return 0;
  }
}

export function sanitizeAllStoredHistories(): number {
  let dropped = 0;
  const keys = Object.keys(localStorage).filter((key) =>
    key.startsWith("mcp-demo:chat:"),
  );
  for (const key of keys) {
    const verticalId = key.replace("mcp-demo:chat:", "");
    dropped += sanitizeStoredChatHistory(verticalId);
  }
  return dropped;
}

export function clearChatHistory(verticalId: string): void {
  localStorage.removeItem(STORAGE_KEYS.chatHistory(verticalId));
}

export function clearAllChatHistory(): void {
  const keys = Object.keys(localStorage);
  for (const key of keys) {
    if (key.startsWith("mcp-demo:chat:")) {
      localStorage.removeItem(key);
    }
  }
}
