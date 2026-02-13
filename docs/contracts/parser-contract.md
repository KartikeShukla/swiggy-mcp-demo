# Parser Contract

## Entrypoint
`parseToolResult(toolName, content, verticalId, toolInput?)`

## Required Output
Must always return one `ParsedToolResult` union variant:
- `products`, `restaurants`, `time_slots`, `addresses`, `cart`, `order_placed`, `booking_confirmed`, `status`, `info`, or `raw`.

## Stability Rules
1. Parser path should not throw to caller.
2. Tool-name routing is preferred first pass, not exclusive.
3. Shape fallback must remain active.
4. Final fallback must remain `raw`.
5. Cart parsing must preserve nested bill/line-item extraction behavior.
6. Dining restaurant parsing must preserve strict-first rerank + explicit broaden-info fallback behavior.

## Regression Locks
- `src/lib/parsers/__tests__/orchestrator.test.ts`
- parser-specific tests in `src/lib/parsers/__tests__/`
