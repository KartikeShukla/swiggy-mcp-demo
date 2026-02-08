import { useState, useCallback, useEffect } from "react";
import {
  getApiKey,
  setApiKey as storeApiKey,
  removeApiKey,
  getSwiggyToken,
  setSwiggyToken as storeSwiggyToken,
  removeSwiggyToken,
  getSwiggyTokenAge,
  clearAllChatHistory,
} from "@/lib/storage";

export function useAuth() {
  const [apiKey, setApiKeyState] = useState<string | null>(getApiKey);
  const [swiggyToken, setSwiggyTokenState] = useState<string | null>(
    getSwiggyToken,
  );
  const [showApiKeyModal, setShowApiKeyModal] = useState(!getApiKey());

  const saveApiKey = useCallback((key: string) => {
    storeApiKey(key);
    setApiKeyState(key);
    setShowApiKeyModal(false);
  }, []);

  const changeApiKey = useCallback(() => {
    setShowApiKeyModal(true);
  }, []);

  const deleteApiKey = useCallback(() => {
    removeApiKey();
    setApiKeyState(null);
    setShowApiKeyModal(true);
  }, []);

  const saveSwiggyToken = useCallback((token: string) => {
    storeSwiggyToken(token);
    setSwiggyTokenState(token);
  }, []);

  const disconnectSwiggy = useCallback(() => {
    removeSwiggyToken();
    setSwiggyTokenState(null);
  }, []);

  const clearChats = useCallback(() => {
    clearAllChatHistory();
  }, []);

  const tokenAge = getSwiggyTokenAge();
  const isTokenStale = tokenAge !== null && tokenAge > 60 * 60 * 1000; // 1 hour

  // Listen for OAuth postMessage from popup
  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.data?.type === "swiggy-oauth-token" && event.data.token) {
        saveSwiggyToken(event.data.token);
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [saveSwiggyToken]);

  const startOAuth = useCallback(() => {
    const width = 500;
    const height = 600;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    window.open(
      "/api/auth/start",
      "swiggy-oauth",
      `width=${width},height=${height},left=${left},top=${top}`,
    );
  }, []);

  return {
    apiKey,
    swiggyToken,
    showApiKeyModal,
    isTokenStale,
    saveApiKey,
    changeApiKey,
    deleteApiKey,
    saveSwiggyToken,
    disconnectSwiggy,
    startOAuth,
    clearChats,
  };
}
