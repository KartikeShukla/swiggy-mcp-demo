# Action Message Contract

## Definition

Card interactions convert UI clicks into natural-language action strings sent back through the same chat pipeline.

## Contract Rules

1. Action messages must be deterministic and user-intent explicit.
2. Action messages must preserve current behavior semantics (no hidden side effects).
3. All card action messages must route through `onAction` and then `sendMessage`.

## Current Action Examples

1. Product bulk add:
- `Add the following items to my cart: ...`
2. Restaurant action:
- `Check availability at {restaurant}`
- `Show me the menu at {restaurant}`
3. Time slot action:
- `Book a table at {restaurant} for {slot}`
4. Address action:
- `Use my {label} address: {address}`
5. Cart edits:
- `Change {item} quantity to {n}`
- `Remove {item} from my cart`

## Regression Guard

Tests should verify that click interactions emit expected message templates for each card type.
