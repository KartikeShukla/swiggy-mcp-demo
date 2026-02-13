# Data Models

All TypeScript interfaces, Zod schemas, and parsed types used in the Swiggy MCP Demo. Types are defined in `src/lib/types.ts`; Zod schemas mirror them in `src/lib/schemas.ts` (using `zod/v4`). Prompt types live in `src/verticals/prompt-spec/types.ts`.

See also: [MCP_TOOLS.md](./MCP_TOOLS.md), [ARCHITECTURE.md](./ARCHITECTURE.md), [contracts/parser-contract.md](./contracts/parser-contract.md)

---

## Core Config Types

### `McpServerConfig`

```typescript
interface McpServerConfig {
  url: string;    // MCP server URL (e.g., "https://mcp.swiggy.com/im")
  name: string;   // Server name (e.g., "swiggy-instamart")
}
```

### `VerticalConfig`

```typescript
interface VerticalConfig {
  id: string;                        // Vertical identifier ("food", "style", "dining", "foodorder")
  name: string;                      // Display name ("NutriCart", "StyleKit", etc.)
  tabName: string;                   // Navigation tab label ("Nutrition", "Style", "Dine", "Order")
  description: string;               // One-line description for landing page
  color: "food" | "style" | "dining" | "foodorder";  // Theme color key
  icon: string;                      // Lucide icon name
  systemPrompt: string;              // Compiled system prompt (from PromptProfile)
  welcomeMessage: string;            // Empty-state welcome text
  examplePrompts: string[];          // Suggested starter prompts
  mcpServer: McpServerConfig;        // Which MCP server to use
  promptProfileId?: string;          // Links back to PromptProfile.id
}
```

---

## Content Block Types

### `TextBlock`

```typescript
interface TextBlock {
  type: "text";
  text: string;
}
```

### `McpToolUseBlock`

```typescript
interface McpToolUseBlock {
  type: "mcp_tool_use";
  id: string;                          // Unique block ID (matches tool_use_id in result)
  name: string;                        // Tool name (e.g., "search_products")
  server_name?: string;                // MCP server name
  input?: Record<string, unknown>;     // Tool input parameters
}
```

### `McpToolResultBlock`

```typescript
interface McpToolResultBlock {
  type: "mcp_tool_result";
  tool_use_id: string;                 // Matches McpToolUseBlock.id
  is_error?: boolean;                  // Whether the tool call errored
  content: unknown;                    // Raw tool result (string, array of text blocks, or object)
}
```

### `ContentBlock` (Union)

```typescript
type ContentBlock = TextBlock | McpToolUseBlock | McpToolResultBlock;
```

---

## Chat & Token Types

### `ChatMessage`

```typescript
interface ChatMessage {
  role: "user" | "assistant";
  content: string | ContentBlock[];    // User messages: string; Assistant messages: ContentBlock[]
  timestamp: number;                   // Unix timestamp (ms)
}
```

### `TokenUsage`

```typescript
interface TokenUsage {
  input_tokens: number;
  output_tokens: number;
  cache_creation_input_tokens?: number;  // Tokens used to create cache entries
  cache_read_input_tokens?: number;      // Tokens read from cache
}
```

### `ApiResponse`

```typescript
interface ApiResponse {
  content: ContentBlock[];
  usage: TokenUsage;
}
```

---

## Parsed Result Types

All types returned by the parser pipeline (`parseToolResult()`). See [MCP_TOOLS.md](./MCP_TOOLS.md) for the processing pipeline.

### `ParsedProduct`

```typescript
interface ParsedProduct {
  id: string;              // Product ID (from various keys: id, productId, product_id, item_id)
  name: string;            // Display name (from: name, displayName, product_name, title)
  price?: number;          // Sale price (from 15+ price key patterns, may be paise-converted)
  mrp?: number;            // MRP / original price
  image?: string;          // Image URL
  brand?: string;          // Brand name
  itemType?: string;       // Category/subcategory (from: item_type, product_type, sub_category, category)
  sku?: string;            // SKU identifier
  groupKey?: string;       // Normalized group key for card grouping
  groupLabel?: string;     // Display label for group header
  sourceQuery?: string;    // Original search query (from tool input)
  groupOrder?: number;     // Ordering index within groups
  quantity?: string;       // Pack size / weight description
  available?: boolean;     // Stock availability (default: true)
  description?: string;    // Description or veg/non-veg label
}
```

