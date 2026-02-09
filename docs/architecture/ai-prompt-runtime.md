# AI Prompt Runtime

## Goal

Keep behavior stable across all four verticals while reducing prompt token usage and preserving MCP tool UX.

## Build Path

1. Vertical profile in `src/verticals/prompt-spec/profiles.ts`
2. Compiler in `src/verticals/prompt-spec/compiler.ts`
3. Shared compact policies in `src/verticals/shared-prompt.ts`
4. Final prompt string attached in `buildMessageStreamParams()`

## Request Composition

`buildMessageStreamParams()` (`src/integrations/anthropic/request-builder.ts`) sends:

1. Cached system prompt block (compiled vertical prompt)
2. Optional delivery address block
3. Optional compact session-state block (`slots=...; confirm=...`)
4. Message history
5. MCP server + toolset config when Swiggy token exists
6. Beta flags for MCP + prompt caching + context management

## Session State Snapshot

`buildSessionStateSummary()` (`src/integrations/anthropic/session-summary.ts`) extracts recent user signals per vertical and emits a tiny summary only when confidence is high enough.

Purpose:

1. Keep model aligned on collected context without long repeated clarifications
2. Keep added token overhead minimal

## Safety + Behavior Invariants

1. Explicit confirmation required before order/booking actions
2. Card-first response style remains mandatory
3. MCP error handling stays aligned with stream abort guards
4. Dining availability check remains mandatory before booking

## Tests

1. Prompt invariants: `src/verticals/__tests__/prompt-compiler.test.ts`
2. Prompt budget gate: `src/verticals/__tests__/prompt-budget.test.ts`
3. Scenario matrix: `src/verticals/__tests__/scenario-matrix.test.ts`
4. Request builder + session snapshot: `src/integrations/anthropic/__tests__/request-builder.test.ts`, `src/integrations/anthropic/__tests__/session-summary.test.ts`
