import Anthropic, { APIUserAbortError } from "@anthropic-ai/sdk";
import {
  MCP_AUTH_ERROR_LIMIT,
  MCP_TOOL_ERROR_LIMIT,
} from "@/lib/constants";
import { logger } from "@/lib/logger";
import type {
  ApiResponse,
  ContentBlock,
  McpErrorCategory,
} from "@/lib/types";
import { ABORT_MESSAGES, classifyMcpError } from "./mcp-tool-errors";

export async function runMessageStream(
  client: Anthropic,
  params: Record<string, unknown>,
  onAuthError?: () => void,
): Promise<ApiResponse> {
  const stream = client.beta.messages.stream(
    params as unknown as Parameters<Anthropic["beta"]["messages"]["stream"]>[0],
  );

  let mcpToolErrorCount = 0;
  let mcpAuthErrorCount = 0;
  let abortedDueToRetryLoop = false;
  let abortCategory: McpErrorCategory = "validation";

  stream.on("contentBlock", (block) => {
    if (
      block.type === "mcp_tool_result" &&
      (block as { is_error?: boolean }).is_error
    ) {
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
      cache_creation_input_tokens: (response.usage as unknown as Record<string, number>)
        .cache_creation_input_tokens,
      cache_read_input_tokens: (response.usage as unknown as Record<string, number>)
        .cache_read_input_tokens,
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
        cache_creation_input_tokens: (
          partialUsage as Record<string, number> | undefined
        )?.cache_creation_input_tokens,
        cache_read_input_tokens: (
          partialUsage as Record<string, number> | undefined
        )?.cache_read_input_tokens,
      };

      console.log(`[Token Usage] (aborted — ${abortCategory})`, usage);

      return {
        content: [...partialContent, syntheticBlock],
        usage,
      };
    }
    throw err;
  }
}
