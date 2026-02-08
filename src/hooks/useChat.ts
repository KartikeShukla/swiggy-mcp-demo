import { useState, useCallback, useEffect, useRef } from "react";
import { createClient } from "@/lib/anthropic";
import { MODEL_ID, MCP_BETA_FLAG } from "@/lib/constants";
import { getChatHistory, setChatHistory } from "@/lib/storage";
import type { ChatMessage, ContentBlock, VerticalConfig } from "@/lib/types";

export function useChat(
  vertical: VerticalConfig,
  apiKey: string | null,
  swiggyToken: string | null,
) {
  const [messages, setMessages] = useState<ChatMessage[]>(() =>
    getChatHistory(vertical.id),
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use ref to avoid stale closure in sendMessage
  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  // Reload history when vertical changes
  useEffect(() => {
    setMessages(getChatHistory(vertical.id));
    setError(null);
  }, [vertical.id]);

  // Persist on change
  useEffect(() => {
    setChatHistory(vertical.id, messages);
  }, [messages, vertical.id]);

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
        const client = createClient(apiKey);

        // Build API messages from history (use ref for latest value)
        const allMessages = [...messagesRef.current, userMessage];
        const apiMessages = allMessages.map((msg) => ({
          role: msg.role as "user" | "assistant",
          content: msg.content,
        }));

        // Build MCP params — only include if we have a token
        const mcpServers = swiggyToken
          ? [
              {
                type: "url" as const,
                url: vertical.mcpServer.url,
                name: vertical.mcpServer.name,
                authorization_token: swiggyToken,
              },
            ]
          : [];

        const tools = swiggyToken
          ? [
              {
                type: "mcp_toolset" as const,
                mcp_server_name: vertical.mcpServer.name,
              },
            ]
          : [];

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const params: any = {
          model: MODEL_ID,
          max_tokens: 4096,
          system: vertical.systemPrompt,
          messages: apiMessages,
          betas: [MCP_BETA_FLAG],
        };

        if (mcpServers.length > 0) {
          params.mcp_servers = mcpServers;
          params.tools = tools;
        }

        const response = await client.beta.messages.create(params);

        const assistantMessage: ChatMessage = {
          role: "assistant",
          content: response.content as ContentBlock[],
          timestamp: Date.now(),
        };

        setMessages((prev) => [...prev, assistantMessage]);
      } catch (err) {
        const errMsg =
          err instanceof Error ? err.message : "Something went wrong";
        setError(errMsg);
      } finally {
        setLoading(false);
      }
    },
    [apiKey, swiggyToken, vertical],
  );

  const clearHistory = useCallback(() => {
    setMessages([]);
  }, []);

  return { messages, loading, error, sendMessage, clearHistory };
}
