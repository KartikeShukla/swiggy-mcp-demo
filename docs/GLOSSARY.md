# Glossary

Alphabetical terminology reference for the Swiggy MCP Demo.

See also: [ARCHITECTURE.md](./ARCHITECTURE.md), [MCP_TOOLS.md](./MCP_TOOLS.md), [VERTICALS.md](./VERTICALS.md)

---

**Action Message**
A `ChatAction` value representing a user interaction — can be a plain string, a `{ kind: "text" }` object, or a `{ kind: "select_address" }` object. Generated when users click cards, buttons, or address pickers. See `src/lib/chat-actions.ts`.

**Beta Flags**
Required HTTP headers for Anthropic API beta features. This project uses three: `mcp-client-2025-11-20` (MCP support), `prompt-caching-2024-07-31` (prompt caching), and `context-management-2025-06-27` (automatic context editing). Configured in `request-builder.ts`.

**Cache Control**
The `cache_control: { type: "ephemeral" }` annotation on system blocks that enables Anthropic's prompt caching. Cached blocks have a 5-minute TTL. Applied to the system prompt and address context blocks; deliberately excluded from the session summary (which changes every turn).

**Card-First**
A shared prompt rule instructing the AI to keep text responses short (1-2 sentences) because the UI renders rich cards from tool results. The cards already display catalog details, so the AI should not repeat them in text.

**Content Block**
The atomic unit of an assistant message: either `TextBlock`, `McpToolUseBlock`, or `McpToolResultBlock`. Defined in `src/lib/types.ts`. Assistant messages contain an array of content blocks.

**Context Management**
An Anthropic API feature (`context-management-2025-06-27` beta) that automatically removes old tool uses when input tokens exceed a threshold. Configured as `clear_tool_uses_20250919` with a 25,000-token trigger, keeping the last 5 tool uses.

**COD Notice**
"Cash on Delivery Notice" — a shared prompt rule reminding users that COD orders are non-cancellable after placement. Included for NutriCart, StyleKit, and FeedMe verticals (`includeCodRule: true`).

**Dineout**
Swiggy's restaurant booking platform. The `swiggy-dineout` MCP server (`mcp.swiggy.com/dineout`) provides restaurant search, availability checks, and table booking tools. Used by the TableScout vertical.

**DisplaySegment**
A UI rendering unit that represents either a text block or a group of consecutive tool_use/result blocks. Produced by `groupBlocks()` in `content-blocks.ts`. Tool groups render as collapsible sections with a tool trace header and parsed card content.

**FeedMe**
The food delivery vertical (ID: `foodorder`). An AI assistant that finds restaurants, browses menus, builds carts, and places delivery orders via the `swiggy-food` MCP server.

**Instamart**
Swiggy's instant grocery delivery platform. The `swiggy-instamart` MCP server (`mcp.swiggy.com/im`) provides product search, cart management, and checkout tools. Shared by both NutriCart and StyleKit verticals.

**Loading Context**
One of 12 categories (generic, cart, menu, restaurant, slots, booking, address, auth, nutrition, style, grooming, order) detected from user input text. Each category has 4 rotating labels that cycle every 1.8 seconds during API calls.

**MCP (Model Context Protocol)**
A protocol that lets AI models call external tools. In this project, the Anthropic API connects to Swiggy's MCP servers, discovers available tools at runtime, and executes them server-side. The browser never connects to MCP servers directly.

**MCP Toolset**
The `{ type: "mcp_toolset", mcp_server_name: "..." }` tool configuration that tells Anthropic to auto-discover all tools from a named MCP server, rather than specifying individual tool definitions.

**NutriCart**
The nutrition vertical (ID: `food`). An AI nutrition coach that plans meals with macros, generates recipes, and orders ingredients from Instamart.

**Onboarding**
The three-step setup flow: API Key → Swiggy Connect → Address Select. Managed by the `useAuth` hook's step machine (`OnboardingStep`). The `OnboardingSheet` component renders the current step as a bottom sheet.

**Orchestrator**
The `parseToolResult()` function in `src/lib/parsers/orchestrator.ts`. It examines MCP tool result content and tool names to route to the appropriate specialized parser. Uses regex patterns on tool names and signal key analysis on payloads.

