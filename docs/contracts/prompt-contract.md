# Prompt Contract

## Composition Contract
System prompts are composed from:
1. per-vertical prompt profile
2. compiler output sections
3. shared prompt rules
4. optional COD notice by profile flag

## Required Invariants
1. Vertical mission/scope distinctions remain explicit.
2. Confirmation policy remains explicit before place/book operations.
3. Shared error-handling, card-first response, and cart-consistency rules remain present.
4. Dining flow keeps availability-before-booking behavior.
5. Dining strict-first matching must request user approval before broadening filters.
6. Foodorder keeps discovery-to-menu progression semantics.
7. Foodorder restaurant lock: once selected, all menu/cart operations use that restaurant.
8. Cart state comes from tool results only — no mental model of cart contents.

## Mapping Contract
- `food` and `style` use Instamart MCP.
- `dining` uses Dineout MCP.
- `foodorder` uses Food MCP.

## Regression Locks
- `src/verticals/__tests__/prompts.test.ts`
- `src/verticals/__tests__/prompt-compiler.test.ts`
- `src/verticals/__tests__/scenario-matrix.test.ts`
- `src/verticals/__tests__/prompt-budget.test.ts`
