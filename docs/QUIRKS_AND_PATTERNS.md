# Quirks and Patterns

Tribal knowledge, hacks, magic values, demo logic, and gotchas. Each entry explains **what** and **why** so future developers and AI agents can understand intent.

See also: [ARCHITECTURE.md](./ARCHITECTURE.md), [MCP_TOOLS.md](./MCP_TOOLS.md)

---

## 1. Browser SDK with `dangerouslyAllowBrowser: true`

**File:** `src/lib/anthropic.ts`

```typescript
new Anthropic({ apiKey, dangerouslyAllowBrowser: true, maxRetries: 0 });
```

**Why:** This is intentional. The Anthropic SDK normally warns against browser usage because API keys are exposed. In this demo, the API key is user-provided and stored in localStorage. MCP tool calls are executed **server-side by Anthropic** (not in the browser), so there's no CORS or security issue with MCP execution itself.

---

## 2. `maxRetries: 0` on SDK Client

**File:** `src/lib/anthropic.ts`

The SDK's built-in retry mechanism is disabled. Instead, custom retry logic in `retry-policy.ts` handles retries with:
- Max 2 retries
- Exponential backoff: 500ms base, 2x multiplier, 20% jitter, 5s cap
- Only retries statuses: 429, 500, 502, 503, 504, 529

**Why:** The custom policy integrates with the two-layer error handling (API-level + MCP tool-level) and provides more control over retry behavior, including the ability to classify errors before deciding whether to retry.

---

## 3. Paise-to-Rupee Price Conversion

**File:** `src/lib/parsers/products.ts` (lines 203-211)

```typescript
const allPricesLargeIntegers = items.every(
  (i) => i.price != null && i.price > 1000 && Number.isInteger(i.price),
);
if (allPricesLargeIntegers) {
  for (const item of items) {
    if (item.price != null) item.price = item.price / 100;
    if (item.mrp != null) item.mrp = item.mrp / 100;
  }
}
```

**Why:** Some Swiggy MCP servers return prices in paise (Indian cents) instead of rupees. The heuristic: if ALL prices in a result set are >1000 AND are integers, they're probably in paise. Dividing by 100 converts to rupees. This avoids showing "₹15000" when the actual price is "₹150."

---

## 4. Tool Result Unwrapping Pipeline

**File:** `src/lib/parsers/unwrap.ts`

The Anthropic API returns MCP tool results in various formats:
- Plain JSON string: `'{"items": [...]}'`
- Array of text blocks: `[{ type: "text", text: '{"items": [...]}' }]`

`unwrapContent()` normalizes both into parsed data.

Then `extractPayload()` recursively drills through wrapper keys (`data`, `results`, `items`, `products`, `restaurants`, `menu`, `dishes`, `addresses`, `cart`, `cart_items`, `slots`, `menu_items`, `menu_categories`, `listings`, `options`) up to `PAYLOAD_EXTRACT_MAX_DEPTH = 2` levels deep.

**Special case:** `flattenCategoryItems()` handles double-nested menu structures like `{ categories: [{ name: "Starters", items: [{ card: { info: { name, price } } }] }] }` — the Swiggy food menu format.

---

## 5. Cart Nesting — 3 Levels Deep

**File:** `src/lib/parsers/cart.ts`

The cart parser tries items arrays at three nesting levels:

1. **Top level:** `obj.items`, `obj.cart_items`, `obj.products`, `obj.cartItems`
2. **One level:** `obj.cart.items`, `obj.cart.cart_items`
3. **Two levels:** `obj.data.items`, `obj.data.cart.items`

Plus a `lineItems` / `billBreakdown` extraction for bill totals.

**Why:** Different Swiggy MCP tools return cart data in different structures. `update_cart` nests under `.data.cart.items`, while `get_cart` might use `.items` directly. The parser must handle all variants.

---

## 6. Signal Key Disambiguation

**File:** `src/lib/parsers/orchestrator.ts`

Three sets of signal keys are used to classify payloads:

