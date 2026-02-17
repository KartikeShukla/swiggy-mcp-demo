## Core Runtime Facts

### Runtime Topology
- Browser-only React SPA with Anthropic SDK in browser mode (`dangerouslyAllowBrowser: true`).
- MCP tools are executed server-side by Anthropic using `mcp_servers` + `mcp_toolset`.
- Dev-only OAuth middleware is provided by Vite plugin in `server/oauth`.

### Request Pipeline
1. `useChat` appends user-visible message text and can send optional API-only enriched text (`apiText`) for model/tool disambiguation.
2. `useChatApi` builds params via `buildMessageStreamParams`.
3. `runMessageStream` handles streaming, timeout, tool-level aborts, and content sanitization.
4. Assistant blocks are parsed into cards by `parseToolResult` + `ItemCardGrid`.
5. Dining and foodorder parser paths apply strict-first relevance reranking when render context is available.

### Current Limits And Constants
All numeric constants are centralized in `src/lib/constants.ts` unless noted otherwise.
- `MAX_CONTEXT_MESSAGES = 8`.
- Context management trigger: `input_tokens = 12000`.
- Context management keep tool uses: `3`.
- `KEEP_RECENT_MESSAGES_FULL = 2`.
- `MAX_OLD_USER_MESSAGE_CHARS = 240` for compacting older user turns before context bounding.
- `MAX_PRODUCTS_SHOWN = 3`, `MAX_MENU_PRODUCTS_SHOWN = 5`, `MAX_RESTAURANTS_SHOWN = 5`.
- Parser candidate pools before rerank: dining restaurants `15`, foodorder menu `15`, foodorder restaurants `15` (`src/lib/parsers/routing-signals.ts`).
- `MCP_TOOL_ERROR_LIMIT = 2`, `MCP_AUTH_ERROR_LIMIT = 1`.
- `STREAM_REQUEST_TIMEOUT_MS = 90000`.
- API retry budgets: `CHAT_REQUEST_MAX_RETRIES = 2`, `RATE_LIMIT_MAX_RETRIES = 1`, `HEAVY_CONTEXT_RETRY_LIMIT = 1`.

### Session Summary
- Built from recent user messages in `buildSessionStateSummary`.
- Encodes compact signals like slots, intent, confirmation state, selected restaurant, and location lock.
- Can include compact selection-memory hints: `last_cart_selection`, `last_restaurant_selection`, `last_slot_selection`.
- `foodorder` and `dining` include compact `filters=` signals for strict-first relevance continuity.
- Intent classification is aligned with render-context intent classification through shared runtime intent signals (`src/lib/intent/runtime-signals.ts`).
- Included as a system text block without cache control.

### Debug Overlay
- Relevance debug overlays above card rails are disabled by default.
- Overlay rendering is opt-in in dev via `VITE_SHOW_RELEVANCE_DEBUG=true`.

### Storage Boundaries
- Local storage keys: API key, Swiggy token + timestamp, selected address, per-vertical chat history.
- Per-vertical chat persistence key format: `mcp-demo:chat:{verticalId}`.

### Verticals And MCP Mapping
- `food` -> `swiggy-instamart` (`https://mcp.swiggy.com/im`).
- `style` -> `swiggy-instamart` (`https://mcp.swiggy.com/im`).
- `dining` -> `swiggy-dineout` (`https://mcp.swiggy.com/dineout`).
- `foodorder` -> `swiggy-food` (`https://mcp.swiggy.com/food`).

### Current Test Footprint
- `57` test files under `src/**/__tests__` and `server/**/__tests__`.
- Latest baseline: lint and test suites pass on this branch.
