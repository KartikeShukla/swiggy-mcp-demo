export const MODEL_ID = "claude-sonnet-4-5-20250929";
export const MCP_BETA_FLAG = "mcp-client-2025-11-20";

export const MCP_SERVERS = {
  instamart: {
    url: "https://mcp.swiggy.com/im",
    name: "swiggy-instamart",
  },
  dineout: {
    url: "https://mcp.swiggy.com/dineout",
    name: "swiggy-dineout",
  },
  food: {
    url: "https://mcp.swiggy.com/food",
    name: "swiggy-food",
  },
} as const;

export const STORAGE_KEYS = {
  apiKey: "mcp-demo:api-key",
  swiggyToken: "mcp-demo:swiggy-token",
  swiggyTokenTs: "mcp-demo:swiggy-token-ts",
  chatHistory: (verticalId: string) => `mcp-demo:chat:${verticalId}`,
} as const;
