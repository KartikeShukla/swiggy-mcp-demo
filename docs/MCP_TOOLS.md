# MCP Tools

How MCP tools are configured, executed, and rendered in this project.

## Runtime Discovery Model
- Tool catalogs are runtime-discovered through Anthropic MCP toolset integration.
- Local code does not define a static Swiggy tool registry.
- Runtime behavior depends on tool name patterns plus payload-shape parsing.

## Request Configuration
`buildMessageStreamParams` configures:
- `mcp_servers` with vertical server URL + auth token.
- `tools: [{ type: "mcp_toolset", mcp_server_name: ... }]`.
- beta flags including MCP, prompt caching, and context management.

## Swiggy MCP Endpoints
- Instamart: `https://mcp.swiggy.com/im`
- Dineout: `https://mcp.swiggy.com/dineout`
- Food: `https://mcp.swiggy.com/food`

## Tool Result Processing Pipeline
1. `runMessageStream` emits assistant content blocks.
2. `sanitizeAssistantBlocks` removes orphan tool block pairs.
3. UI groups tool blocks by adjacency.
4. `parseToolResult` applies staged routing (tool pattern signals -> payload-shape signals -> shape fallback).
5. `ItemCardGrid` renders typed cards.

## Parser Routing Signals
- Search/discovery patterns route to products/restaurants.
- Cart patterns route to cart parser first.
- Time-slot patterns route to slot parser.
- Address/location patterns route to address parser.
- Confirmation patterns route to order/booking parsers.

## Truncation And Compaction
- `compactOldMessages`: strips tool blocks from old assistant messages while keeping text.
- `compactOldUserMessages`: trims older long user messages before context bounding.
- `truncateToolResultsInMessages`: truncates oversized tool results (uses `MAX_TOOL_RESULT_CHARS = 3000`).
- Message window is bounded before request send.

## Tool Error Handling
- Tool errors are categorized as `auth`, `address`, `server`, `validation`.
- Stream abort behavior:
  - immediate abort on auth/address terminal cases
  - bounded abort for repeated server/validation failures

## Vertical Tool Behavior
- `food`/`style`: Instamart products + cart flows.
- `dining`: restaurant discovery + availability + booking flows, with strict-first restaurant reranking and explicit broaden gating.
- `foodorder`: restaurant discovery + menu + cart/order; includes restaurant-vs-menu disambiguation plus strict-first reranking when render context is available.

## Related Docs
- [Architecture](./ARCHITECTURE.md)
- [Data Models](./DATA_MODELS.md)
- [Parser Contract](./contracts/parser-contract.md)
