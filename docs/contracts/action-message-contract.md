# Action Message Contract

## Definition
Action messages are deterministic user-intent payloads emitted by card and cart interactions and re-fed into chat.

## Contract Rules
1. Emitted actions must preserve user intent without hidden side effects.
2. Actions must route through the same chat pipeline (`onAction` -> `sendMessage`).
3. Templates must remain stable for critical interaction families (menu open, availability check, cart adjust, booking confirm).

## Example Families
- Product/cart: `Add to cart: ...`, `Change {item} quantity to {n}`, `Remove {item} from my cart`.
- Restaurant transitions: `Open menu for restaurant: ...`, `Check availability at ...`.
- Slot confirmation: `Book a table at {restaurant} for {slot}`.
- Address selection: `Use my {label} address: {address}`.

## Regression Locks
- `src/components/cards/__tests__/food-product-interactions.test.tsx`
- `src/components/cards/__tests__/foodorder-restaurant-menu.test.tsx`
- `src/components/cards/__tests__/dining-restaurant-slot-interactions.test.tsx`
- `src/lib/__tests__/chat-actions.test.ts`
