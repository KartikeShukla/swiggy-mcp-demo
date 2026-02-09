import { useCallback, useMemo } from "react";
import { createClient } from "@/lib/anthropic";
import { MODEL_ID, MCP_BETA_FLAG, MAX_TOKENS, MCP_TOOL_ERROR_LIMIT, MCP_AUTH_ERROR_LIMIT } from "@/lib/constants";
import { APIUserAbortError } from "@anthropic-ai/sdk";
import { logger } from "@/lib/logger";
import type { ChatMessage, ApiResponse, VerticalConfig, ContentBlock, McpErrorCategory, ParsedAddress } from "@/lib/types";

interface ApiError {
  status?: number;
  message: string;
}

/** Extract searchable text from an MCP tool result content field. */
function extractMcpErrorText(content: unknown): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .filter((item): item is { type: "text"; text: string } => item?.type === "text" && typeof item.text === "string")
      .map((item) => item.text)
      .join(" ");
  }
  if (content && typeof content === "object") {
    try {
      return JSON.stringify(content);
    } catch {
      return "";
    }
  }
  return "";
}

/** Classify an MCP tool error into auth / server / validation. */
function classifyMcpError(content: unknown): McpErrorCategory {
  const text = extractMcpErrorText(content).toLowerCase();

  const authPatterns = ["403", "401", "forbidden", "unauthorized", "expired", "access denied", "invalid token", "not authenticated"];
  if (authPatterns.some((p) => text.includes(p))) return "auth";

  const serverPatterns = ["500", "502", "503", "504", "internal server error", "service unavailable", "timeout", "gateway"];
  if (serverPatterns.some((p) => text.includes(p))) return "server";

  return "validation";
}

const ABORT_MESSAGES: Record<McpErrorCategory, string> = {
  auth: "Your Swiggy session has expired. Please click **Reconnect** at the top of the page to log in again, then retry your request.",
  server: "The Swiggy service is temporarily unavailable. Please try again in a moment.",
  validation: "I encountered repeated errors from the service and stopped retrying. Please try a different request — for example, different search terms or options.",
};