| Set | Count | Purpose |
|-----|-------|---------|
| `PRODUCT_SIGNAL_KEYS` | 28 | Keys that indicate product data (price, selling_price, mrp, variations, productId, etc.) |
| `STRONG_RESTAURANT_SIGNAL_KEYS` | 12 | Keys that definitively indicate restaurant data (cuisine, priceForTwo, locality, deliveryTime, sla, etc.) |
| `WEAK_RESTAURANT_SIGNAL_KEYS` | 3 | Keys that could be either (rating, avgRating, avg_rating) |

**Why:** Menu items from food delivery often have `rating` fields, making them look like restaurants. The strong/weak distinction prevents misclassification. Only "weak-only" results are treated as restaurants when the tool name explicitly suggests restaurant discovery.

---

## 7. Dish Name Hint Regex

**File:** `src/lib/parsers/orchestrator.ts`

```typescript
const DISH_NAME_HINT_PATTERN =
  /\b(paneer|chicken|mutton|fish|prawn|biryani|pizza|burger|sandwich|roll|wrap|tikka|masala|curry|thali|noodles|fries|rice|soup|salad|kebab|falafel|shawarma)\b/i;
```

**Why:** Used as a tie-breaker when a payload has weak restaurant signals but the item names contain dish names. If the `name` field contains "Paneer Tikka" or "Chicken Biryani," it's products, not restaurants — even if the payload has a `rating` field.

---

## 8. FoodOrder Product/Restaurant Disambiguation

**File:** `src/lib/parsers/orchestrator.ts` (lines 167-194)

The most complex parsing path. When `verticalId === "foodorder"` and `SEARCH_TOOL_RE` matches:

1. Is the tool a **restaurant discovery** tool? (`/restaurant/i` AND NOT `/menu|dish|item/i`)
2. Is it a **menu intent** tool? (`/menu|dish|item/i`)
3. Analyze payload signals across first 5 items
4. `shouldPreferProducts` = true if:
   - Menu intent tool, OR
   - Menu signals detected, OR
   - Product signals without strong restaurant signals, OR
   - Weak-only restaurant signals AND (not restaurant discovery OR has dish name hints)
5. Try preferred type first, fall through to the other

**Why:** FeedMe uses a single MCP server that returns both restaurants and menu items. The same `search` tool might return restaurants (when browsing) or menu items (when a restaurant is selected). The multi-path logic handles this without separate tool endpoints.

---

## 9. Session Summary Deliberately Not Cached

**File:** `src/integrations/anthropic/request-builder.ts`

The system blocks use `cache_control: { type: "ephemeral" }` on the prompt and address blocks, but the session summary and datetime blocks do NOT have cache control.

**Why:** The session summary changes every turn (it reflects the latest slots, intent, and restaurant selection). Caching it would serve stale state. The prompt and address are stable across turns, so caching them saves tokens.

---

## 10. Magic Constants Table

**File:** `src/lib/constants.ts`

| Constant | Value | Rationale |
|----------|-------|-----------|
| `MODEL_ID` | `"claude-haiku-4-5-20251001"` | Fast, cost-effective model for interactive chat |
| `MCP_BETA_FLAG` | `"mcp-client-2025-11-20"` | Required beta header for MCP API access |
| `TOKEN_STALENESS_MS` | `3_600_000` (1 hour) | Swiggy tokens expire after ~1 hour |
| `OAUTH_POPUP_WIDTH` | `500` | OAuth popup window width |
| `OAUTH_POPUP_HEIGHT` | `600` | OAuth popup window height |
| `MAX_TOKENS` | `1024` | Max output tokens per API call |
| `MCP_TOOL_ERROR_LIMIT` | `2` | Abort stream after 2 MCP tool errors |
| `MCP_AUTH_ERROR_LIMIT` | `1` | Abort stream after 1 auth error |
| `STREAM_REQUEST_TIMEOUT_MS` | `90_000` (90s) | Stream abort timeout |
| `TEXT_COLLAPSE_THRESHOLD` | `120` | Characters before text is collapsed |
| `TEXTAREA_MAX_HEIGHT` | `160` | Max height of chat input textarea |
| `CART_BOUNCE_MS` | `300` | Cart button bounce animation duration |
| `MAX_OFFERS_SHOWN` | `2` | Max offers shown on restaurant card |
| `MAX_STATUS_DETAILS` | `6` | Max detail fields on status card |
| `MAX_STATUS_CARD_DETAILS` | `4` | Max details on compact status card |
| `PAYLOAD_EXTRACT_MAX_DEPTH` | `2` | Max recursion depth for extractPayload |
| `MAX_PRODUCTS_SHOWN` | `5` | Max products shown in default view |
| `MAX_MENU_PRODUCTS_SHOWN` | `10` | Max products shown for foodorder menus |
| `MAX_RESTAURANTS_SHOWN` | `10` | Max restaurants shown |

