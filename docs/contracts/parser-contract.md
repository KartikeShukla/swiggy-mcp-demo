# Parser Contract

## Input

`parseToolResult(toolName, content, verticalId)`

1. `toolName`: MCP tool identifier associated with a tool result block.
2. `content`: raw tool output from Anthropic MCP result block.
3. `verticalId`: one of `food | style | dining | foodorder`.

## Output

`ParsedToolResult` union:

1. `products`
2. `restaurants`
3. `time_slots`
4. `addresses`
5. `cart`
6. `order_placed`
7. `booking_confirmed`
8. `status`
9. `info`
10. `raw`

## Stability Rules

1. Never throw; fallback must return `raw`.
2. Preserve current parser precedence in orchestrator.
3. Tool-name routing is first-pass, not exclusive.
4. Shape fallback must remain active for unknown tool names.
5. `cart` detection must preserve nested bill/line item extraction behavior.

## Test Lock

1. `src/lib/parsers/__tests__/orchestrator.test.ts`
2. Specialized parser test files under `src/lib/parsers/__tests__/`.
