# Quirks And Patterns

Verified implementation patterns that are easy to regress.

## Anthropic Client Runtime Pattern
- SDK runs in browser with `dangerouslyAllowBrowser: true` and `maxRetries: 0`.
- Retry behavior is intentionally centralized in custom retry policy logic.

## Message Sanitization Pattern
- Orphan tool blocks are removed before persistence/request usage.
- Old tool-heavy assistant messages are compacted to text-first representation.
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

## OAuth Discovery Pattern
- OAuth discovery uses robust candidate probing and fallback paths.
- Token endpoint is passed through callback via cookie in dev flow.

## UI Action Loop Pattern
- Card interactions emit deterministic action messages through `onAction`.
- Actions are fed back into the same chat pipeline, preserving one conversational loop.

## Guardrail-Sensitive Facts
- Keep runtime numeric claims synced through `docs/RUNTIME_FACTS.md` and `docs:sync`.
- `docs:verify` enforces stale-claim rejection for frequently regressed values.

## Related Docs
- [MCP Tools](./MCP_TOOLS.md)
- [Parser Contract](./contracts/parser-contract.md)
- [Runtime Facts](./RUNTIME_FACTS.md)