Additional constants in `request-builder.ts`:
- `MAX_CONTEXT_MESSAGES = 24` — only last 24 messages sent to API

Additional constants in `useChatApi.ts`:
- `CHAT_REQUEST_MAX_RETRIES = 2`

Additional constants in `fetchAddresses.ts`:
- `ADDRESS_FETCH_MAX_RETRIES = 2`

Additional constants in `server/oauth/plugin.ts`:
- `PENDING_AUTH_TTL_MS = 600_000` (10 minutes)
- `PENDING_AUTH_CLEANUP_MS = 60_000` (1 minute)

---

## 11. Address ID Validation

**File:** `src/lib/storage.ts`

```typescript
function isValidPersistedAddressId(id: string): boolean {
  const normalized = id.trim();
  if (!normalized) return false;
  if (/^chat-/i.test(normalized)) return false;
  if (/^address$/i.test(normalized)) return false;
  return true;
}
```

**Why:** Rejects IDs starting with `"chat-"` (which are internal message IDs) or exactly `"address"` (a placeholder string). These can end up in localStorage if the address picker sends a malformed selection. The `getValidatedSelectedAddress()` function uses this to auto-clear invalid addresses.

---

## 12. Optimistic Cart in FoodOrder

**File:** `src/components/chat/ChatView.tsx`

The `ChatViewInner` component maintains `optimisticCartItems` state for the FeedMe vertical. When a user adds items via the unified "Add to cart" button:

1. The message is sent to the API (async)
2. If the send succeeds, items are added to `optimisticCartItems` immediately
3. The `effectiveCart` displays whichever is available: the real MCP cart (from parsed messages) or the optimistic cart

**Why:** MCP cart updates take several seconds. Without optimistic UI, the cart would appear empty between the user clicking "Add" and the API response arriving. Once a real cart is parsed from an API response, it takes precedence over the optimistic state.

---

## 13. Structured Cart Action Messages

**File:** `src/components/chat/ChatView.tsx` (lines 193-210)

For the FeedMe vertical, the "Add to cart" button generates a structured message:

```
Cart update request (menu mode):
Selected restaurant: <name>.
Add to cart: 2x Butter Chicken, 1x Naan.
Structured items: [{"item_id":"123","name":"Butter Chicken","quantity":2},...].
Execute cart update directly. Do not run restaurant discovery.
Do not run menu discovery or fetch/show menu items for this restaurant again unless the user explicitly asks to see the menu.
```

**Why:** This gives the AI precise instructions to call the cart mutation tool directly with the exact item IDs and quantities, avoiding unnecessary search or menu fetch tool calls. The structured JSON payload is embedded in the natural language message so the AI can extract it reliably.

---

## 14. React Key on `verticalId` — Full Remount

**File:** `src/components/chat/ChatView.tsx` (line 356)

```tsx
return <ChatViewInner key={verticalId} vertical={vertical} {...props} />;
```

**Why:** When the user switches verticals (e.g., from NutriCart to FeedMe), all hook state must reset — messages, loading state, errors, pending selections, optimistic cart. Using `key={verticalId}` forces React to unmount and remount `ChatViewInner`, creating fresh hook instances. Without this, stale state from the previous vertical would leak into the new one.

---

## 15. Dark Mode Before React

**File:** `index.html`

```html
<script>
  (function () {
    var t = localStorage.getItem("theme");
    if (t === "dark" || (!t && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
      document.documentElement.classList.add("dark");
    }
  })();
</script>
```

