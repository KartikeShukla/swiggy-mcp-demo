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
  lib/
    anthropic.ts       # SDK client factory (maxRetries: 0)
    constants.ts       # Model ID, MCP URLs, storage keys, limits
    types.ts           # All TypeScript interfaces
    schemas.ts         # Zod 4 (zod/v4) runtime validation schemas
    storage.ts         # localStorage wrapper
    logger.ts          # Level-filtered logger (debug in dev, warn+ in prod)
    fetchAddresses.ts  # Onboarding address fetch via Instamart MCP
    chat-actions.ts    # Chat action helpers
    content-blocks.ts  # Content block utilities
    markdown.ts        # Markdown processing
    utils.ts           # General utilities
    parsers/           # 14 parser files + index (orchestrator, products, restaurants, cart, etc.)
  hooks/               # useAuth, useChat, useChatApi, useChatPersistence, useCart
  verticals/           # 4 AI vertical configs + prompt-spec/ (profiles, compiler, types)
  integrations/anthropic/  # Request builder, stream runner, sanitizer, retry, errors
  components/
    ui/          # shadcn/ui primitives (Radix + Tailwind + CVA)
    chat/        # ChatView, MessageList, AssistantMessageBubble, UserMessageBubble,
                 #   ChatInput, CollapsibleToolGroup, CollapsibleText, DetailSheet,
                 #   LoadingIndicator, MessageBubble, ToolTrace
    cards/       # ProductCard, ProductGrid, RestaurantCard, CartSummaryCard, TimeSlotPicker,
                 #   ItemCardGrid, ToolSectionCard, InfoCard, StatusCard, AddressPicker,
                 #   BookingConfirmationSheet, BookingConfirmedCard, OrderConfirmationCard
    cart/        # CartFloatingButton, CartPanel, OrderConfirmation
    auth/        # ApiKeyModal, SwiggyConnect, SettingsMenu, OnboardingSheet
    layout/      # Header, PhoneFrame, VerticalNav
    home/        # LandingPage, VerticalCard
    ErrorBoundary.tsx
server/
  oauth-plugin.ts    # Vite plugin re-export
  oauth/             # PKCE OAuth implementation (7 files: plugin, cookies, discovery,
                     #   pkce, types, callback-handler, start-handler)
