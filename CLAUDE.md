# CLAUDE.md

## Commands

```bash
npm run dev          # Start dev server (localhost:5173)
npm run build        # TypeScript check + Vite production build
npm run preview      # Preview production build
npm run lint         # ESLint (flat config, TS + React rules)
npm run test         # Vitest (run once)
npm run test:watch   # Vitest (watch mode)
npm run test:coverage # Vitest with coverage
```

## Architecture

React 19 + TypeScript 5.9 + Vite 7 SPA. No backend — Anthropic SDK runs in browser (`dangerouslyAllowBrowser: true`). MCP tool calls go through Anthropic's servers, not the browser.

```
src/
  lib/           # Types, constants, storage, parsers, Anthropic client
  hooks/         # useAuth, useChat, useChatApi, useChatPersistence, useCart
  verticals/     # 4 AI vertical configs + prompt profiles/compiler
  components/
    ui/          # shadcn/ui primitives (Radix + Tailwind + CVA)
    chat/        # ChatView, MessageBubble, ToolTrace, ChatInput
    cards/       # ProductCard, RestaurantCard, CartSummaryCard, TimeSlotPicker
    cart/        # CartFloatingButton, CartPanel, OrderConfirmation
    auth/        # ApiKeyModal, SwiggyConnect, SettingsMenu
    layout/      # Header, PhoneFrame, VerticalNav
    home/        # LandingPage, VerticalCard
server/
  oauth-plugin.ts  # Vite dev server middleware for Swiggy OAuth (PKCE)
```

## Verticals

Same MCP tools, different system prompts = different product experiences.

| Vertical | ID | MCP Server | URL |
|----------|----|------------|-----|
| NutriCart | `food` | swiggy-instamart | `mcp.swiggy.com/im` |
| StyleBox | `style` | swiggy-instamart | `mcp.swiggy.com/im` |
| TableScout | `dining` | swiggy-dineout | `mcp.swiggy.com/dineout` |
| FoodOrder | `foodorder` | swiggy-food | `mcp.swiggy.com/food` |

Config: `src/verticals/` — each file exports a `VerticalConfig`. Registry in `src/verticals/index.ts`.
Prompt profiles: `src/verticals/prompt-spec/`; shared compact policy: `src/verticals/shared-prompt.ts`.

## MCP Integration

- SDK: `@anthropic-ai/sdk` (^0.74.0) with beta flags: `mcp-client-2025-11-20`, `prompt-caching-2024-07-31`
- API sends `mcp_servers` array (type: "url", with Swiggy auth token) + `tools: [{ type: "mcp_toolset" }]`
- Anthropic servers connect to Swiggy MCP, discover tools, execute calls, return results — one round trip
- Error classification in `useChatApi.ts`: auth (401/403) → prompt token refresh; server (5xx) → retry; validation → simplify params
- Retry loop prevention: aborts after 2 tool errors or 1 auth error (`MCP_TOOL_ERROR_LIMIT`, `MCP_AUTH_ERROR_LIMIT`)
- Prompt caching: system prompt uses `cache_control: { type: "ephemeral" }`
- Request builder can add a compact per-turn session summary (`slots=...; confirm=...`) for high-confidence context carryover
- Context management: auto-cleans old tool results when input > 10k tokens, keeps last 3

## Key Files

- `src/lib/constants.ts` — model ID (`claude-haiku-4-5-20251001`), MCP server URLs, storage keys, limits
- `src/lib/types.ts` — all TypeScript interfaces (VerticalConfig, ChatMessage, ContentBlock, parsed types)
- `src/lib/storage.ts` — localStorage wrapper (API key, Swiggy token, chat history per vertical)
- `src/lib/parsers/orchestrator.ts` — heuristic routing: regex on tool name → specialized parser
- `src/lib/parsers/` — 10+ parsers: products, restaurants, cart, time-slots, confirmation, addresses, etc.
- `src/hooks/useChatApi.ts` — core API hook: stream management, error handling, prompt caching
- `src/hooks/useAuth.ts` — credentials + OAuth popup + token staleness
- `server/oauth-plugin.ts` — Vite dev middleware: PKCE OAuth flow with Swiggy

## Integrations Layer

```
src/integrations/anthropic/
  request-builder.ts    — Builds API params: system blocks with cache_control, MCP server config, beta flags, context_management
  stream-runner.ts      — Runs streaming message call, monitors MCP tool errors in contentBlock events, aborts on error limits
  message-sanitizer.ts  — Matches tool_use/result pairs by ID, drops orphan blocks, ensures API-safe message history
  session-summary.ts    — Builds compact state string (slots, intent, restaurant, location) from last 8 user messages
  error-classifier.ts   — Classifies HTTP errors (401/403/429/5xx/network) into user-friendly messages
  mcp-tool-errors.ts    — Classifies MCP tool-level errors (auth/server/validation/address) and provides abort messages
```

## Data Flow

