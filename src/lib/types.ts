export interface McpServerConfig {
  url: string;
  name: string;
}

export interface VerticalConfig {
  id: string;
  name: string;
  tabName: string;
  tagline: string;
  description: string;
  color: "food" | "style" | "dining" | "foodorder";
  icon: string;
  systemPrompt: string;
  welcomeMessage: string;
  examplePrompts: string[];
  mcpServer: McpServerConfig;
}

export interface TextBlock {
  type: "text";
  text: string;
}

export interface McpToolUseBlock {
  type: "mcp_tool_use";
  id: string;
  name: string;
  server_name?: string;
  input?: Record<string, unknown>;
}

export interface McpToolResultBlock {
  type: "mcp_tool_result";
  tool_use_id: string;
  is_error?: boolean;
  content: unknown;
}

export type ContentBlock = TextBlock | McpToolUseBlock | McpToolResultBlock;

export interface TokenUsage {
  input_tokens: number;
  output_tokens: number;
  cache_creation_input_tokens?: number;
  cache_read_input_tokens?: number;
}

export interface ApiResponse {
  content: ContentBlock[];
  usage: TokenUsage;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string | ContentBlock[];
  timestamp: number;
}

// --- Parsed item types for rich card rendering ---

export interface ParsedProduct {
  id: string;
  name: string;
  price?: number;
  mrp?: number;
  image?: string;
  brand?: string;
  quantity?: string;
  available?: boolean;
  description?: string;
}

export interface ParsedRestaurant {
  id: string;
  name: string;
  cuisine?: string;
  rating?: number;
  priceForTwo?: string;
  image?: string;
  address?: string;
  offers?: string[];
  locality?: string;
}

export interface ParsedTimeSlot {
  time: string;
  available: boolean;
}

export interface ParsedAddress {
  id: string;
  label: string;
  address: string;
  lat?: number;
  lng?: number;
}

export interface ParsedStatus {
  success: boolean;
  message: string;
  details?: Record<string, unknown>;
}

export interface ParsedInfoEntry {
  key: string;
  value: string;
}

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface CartState {
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
}

export interface TextParseResult {
  segments: Array<
    | { type: "text"; content: string }
    | { type: "products"; items: ParsedProduct[] }
  >;
}

export type McpErrorCategory = "auth" | "server" | "validation";

export type ParsedToolResult =
  | { type: "products"; items: ParsedProduct[] }
  | { type: "restaurants"; items: ParsedRestaurant[] }
  | { type: "time_slots"; slots: ParsedTimeSlot[]; restaurantName?: string }
  | { type: "addresses"; addresses: ParsedAddress[] }
  | { type: "cart"; cart: CartState }
  | { type: "order_placed"; orderId?: string; status?: string }
  | { type: "booking_confirmed"; details: Record<string, unknown> }
  | { type: "status"; status: ParsedStatus }
  | { type: "info"; title: string; entries: ParsedInfoEntry[] }
  | { type: "raw"; content: unknown }