```

## Verticals

Same MCP tools, different system prompts = different product experiences.

| Vertical | ID | MCP Server | URL |
|----------|----|------------|-----|
| NutriCart | `food` | swiggy-instamart | `mcp.swiggy.com/im` |
| StyleKit | `style` | swiggy-instamart | `mcp.swiggy.com/im` |
| TableScout | `dining` | swiggy-dineout | `mcp.swiggy.com/dineout` |
| FeedMe | `foodorder` | swiggy-food | `mcp.swiggy.com/food` |

Config: `src/verticals/` — each file exports a `VerticalConfig`. Registry in `src/verticals/index.ts`.
Prompt profiles: `src/verticals/prompt-spec/`; shared compact policy: `src/verticals/shared-prompt.ts`.
Prompt strategy: **1 tool call per turn** — show results and wait for user input before the next search. Reduces peak ITPM and lets human think-time provide natural rate limit relief.

## MCP Integration

- SDK: `@anthropic-ai/sdk` (^0.74.0) with beta flags: `mcp-client-2025-11-20`, `prompt-caching-2024-07-31`
- SDK client: `maxRetries: 0` — retries disabled at SDK level, handled by custom `retry-policy.ts`
- API sends `mcp_servers` array (type: "url", with Swiggy auth token) + `tools: [{ type: "mcp_toolset" }]`
- Anthropic servers connect to Swiggy MCP, discover tools, execute calls, return results — one round trip
- Error classification in `useChatApi.ts`: auth (401/403) → prompt token refresh; server (5xx) → retry; validation → simplify params
- Retry loop prevention: aborts after 2 tool errors or 1 auth error (`MCP_TOOL_ERROR_LIMIT`, `MCP_AUTH_ERROR_LIMIT`)
- Retry policy: max 2 retries with exponential backoff (500ms base, 2x, 20% jitter, 5s cap) for statuses 429/500/502/503/504/529. Rate-limited (429) errors get their own retry budget (`RATE_LIMIT_MAX_RETRIES=2`) with header logging.
- Prompt caching: system prompt uses `cache_control: { type: "ephemeral" }`
- Request builder can add a compact per-turn session summary (`slots=...; confirm=...`) for high-confidence context carryover
- Context management: auto-cleans old tool uses when input > 25k tokens, keeps last 5. Old messages beyond keepRecent=4 have tool blocks stripped (only text kept) via `compactOldMessages()`.
- Stream timeout: 90s (`STREAM_REQUEST_TIMEOUT_MS`) — aborts and returns partial content on timeout
- Message bounding: `MAX_CONTEXT_MESSAGES = 24` — only last 24 messages sent to API

## Key Files

- `src/lib/constants.ts` — model ID (`claude-haiku-4-5-20251001`), MCP server URLs, storage keys, limits
- `src/lib/types.ts` — all TypeScript interfaces (VerticalConfig, ChatMessage, ContentBlock, parsed types)
- `src/lib/schemas.ts` — Zod 4 (`zod/v4`) schemas mirroring `types.ts` for runtime validation
- `src/lib/storage.ts` — localStorage wrapper (API key, Swiggy token, chat history per vertical)
- `src/lib/anthropic.ts` — SDK client factory (`createClient`), `maxRetries: 0`
- `src/lib/logger.ts` — level-filtered logger (debug in dev, warn+ in prod)
- `src/lib/fetchAddresses.ts` — onboarding address fetch (Instamart MCP, own retry loop)
- `src/lib/parsers/orchestrator.ts` — heuristic routing: regex on tool name → specialized parser
- `src/lib/parsers/` — 14 parsers: products, restaurants, cart, time-slots, confirmation, addresses, status, info, etc.
- `src/hooks/useChatApi.ts` — core API hook: stream management, error handling, retry loop, prompt caching
- `src/hooks/useAuth.ts` — credentials + OAuth popup + token staleness
- `server/oauth-plugin.ts` — Vite dev middleware: PKCE OAuth flow with Swiggy

## Integrations Layer

```
src/integrations/anthropic/
  request-builder.ts    — Builds API params: system blocks with cache_control, MCP server config, beta flags, context_management
  stream-runner.ts      — Runs streaming message call, monitors MCP tool errors in contentBlock events, aborts on error limits
  message-sanitizer.ts  — Matches tool_use/result pairs by ID, drops orphan blocks, compacts old messages (strips tool blocks, keeps text)
  session-summary.ts    — Builds compact state string (slots, intent, restaurant, location) from last 8 user messages
  error-classifier.ts   — Classifies HTTP errors (401/403/429/5xx/network) into user-friendly messages
  mcp-tool-errors.ts    — Classifies MCP tool-level errors (auth/server/validation/address) and provides abort messages
  retry-policy.ts       — Retryable error detection (429/5xx/529), exponential backoff (500ms base, 2x, 20% jitter, 5s cap), rate limit header extraction
