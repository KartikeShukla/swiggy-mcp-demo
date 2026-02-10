# Target Module Layout

## Integration Layer

`src/integrations/anthropic/`

1. `request-builder.ts`
2. `stream-runner.ts`
3. `mcp-tool-errors.ts`
4. `error-classifier.ts`

Purpose: isolate SDK request and stream logic from React hooks.

## Domain Parsing Layer

`src/lib/parsers/`

1. unwrap/shape/routing orchestration
2. specialized parsers (products/restaurants/cart/status/etc.)
3. tests as behavior lock

Purpose: single source of truth for converting MCP payloads to UI-ready objects.

## Feature UI Layer

1. `src/components/chat/` for conversation rendering and tool detail surfaces.
2. `src/components/cards/` for typed result cards and card action emitters.
3. `src/components/auth/` for bootstrap/settings flows.

Purpose: keep UI composable and decouple view model logic from rendering.

## Server Middleware Layer

`server/oauth/`

1. plugin composition (`plugin.ts`)
2. transport handlers (`start-handler.ts`, `callback-handler.ts`)
3. PKCE/cookie helpers

Purpose: isolate OAuth concerns and avoid lifecycle side effects in tests.
