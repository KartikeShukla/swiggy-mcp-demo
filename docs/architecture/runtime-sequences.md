# Runtime Sequences

## OAuth Sequence

1. UI opens `/api/auth/start`.
2. Middleware fetches OAuth discovery from Swiggy.
3. Middleware creates PKCE + state, stores pending auth.
4. Browser is redirected to provider authorization endpoint.
5. Provider redirects to `/api/auth/callback`.
6. Middleware exchanges auth code for access token.
7. Popup posts token to opener via `postMessage`.
8. `useAuth` persists token and onboarding advances.

## Chat + MCP Sequence

1. User submits message in `ChatInput`.
2. `useChat` appends user message and toggles loading.
3. `useChatApi` composes request:
- model, system blocks, messages
- `mcp_servers` + `tools` when Swiggy token exists
- beta flags and context management edits
4. Anthropic stream emits content blocks.
5. Retry loop guard aborts stream on repeated MCP tool failures.
6. `useChat` appends assistant content blocks.
7. Message UI groups blocks and parses tool results into card types.
8. Card actions trigger new user-like follow-up messages.

## Parser Rendering Sequence

1. `unwrapContent` normalizes MCP tool result payload.
2. `extractPayload` peels nested response wrappers.
3. `parseToolResult` routes by tool-name heuristics.
4. Fallback order:
- shape detect
- status parser
- info parser
- raw passthrough
5. `ItemCardGrid` renders typed cards by `ParsedToolResult`.
