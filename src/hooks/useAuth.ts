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
import { TOKEN_STALENESS_MS, OAUTH_POPUP_WIDTH, OAUTH_POPUP_HEIGHT } from "@/lib/constants";

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
  const isTokenStale = tokenAge !== null && tokenAge > TOKEN_STALENESS_MS;

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
    const left = window.screenX + (window.outerWidth - OAUTH_POPUP_WIDTH) / 2;
    const top = window.screenY + (window.outerHeight - OAUTH_POPUP_HEIGHT) / 2;
    window.open(
      "/api/auth/start",
      "swiggy-oauth",
      `width=${OAUTH_POPUP_WIDTH},height=${OAUTH_POPUP_HEIGHT},left=${left},top=${top}`,
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
