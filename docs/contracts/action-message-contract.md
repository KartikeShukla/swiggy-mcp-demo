# Action Message Contract

## Definition
Action messages are deterministic user-intent payloads emitted by card and cart interactions and re-fed into chat.

Actions use a dual-channel contract:
- Stable human-readable `message` text (for backward-compatible prompt grammar).
- Structured metadata payload (IDs, variant labels, target quantities, slot/restaurant refs).

## Contract Rules
1. Emitted actions must preserve user intent without hidden side effects.
2. Actions must route through the same chat pipeline (`onAction` -> `sendMessage`).
3. Human-readable templates must remain stable for critical interaction families (menu open, availability check, cart adjust, booking confirm).
4. Structured metadata must be preferred over fuzzy text matching when both are present.
5. Nutrition/Style tab-switch cleanup is UI-level state management and is intentionally outside action-message emission.
6. Structured metadata may be transported in API-only message text; it should not be rendered in user chat bubbles.

## Example Families
- Product/cart: `Add to cart: ...`, `Change {item} quantity to {n}`, `Remove {item} from my cart`.
- Restaurant transitions: `Open menu for restaurant: ...`, `Check availability at ...`.
- Slot confirmation: `Book a table at {restaurant} for {slot}`.
- Address selection: `Use my {label} address: {address}`.

Structured action kinds:
- `cart_add_selection`
- `cart_update_item`
- `restaurant_select`
- `slot_select`
- `select_address`
- `text`

## Regression Locks
- `src/components/cards/__tests__/food-product-interactions.test.tsx`
- `src/components/cards/__tests__/foodorder-restaurant-menu.test.tsx`
- `src/components/cards/__tests__/dining-restaurant-slot-interactions.test.tsx`
- `src/lib/__tests__/chat-actions.test.ts`
