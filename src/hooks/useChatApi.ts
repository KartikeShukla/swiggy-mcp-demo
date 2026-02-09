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

/** Encapsulates the Anthropic API call with MCP server configuration. */
export function useChatApi(
  apiKey: string | null,
  vertical: VerticalConfig,
  swiggyToken: string | null,
  onAuthError?: () => void,
  selectedAddress?: ParsedAddress | null,
) {
  const client = useMemo(() => (apiKey ? createClient(apiKey) : null), [apiKey]);

  const sendToApi = useCallback(
    async (messages: ChatMessage[]): Promise<ApiResponse> => {
      if (!client) throw new Error("API key required");

      const params = buildMessageStreamParams(
        messages,
        vertical,
        swiggyToken,
        selectedAddress,
      );

      return runMessageStream(client, params, onAuthError);
    },
    [client, vertical, swiggyToken, selectedAddress, onAuthError],
  );

  return { sendToApi, classifyError: classifyApiError };
}