1. User types in ChatInput → `useChat.sendMessage()` (`useChat.ts`)
2. Loading context detected from user input (keyword-based heuristic)
3. Session state summary built from last 8 user messages (`session-summary.ts`)
4. `buildMessageStreamParams()` sanitizes messages, builds system blocks with `cache_control`, configures MCP servers
5. `runMessageStream()` opens beta stream, monitors `contentBlock` events for tool errors
6. Error classification: auth (401/403) → `onAuthError()`, address errors → `onAddressError()`, tool errors limited by `MCP_TOOL_ERROR_LIMIT=2`
7. Response sanitized via `sanitizeAssistantBlocks()`, empty-check via `ensureNonEmptyContent()`
8. Assistant message created and persisted via `useChatPersistence` → localStorage
9. `useCart` derives cart state by scanning messages in reverse for cart-type tool results
10. UI renders: `AssistantMessageBubble` → `groupBlocks()` → `CollapsibleToolGroup` → `parseToolResult()` → `ItemCardGrid` → card components

## Token Strategy

- **Prompt caching**: `cache_control: { type: "ephemeral" }` on system prompt and address blocks (5-min TTL). Session summary block intentionally excluded (changes every turn).
- **Cache hierarchy**: tools → system → messages (prefix-based)
- **Context management**: `clear_tool_uses_20250919` with trigger at 10k tokens, keeps last 3 tool uses, `clear_at_least: 2000` tokens to avoid cache invalidation for small clearings
- **Session summary**: compact per-turn state string (`slots=...; intent=...; confirm=...`) injected as last system block
- **Beta flags**: `mcp-client-2025-11-20` (MCP), `prompt-caching-2024-07-31` (caching), `context-management-2025-06-27` (context editing)

## Error Recovery

Two-layer error handling:
- **API-level**: `classifyApiError()` in `error-classifier.ts` — HTTP status codes → user-friendly messages (401, 403, 429, 5xx, network)
- **MCP tool-level**: `classifyMcpError()` in `stream-runner.ts` contentBlock listener → category (auth/server/validation/address) → `ABORT_MESSAGES` → `stream.abort()` → callbacks (`onAuthError`, `onAddressError`)
- **Error limits**: `MCP_TOOL_ERROR_LIMIT=2`, `MCP_AUTH_ERROR_LIMIT=1`

## Code Style

- Path alias: `@/*` → `./src/*` (tsconfig + vite)
- Styling: Tailwind CSS 4 (CSS-first), no CSS modules. Theme vars in `src/index.css`
- UI components: shadcn/ui (New York style, Stone base color), Radix UI primitives, CVA for variants
- Icons: Lucide React
- All components: functional, typed props, no class components
- Strict TypeScript: `noUnusedLocals`, `noUnusedParameters`, `erasableSyntaxOnly`
- ESLint flat config (v9): TS + React hooks + React refresh rules

## State Management

Hooks-only — no Redux, Zustand, or Context providers.
- `useAuth` — API key + Swiggy token (localStorage-backed)
- `useChat` — composes `useChatApi` + `useChatPersistence`
- `useCart` — derives cart state from chat message history
- Persistence: localStorage keyed by `mcp-demo:chat:{verticalId}`

## Testing

Vitest + React Testing Library + jsdom. ~42 test files across 6 areas.

```bash
npm run test              # Run all tests
npm run test:watch        # Watch mode
npm run test:coverage     # With coverage report
```

- Test setup: `src/test/setup.ts` (imports `@testing-library/jest-dom/vitest`)
- Globals enabled (describe, it, expect without imports)
- Mocking: `vi.mock()` for external deps, `renderHook` for hook tests
- Parser tests: `src/lib/parsers/__tests__/` (13 files)
- Lib tests: `src/lib/__tests__/` (4 files — markdown, content-blocks, storage, chat-actions)
- Hook tests: `src/hooks/__tests__/` (2 files — useCart, useChatApi)
- Vertical tests: `src/verticals/__tests__/` (4 files — prompts, compiler, budget, scenario-matrix)
- Integration tests: `src/integrations/anthropic/__tests__/` (4 files — message-sanitizer, request-builder, session-summary, stream-runner)
- Component tests: `src/components/` (11 files — cards, cart, chat, layout, auth, ui)

## Gotchas

- **No .env needed** — all credentials entered via UI, stored in localStorage
- **Browser SDK** — `dangerouslyAllowBrowser: true` is intentional; MCP calls go server-side via Anthropic
- **Token staleness** — Swiggy tokens expire after 1 hour (`TOKEN_STALENESS_MS`). UI shows warning.
- **OAuth in dev only** — `server/oauth-plugin.ts` is a Vite dev middleware, not a production server
- **MCP beta flags required** — API calls must include `mcp-client-2025-11-20` beta header
- **Shared MCP server** — NutriCart and StyleBox both use the same Instamart MCP server; behavior differs only via system prompt
- **Routes** — `/` = landing, `/:verticalId` = chat. Vertical IDs: `food`, `style`, `dining`, `foodorder`
- **Dark mode** — detected from localStorage/system preference in `index.html` script tag (before React mounts)
- **Phone frame** — app renders inside a phone mockup (`PhoneFrame` component) with safe area insets