function classifyError(err: unknown): ApiError {
  if (err instanceof Error) {
    const msg = err.message;

    // Check for HTTP status codes in the error
    if ("status" in err) {
      const status = (err as { status: number }).status;
      if (status === 403) return { status: 403, message: "Your Swiggy session has expired. Please reconnect." };
      if (status === 401) return { status: 401, message: "Invalid API key. Please check your Anthropic API key." };
      if (status === 429) return { status: 429, message: "Rate limit exceeded. Please wait a moment and try again." };
      if (status === 500) return { status: 500, message: "Server error. Please try again later." };
    }

    if (msg.includes("403") || msg.includes("Forbidden")) return { status: 403, message: "Your Swiggy session has expired. Please reconnect." };
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
  onAuthError?: () => void,
  selectedAddress?: ParsedAddress | null,
) {
  // GAP 8: Memoize the Anthropic client instead of re-creating on every call
  const client = useMemo(
    () => (apiKey ? createClient(apiKey) : null),
    [apiKey],
  );

  const sendToApi = useCallback(
    async (
      messages: ChatMessage[],
      _onStreamContent?: (content: ApiResponse["content"]) => void,
    ): Promise<ApiResponse> => {
      if (!client) throw new Error("API key required");

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

      // Build system prompt blocks — optionally include delivery address context
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const systemBlocks: any[] = [
        {
          type: "text",
          text: vertical.systemPrompt,
          cache_control: { type: "ephemeral" },
        },
      ];
      if (selectedAddress?.address) {
        systemBlocks.push({
          type: "text",
          text: `The user's delivery address is: "${selectedAddress.label}" — ${selectedAddress.address}. Use this as the default delivery location for all operations.`,
          cache_control: { type: "ephemeral" },
        });
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const params: any = {
        model: MODEL_ID,
        max_tokens: MAX_TOKENS,
        // GAP 1: Prompt caching — send system as array with cache_control
        system: systemBlocks,
        messages: apiMessages,
        // GAP 2: Context editing — automatically clear old tool results
        // GAP 1+2: Both beta flags needed
        betas: [MCP_BETA_FLAG, "prompt-caching-2024-07-31", "context-management-2025-06-27"],
        // GAP 2: Server-side context editing — clear old tool results when input exceeds threshold
        context_management: {
          edits: [
            {
              type: "clear_tool_uses_20250919",
              trigger: { type: "input_tokens", value: 10000 },
              keep: { type: "tool_uses", value: 3 },
            },
          ],
        },
      };

      if (mcpServers.length > 0) {
        params.mcp_servers = mcpServers;
        params.tools = tools;
      }

      // Always stream — monitor for repeated MCP tool errors and abort to prevent retry loops
      const stream = client.beta.messages.stream(params);

      let mcpToolErrorCount = 0;
      let mcpAuthErrorCount = 0;
      let abortedDueToRetryLoop = false;
      let abortCategory: McpErrorCategory = "validation";

      stream.on("contentBlock", (block) => {
        if (block.type === "mcp_tool_result" && (block as { is_error?: boolean }).is_error) {
          const category = classifyMcpError((block as { content: unknown }).content);
          mcpToolErrorCount++;
          logger.warn(`MCP tool error #${mcpToolErrorCount} [${category}]`, block);

          if (category === "auth") {
            mcpAuthErrorCount++;
            onAuthError?.();
            if (mcpAuthErrorCount >= MCP_AUTH_ERROR_LIMIT) {
              logger.warn("MCP auth error — aborting stream immediately");
              abortedDueToRetryLoop = true;
              abortCategory = "auth";
              stream.abort();
              return;
            }
          }

          if (category === "server" && mcpToolErrorCount >= MCP_TOOL_ERROR_LIMIT) {
            logger.warn("MCP server error limit reached — aborting stream");
            abortedDueToRetryLoop = true;
            abortCategory = "server";
            stream.abort();
            return;
          }

          if (mcpToolErrorCount >= MCP_TOOL_ERROR_LIMIT) {
            logger.warn("MCP tool error limit reached — aborting stream");
            abortedDueToRetryLoop = true;
            abortCategory = category;
            stream.abort();
          }
        }
      });

      try {
        const response = await stream.finalMessage();

        const usage = {
          input_tokens: response.usage.input_tokens,
          output_tokens: response.usage.output_tokens,
          cache_creation_input_tokens: (response.usage as unknown as Record<string, number>).cache_creation_input_tokens,
          cache_read_input_tokens: (response.usage as unknown as Record<string, number>).cache_read_input_tokens,
        };

        console.log("[Token Usage]", usage);

        return {
          content: response.content as ApiResponse["content"],
          usage,
        };
      } catch (err) {
        if (abortedDueToRetryLoop && err instanceof APIUserAbortError) {
          const partial = stream.currentMessage;
          const partialContent = (partial?.content ?? []) as ContentBlock[];
          const partialUsage = partial?.usage;

          const syntheticBlock: ContentBlock = {
            type: "text",
            text: ABORT_MESSAGES[abortCategory],
          };

          const usage = {
            input_tokens: partialUsage?.input_tokens ?? 0,
            output_tokens: partialUsage?.output_tokens ?? 0,
            cache_creation_input_tokens: (partialUsage as Record<string, number> | undefined)?.cache_creation_input_tokens,
            cache_read_input_tokens: (partialUsage as Record<string, number> | undefined)?.cache_read_input_tokens,
          };

          console.log(`[Token Usage] (aborted — ${abortCategory})`, usage);

          return {
            content: [...partialContent, syntheticBlock],
            usage,
          };
        }
        throw err;
      }
    },
    [client, swiggyToken, vertical, onAuthError, selectedAddress],
  );

  return { sendToApi, classifyError };
}
