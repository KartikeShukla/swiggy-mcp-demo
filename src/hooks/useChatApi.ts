import { useCallback } from "react";
import { createClient } from "@/lib/anthropic";
import { MODEL_ID, MCP_BETA_FLAG, MAX_TOKENS } from "@/lib/constants";
import type { ChatMessage, ContentBlock, VerticalConfig } from "@/lib/types";

interface ApiError {
  status?: number;
  message: string;
}

function classifyError(err: unknown): ApiError {
  if (err instanceof Error) {
    const msg = err.message;

    // Check for HTTP status codes in the error
    if ("status" in err) {
      const status = (err as { status: number }).status;
      if (status === 401) return { status: 401, message: "Invalid API key. Please check your Anthropic API key." };
      if (status === 429) return { status: 429, message: "Rate limit exceeded. Please wait a moment and try again." };
      if (status === 500) return { status: 500, message: "Server error. Please try again later." };
    }

    if (msg.includes("401")) return { status: 401, message: "Invalid API key. Please check your Anthropic API key." };
    if (msg.includes("429")) return { status: 429, message: "Rate limit exceeded. Please wait a moment and try again." };
    if (msg.includes("Failed to fetch") || msg.includes("NetworkError") || msg.includes("net::")) {
      return { message: "Network error. Please check your connection and try again." };
    }

    return { message: msg };
  }
  return { message: "Something went wrong" };
}

/** Encapsulates the Anthropic API call with MCP server configuration. */
export function useChatApi(
  apiKey: string | null,
  vertical: VerticalConfig,
  swiggyToken: string | null,
) {
  const sendToApi = useCallback(
    async (messages: ChatMessage[]): Promise<ContentBlock[]> => {
      if (!apiKey) throw new Error("API key required");

      const client = createClient(apiKey);

      const apiMessages = messages.map((msg) => ({
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
        max_tokens: MAX_TOKENS,
        system: vertical.systemPrompt,
        messages: apiMessages,
        betas: [MCP_BETA_FLAG],
      };

      if (mcpServers.length > 0) {
        params.mcp_servers = mcpServers;
        params.tools = tools;
      }

      const response = await client.beta.messages.create(params);
      return response.content as ContentBlock[];
    },
    [apiKey, swiggyToken, vertical],
  );

  return { sendToApi, classifyError };
}
