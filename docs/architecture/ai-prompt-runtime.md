# AI Prompt Runtime

## Goal
Provide stable vertical behavior with compact prompts and predictable tool usage.

## Build Path
1. Prompt profiles in `src/verticals/prompt-spec/profiles.ts`.
2. Profile compilation via `compilePromptProfile`.
3. Shared rule append in `src/verticals/shared-prompt.ts`.
4. Request-time system blocks in `buildMessageStreamParams`.

## Runtime Inputs
- Vertical compiled prompt.
- Optional selected address lock context.
- Datetime context block.
- Optional compact session summary.
- Shared runtime intent signals for loading/parser intent alignment (`src/lib/intent/runtime-signals.ts`).

## Runtime Constraints
- Bounded message window.
- Older long user turns are compacted before context bounding.
- Context-management edit policy.
- One stream request per turn.
- Retry/abort guards for MCP and API failures with conservative retry budgets for rate-limit/heavy-context cases.

## Invariants
1. Confirmation required before place/book actions.
2. Tool errors should not loop indefinitely.
3. Prompt-driven vertical identity remains explicit.
4. Card-first output style remains preferred.

## Related Tests
- `src/verticals/__tests__/prompt-compiler.test.ts`
- `src/verticals/__tests__/prompt-budget.test.ts`
- `src/integrations/anthropic/__tests__/request-builder.test.ts`
- `src/integrations/anthropic/__tests__/session-summary.test.ts`
