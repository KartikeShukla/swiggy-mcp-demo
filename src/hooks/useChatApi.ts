import { useCallback, useMemo } from "react";
import { createClient } from "@/lib/anthropic";
import type {
  ChatMessage,
  ApiResponse,
  VerticalConfig,
  ParsedAddress,
} from "@/lib/types";
import { classifyApiError } from "@/integrations/anthropic/error-classifier";
import { buildMessageStreamParams } from "@/integrations/anthropic/request-builder";
import { runMessageStream } from "@/integrations/anthropic/stream-runner";
import {
  isRetryableAnthropicError,
  isRateLimitError,
  waitForRetryAttempt,
  extractRetryAfterMs,
  extractRateLimitHeaders,
} from "@/integrations/anthropic/retry-policy";

const CHAT_REQUEST_MAX_RETRIES = 2;
const RATE_LIMIT_MAX_RETRIES = 2;

/** Encapsulates the Anthropic API call with MCP server configuration. */
export function useChatApi(
  apiKey: string | null,
  vertical: VerticalConfig,
  swiggyToken: string | null,
  onAuthError?: () => void,
  onAddressError?: () => void,
  selectedAddress?: ParsedAddress | null,
) {
  const client = useMemo(() => (apiKey ? createClient(apiKey) : null), [apiKey]);

  const sendToApi = useCallback(
    async (
      messages: ChatMessage[],
      sessionStateSummary?: string | null,
    ): Promise<ApiResponse> => {
      if (!client) throw new Error("API key required");

      const params = buildMessageStreamParams(
        messages,
        vertical,
        swiggyToken,
        selectedAddress,
        sessionStateSummary,
      );

      let lastError: unknown;
      for (let attempt = 0; attempt <= CHAT_REQUEST_MAX_RETRIES; attempt++) {
        try {
          return await runMessageStream(client, params, onAuthError, onAddressError);
        } catch (err) {
          lastError = err;

          const rateLimited = isRateLimitError(err);
          if (rateLimited) {
            const headers = extractRateLimitHeaders(err);
            if (headers) console.warn("[Rate Limit Hit]", headers);
          }

          const maxRetries = rateLimited ? RATE_LIMIT_MAX_RETRIES : CHAT_REQUEST_MAX_RETRIES;
          if (attempt >= maxRetries || !isRetryableAnthropicError(err)) {
            throw err;
          }
          await waitForRetryAttempt(attempt + 1, extractRetryAfterMs(err));
        }
      }

      throw lastError instanceof Error ? lastError : new Error("Request failed");
    },
    [client, vertical, swiggyToken, selectedAddress, onAuthError, onAddressError],
  );

  return { sendToApi, classifyError: classifyApiError };
}
