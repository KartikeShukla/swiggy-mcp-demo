import {
  MCP_BETA_FLAG,
  MAX_TOKENS,
  MODEL_ID,
} from "@/lib/constants";
import type { ChatMessage, ParsedAddress, VerticalConfig } from "@/lib/types";
import { sanitizeMessagesForApi, truncateOldToolResults } from "./message-sanitizer";

const MAX_CONTEXT_MESSAGES = 16;

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

export function buildMessageStreamParams(
  messages: ChatMessage[],
  vertical: VerticalConfig,
  swiggyToken: string | null,
  selectedAddress?: ParsedAddress | null,
  sessionStateSummary?: string | null,
): Record<string, unknown> {
  const { sanitizedMessages } = sanitizeMessagesForApi(messages);
  const truncatedMessages = truncateOldToolResults(sanitizedMessages);
  const boundedMessages = truncatedMessages.slice(-MAX_CONTEXT_MESSAGES);

  const apiMessages = boundedMessages.map((msg) => ({
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
        `Active delivery address ID: "${selectedAddress.id}".`,
        `Active default delivery address: "${selectedAddress.label}" — ${selectedAddress.address}.`,
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

  if (sessionStateSummary) {
    systemBlocks.push({
      type: "text",
      text: `Conversation state snapshot: ${sessionStateSummary}.`,
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
          trigger: { type: "input_tokens", value: 18000 },
          keep: { type: "tool_uses", value: 3 },
          clear_at_least: { type: "input_tokens", value: 4000 },
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