**Why:** This runs synchronously before React mounts, preventing a flash of light mode → dark mode transition. The Tailwind dark mode classes are applied immediately based on localStorage or system preference.

---

## 16. PhoneFrame Safe Areas

**File:** `src/components/layout/PhoneFrame.tsx`

The app renders inside a phone mockup with CSS custom properties `--safe-top` and `--safe-bottom`. These are used throughout components for padding/positioning:

```css
/* Example usage in CartPanel */
max-h-[calc(100%-var(--safe-top,0px)-1.5rem)]
pb-[calc(var(--safe-bottom,0px)+0.5rem)]
```

**Why:** The phone frame creates a visual demo experience. Safe areas ensure content doesn't overlap with the simulated notch or home indicator. The `phone-frame-context.ts` provides these values via React context.

---

## 17. Markdown-Lite Renderer

**File:** `src/lib/markdown.ts`

A custom markdown renderer that handles only: `**bold**`, `` `code` ``, `# headings` (1-3 levels), `- unordered lists`, `1. ordered lists`.

**Why:** Full markdown libraries (marked, react-markdown) are heavy for a demo that only needs basic formatting. The custom renderer is ~110 lines and handles the exact subset that Claude's responses use. It produces React elements directly (no HTML string injection).

---

## 18. `scanForPrice()` Fallback

**File:** `src/lib/parsers/primitives.ts`

```typescript
function scanForPrice(obj: Record<string, unknown>): number | undefined {
  for (const [key, val] of Object.entries(obj)) {
    if (/price|cost|amount|mrp/i.test(key) && key !== "priceForTwo" && key !== "price_for_two") {
      const n = num(val) ?? numFromCurrency(val);
      if (n != null && n > 0) return n;
    }
  }
  return undefined;
}
```

**Why:** After trying 15+ specific price key patterns, this is the last resort. It scans all object properties for any key containing "price", "cost", "amount", or "mrp" and returns the first valid number. Explicitly excludes `priceForTwo`/`price_for_two` to avoid using the restaurant-level "price for two" as an item price.

---

## 19. OAuth Discovery Cascade

**File:** `server/oauth/discovery.ts`

The discovery function tries 14+ URL patterns:
1. `https://mcp.swiggy.com/.well-known/oauth-authorization-server`
2. `https://mcp.swiggy.com/.well-known/openid-configuration`
3. Per-resource variants: `/im`, `/food`, `/dineout` (both RFC-style and alternative)
4. Protected resource metadata fallback: `/.well-known/oauth-protected-resource` variants
5. Each protected resource may reference an auth server → tries its well-known URLs too

**Why:** OAuth discovery URLs vary across providers. Swiggy's MCP server may change its discovery endpoint location. The cascade ensures the OAuth flow works regardless of which well-known path the server uses. Environment variables (`SWIGGY_OAUTH_*`) can override discovery entirely for debugging.

---

## 20. Token Endpoint in Cookie

**File:** `server/oauth/cookies.ts`, `server/oauth/start-handler.ts`

During the OAuth flow, the `mcp_token_endpoint` cookie stores the discovered token endpoint URL. The callback handler reads this cookie to know where to exchange the authorization code.

**Why:** The OAuth flow spans two HTTP requests (start → redirect → callback). The token endpoint discovered during the start phase must persist to the callback phase. A cookie is simpler than server-side session storage for a dev-only Vite middleware.

---

## 21. Loading Label Rotation

**File:** `src/hooks/useChat.ts`

12 loading contexts, each with 4 labels. Labels rotate every 1.8 seconds (`Math.floor(elapsedMs / 1800) % labels.length`).

The loading context is detected from user input text via regex, with vertical-specific defaults (e.g., `food` vertical defaults to "nutrition" context if no specific match).

**Why:** Static "Loading..." is boring. Contextual, rotating labels ("Scanning Menu → Matching Items → Filtering Dishes → Ranking Options") create the impression of progress and make the wait feel purposeful.

---

## Cross-References

- [ARCHITECTURE.md](./ARCHITECTURE.md) — System design context for these patterns
- [MCP_TOOLS.md](./MCP_TOOLS.md) — Parser pipeline details
