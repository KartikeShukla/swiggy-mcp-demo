import { useState, useCallback, useEffect } from "react";
import type { ChatMessage, VerticalConfig } from "@/lib/types";
import { useChatApi } from "./useChatApi";
import { useChatPersistence } from "./useChatPersistence";

export function useChat(
  vertical: VerticalConfig,
  apiKey: string | null,
  swiggyToken: string | null,
) {
  const { messages, setMessages } = useChatPersistence(vertical.id);
  const { sendToApi, classifyError } = useChatApi(apiKey, vertical, swiggyToken);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Clear error when vertical changes
  useEffect(() => {
    setError(null);
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
        const content = await sendToApi(allMessages);

        const assistantMessage: ChatMessage = {
          role: "assistant",
          content,
          timestamp: Date.now(),
        };

        setMessages((prev) => [...prev, assistantMessage]);
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
  }, [setMessages]);

  return { messages, loading, error, sendMessage, clearHistory };
}
