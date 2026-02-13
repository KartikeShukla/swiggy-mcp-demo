# Vertical: food (NutriCart)

## Goal
Provide nutrition-aware guidance and grocery ordering through Instamart.

## Primary Runtime Path
1. Detect direct-order vs advisory nutrition mode.
2. Advisory mode: gather context and suggest recipe/meal options.
3. Direct mode: search products immediately for named items.
4. Convert tool results to product/cart cards.
5. Confirm before final order placement.

## Key Signals
- Goal intent: diet/nutrition/meal-prep language.
- Dietary constraints and serving counts.
- Budget preference and quantity hints.

## Edge Cases
- Missing nutrition context in advisory mode.
- Ingredient unavailability requiring substitute suggestion.
- Session expiry during cart/order steps.