**ParsedToolResult**
A discriminated union type with 10 variants (products, restaurants, time_slots, addresses, cart, order_placed, booking_confirmed, status, info, raw). The output of the parser pipeline, consumed by `ItemCardGrid` for rendering.

**PKCE (Proof Key for Code Exchange)**
An OAuth 2.0 extension used in the dev-only OAuth flow. A code verifier and challenge are generated in `server/oauth/pkce.ts` and used to secure the authorization code exchange.

**PhoneFrame**
A layout component that renders the entire app inside a phone mockup. Provides CSS custom properties `--safe-top` and `--safe-bottom` for spacing around the simulated notch and home indicator.

**Prompt Profile**
A structured definition of an AI vertical's behavior: mission, scope, slots, phases, tool policies, response style, confirmation rules, and fallback rules. Defined in `src/verticals/prompt-spec/profiles.ts` and compiled into system prompts by `compilePromptProfile()`.

**Session Summary**
A compact per-turn state string injected as the last system block. Format: `slots=goal,diet;intent=discover;confirm=no;datetime=...;restaurant=...;location=...`. Built from the last 16 user messages by `buildSessionStateSummary()` in `session-summary.ts`. Not cached because it changes every turn.

**Shape Detection**
A fallback parser (`src/lib/parsers/shape-detect.ts`) that examines object keys to infer the data type when no tool name regex matches. Checks for restaurant-like keys (cuisine, priceForTwo), product-like keys (price, mrp, variations), time slot keys, and address keys.

**Signal Keys**
Sets of object property names used by the orchestrator to classify tool result payloads. Three tiers: PRODUCT_SIGNAL_KEYS (28 keys), STRONG_RESTAURANT_SIGNAL_KEYS (12 keys), WEAK_RESTAURANT_SIGNAL_KEYS (3 keys).

**Slot**
A piece of information the AI needs to collect before taking action. Defined in `PromptSlotRule` objects within each prompt profile. Examples: `goal` (nutrition goal), `cuisine_or_vibe` (dining preference), `craving` (food order intent). The session summary tracks which slots have been filled.

**StyleKit**
The grooming vertical (ID: `style`). An AI grooming advisor that builds skincare/haircare routines and orders products from Instamart.

**Swiggy Token**
An OAuth access token for Swiggy's MCP servers. Obtained via the PKCE OAuth flow in dev mode. Stored in localStorage (`mcp-demo:swiggy-token`). Expires after 1 hour (`TOKEN_STALENESS_MS`). Passed as `authorization_token` in the MCP server configuration.

**TableScout**
The dining vertical (ID: `dining`). An AI dining concierge that searches restaurants, checks availability, and books tables via Dineout.

**Token Staleness**
The condition when a Swiggy token has been stored for more than 1 hour (`TOKEN_STALENESS_MS = 3_600_000`). Detected by `useAuth` hook; displayed as a warning in the header. Can also be forced by MCP auth errors.

**Tool Group**
A `DisplaySegment` of kind `"tool_group"` — consecutive `mcp_tool_use` and `mcp_tool_result` blocks grouped together for rendering. Rendered by `CollapsibleToolGroup` as an expandable section showing the tool trace and parsed card.

**Tool Trace**
A debug view (`ToolTrace.tsx`) showing the tool name and input parameters for an MCP tool call. Visible when expanding a tool group in the chat.

**Unified Selection**
A UI pattern in NutriCart, StyleKit, and FeedMe where users can select quantities on product cards across multiple tool results, then add all selected items to cart with a single "Add to cart" button. Managed by `pendingSelection` state in `ChatViewInner`.

**Vertical**
One of four AI product experiences: NutriCart, StyleKit, TableScout, FeedMe. Each vertical has a unique system prompt, MCP server, and persona, but shares the same underlying infrastructure. Accessed via URL routes (`/:verticalId`).

**VerticalConfig**
The TypeScript interface that defines a vertical: ID, name, tab label, description, color, icon, system prompt, welcome message, example prompts, and MCP server configuration. Defined in `src/lib/types.ts`.

---

## Cross-References

- [ARCHITECTURE.md](./ARCHITECTURE.md) — System design
- [MCP_TOOLS.md](./MCP_TOOLS.md) — MCP tool documentation
- [VERTICALS.md](./VERTICALS.md) — Vertical deep dives
