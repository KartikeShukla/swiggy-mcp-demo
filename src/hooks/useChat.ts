import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import type { ChatMessage, VerticalConfig, TokenUsage, ParsedAddress } from "@/lib/types";
import { useChatApi } from "./useChatApi";
import { useChatPersistence } from "./useChatPersistence";
import { buildSessionStateSummary } from "@/integrations/anthropic/session-summary";
import { logger } from "@/lib/logger";
import { detectLoadingContext, type LoadingContext } from "@/lib/intent/runtime-signals";
import { getLoadingLabel } from "./useLoadingLabel";
import type { VerticalId } from "@/verticals/prompt-spec/types";

const SUPPORTED_VERTICAL_IDS: VerticalId[] = [
  "food",
  "style",
  "dining",
  "foodorder",
];

function isVerticalId(verticalId: string): verticalId is VerticalId {
  return SUPPORTED_VERTICAL_IDS.includes(verticalId as VerticalId);
}

export function useChat(
  vertical: VerticalConfig,
  apiKey: string | null,
  swiggyToken: string | null,
  onAuthError?: () => void,
  onAddressError?: () => void,
  selectedAddress?: ParsedAddress | null,
) {
  const { messages, setMessages } = useChatPersistence(vertical.id);
  const { sendToApi, classifyError } = useChatApi(
    apiKey,
    vertical,
    swiggyToken,
    onAuthError,
    onAddressError,
    selectedAddress,
  );
  const [loading, setLoading] = useState(false);
  const [loadingElapsedMs, setLoadingElapsedMs] = useState(0);
  const loadingContextRef = useRef<LoadingContext>("generic");
  const [error, setError] = useState<string | null>(null);
  const [tokenUsage, setTokenUsage] = useState<TokenUsage | null>(null);
  const [cooldownEndsAt, setCooldownEndsAt] = useState<number | null>(null);
  const [cooldownNow, setCooldownNow] = useState(Date.now());
  const cumulativeUsageRef = useRef({ input_tokens: 0, output_tokens: 0 });
  const messagesRef = useRef(messages);
  const inFlightRef = useRef(false);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Clear error when vertical changes
  useEffect(() => {
    setError(null);
    setTokenUsage(null);
    setLoadingElapsedMs(0);
    setCooldownEndsAt(null);
    cumulativeUsageRef.current = { input_tokens: 0, output_tokens: 0 };
  }, [vertical.id]);

  // Tick cooldown timer every second
  useEffect(() => {
    if (!cooldownEndsAt) return;
    const timer = window.setInterval(() => {
      const now = Date.now();
      setCooldownNow(now);
      if (now >= cooldownEndsAt) {
        setCooldownEndsAt(null);
        setError(null);
      }
    }, 1000);
    return () => window.clearInterval(timer);
  }, [cooldownEndsAt]);

  const cooldownRemaining = useMemo(
    () => (cooldownEndsAt ? Math.max(0, cooldownEndsAt - cooldownNow) : 0),
    [cooldownEndsAt, cooldownNow],
  );

  const inputDisabled = loading || cooldownRemaining > 0;

  useEffect(() => {
    if (!loading) {
      setLoadingElapsedMs(0);
      return;
    }
    const startedAt = Date.now();
    setLoadingElapsedMs(0);
    const timer = window.setInterval(() => {
      setLoadingElapsedMs(Date.now() - startedAt);
    }, 400);
    return () => window.clearInterval(timer);
  }, [loading]);

  const sendMessage = useCallback(
    async (
      text: string,
      options?: { apiText?: string },
    ): Promise<boolean> => {
      if (!apiKey) {
        setError("API key required");
        return false;
      }
      if (loading || inFlightRef.current || cooldownEndsAt) return false;

      const visibleText = text.trim();
      if (!visibleText) return false;
      const apiText = options?.apiText?.trim() || visibleText;

      const userMessage: ChatMessage = {
        role: "user",
        content: visibleText,
        timestamp: Date.now(),
      };
      const apiUserMessage: ChatMessage = {
        role: "user",
        content: apiText,
        timestamp: Date.now(),
      };

      inFlightRef.current = true;
      loadingContextRef.current = detectLoadingContext(visibleText, vertical.id);

      setMessages((prev) => [...prev, userMessage]);
      setLoading(true);
      setError(null);

      try {
        // Pass all messages including the latest user turn, optionally enriched for API only.
        const allMessages = [...messagesRef.current, apiUserMessage];
        const sessionStateSummary = isVerticalId(vertical.id)
          ? buildSessionStateSummary(allMessages, vertical.id, selectedAddress)
          : null;
        logger.debug("[Chat Turn Context]", {
          verticalId: vertical.id,
          messageCount: allMessages.length,
          summary: sessionStateSummary,
        });
        const response = await sendToApi(allMessages, sessionStateSummary);

        // stream-runner.ts already sanitizes and ensures non-empty content;
        // only guard against the edge case of an empty array here.
        const normalizedContent = response.content.length > 0
          ? response.content
          : [
              {
                type: "text" as const,
                text: "I completed that request but the final response was empty. Please try once.",
              },
            ];

        const timedOut = normalizedContent.some(
          (block) =>
            block.type === "text" &&
            /timed out/i.test(block.text),
        );

        const assistantMessage: ChatMessage = {
          role: "assistant",
          content: normalizedContent,
          timestamp: Date.now(),
        };

        setMessages((prev) => [...prev, assistantMessage]);

        // Track token usage
        setTokenUsage(response.usage);
        cumulativeUsageRef.current.input_tokens += response.usage.input_tokens;
        cumulativeUsageRef.current.output_tokens += response.usage.output_tokens;
        logger.debug("[Cumulative Token Usage]", { ...cumulativeUsageRef.current });
        return !timedOut;
      } catch (err) {
        const classified = classifyError(err);
        setError(classified.message);
        if (classified.status === 429 && classified.retryAfterMs) {
          setCooldownEndsAt(Date.now() + classified.retryAfterMs);
          setCooldownNow(Date.now());
        }
        return false;
      } finally {
        setLoading(false);
        inFlightRef.current = false;
      }
    },
    [
      apiKey,
      loading,
      cooldownEndsAt,
      sendToApi,
      classifyError,
      setMessages,
      vertical.id,
      selectedAddress,
    ],
  );

  const clearHistory = useCallback(() => {
    setMessages([]);
    setTokenUsage(null);
    setLoadingElapsedMs(0);
    cumulativeUsageRef.current = { input_tokens: 0, output_tokens: 0 };
  }, [setMessages]);

  const loadingLabel = loading
    ? getLoadingLabel(loadingContextRef.current, loadingElapsedMs)
    : null;

  return {
    messages,
    loading,
    loadingLabel,
    loadingElapsedMs,
    error,
    sendMessage,
    clearHistory,
    tokenUsage,
    cooldownRemaining,
    inputDisabled,
  };
}
