## Core Runtime Facts

### Runtime Topology
- Browser-only React SPA with Anthropic SDK in browser mode (`dangerouslyAllowBrowser: true`).
- MCP tools are executed server-side by Anthropic using `mcp_servers` + `mcp_toolset`.
- Dev-only OAuth middleware is provided by Vite plugin in `server/oauth`.

### Request Pipeline
1. `useChat` appends user message and builds optional session summary.
2. `useChatApi` builds params via `buildMessageStreamParams`.
3. `runMessageStream` handles streaming, timeout, tool-level aborts, and content sanitization.
4. Assistant blocks are parsed into cards by `parseToolResult` + `ItemCardGrid`.
5. Dining parser path applies strict-first relevance reranking before rendering restaurant cards.

### Current Limits And Constants
- `MAX_CONTEXT_MESSAGES = 8` (`src/integrations/anthropic/request-builder.ts`).
- Context management trigger: `input_tokens = 12000`.
- Context management keep tool uses: `3`.
- `KEEP_RECENT_MESSAGES_FULL = 2` (`src/integrations/anthropic/message-sanitizer.ts`).
- `MAX_PRODUCTS_SHOWN = 3`, `MAX_MENU_PRODUCTS_SHOWN = 5`, `MAX_RESTAURANTS_SHOWN = 5`.
- Dining parser candidate pool before rerank: `15` (`src/lib/parsers/orchestrator.ts`).
- `MCP_TOOL_ERROR_LIMIT = 2`, `MCP_AUTH_ERROR_LIMIT = 1`.
- `STREAM_REQUEST_TIMEOUT_MS = 90000`.

### Session Summary
- Built from recent user messages in `buildSessionStateSummary`.
- Encodes compact signals like slots, intent, confirmation state, selected restaurant, and location lock.
- `foodorder` and `dining` include compact `filters=` signals for strict-first relevance continuity.
- Included as a system text block without cache control.

### Storage Boundaries
- Local storage keys: API key, Swiggy token + timestamp, selected address, per-vertical chat history.
- Per-vertical chat persistence key format: `mcp-demo:chat:{verticalId}`.

### Verticals And MCP Mapping
- `food` -> `swiggy-instamart` (`https://mcp.swiggy.com/im`).
- `style` -> `swiggy-instamart` (`https://mcp.swiggy.com/im`).
- `dining` -> `swiggy-dineout` (`https://mcp.swiggy.com/dineout`).
- `foodorder` -> `swiggy-food` (`https://mcp.swiggy.com/food`).

### Current Test Footprint
- `46` test files under `src/**/__tests__` and `server/**/__tests__`.
- Latest baseline: lint and test suites pass on this branch.
