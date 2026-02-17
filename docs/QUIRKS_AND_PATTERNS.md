# Quirks And Patterns

Verified implementation patterns that are easy to regress.

## Anthropic Client Runtime Pattern
- SDK runs in browser with `dangerouslyAllowBrowser: true` and `maxRetries: 0`.
- Retry behavior is intentionally centralized in custom retry policy logic.

## Message Sanitization Pattern
- Orphan tool blocks are removed before persistence/request usage.
- Old tool-heavy assistant messages are compacted to text-first representation.
- Older long user messages are compacted before context bounding to reduce token load.
- Large tool results are truncated with query-aware selection to avoid oversized payloads.

## Parser Fallback Pattern
- Tool-name routing is first pass, shape detection is fallback.
- Final fallback is always `raw`; parser path should not throw.

## FoodOrder Disambiguation Pattern
- Foodorder payload classification uses both tool-name intent and payload signal keys.
- Mixed payloads can prefer menu products over restaurants based on signals.

## Cart Derivation Pattern
- Cart state is derived from assistant tool results by reverse scanning messages.
- Supports nested cart response structures and bill breakdown extraction.
- Foodorder optimistic cart entries use stable keys with restaurant scope to avoid cross-restaurant key collisions.

## Nutrition/Style Switch Guard Pattern
- Guard applies only to `food` <-> `style` tab switches.
- Prompt is shown only when current/source tab has clearable local state (chat history and/or non-empty latest cart snapshot).
- On confirm, source-tab chat history is cleared before navigating.
- A best-effort background Instamart cart-clear request is fired; failures are logged but never block navigation.

## OAuth Discovery Pattern
- OAuth discovery uses robust candidate probing and fallback paths.
- Token endpoint is bound to server-side pending auth state and reused in callback.

## UI Action Loop Pattern
- Card interactions emit deterministic action payloads through `onAction`.
- Critical interaction families preserve stable human-readable message templates while also carrying structured identity metadata.
- Actions are fed back into the same chat pipeline, preserving one conversational loop.

## Guardrail-Sensitive Facts
- Keep runtime numeric claims synced through `docs/RUNTIME_FACTS.md` and `docs:sync`.
- `docs:verify` enforces stale-claim rejection for frequently regressed values.

## Related Docs
- [MCP Tools](./MCP_TOOLS.md)
- [Parser Contract](./contracts/parser-contract.md)
- [Runtime Facts](./RUNTIME_FACTS.md)
