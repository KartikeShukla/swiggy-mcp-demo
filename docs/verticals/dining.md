# Vertical: dining (TableScout)

## Goal
Guide restaurant discovery, slot availability checks, and booking via Dineout MCP.

## Primary Runtime Path
1. Gather cuisine/vibe, party size, and time context.
2. Run one focused restaurant discovery call.
3. Apply strict-first ranking for cuisine/vibe/location/budget when signals exist.
4. If no strict combined match, return actionable broaden choices (one filter at a time).
5. Let user choose a restaurant from cards.
6. Fetch and render time-slot options.
7. Require explicit confirmation before booking action.

## Key Signals
- Cuisine/vibe vocabulary.
- Party size and date-time intent.
- Location context from selected address or user override.

## Edge Cases
- Requested slot unavailable; must offer returned alternatives.
- Incomplete party/time context.
- Strict filters conflict (for example, cuisine + area both present but no combined match).
- Dish-specific requests with no menu-level evidence should use a cuisine proxy with clear caveat.
- Non-dining requests in dining context.
