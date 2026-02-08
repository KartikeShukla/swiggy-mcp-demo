import { STORAGE_KEYS } from "./constants";
import type { ChatMessage } from "./types";

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