```

## Data Flow

1. User types in ChatInput → `useChat.sendMessage()` (`useChat.ts`)
2. Loading context detected from user input (12 categories via regex: cart, menu, restaurant, slots, booking, address, auth, nutrition, style, grooming, order, generic) — labels cycle every 1.8s
3. Session state summary built from last 8 user messages (`session-summary.ts`)
4. `buildMessageStreamParams()` sanitizes messages, compacts old messages (strips tool blocks beyond keepRecent=4), caps at `MAX_CONTEXT_MESSAGES=24`, builds system blocks with `cache_control`, configures MCP servers
5. `runMessageStream()` opens beta stream (90s timeout), monitors `contentBlock` events for tool errors
6. On retryable error (429/5xx/529): `retry-policy.ts` retries up to 2 times with exponential backoff before failing
7. Error classification: auth (401/403) → `onAuthError()`, address errors → `onAddressError()`, tool errors limited by `MCP_TOOL_ERROR_LIMIT=2`
8. Response sanitized via `sanitizeAssistantBlocks()`, empty-check via `ensureNonEmptyContent()`
9. Assistant message created and persisted via `useChatPersistence` → localStorage
10. `useCart` derives cart state by scanning messages in reverse for cart-type tool results
11. UI renders: `AssistantMessageBubble` → `groupBlocks()` → `CollapsibleToolGroup` → `parseToolResult()` → `ItemCardGrid` → card components

## Token Strategy

- **Prompt caching**: `cache_control: { type: "ephemeral" }` on system prompt and address blocks (5-min TTL). Session summary block intentionally excluded (changes every turn).
- **Cache hierarchy**: tools → system → messages (prefix-based)
- **Context management**: `clear_tool_uses_20250919` with trigger at 25k tokens, keeps last 5 tool uses, `clear_at_least: 2000` tokens to avoid cache invalidation for small clearings. Additionally, `compactOldMessages()` strips tool blocks from messages older than keepRecent=4, keeping only text blocks.
- **Max output tokens**: `MAX_TOKENS = 800` — keeps responses concise with the 1-tool-per-turn flow
- **Session summary**: compact per-turn state string (`slots=...; intent=...; confirm=...`) injected as last system block
- **Beta flags**: `mcp-client-2025-11-20` (MCP), `prompt-caching-2024-07-31` (caching), `context-management-2025-06-27` (context editing)
- **SDK retries disabled**: `maxRetries: 0` on Anthropic client — custom `retry-policy.ts` handles retries

## Error Recovery

Two-layer error handling + retry policy:
- **API-level**: `classifyApiError()` in `error-classifier.ts` — HTTP status codes → user-friendly messages (401, 403, 429, 5xx, network)
- **MCP tool-level**: `classifyMcpError()` in `stream-runner.ts` contentBlock listener → category (auth/server/validation/address) → `ABORT_MESSAGES` → `stream.abort()` → callbacks (`onAuthError`, `onAddressError`)
- **Error limits**: `MCP_TOOL_ERROR_LIMIT=2`, `MCP_AUTH_ERROR_LIMIT=1`
- **Retry policy**: exponential backoff (500ms base, 2x multiplier, 20% jitter, 5s cap), max 2 retries for statuses 429, 500, 502, 503, 504, 529. Rate-limited errors use separate retry budget (`RATE_LIMIT_MAX_RETRIES=2`) and log `anthropic-ratelimit-*` headers.
- **Stream timeout**: 90s (`STREAM_REQUEST_TIMEOUT_MS`) — stream aborts and returns partial content on timeout

## Code Style

- Path alias: `@/*` → `./src/*` (tsconfig + vite)
- Styling: Tailwind CSS 4 (CSS-first), no CSS modules. Theme vars in `src/index.css`
- UI components: shadcn/ui (New York style, Stone base color), Radix UI primitives, CVA for variants
- Icons: Lucide React
- All components: functional, typed props, no class components
- Strict TypeScript: `noUnusedLocals`, `noUnusedParameters`, `erasableSyntaxOnly`, `verbatimModuleSyntax`, `noUncheckedSideEffectImports`
- ESLint flat config (v9): TS + React hooks + React refresh rules
- Validation: Zod 4 (`zod/v4` import path)
- Parsers: 14 files in `src/lib/parsers/` (+ index)

## State Management

Hooks-only — no Redux, Zustand, or Context providers.
- `useAuth` — API key + Swiggy token (localStorage-backed)
- `useChat` — composes `useChatApi` + `useChatPersistence`
- `useCart` — derives cart state from chat message history
- Persistence: localStorage keyed by `mcp-demo:chat:{verticalId}`

## Testing

Vitest + React Testing Library + jsdom. 44 test files across 7 areas.

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
- Component tests: `src/components/` (16 files — cards, cart, chat, layout, auth, ui)
- Server tests: `server/oauth/__tests__/` (1 file — start-handler)

## Gotchas

- **No .env needed** — all credentials entered via UI, stored in localStorage
- **Browser SDK** — `dangerouslyAllowBrowser: true` is intentional; MCP calls go server-side via Anthropic
- **Token staleness** — Swiggy tokens expire after 1 hour (`TOKEN_STALENESS_MS`). UI shows warning.
- **OAuth in dev only** — `server/oauth-plugin.ts` is a Vite dev middleware, not a production server
- **MCP beta flags required** — API calls must include `mcp-client-2025-11-20` beta header
- **Shared MCP server** — NutriCart and StyleKit both use the same Instamart MCP server; behavior differs only via system prompt
- **Routes** — `/` = landing, `/:verticalId` = chat. Vertical IDs: `food`, `style`, `dining`, `foodorder`
- **Dark mode** — detected from localStorage/system preference in `index.html` script tag (before React mounts)
- **Phone frame** — app renders inside a phone mockup (`PhoneFrame` component) with safe area insets
- **SDK retries disabled** — `maxRetries: 0` on Anthropic client; custom `retry-policy.ts` handles retries instead
- **Message cap** — `MAX_CONTEXT_MESSAGES = 24` — only last 24 messages sent to API
- **Stream timeout** — 90s (`STREAM_REQUEST_TIMEOUT_MS`) — returns partial content on timeout
