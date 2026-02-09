import {
  MCP_BETA_FLAG,
  MAX_TOKENS,
  MODEL_ID,
} from "@/lib/constants";
import type { ChatMessage, ParsedAddress, VerticalConfig } from "@/lib/types";

export function buildMessageStreamParams(
  messages: ChatMessage[],
  vertical: VerticalConfig,
  swiggyToken: string | null,
  selectedAddress?: ParsedAddress | null,
): Record<string, unknown> {
  const apiMessages = messages.map((msg) => ({
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
      text: `The user's delivery address is: "${selectedAddress.label}" — ${selectedAddress.address}. Use this as the default delivery location for all operations.`,
      cache_control: { type: "ephemeral" },
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
          trigger: { type: "input_tokens", value: 10000 },
          keep: { type: "tool_uses", value: 3 },
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
