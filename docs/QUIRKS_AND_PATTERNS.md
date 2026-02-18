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
- Cart state is derived from assistant tool results by chronological scanning and reconciliation.
- Supports nested cart response structures and bill breakdown extraction.
- For `food`, `style`, and `foodorder`, add-like partial cart snapshots are reconciled with prior cart state so earlier items do not disappear.
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
- Chat transport supports dual-channel user turns: clean visible text for bubbles plus optional API-only enriched metadata text for reliability.
- Actions are fed back into the same chat pipeline, preserving one conversational loop.

## Advisory Intent Guard Pattern
- In `food` and `style`, advisory prompts (recipes/routines/plans) are treated as knowledge-first turns.
- Advisory turns avoid MCP tool calls unless the user explicitly asks to source/find/buy items.
- Cart intent heuristics for `food` and `style` are stricter than generic verticals to avoid false cart-mode triggers from non-commerce phrasing.

## Relevance Debug Overlay Pattern
- Relevance debug trace ribbons above card rails are hidden by default.
- Overlay is rendered only in dev when `VITE_SHOW_RELEVANCE_DEBUG=true`.

## Dining Strict-Match Pattern
- Dining strict-first ranking no longer hard-blocks on conflicting filters.
- When no exact combined match exists, closest restaurant options are still returned with an explicit relaxation hint.
- Dining time-slot rails prioritize requested-time matches first, then list remaining available slots.
- Dining slot selections are treated as pre-booking intent; assistant must ask one final explicit yes/no before executing booking tools.
- Dining assistant copy is card-grounded when tool cards are present to avoid over-claiming exact match/slot outcomes.

## Guardrail-Sensitive Facts
- Keep runtime numeric claims synced through `docs/RUNTIME_FACTS.md` and `docs:sync`.
- `docs:verify` enforces stale-claim rejection for frequently regressed values.

## Related Docs
- [MCP Tools](./MCP_TOOLS.md)
- [Parser Contract](./contracts/parser-contract.md)
- [Runtime Facts](./RUNTIME_FACTS.md)
