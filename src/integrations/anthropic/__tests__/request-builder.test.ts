import { buildMessageStreamParams } from "@/integrations/anthropic/request-builder";
import { MCP_BETA_FLAG, MCP_SERVERS } from "@/lib/constants";
import { foodVertical } from "@/verticals/food";
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
    expect(systemBlocks[1].text).toContain("Home");
    expect(systemBlocks[1].text).toContain("123 Main Street");
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
          trigger: { type: "input_tokens", value: 10000 },
          keep: { type: "tool_uses", value: 3 },
        },
      ],
    });
  });
});
