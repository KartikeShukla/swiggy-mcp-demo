export interface McpServerConfig {
  url: string;
  name: string;
}

export interface VerticalConfig {
  id: string;
  name: string;
  tabName: string;
  description: string;
  color: "food" | "style" | "dining" | "foodorder";
  icon: string;
  systemPrompt: string;
  welcomeMessage: string;
  examplePrompts: string[];
  mcpServer: McpServerConfig;
  promptProfileId?: string;
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
  itemType?: string;
  sku?: string;
  groupKey?: string;
  groupLabel?: string;
  sourceQuery?: string;
  groupOrder?: number;
  quantity?: string;
  variantLabel?: string;
  backendProductId?: string;
  backendVariantId?: string;
  available?: boolean;
  description?: string;
  restaurantName?: string;
}

export interface ParsedRestaurant {
  id: string;
  name: string;
  backendRestaurantId?: string;
  cuisine?: string;
  rating?: number;
  priceForTwo?: string;
  deliveryTime?: string;
  image?: string;
  address?: string;
  offers?: string[];
  locality?: string;
}

export interface ParsedTimeSlot {
  time: string;
  available: boolean;
  slotId?: string;
  slotToken?: string;
  restaurantId?: string;
  matchTier?: "preferred" | "other";
}

export interface ParsedAddress {
  id: string;
  label: string;
  address: string;
  lat?: number;
  lng?: number;
}

export interface CartAddSelectionItem {
  uiProductId: string;
  name: string;
  quantity: number;
  brand?: string;
  variantLabel?: string;
  price?: number;
  backendProductId?: string;
  backendVariantId?: string;
  restaurantName?: string;
}

export type ChatAction =
  | string
  | { kind: "text"; text: string }
  | { kind: "select_address"; address: ParsedAddress; message: string }
  | {
      kind: "cart_add_selection";
      message: string;
      items: CartAddSelectionItem[];
      verticalId?: string;
      restaurantName?: string;
    }
  | {
      kind: "cart_update_item";
      message: string;
      itemId: string;
      itemName: string;
      targetQuantity: number;
      restaurantName?: string;
    }
  | {
      kind: "restaurant_select";
      message: string;
      restaurantId: string;
      restaurantName: string;
      mode: "menu" | "availability";
    }
  | {
      kind: "slot_select";
      message: string;
      slotTime: string;
      slotId?: string;
      slotToken?: string;
      restaurantName?: string;
      restaurantId?: string;
    };

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

export type McpErrorCategory = "auth" | "server" | "validation" | "address";

export type ParserIntentHint =
  | "discover"
  | "menu"
  | "availability"
  | "cart"
  | "confirm";

export interface StrictConstraintSnapshot {
  cuisines?: string[];
  vibes?: string[];
  areas?: string[];
  dishes?: string[];
  diet?: "veg" | "non_veg" | "vegan";
  spicy?: boolean;
  budgetMax?: number;
  partySize?: number;
  timeHints?: string[];
  maxDeliveryMins?: number;
}

export interface ToolRenderContext {
  verticalId: string;
  latestUserQuery?: string;
  lockedRestaurant?: string | null;
  mode?: ParserIntentHint;
  strictConstraints?: StrictConstraintSnapshot;
  allowConstraintBroadening?: boolean;
  debug?: boolean;
}

export interface RelevanceDebugTrace {
  strategy: string;
  query?: string;
  mode?: ParserIntentHint;
  strictApplied?: string[];
  strictSatisfied?: boolean;
  beforeCount?: number;
  afterCount?: number;
  note?: string;
}

export interface ConversationStateSnapshot {
  slots: string[];
  selectedAddress?: string;
  selectedRestaurant?: string;
  pendingConfirmation: boolean;
  intent: ParserIntentHint;
}

export type ParsedToolResult =
  | {
      type: "products";
      items: ParsedProduct[];
      debug?: RelevanceDebugTrace;
    }
  | {
      type: "restaurants";
      items: ParsedRestaurant[];
      debug?: RelevanceDebugTrace;
    }
  | {
      type: "time_slots";
      slots: ParsedTimeSlot[];
      restaurantName?: string;
      slotGuidance?: string;
      debug?: RelevanceDebugTrace;
    }
  | { type: "addresses"; addresses: ParsedAddress[]; debug?: RelevanceDebugTrace }
  | { type: "cart"; cart: CartState; debug?: RelevanceDebugTrace }
  | { type: "order_placed"; orderId?: string; status?: string; debug?: RelevanceDebugTrace }
  | { type: "booking_confirmed"; details: Record<string, unknown>; debug?: RelevanceDebugTrace }
  | { type: "status"; status: ParsedStatus; debug?: RelevanceDebugTrace }
  | { type: "info"; title: string; entries: ParsedInfoEntry[]; debug?: RelevanceDebugTrace }
  | { type: "raw"; content: unknown; debug?: RelevanceDebugTrace }
