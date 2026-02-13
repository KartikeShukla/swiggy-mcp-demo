# Vertical: dining (TableScout)

## Goal
Guide restaurant discovery, slot availability checks, and booking via Dineout MCP.

## Primary Runtime Path
1. Gather cuisine/vibe, party size, and time context.
2. Run focused restaurant discovery call.
3. Let user choose a restaurant from cards.
4. Fetch and render time-slot options.
5. Require explicit confirmation before booking action.

## Key Signals
- Cuisine/vibe vocabulary.
- Party size and date-time intent.
- Location context from selected address or user override.

## Edge Cases
- Requested slot unavailable; must offer returned alternatives.
- Incomplete party/time context.
- Non-dining requests in dining context.
