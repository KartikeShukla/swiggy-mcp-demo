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
3. Shared error-handling and card-first response rules remain present.
4. Dining flow keeps availability-before-booking behavior.
5. Foodorder keeps discovery-to-menu progression semantics.

## Mapping Contract
- `food` and `style` use Instamart MCP.
- `dining` uses Dineout MCP.
- `foodorder` uses Food MCP.

## Regression Locks
- `src/verticals/__tests__/prompts.test.ts`
- `src/verticals/__tests__/prompt-compiler.test.ts`
- `src/verticals/__tests__/scenario-matrix.test.ts`
- `src/verticals/__tests__/prompt-budget.test.ts`
