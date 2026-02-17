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
import { logger } from "@/lib/logger";
import {
  isRetryableAnthropicError,
  isRateLimitError,
  waitForRetryAttempt,
  extractRetryAfterMs,
  extractRateLimitHeaders,
} from "@/integrations/anthropic/retry-policy";

import {
  CHAT_REQUEST_MAX_RETRIES,
  RATE_LIMIT_MAX_RETRIES,
  HEAVY_CONTEXT_RETRY_LIMIT,
  HEAVY_CONTEXT_MESSAGE_COUNT,
  HEAVY_CONTEXT_CHAR_BUDGET,
} from "@/lib/constants";

function estimateMessageChars(messages: ChatMessage[]): number {
  return messages.reduce((sum, message) => {
    if (typeof message.content === "string") {
      return sum + message.content.length;
    }
    try {
      return sum + JSON.stringify(message.content).length;
    } catch {
      return sum + 0;
    }
  }, 0);
}

function getRetryLimit(messages: ChatMessage[], rateLimited: boolean): number {
  if (rateLimited) return RATE_LIMIT_MAX_RETRIES;
  const heavyContext =
    messages.length > HEAVY_CONTEXT_MESSAGE_COUNT ||
    estimateMessageChars(messages) > HEAVY_CONTEXT_CHAR_BUDGET;
  return heavyContext ? HEAVY_CONTEXT_RETRY_LIMIT : CHAT_REQUEST_MAX_RETRIES;
}

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
          const retryLimit = getRetryLimit(messages, rateLimited);
          if (rateLimited) {
            const headers = extractRateLimitHeaders(err);
            if (headers) logger.debug("[Rate Limit Hit]", headers);
          }

          logger.debug("[Retry Policy]", {
            attempt,
            retryLimit,
            rateLimited,
            messageCount: messages.length,
          });

          if (attempt >= retryLimit || !isRetryableAnthropicError(err)) {
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
