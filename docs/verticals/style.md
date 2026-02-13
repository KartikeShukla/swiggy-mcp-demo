# Vertical: style (StyleKit)

## Goal
Provide grooming-focused recommendations and Instamart shopping flow.

## Primary Runtime Path
1. Detect direct-shopping vs advisory routine mode.
2. Advisory mode: infer concern + skin/hair context.
3. Recommend concise routine or product stack.
4. Search and render product cards.
5. Confirm before final order placement.

## Key Signals
- Concern words (acne, dandruff, beard, wedding prep).
- Skin and hair type cues.
- Budget and product preference hints.

## Edge Cases
- Partial context where skin/hair type is missing.
- Brand unavailability requiring near-equivalent alternatives.
- Repeated cart edits across multiple product groups.
