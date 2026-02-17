import {
  MCP_BETA_FLAG,
  MAX_TOKENS,
  MODEL_ID,
  MAX_CONTEXT_MESSAGES,
  KEEP_RECENT_MESSAGES_FULL,
  MAX_OLD_USER_MESSAGE_CHARS,
} from "@/lib/constants";
import type { ChatMessage, ParsedAddress, VerticalConfig } from "@/lib/types";
import {
  quotePromptValue,
  sanitizeUntrustedPromptText,
} from "@/lib/prompt-safety";
import {
  sanitizeMessagesForApi,
  compactOldMessages,
  compactOldUserMessages,
  truncateToolResultsInMessages,
} from "./message-sanitizer";
import { logger } from "@/lib/logger";

/**
 * Formats the current date and time using the user's browser locale (en-IN)
 * and appends the IANA timezone identifier (e.g. "Asia/Kolkata").
 *
 * The timezone is resolved from `Intl.DateTimeFormat`, so it reflects the
 * user's actual OS/browser setting rather than a hardcoded value.
 */
export function formatCurrentDateTime(): string {
  const now = new Date();
  const formatted = new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZoneName: "short",
  }).format(now);
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return `${formatted} (${tz})`;
}

/**
 * Builds the full parameter object for `client.beta.messages.stream()`.
 *
 * **System blocks** (assembled in order):
 * 1. Vertical prompt profile — cached with `cache_control: ephemeral`.
 * 2. Active delivery address (if available) — cached, instructs the model
 *    to treat it as the user's current location.
 * 3. Current date/time — uncached, provides temporal context for
 *    time-sensitive decisions (delivery windows, restaurant hours, etc.).
 * 4. Session state summary (if available) — uncached, carries compact
 *    intent/slot/filter signals across the conversation window.
 *
 * **Message processing pipeline** (applied sequentially):
 * 1. `sanitizeMessagesForApi` — removes orphaned tool_use/result blocks
 *    that would cause API validation errors.
 * 2. `compactOldMessages` — strips tool blocks from older assistant
 *    messages, keeping only text content.
 * 3. `compactOldUserMessages` — truncates long older user messages to
 *    `MAX_OLD_USER_MESSAGE_CHARS`.
 * 4. Bounding — takes the last `MAX_CONTEXT_MESSAGES` messages.
 * 5. `truncateToolResultsInMessages` — smart-truncates oversized
 *    tool result payloads using query-relevance scoring.
 *
 * **MCP config**: When a Swiggy token is present, attaches the vertical's
 * MCP server URL and a `mcp_toolset` tool entry so the model can invoke
 * Swiggy tools through Anthropic's MCP bridge.
 */
export function buildMessageStreamParams(
  messages: ChatMessage[],
  vertical: VerticalConfig,
  swiggyToken: string | null,
  selectedAddress?: ParsedAddress | null,
  sessionStateSummary?: string | null,
): Record<string, unknown> {
  const safeSessionStateSummary = sessionStateSummary
    ? sanitizeUntrustedPromptText(sessionStateSummary, 500)
    : null;
  const { sanitizedMessages } = sanitizeMessagesForApi(messages);
  const compactedMessages = compactOldMessages(
    sanitizedMessages,
    KEEP_RECENT_MESSAGES_FULL,
  );
  const compactedUserMessages = compactOldUserMessages(compactedMessages, {
    keepRecent: KEEP_RECENT_MESSAGES_FULL,
    maxChars: MAX_OLD_USER_MESSAGE_CHARS,
  });
  const boundedMessages = compactedUserMessages.slice(-MAX_CONTEXT_MESSAGES);
  const truncatedMessages = truncateToolResultsInMessages(boundedMessages);
  logger.debug("[Request Builder Context]", {
    sourceMessages: messages.length,
    sanitizedMessages: sanitizedMessages.length,
    compactedMessages: compactedMessages.length,
    compactedUserMessages: compactedUserMessages.length,
    boundedMessages: boundedMessages.length,
    maxContext: MAX_CONTEXT_MESSAGES,
  });

  const apiMessages = truncatedMessages.map((msg) => ({
    role: msg.role as "user" | "assistant",
    content: msg.content,
  }));

  const systemBlocks: Array<Record<string, unknown>> = [
    {
      type: "text",
      text: vertical.systemPrompt,
      cache_control: { type: "ephemeral" },
    },
  ];

  if (selectedAddress?.address) {
    systemBlocks.push({
      type: "text",
      text: [
        `Active delivery address ID: ${quotePromptValue(selectedAddress.id, 80)}.`,
        `Active default delivery address: ${quotePromptValue(selectedAddress.label, 80)} — ${quotePromptValue(selectedAddress.address, 200)}.`,
        "Treat this as the user's current location for search, availability, and checkout.",
        "Do not call address/location tools unless the user explicitly asks to change location or a tool requires address correction.",
      ].join(" "),
      cache_control: { type: "ephemeral" },
    });
  }

  systemBlocks.push({
    type: "text",
    text: [
      `Current date and time: ${formatCurrentDateTime()}.`,
      "Use this for any time-sensitive decisions like delivery windows, restaurant hours, booking availability, or freshness of search results.",
    ].join(" "),
  });

  if (safeSessionStateSummary) {
    systemBlocks.push({
      type: "text",
      text: `Conversation state snapshot: ${safeSessionStateSummary}.`,
    });
  }

  const params: Record<string, unknown> = {
    model: MODEL_ID,
    max_tokens: MAX_TOKENS,
    system: systemBlocks,
    messages: apiMessages,
    betas: [
      MCP_BETA_FLAG,
      "prompt-caching-2024-07-31",
      "context-management-2025-06-27",
    ],
    context_management: {
      edits: [
        {
          type: "clear_tool_uses_20250919",
          trigger: { type: "input_tokens", value: 12000 },
          keep: { type: "tool_uses", value: 3 },
          clear_at_least: { type: "input_tokens", value: 2000 },
        },
      ],
    },
  };

  if (swiggyToken) {
    params.mcp_servers = [
      {
        type: "url",
        url: vertical.mcpServer.url,
        name: vertical.mcpServer.name,
        authorization_token: swiggyToken,
      },
    ];
    params.tools = [
      {
        type: "mcp_toolset",
        mcp_server_name: vertical.mcpServer.name,
      },
    ];
  }

  return params;
}
