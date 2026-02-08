export interface McpServerConfig {
  url: string;
  name: string;
}

export interface VerticalConfig {
  id: string;
  name: string;
  tagline: string;
  description: string;
  color: "food" | "style" | "dining" | "foodorder";
  icon: string;
  systemPrompt: string;
  welcomeMessage: string;
  examplePrompts: string[];
  mcpServer: McpServerConfig;
}

export interface ContentBlock {
  type: string;
  text?: string;
  id?: string;
  name?: string;
  server_name?: string;
  input?: Record<string, unknown>;
  tool_use_id?: string;
  is_error?: boolean;
  content?: unknown;
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

export type ParsedToolResult =
  | { type: "products"; items: ParsedProduct[] }
  | { type: "restaurants"; items: ParsedRestaurant[] }
  | { type: "time_slots"; slots: ParsedTimeSlot[]; restaurantName?: string }
  | { type: "addresses"; addresses: ParsedAddress[] }
  | { type: "cart"; cart: CartState }
  | { type: "order_placed"; orderId?: string; status?: string }
  | { type: "booking_confirmed"; details: Record<string, unknown> }
  | { type: "raw"; content: unknown }
