# Swiggy MCP Demo

A React SPA that connects Claude AI to Swiggy's services via [Model Context Protocol (MCP)](https://modelcontextprotocol.io). Four product verticals — grocery nutrition planning, personal grooming, restaurant discovery, and food ordering — share the same infrastructure but produce entirely different experiences through system prompts alone. No backend: the Anthropic SDK runs in the browser, and MCP tool calls execute server-side through Anthropic.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│  Browser (React SPA)                                │
│                                                     │
│  User Input → useChat → Anthropic SDK (streaming)   │
│       ↑                        │                    │
│  Card UI ← Parser Pipeline     │                    │
└─────────────────────────────────┼────────────────────┘
                                  │ API call with
                                  │ mcp_servers config
                                  ▼
                      ┌───────────────────────┐
                      │   Anthropic API       │
                      │   (Claude + MCP)      │
                      └───────────┬───────────┘
                                  │ Server-side
                                  │ tool execution
                    ┌─────────────┼─────────────┐
                    ▼             ▼             ▼
              ┌──────────┐ ┌──────────┐ ┌──────────┐
              │ Instamart │ │ Dineout  │ │  Food    │
              │ MCP      │ │ MCP      │ │  MCP     │
              └──────────┘ └──────────┘ └──────────┘
              mcp.swiggy    mcp.swiggy   mcp.swiggy
              .com/im       .com/dineout .com/food
```

The browser never talks to Swiggy directly. API requests include an `mcp_servers` array; Anthropic's servers connect to the MCP endpoints, discover tools, execute calls, and return results — all in one streaming response.

## Verticals

| Vertical | ID | MCP Server | What it does |
|---|---|---|---|
| **NutriCart** | `food` | swiggy-instamart | Meal planning with macros, recipes, and Instamart grocery ordering |
| **StyleKit** | `style` | swiggy-instamart | Skincare, haircare, and grooming advice with product delivery |
| **TableScout** | `dining` | swiggy-dineout | Restaurant discovery, live availability, and table bookings |
| **FeedMe** | `foodorder` | swiggy-food | Restaurant browsing, menu exploration, and food delivery |

NutriCart and StyleKit share the same Instamart MCP server — behavior differs only via system prompt.

## Project Structure

```
src/
  lib/              # Types, constants, localStorage wrapper, parsers
    parsers/        # 10+ heuristic parsers: products, restaurants, cart, time-slots, etc.
  hooks/            # useAuth, useChat, useChatApi, useChatPersistence, useCart
  verticals/        # 4 vertical configs + prompt profiles + shared prompt compiler
    prompt-spec/    # Per-vertical prompt profiles (persona, constraints, examples)
  integrations/
    anthropic/      # Request builder, stream runner, message sanitizer, error classifier
  components/
    ui/             # shadcn/ui primitives (Radix + Tailwind + CVA)
    chat/           # ChatView, MessageBubble, ToolTrace, ChatInput
    cards/          # ProductCard, RestaurantCard, CartSummaryCard, TimeSlotPicker
    cart/           # CartFloatingButton, CartPanel, OrderConfirmation
    auth/           # ApiKeyModal, SwiggyConnect, SettingsMenu, OnboardingSheet
    layout/         # Header, PhoneFrame, VerticalNav
    home/           # LandingPage, VerticalCard
server/
  oauth/            # Vite dev middleware for Swiggy OAuth (PKCE flow)
