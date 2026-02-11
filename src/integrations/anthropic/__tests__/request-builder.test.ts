import { buildMessageStreamParams } from "@/integrations/anthropic/request-builder";
import { MCP_BETA_FLAG, MCP_SERVERS } from "@/lib/constants";
import { foodVertical } from "@/verticals/food";
import { styleVertical } from "@/verticals/style";
import { diningVertical } from "@/verticals/dining";
import { foodOrderVertical } from "@/verticals/foodOrder";
import type { ParsedAddress } from "@/lib/types";

describe("buildMessageStreamParams()", () => {
  const messages = [{ role: "user" as const, content: "hello", timestamp: Date.now() }];

  it("includes MCP servers and tools when token is available", () => {
    const params = buildMessageStreamParams(messages, foodVertical, "swiggy-token");

    expect(params.mcp_servers).toEqual([
      {
        type: "url",
        url: MCP_SERVERS.instamart.url,
        name: MCP_SERVERS.instamart.name,
        authorization_token: "swiggy-token",
      },
    ]);

    expect(params.tools).toEqual([
      {
        type: "mcp_toolset",
        mcp_server_name: MCP_SERVERS.instamart.name,
      },
    ]);
  });

  it("omits MCP servers and tools when token is missing", () => {
    const params = buildMessageStreamParams(messages, foodVertical, null);
    expect(params.mcp_servers).toBeUndefined();
    expect(params.tools).toBeUndefined();
  });

  it("includes selected address context when provided", () => {
    const address: ParsedAddress = {
      id: "1",
      label: "Home",
      address: "123 Main Street",
    };

    const params = buildMessageStreamParams(messages, foodVertical, null, address);
    const systemBlocks = params.system as Array<Record<string, unknown>>;

    expect(systemBlocks).toHaveLength(2);
    expect(systemBlocks[1].text).toContain('Active delivery address ID: "1"');
    expect(systemBlocks[1].text).toContain("Home");
    expect(systemBlocks[1].text).toContain("123 Main Street");
    expect(systemBlocks[1].text).toContain("Do not call address/location tools");
  });

  it("includes compact session state summary when provided", () => {
    const params = buildMessageStreamParams(
      messages,
      foodVertical,
      null,
      undefined,
      "slots=goal,diet,servings; confirm=no",
    );
    const systemBlocks = params.system as Array<Record<string, unknown>>;

    expect(systemBlocks).toHaveLength(2);
    expect(systemBlocks[1].text).toContain("Conversation state snapshot");
    expect(systemBlocks[1].text).toContain("slots=goal,diet,servings");
  });

  it("sets required beta flags and context edits", () => {
    const params = buildMessageStreamParams(messages, foodVertical, null);
    expect(params.betas).toEqual([
      MCP_BETA_FLAG,
      "prompt-caching-2024-07-31",
      "context-management-2025-06-27",
    ]);

    expect(params.context_management).toEqual({
      edits: [
        {
          type: "clear_tool_uses_20250919",
          trigger: { type: "input_tokens", value: 25000 },
          keep: { type: "tool_uses", value: 5 },
          clear_at_least: { type: "input_tokens", value: 2000 },
        },
      ],
    });
  });

  it("maps each tab to its MCP server toolset when token is available", () => {
    const cases = [
      { vertical: foodVertical, expected: MCP_SERVERS.instamart },
      { vertical: styleVertical, expected: MCP_SERVERS.instamart },
      { vertical: diningVertical, expected: MCP_SERVERS.dineout },
      { vertical: foodOrderVertical, expected: MCP_SERVERS.food },
    ];

    for (const { vertical, expected } of cases) {
      const params = buildMessageStreamParams(messages, vertical, "swiggy-token");
      expect(params.mcp_servers).toEqual([
        {
          type: "url",
          url: expected.url,
          name: expected.name,
          authorization_token: "swiggy-token",
        },
      ]);
      expect(params.tools).toEqual([
        {
          type: "mcp_toolset",
          mcp_server_name: expected.name,
        },
      ]);
    }
  });

  it("bounds message context to the most recent entries", () => {
    const manyMessages = Array.from({ length: 30 }, (_, i) => ({
      role: (i % 2 === 0 ? "user" : "assistant") as "user" | "assistant",
      content: `message-${i}`,
      timestamp: i,
    }));

    const params = buildMessageStreamParams(manyMessages, foodVertical, null);
    const apiMessages = params.messages as Array<{ content: string }>;

    expect(apiMessages).toHaveLength(24);
    expect(apiMessages[0]?.content).toBe("message-6");
    expect(apiMessages[23]?.content).toBe("message-29");
  });

  it("preserves all content blocks including tool blocks in older messages", () => {
    const toolHeavyAssistant = {
      role: "assistant" as const,
      timestamp: 2,
      content: [
        { type: "text" as const, text: "Summary text" },
        { type: "mcp_tool_use" as const, id: "u-1", name: "search_menu", input: { q: "pizza" } },
        { type: "mcp_tool_result" as const, tool_use_id: "u-1", content: "{\"items\":[1,2,3]}" },
      ],
    };

    const messages = [
      { role: "user" as const, content: "hello", timestamp: 1 },
      toolHeavyAssistant,
      { role: "user" as const, content: "latest", timestamp: 3 },
      { role: "assistant" as const, content: "latest response", timestamp: 4 },
    ];

    const params = buildMessageStreamParams(messages, foodVertical, null);
    const apiMessages = params.messages as Array<{ role: string; content: unknown }>;
    const assistantWithTools = apiMessages.find((m) => Array.isArray(m.content));
    const blocks = assistantWithTools?.content as Array<{ type: string }>;

    expect(blocks).toHaveLength(3);
    expect(blocks.map((b) => b.type)).toEqual(["text", "mcp_tool_use", "mcp_tool_result"]);
  });
});
