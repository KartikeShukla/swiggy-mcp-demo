# Swiggy MCP Demo

Swiggy MCP demo is a browser-only React SPA that connects Claude to Swiggy MCP servers through Anthropic's MCP support.

## What This Project Demonstrates
- Prompt-driven product verticals on shared infra (`food`, `style`, `dining`, `foodorder`).
- Tool-based chat UX using streamed `mcp_tool_use` and `mcp_tool_result` blocks.
- Heuristic parser pipeline that converts tool payloads into card UIs.
- Dev-only OAuth middleware for obtaining Swiggy access tokens.

## Runtime Model
- Frontend calls Anthropic Messages API from the browser.
- Anthropic executes MCP tools server-side against Swiggy MCP endpoints.
- Browser persists credentials and per-vertical chat histories in localStorage.

## Security Notes (Demo)
- This app is intentionally browser-first and stores API/session tokens in localStorage.
- Use personal test credentials only; avoid shared browser profiles/machines.
- Do not deploy this as a shared public service without a backend token broker.
- After demos, clear chats and revoke/disconnect tokens.

## Quick Start
```bash
npm install
npm run dev
```
Open `http://localhost:5173`.

## Scripts
```bash
npm run dev
npm run build
npm run preview
npm run lint
npm run test
npm run test:watch
npm run test:coverage
npm run docs:sync
npm run docs:verify
```

## Test Baseline
- Current suite: `45` test files.
- Typical verification for behavior changes:
  - `npm run lint`
  - `npm run test`

## Documentation
- Main docs index: `/Users/kartike/Downloads/Co-work/swiggy-mcp-demo/docs/README.md`
- Architecture: `/Users/kartike/Downloads/Co-work/swiggy-mcp-demo/docs/ARCHITECTURE.md`
- Runtime facts: `/Users/kartike/Downloads/Co-work/swiggy-mcp-demo/docs/RUNTIME_FACTS.md`
- Coverage matrix: `/Users/kartike/Downloads/Co-work/swiggy-mcp-demo/docs/COVERAGE_MATRIX.md`