### `ParsedRestaurant`

```typescript
interface ParsedRestaurant {
  id: string;              // Restaurant ID
  name: string;            // Restaurant name
  cuisine?: string;        // Comma-separated cuisines
  rating?: number;         // Average rating
  priceForTwo?: string;    // Price for two display string (e.g., "₹500")
  image?: string;          // Image URL
  address?: string;        // Full address
  offers?: string[];       // Active offer strings
  locality?: string;       // Area / neighborhood
}
```

### `ParsedTimeSlot`

```typescript
interface ParsedTimeSlot {
  time: string;            // Time label (from: time, slot, label, start_time)
  available: boolean;      // Whether the slot is available
}
```

### `ParsedAddress`

```typescript
interface ParsedAddress {
  id: string;              // Address ID
  label: string;           // Address label (from: label, type, tag, annotation, category)
  address: string;         // Full address string
  lat?: number;            // Latitude
  lng?: number;            // Longitude
}
```

### `ParsedStatus`

```typescript
interface ParsedStatus {
  success: boolean;        // Operation success/failure
  message: string;         // Human-readable message (normalized for overload/error patterns)
  details?: Record<string, unknown>;  // Additional fields (capped at MAX_STATUS_DETAILS = 6)
}
```

### `ParsedInfoEntry`

```typescript
interface ParsedInfoEntry {
  key: string;             // Humanized key (e.g., "Order ID" from "order_id")
  value: string;           // Stringified value
}
```

### `CartItem`

```typescript
interface CartItem {
  id: string;              // Item ID
  name: string;            // Item name
  price: number;           // Unit price
  quantity: number;        // Quantity (default: 1)
  image?: string;          // Image URL
}
```

### `CartState`

```typescript
interface CartState {
  items: CartItem[];       // Cart line items
  subtotal: number;        // Item total (computed or from lineItems)
  deliveryFee: number;     // Delivery fee (0 if not present)
  total: number;           // Grand total (computed or from lineItems)
}
```

### `ParsedToolResult` (Discriminated Union)

```typescript
type ParsedToolResult =
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
```

10 variants. The `type` field is the discriminant. The `"raw"` variant is the ultimate fallback when no parser succeeds.

---

## Action & State Types

### `ChatAction`

```typescript
type ChatAction =
  | string                                                        // Plain text message
  | { kind: "text"; text: string }                                // Wrapped text message
  | { kind: "select_address"; address: ParsedAddress; message: string }  // Address selection
```

### `McpErrorCategory`

```typescript
type McpErrorCategory = "auth" | "server" | "validation" | "address";
```

### `ParserIntentHint`

```typescript
type ParserIntentHint = "discover" | "menu" | "availability" | "cart" | "confirm";
```

### `ConversationStateSnapshot`

```typescript
interface ConversationStateSnapshot {
  slots: string[];                    // Filled slot keys
  selectedAddress?: string;
  selectedRestaurant?: string;
  pendingConfirmation: boolean;
  intent: ParserIntentHint;
}
```

### `TextParseResult`

```typescript
interface TextParseResult {
  segments: Array<
    | { type: "text"; content: string }
    | { type: "products"; items: ParsedProduct[] }
  >;
}
```

---

## Display Types

### `DisplaySegment`

```typescript
type DisplaySegment =
  | { kind: "text"; block: ContentBlock; index: number }
  | { kind: "tool_group"; blocks: { block: ContentBlock; index: number }[] }
```

Used by `groupBlocks()` in `content-blocks.ts` to group consecutive tool_use/result blocks for rendering.

---

## Prompt System Types

Defined in `src/verticals/prompt-spec/types.ts`.

### `VerticalId`

```typescript
type VerticalId = "food" | "style" | "dining" | "foodorder";
```

