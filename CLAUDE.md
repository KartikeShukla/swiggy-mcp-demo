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

Vitest + React Testing Library + jsdom. 17 test files, mostly covering parsers.

```bash
npm run test              # Run all tests
npm run test:watch        # Watch mode
npm run test:coverage     # With coverage report
```

- Test setup: `src/test/setup.ts` (imports `@testing-library/jest-dom/vitest`)
- Globals enabled (describe, it, expect without imports)
- Mocking: `vi.mock()` for external deps, `renderHook` for hook tests
- Parser tests: `src/lib/parsers/__tests__/` (12 files)
- Hook tests: `src/hooks/__tests__/`

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
