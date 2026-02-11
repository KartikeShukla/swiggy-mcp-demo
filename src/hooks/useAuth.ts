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
  getValidatedSelectedAddress,
  sanitizeAllStoredHistories,
  setSelectedAddress as storeSelectedAddress,
} from "@/lib/storage";
import { TOKEN_STALENESS_MS, OAUTH_POPUP_WIDTH, OAUTH_POPUP_HEIGHT } from "@/lib/constants";
import type { ParsedAddress } from "@/lib/types";

export type OnboardingStep = "idle" | "api-key" | "swiggy-connect" | "address-select";

function computeInitialStep(): OnboardingStep {
  if (!getApiKey()) return "api-key";
  if (!getSwiggyToken()) return "swiggy-connect";
  if (!getValidatedSelectedAddress()) return "address-select";
  return "idle";
}

export function useAuth() {
  const [apiKey, setApiKeyState] = useState<string | null>(getApiKey);
  const [swiggyToken, setSwiggyTokenState] = useState<string | null>(
    getSwiggyToken,
  );
  const [onboardingStep, setOnboardingStep] = useState<OnboardingStep>(computeInitialStep);
  const [selectedAddress, setSelectedAddressState] = useState<ParsedAddress | null>(getValidatedSelectedAddress);

  useEffect(() => {
    sanitizeAllStoredHistories();
  }, []);

  // Backward compat
  const showApiKeyModal = onboardingStep === "api-key";

  const saveApiKey = useCallback((key: string) => {
    storeApiKey(key);
    setApiKeyState(key);
    // Advance to next step
    if (getSwiggyToken()) {
      if (getValidatedSelectedAddress()) {
        setOnboardingStep("idle");
      } else {
        setOnboardingStep("address-select");
      }
    } else {
      setOnboardingStep("swiggy-connect");
    }
  }, []);

  const changeApiKey = useCallback(() => {
    setOnboardingStep("api-key");
  }, []);

  const deleteApiKey = useCallback(() => {
    removeApiKey();
    setApiKeyState(null);
    setOnboardingStep("api-key");
  }, []);

  const [forceStale, setForceStale] = useState(false);

  const markTokenExpired = useCallback(() => {
    setForceStale(true);
  }, []);

  const saveSwiggyToken = useCallback((token: string) => {
    storeSwiggyToken(token);
    setSwiggyTokenState(token);
    setForceStale(false);
    // Advance to next step
    if (getValidatedSelectedAddress()) {
      setOnboardingStep("idle");
    } else {
      setOnboardingStep("address-select");
    }
  }, []);

  const disconnectSwiggy = useCallback(() => {
    removeSwiggyToken();
    setSwiggyTokenState(null);
  }, []);

  const reconnectSwiggy = useCallback(() => {
    if (!getApiKey()) {
      setOnboardingStep("api-key");
      return;
    }
    setOnboardingStep("swiggy-connect");
  }, []);

  const selectAddress = useCallback((addr: ParsedAddress) => {
    storeSelectedAddress(addr);
    setSelectedAddressState(addr);
    setOnboardingStep("idle");
  }, []);

  const changeAddress = useCallback(() => {
    setOnboardingStep("address-select");
  }, []);

  const dismissOnboarding = useCallback(() => {
    setOnboardingStep("idle");
  }, []);

  const clearChats = useCallback(() => {
    clearAllChatHistory();
    window.location.reload();
  }, []);

  const tokenAge = getSwiggyTokenAge();
  const isTokenStale = forceStale || (tokenAge !== null && tokenAge > TOKEN_STALENESS_MS);

  // Listen for OAuth postMessage from popup
  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return;
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
    onboardingStep,
    selectedAddress,
    isTokenStale,
    saveApiKey,
    changeApiKey,
    deleteApiKey,
    saveSwiggyToken,
    disconnectSwiggy,
    reconnectSwiggy,
    startOAuth,
    clearChats,
    markTokenExpired,
    selectAddress,
    changeAddress,
    dismissOnboarding,
  };
}
