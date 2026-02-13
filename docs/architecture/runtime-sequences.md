# Runtime Sequences

## OAuth Sequence (Dev)
1. Open `/api/auth/start`.
2. Discover endpoints + generate PKCE.
3. Redirect to provider auth endpoint.
4. Return to `/api/auth/callback` with code.
5. Exchange code for token.
6. `postMessage` token to opener.
7. Persist token in `useAuth`.

## Chat + MCP Sequence
1. User sends message.
2. `useChat` updates history and loading state.
3. `useChatApi` builds params and starts stream.
4. Stream emits text/tool blocks.
5. Tool errors are monitored and may abort stream.
6. Assistant content is sanitized and appended.
7. UI parses tool results into typed cards.

## Parser Rendering Sequence
1. Normalize raw tool result payload.
2. Extract nested payload.
3. Route by tool name where possible.
4. Apply shape detection fallback.
5. Fallback to status/info/raw.
6. Render through `ItemCardGrid`.
