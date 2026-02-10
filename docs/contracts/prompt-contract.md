# Prompt Contract

## Composition

All verticals compose system prompts as:

1. Vertical profile (`src/verticals/prompt-spec/profiles.ts`)
2. Profile compiler (`src/verticals/prompt-spec/compiler.ts`)
3. Shared compact rules from `src/verticals/shared-prompt.ts`:
- search efficiency
- result filtering
- tool error handling
- card rendering guidance
- COD cancellation reminder where applicable

Compiled output is attached as one cached system block per request.

## Required Invariants

1. Do not remove context-gathering requirements per vertical.
2. Do not remove explicit confirmation rules before place/book operations.
3. Card rendering rule must remain: assistant avoids enumerating details already shown in cards.
4. Tool error handling policy must remain aligned with stream retry guard behavior.
5. Dining flow must keep availability check mandatory before booking.
6. FoodOrder vague-intent handling must keep cuisine-option disambiguation path.
7. Prompt profiles must be duplicate-free after normalization (lint gate).
8. Compiled prompts must keep at least 20% word reduction versus legacy baseline.

## Vertical Mapping

1. `food` -> Instamart
2. `style` -> Instamart
3. `dining` -> Dineout
4. `foodorder` -> Food

## Regression Locks

1. `src/verticals/__tests__/prompts.test.ts`
2. `src/verticals/__tests__/prompt-compiler.test.ts`
3. `src/verticals/__tests__/scenario-matrix.test.ts`
4. `src/verticals/__tests__/prompt-budget.test.ts`