### `PromptSlotRule`

```typescript
interface PromptSlotRule {
  key: string;            // Slot identifier (e.g., "goal", "diet", "servings")
  prompt: string;         // Question to collect the slot
  required?: boolean;     // Whether the slot must be filled before tool use
  when?: string;          // Conditional requirement (e.g., "if skincare path")
}
```

### `PromptProfile`

```typescript
interface PromptProfile {
  id: VerticalId;
  assistantName: string;          // e.g., "NutriCart"
  mission: string;                // One-line mission statement
  inScope: string[];              // What the assistant can do
  outOfScope: string;             // What to decline
  slots: PromptSlotRule[];        // Information slots to collect
  preToolRequirement: string;     // What must be known before tool use
  phaseFlow: string[];            // Ordered execution phases
  toolPolicies: string[];         // Rules for tool usage
  responseStyle: string[];        // Response formatting rules
  confirmationRules: string[];    // Confirmation/checkout rules
  fallbackRules: string[];        // Fallback behavior rules
  includeCodRule?: boolean;       // Whether to include COD cancellation notice
}
```

---

## Integration & Server Types

### `BlockSanitizeResult` (from `message-sanitizer.ts`)

```typescript
interface BlockSanitizeResult {
  blocks: ContentBlock[];
  droppedBlocksCount: number;
}
```

### `MessageSanitizeResult` (from `message-sanitizer.ts`)

```typescript
interface MessageSanitizeResult {
  sanitizedMessages: ChatMessage[];
  droppedBlocksCount: number;
}
```

### `PendingAuth` (from `server/oauth/types.ts`)

```typescript
interface PendingAuth {
  codeVerifier: string;     // PKCE code verifier
  redirectUri: string;      // OAuth redirect URI
  createdAt: number;        // Timestamp for TTL expiry (10-min TTL)
}
```

### `OnboardingStep` (from `useAuth.ts`)

```typescript
type OnboardingStep = "idle" | "api-key" | "swiggy-connect" | "address-select";
```

### `LoadingContext` (from `useChat.ts`)

```typescript
type LoadingContext =
  | "generic" | "cart" | "menu" | "restaurant" | "slots"
  | "booking" | "address" | "auth" | "nutrition" | "style"
  | "grooming" | "order";
```

### `OAuthDiscoveryResult` (from `server/oauth/discovery.ts`)

```typescript
interface OAuthDiscoveryResult {
  authorizationEndpoint: string;
  tokenEndpoint: string;
  clientId?: string;
  scopes?: string[];
}
```

---

## Zod ↔ Interface Correspondence

| Interface | Zod Schema | Zod Import |
|-----------|------------|------------|
| `ParsedProduct` | `ParsedProductSchema` | `zod/v4` |
| `ParsedRestaurant` | `ParsedRestaurantSchema` | `zod/v4` |
| `ParsedTimeSlot` | `ParsedTimeSlotSchema` | `zod/v4` |
| `ParsedAddress` | `ParsedAddressSchema` | `zod/v4` |
| `ParsedStatus` | `ParsedStatusSchema` | `zod/v4` |
| `ParsedInfoEntry` | `ParsedInfoEntrySchema` | `zod/v4` |
| `CartItem` | `CartItemSchema` | `zod/v4` |
| `CartState` | `CartStateSchema` | `zod/v4` |

All schemas are defined in `src/lib/schemas.ts`. They use `z.object()` with `.optional()` for optional fields. Note: The schemas are slightly simpler than the interfaces (e.g., `ParsedProductSchema` has fewer fields than `ParsedProduct` — fields like `itemType`, `sku`, `groupKey`, `groupLabel`, `sourceQuery`, `groupOrder` are not validated at runtime).

---

## Cross-References

- [MCP_TOOLS.md](./MCP_TOOLS.md) — How ParsedToolResult variants are produced
- [ARCHITECTURE.md](./ARCHITECTURE.md) — How types flow through the system
- [contracts/parser-contract.md](./contracts/parser-contract.md) — Parser contract specification
