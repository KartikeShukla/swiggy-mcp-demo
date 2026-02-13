# Vertical: foodorder (FeedMe)

## Goal
Handle craving-based restaurant discovery, menu exploration, cart updates, and food ordering.

## Primary Runtime Path
1. Establish craving/cuisine intent.
2. Discover restaurants and render restaurant cards.
3. Lock selected restaurant and switch to menu mode.
4. Render menu products and process cart updates.
5. Confirm before order placement.

## Key Signals
- Craving and cuisine language.
- Diet/speed/budget constraints.
- Restaurant selection events (`Open menu for restaurant: ...`).

## Edge Cases
- Vague user hunger prompt with no cuisine.
- Mixed payloads requiring restaurant-vs-menu parser disambiguation.
- Optimistic cart state prior to latest MCP cart confirmation.
