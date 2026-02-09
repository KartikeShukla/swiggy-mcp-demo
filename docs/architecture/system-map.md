# System Map

## Runtime Topology

1. React SPA (`src/`) runs in browser.
2. Anthropic SDK is used in browser mode (`dangerouslyAllowBrowser: true`).
3. Anthropic Messages API performs MCP tool discovery/calls server-side.
4. Swiggy MCP servers:
- Instamart: `https://mcp.swiggy.com/im`
- Dineout: `https://mcp.swiggy.com/dineout`
- Food: `https://mcp.swiggy.com/food`
5. Local Vite middleware provides OAuth helpers only:
- `GET /api/auth/start`
- `GET /api/auth/callback`

## Core User Flows

1. Auth bootstrap:
- User enters Anthropic key.
- User connects/pastes Swiggy token.
- User selects delivery address (optional skip).

2. Chat send:
- `useChat` appends user message.
- `useChatApi` builds request (system prompt + MCP config).
- Stream response returns text and tool blocks.
- UI parses tool results and renders cards.

3. Action loop:
- Card click emits natural-language action message.
- Message re-enters chat send loop.

## State Boundaries

1. Local storage:
- API key, Swiggy token/timestamp, selected address, per-vertical chat history.
2. In-memory UI state:
- Loading/error flags.
- Sheet/panel open states.
- Card selection quantities.
