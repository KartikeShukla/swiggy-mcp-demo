export const MODEL_ID = "claude-haiku-4-5-20251001";
export const MCP_BETA_FLAG = "mcp-client-2025-11-20";

// Auth
export const TOKEN_STALENESS_MS = 3_600_000; // 1 hour
export const OAUTH_POPUP_WIDTH = 500;
export const OAUTH_POPUP_HEIGHT = 600;

// Chat
export const MAX_TOKENS = 1024;
export const MCP_TOOL_ERROR_LIMIT = 2;
export const MCP_AUTH_ERROR_LIMIT = 1;
export const TEXT_COLLAPSE_THRESHOLD = 120;
export const TEXTAREA_MAX_HEIGHT = 160;

// UI
export const CART_BOUNCE_MS = 300;
export const MAX_OFFERS_SHOWN = 2;

// Parsers
export const MAX_STATUS_DETAILS = 6;
export const MAX_STATUS_CARD_DETAILS = 4;
export const PAYLOAD_EXTRACT_MAX_DEPTH = 2;
export const MAX_PRODUCTS_SHOWN = 5;
export const MAX_RESTAURANTS_SHOWN = 10;

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
  selectedAddress: "mcp-demo:selected-address",
  chatHistory: (verticalId: string) => `mcp-demo:chat:${verticalId}`,
} as const;