```

## How It Works

1. **User input** enters through `ChatInput` → `useChat.sendMessage()`
2. **Request building** (`request-builder.ts`): sanitizes message history, constructs system prompt blocks with `cache_control`, attaches MCP server config with Swiggy auth token, and injects a compact session summary
3. **Streaming** (`stream-runner.ts`): opens a beta stream via `@anthropic-ai/sdk`, monitors `contentBlock` events for MCP tool errors, aborts on auth failures or after 2 tool errors
4. **Parsing** (`parsers/orchestrator.ts`): regex on MCP tool names routes each tool result to a specialized parser (products, restaurants, cart, time-slots, addresses, confirmation, etc.)
5. **Rendering**: `AssistantMessageBubble` → `groupBlocks()` → `CollapsibleToolGroup` → card components (`ProductCard`, `RestaurantCard`, `TimeSlotPicker`, etc.)
6. **Cart state**: `useCart` derives cart contents by scanning chat messages in reverse for cart-type tool results — no separate cart store

## Getting Started

### Prerequisites

- Node.js 18+
- An [Anthropic API key](https://console.anthropic.com/)
- A Swiggy account (for OAuth token)

### Setup

```bash
git clone <repo-url>
cd swiggy-mcp-demo
npm install
npm run dev
```

Open `http://localhost:5173`. The app will prompt you to enter your Anthropic API key and connect your Swiggy account through the onboarding flow.

No `.env` file needed — credentials are entered in the UI and stored in localStorage.

### Commands

```bash
npm run dev            # Start dev server (localhost:5173)
npm run build          # TypeScript check + Vite production build
npm run preview        # Preview production build
npm run lint           # ESLint
npm run test           # Run all tests
npm run test:watch     # Watch mode
npm run test:coverage  # With coverage
```

## Tech Stack

- **React 19** with React Router 7
- **TypeScript 5.9** (strict mode, erasable syntax)
- **Vite 7** with `@vitejs/plugin-react`
- **Tailwind CSS 4** (CSS-first config, no `tailwind.config.js`)
- **Anthropic SDK** (`@anthropic-ai/sdk ^0.74.0`) with beta flags for MCP, prompt caching, and context management
- **Radix UI / shadcn/ui** (New York style, Stone base)
- **Lucide React** for icons
- **Zod 4** for schema validation
- **Vitest 4** + React Testing Library + jsdom

## Testing

```bash
npm run test
```

~42 test files covering:

- **Parsers** (`src/lib/parsers/__tests__/`) — 13 files: product, restaurant, cart, time-slot, address, confirmation parsing
- **Lib** (`src/lib/__tests__/`) — 4 files: markdown rendering, content blocks, storage, chat actions
- **Hooks** (`src/hooks/__tests__/`) — useCart, useChatApi
- **Integrations** (`src/integrations/anthropic/__tests__/`) — message sanitizer, request builder, session summary, stream runner
- **Verticals** (`src/verticals/__tests__/`) — prompt compilation, budget constraints, scenario matrix
- **Components** (`src/components/`) — 11 files: cards, cart, chat, layout, auth, UI primitives

## OAuth Flow (Dev Only)

The Swiggy OAuth integration uses PKCE (Proof Key for Code Exchange) and runs as Vite dev server middleware (`server/oauth/`). It is not a production server.

1. User clicks "Connect Swiggy" → app opens a popup to Swiggy's OAuth endpoint with a PKCE challenge
2. User authenticates on Swiggy → redirect back to `localhost` with an auth code
3. Dev middleware exchanges the code for an access token
4. Token is stored in localStorage and sent with MCP server config on each API call
5. Tokens expire after 1 hour — the UI warns when the token is stale

## Key Design Decisions

- **Hooks-only state** — no Redux, Zustand, or Context. `useAuth`, `useChat`, `useCart` compose everything.
- **Prompt-as-product** — the four verticals share identical infrastructure. Only the system prompt differs, making each vertical a prompt engineering exercise rather than a code change.
- **Heuristic parsers** — tool results are parsed by regex-matching on tool names rather than a schema registry. Fast to iterate, easy to add new tool types.
- **Prompt caching** — system prompt and address blocks use `cache_control: { type: "ephemeral" }` (5-min TTL). Session summaries are excluded since they change every turn.
- **Context management** — auto-cleans old tool results when input exceeds 10k tokens, keeping the last 3 tool uses.
- **No backend** — the Anthropic SDK runs in-browser with `dangerouslyAllowBrowser: true`. MCP calls are server-side through Anthropic, so no secrets are exposed to Swiggy endpoints from the browser.

## License

MIT
