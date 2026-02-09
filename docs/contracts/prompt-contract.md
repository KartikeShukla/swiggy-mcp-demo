# Prompt Contract

## Composition

All verticals compose system prompts as:

1. Vertical base prompt (`src/verticals/prompts/*.md`)
2. Shared rules from `src/verticals/shared-prompt.ts`:
- search efficiency
- result filtering
- tool error handling
- card rendering guidance
- COD cancellation reminder where applicable

## Required Invariants

1. Do not remove context-gathering requirements per vertical.
2. Do not remove explicit confirmation rules before place/book operations.
3. Card rendering rule must remain: assistant avoids enumerating details already shown in cards.
4. Tool error handling policy must remain aligned with stream retry guard behavior.

## Vertical Mapping

1. `food` -> Instamart
2. `style` -> Instamart
3. `dining` -> Dineout
4. `foodorder` -> Food
