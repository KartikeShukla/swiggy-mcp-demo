import Anthropic, { APIUserAbortError } from "@anthropic-ai/sdk";
import {
  MCP_AUTH_ERROR_LIMIT,
  MCP_TOOL_ERROR_LIMIT,
  STREAM_REQUEST_TIMEOUT_MS,
} from "@/lib/constants";
import { logger } from "@/lib/logger";
import type {
  ApiResponse,
  ContentBlock,
  McpErrorCategory,
} from "@/lib/types";
import { ABORT_MESSAGES, classifyMcpError } from "./mcp-tool-errors";
import { sanitizeAssistantBlocks } from "./message-sanitizer";

function ensureNonEmptyContent(content: ContentBlock[], fallbackText: string): ContentBlock[] {
  if (content.length > 0) return content;
  return [{ type: "text", text: fallbackText }];
}

export async function runMessageStream(
  client: Anthropic,
  params: Record<string, unknown>,
  onAuthError?: () => void,
  onAddressError?: () => void,
): Promise<ApiResponse> {
  const stream = client.beta.messages.stream(
    params as unknown as Parameters<Anthropic["beta"]["messages"]["stream"]>[0],
  );

  let mcpToolErrorCount = 0;
  let mcpAuthErrorCount = 0;
  let abortedDueToRetryLoop = false;
  let abortCategory: McpErrorCategory = "validation";
  let timedOut = false;
  const timeoutId = setTimeout(() => {
    timedOut = true;
    logger.warn(`Stream timed out after ${STREAM_REQUEST_TIMEOUT_MS}ms — aborting`);
    stream.abort();
  }, STREAM_REQUEST_TIMEOUT_MS);

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

      if (category === "address") {
        onAddressError?.();
        logger.warn("MCP address error — aborting stream and requesting reselection");
        abortedDueToRetryLoop = true;
        abortCategory = "address";
        stream.abort();
        return;
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
    const sanitized = sanitizeAssistantBlocks(
      response.content as ApiResponse["content"],
    );
    const safeContent = ensureNonEmptyContent(
      sanitized.blocks,
      "I completed that request but did not receive a final assistant message. Please try once.",
    );

    const usage = {
      input_tokens: response.usage.input_tokens,
      output_tokens: response.usage.output_tokens,
      cache_creation_input_tokens: (response.usage as unknown as Record<string, number>)
        .cache_creation_input_tokens,
      cache_read_input_tokens: (response.usage as unknown as Record<string, number>)
        .cache_read_input_tokens,
    };

    logger.debug("[Token Usage]", usage);

    return {
      content: safeContent,
      usage,
    };
  } catch (err) {
    if (timedOut) {
      const partial = stream.currentMessage;
      const partialContent = sanitizeAssistantBlocks(
        (partial?.content ?? []) as ContentBlock[],
      ).blocks;
      const partialUsage = partial?.usage;

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

      return {
        content: ensureNonEmptyContent(
          partialContent,
          "This request took longer than expected and timed out. Please try again with a shorter or more specific request.",
        ),
        usage,
      };
    }

    if (abortedDueToRetryLoop && err instanceof APIUserAbortError) {
      const partial = stream.currentMessage;
      const partialContent = sanitizeAssistantBlocks(
        (partial?.content ?? []) as ContentBlock[],
      ).blocks;
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

      logger.debug(`[Token Usage] (aborted — ${abortCategory})`, usage);

      return {
        content: ensureNonEmptyContent(
          [...partialContent, syntheticBlock],
          ABORT_MESSAGES[abortCategory],
        ),
        usage,
      };
    }

    if (
      err instanceof Error &&
      /stream ended without producing a Message with role=assistant/i.test(
        err.message,
      )
    ) {
      const partial = stream.currentMessage;
      const partialContent = sanitizeAssistantBlocks(
        (partial?.content ?? []) as ContentBlock[],
      ).blocks;
      const partialUsage = partial?.usage;

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

      return {
        content: ensureNonEmptyContent(
          partialContent,
          "I finished processing but the stream ended unexpectedly. Please retry once.",
        ),
        usage,
      };
    }

    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}
