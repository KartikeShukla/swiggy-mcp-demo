import { useState, useCallback, useEffect, useRef } from "react";
import type { ChatMessage, VerticalConfig, TokenUsage, ParsedAddress } from "@/lib/types";
import { useChatApi } from "./useChatApi";
import { useChatPersistence } from "./useChatPersistence";

export function useChat(
  vertical: VerticalConfig,
  apiKey: string | null,
  swiggyToken: string | null,
  onAuthError?: () => void,
  selectedAddress?: ParsedAddress | null,
) {
  const { messages, setMessages } = useChatPersistence(vertical.id);
  const { sendToApi, classifyError } = useChatApi(apiKey, vertical, swiggyToken, onAuthError, selectedAddress);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tokenUsage, setTokenUsage] = useState<TokenUsage | null>(null);
  const cumulativeUsageRef = useRef({ input_tokens: 0, output_tokens: 0 });

  // Clear error when vertical changes
  useEffect(() => {
    setError(null);
    setTokenUsage(null);
    cumulativeUsageRef.current = { input_tokens: 0, output_tokens: 0 };
  }, [vertical.id]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!apiKey) {
        setError("API key required");
        return;
      }

      const userMessage: ChatMessage = {
        role: "user",
        content: text,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setLoading(true);
      setError(null);

      try {
        // Pass all messages including the new user message
        const allMessages = [...messages, userMessage];
        const response = await sendToApi(allMessages);

        const assistantMessage: ChatMessage = {
          role: "assistant",
          content: response.content,
          timestamp: Date.now(),
        };

        setMessages((prev) => [...prev, assistantMessage]);

        // Track token usage
        setTokenUsage(response.usage);
        cumulativeUsageRef.current.input_tokens += response.usage.input_tokens;
        cumulativeUsageRef.current.output_tokens += response.usage.output_tokens;
        console.log("[Cumulative Token Usage]", { ...cumulativeUsageRef.current });
      } catch (err) {
        const classified = classifyError(err);
        setError(classified.message);
      } finally {
        setLoading(false);
      }
    },
    [apiKey, messages, sendToApi, classifyError, setMessages],
  );

  const clearHistory = useCallback(() => {
    setMessages([]);
    setTokenUsage(null);
    cumulativeUsageRef.current = { input_tokens: 0, output_tokens: 0 };
  }, [setMessages]);

  return { messages, loading, error, sendMessage, clearHistory, tokenUsage };
}
