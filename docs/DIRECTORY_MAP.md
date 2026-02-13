# Directory Map

Repository map with purpose-oriented annotations.

## Root
| Path | Purpose |
|---|---|
| `package.json` | Scripts and dependency manifests, including docs automation scripts. |
| `vite.config.ts` | Vite config + OAuth plugin registration. |
| `tsconfig*.json` | TS project + app/node compiler settings. |
| `eslint.config.js` | Lint configuration. |
| `vitest.config.ts` | Test configuration. |
| `AGENTS.md` | Canonical agent guide. |
| `CLAUDE.md` | Synchronized companion guide. |
| `README.md` | Human-facing repository overview. |

## Source (`src`)
### `src/components`
- UI and feature components: auth, chat, cards, cart, layout, home, ui primitives.
- Tool outputs become cards through `chat -> CollapsibleToolGroup -> ItemCardGrid`.

### `src/hooks`
- `useAuth`: onboarding and credential lifecycle.
- `useChat`: orchestrates messaging, loading state, and persistence.
- `useChatApi`: request/stream execution with retry + error classification.
- `useChatPersistence`: localStorage history layer.
- `useCart`: derives cart from parsed tool results.

### `src/integrations/anthropic`
- `request-builder.ts`: builds stream params and MCP config.
- `stream-runner.ts`: stream lifecycle, abort handling, timeout.
- `message-sanitizer.ts`: block-level sanitization + compaction/truncation.
- `session-summary.ts`: compact state snapshot generation.
- `retry-policy.ts`, `error-classifier.ts`, `mcp-tool-errors.ts`, `tool-result-truncation.ts`.

### `src/lib`
- `constants.ts`, `types.ts`, `schemas.ts`, `storage.ts`, `logger.ts`, utility helpers.
- `parsers/`: orchestrator + specialized parsing modules.

### `src/verticals`
- Vertical config files and prompt-spec system.
- Runtime prompt composition is code-driven by prompt profiles + shared prompt rules.

## Server (`server`)
- `oauth-plugin.ts`: re-export for Vite plugin integration.
- `oauth/*`: dev-only PKCE OAuth middleware and endpoint handlers.

## Documentation (`docs`)
- `README.md`: index and reading paths.
- `RUNTIME_FACTS.md`: canonical drift-sensitive runtime facts.
- `COVERAGE_MATRIX.md`: code-to-doc mapping.
- Architecture, contracts, vertical deep dives, and operational references.

## Tests
- Test files are colocated under `__tests__` directories in source areas.
- Current total: 45 test files across components, hooks, integrations, parsers, verticals, lib, and server middleware.

## Related Docs
- [Architecture](./ARCHITECTURE.md)
- [Dependency Graph](./DEPENDENCY_GRAPH.md)
- [Coverage Matrix](./COVERAGE_MATRIX.md)
