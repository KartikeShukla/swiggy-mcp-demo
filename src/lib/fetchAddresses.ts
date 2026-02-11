import { createClient } from "@/lib/anthropic";
import { MODEL_ID, MCP_BETA_FLAG, MCP_SERVERS } from "@/lib/constants";
import { unwrapContent, extractPayload } from "@/lib/parsers/unwrap";
import { tryParseAddresses } from "@/lib/parsers/addresses";
import type { ParsedAddress } from "@/lib/types";
import {
  isRetryableAnthropicError,
  waitForRetryAttempt,
} from "@/integrations/anthropic/retry-policy";

const ADDRESS_FETCH_MAX_RETRIES = 2;

export async function fetchAddresses(
  apiKey: string,
  swiggyToken: string,
): Promise<ParsedAddress[]> {
  const client = createClient(apiKey);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const params: any = {
    model: MODEL_ID,
    max_tokens: 1024,
    system: [
      {
        type: "text",
        text: "Return the user's saved delivery addresses. Only call the tool and return the raw result.",
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [{ role: "user", content: "Show my saved addresses" }],
    betas: [MCP_BETA_FLAG, "prompt-caching-2024-07-31"],
    mcp_servers: [
      {
        type: "url" as const,
        url: MCP_SERVERS.instamart.url,
        name: MCP_SERVERS.instamart.name,
        authorization_token: swiggyToken,
      },
    ],
    tools: [
      {
        type: "mcp_toolset" as const,
        mcp_server_name: MCP_SERVERS.instamart.name,
      },
    ],
  };

  let lastError: unknown;
  for (let attempt = 0; attempt <= ADDRESS_FETCH_MAX_RETRIES; attempt++) {
    try {
    const response = await client.beta.messages.create(params);

    // Look for mcp_tool_result blocks — use the same unwrap pipeline as the chat flow
    for (const block of response.content) {
      if (block.type === "mcp_tool_result") {
        const data = unwrapContent((block as { content: unknown }).content);
        const payload = extractPayload(data);
        const parsed = tryParseAddresses(payload);
        if (parsed?.type === "addresses") {
          return parsed.addresses;
        }
      }
    }

      // Valid request, but no address payload.
    return [];
    } catch (err) {
      lastError = err;
      if (attempt >= ADDRESS_FETCH_MAX_RETRIES || !isRetryableAnthropicError(err)) {
        console.warn("[fetchAddresses] Failed after retries:", lastError);
        return [];
      }
      await waitForRetryAttempt(attempt + 1);
    }
  }

  console.warn("[fetchAddresses] Failed after retries:", lastError);
  return [];
}
