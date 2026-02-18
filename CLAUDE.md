# Claude Companion Guide

This file is the synchronized companion to `AGENTS.md`. It remains full-fidelity and uses the same core runtime facts block, generated from `docs/RUNTIME_FACTS.md`.

## Repository At A Glance
- Product: Swiggy MCP demo app.
- Runtime: browser-only React SPA with Anthropic SDK.
- MCP usage: Swiggy MCP tools are discovered and executed through Anthropic servers.
- Vertical model: four product experiences (`food`, `style`, `dining`, `foodorder`) sharing one chat infrastructure.

## High-Confidence Start Points
1. `src/App.tsx` for shell + routing.
2. `src/hooks/useAuth.ts` for onboarding and auth lifecycle.
3. `src/hooks/useChat.ts` and `src/hooks/useChatApi.ts` for chat orchestration.
4. `src/integrations/anthropic` for request/stream/sanitization/retry behavior.
5. `src/lib/parsers` for tool-result conversion rules.

## Commands
```bash
npm run dev
npm run build
npm run preview
npm run lint
npm run test
npm run test:watch
npm run test:coverage
npm run docs:sync
npm run docs:verify
```

## Core Runtime Facts (Synced)
<!-- CORE_RUNTIME_FACTS:START -->

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
6. Cart snapshots for `food`, `style`, and `foodorder` reconcile partial add-mutation payloads with prior cart state to prevent item loss when tool responses are delta-like.

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
- For `food` and `style`, cart intent heuristics avoid generic advisory phrasing (for example "add more protein to this recipe") so non-commerce turns stay in discover mode.
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

<!-- CORE_RUNTIME_FACTS:END -->

## Architecture Summary
- UI layers live in `src/components/*`, state orchestration in hooks, and runtime integration logic in `src/integrations/anthropic`.
- The request builder assembles prompt blocks, optional address and session-state context, plus MCP config.
- Stream runner enforces timeout and tool-error abort limits and returns sanitized assistant content.
- Error classifier uses a table-driven `ERROR_RULES` approach for clear priority ordering.
- Parser orchestrator converts MCP result payloads into typed card models (`products`, `restaurants`, `cart`, etc.).
- Relevance system uses shared foundations (`relevance/shared.ts`, `relevance/patterns.ts`) with vertical-specific rerankers.

## Prompt System Summary
- Prompt profiles are defined in `src/verticals/prompt-spec/profiles.ts`.
- Shared policies are appended in `src/verticals/shared-prompt.ts`.
- Vertical behavior divergence is prompt-driven first, with selective parser/UI branching in `foodorder` and `dining` flows.

## Data And Security Boundaries
- API key and Swiggy token are localStorage-backed by design in this demo.
- OAuth middleware in `server/oauth` is a dev-only flow.
- Do not log secrets or raw auth tokens.

## Contracts To Preserve
- Parser fallback contract: never throw; always return a valid `ParsedToolResult` variant.
- Action-message contract: card interactions map to deterministic chat actions.
- Prompt contract: explicit confirmation required before irreversible operations (order/booking).
- Cart consistency contract: cart state comes from tool results only; foodorder restaurant lock must persist across menu/cart operations.

## Documentation Navigation
- Start at `docs/README.md`.
- Architecture narrative: `docs/ARCHITECTURE.md`.
- Runtime facts source: `docs/RUNTIME_FACTS.md`.
- Documentation coverage map: `docs/COVERAGE_MATRIX.md`.

## Maintenance Rules For Agents
1. Run `npm run docs:sync` after touching `docs/RUNTIME_FACTS.md`.
2. Run `npm run docs:verify` before finishing any docs change.
3. Keep numeric claims sourced from code constants or executable tests.
4. When behavior changes, update docs and related contract files in the same change set.
