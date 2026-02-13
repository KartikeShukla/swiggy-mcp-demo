# Data Models

Type and schema map for runtime payloads and UI rendering.

## Core Config Types
- `McpServerConfig`: MCP endpoint URL + server name.
- `VerticalConfig`: vertical metadata + system prompt + server mapping.

## Chat Content Types
- `TextBlock`
- `McpToolUseBlock`
- `McpToolResultBlock`
- `ContentBlock` union
- `ChatMessage` (`role`, `content`, `timestamp`)

## Token And API Types
- `TokenUsage`
- `ApiResponse`

## Parsed Result Union
`ParsedToolResult` variants:
- `products`
- `restaurants`
- `time_slots`
- `addresses`
- `cart`
- `order_placed`
- `booking_confirmed`
- `status`
- `info`
- `raw`

## Supporting Parsed Types
- `ParsedProduct`
- `ParsedRestaurant`
- `ParsedTimeSlot`
- `ParsedAddress`
- `ParsedStatus`
- `ParsedInfoEntry`
- `CartItem`
- `CartState`

## Action + Conversation Types
- `ChatAction`
- `McpErrorCategory`
- `ParserIntentHint`
- `ConversationStateSnapshot`
- `TextParseResult`
- `DisplaySegment`

## Prompt Spec Types
- `VerticalId`
- `PromptSlotRule`
- `PromptProfile`

## Runtime Schemas
`src/lib/schemas.ts` currently defines schemas for core parsed types:
- product, restaurant, time slot, address
- status, info entry
- cart item, cart state

Schema coverage is intentionally narrower than full runtime unions; parsing logic remains heuristic and union-driven.

## Model Relationships
1. Assistant content arrives as `ContentBlock[]`.
2. Parser converts tool-result payloads into `ParsedToolResult`.
3. `ItemCardGrid` uses the `type` discriminant to pick UI card components.
4. Card actions re-enter chat pipeline via `ChatAction`.

## Related Docs
- [MCP Tools](./MCP_TOOLS.md)
- [Parser Contract](./contracts/parser-contract.md)
- [Prompt Contract](./contracts/prompt-contract.md)
