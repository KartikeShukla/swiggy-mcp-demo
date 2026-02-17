# Swiggy MCP Demo

Browser-first React demo that connects Anthropic chat streaming with Swiggy MCP tools across four tabs: `Nutrition`, `Styling`, `Dine`, and `Food`.

## Important Warning
- This demo was built completely through iterative prompting with CC (Claude Code) and Codex.
- Reliability is not great and can break in edge cases (intent understanding, cart state, tool flows, rate-limit behavior).
- Use this project for demos and experimentation, not as an actual reference.

## What This Demo Covers
- Shared chat infrastructure for 4 verticals (`food`, `style`, `dining`, `foodorder`).
- MCP tool execution via Anthropic (`mcp_tool_use` / `mcp_tool_result` stream flow).
- Parser + card rendering pipeline for products, restaurants, carts, and confirmations.
- Basic dev OAuth middleware for Swiggy token flows.

## Quick Start
```bash
npm install
npm run dev
```
Open `http://localhost:5173`.

## Useful Commands
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

## Project Map (Start Here)
- App shell and routing: `src/App.tsx`
- Auth and onboarding: `src/hooks/useAuth.ts`
- Chat orchestration: `src/hooks/useChat.ts`, `src/hooks/useChatApi.ts`
- Anthropic integration: `src/integrations/anthropic/*`
- Tool-result parsing: `src/lib/parsers/*`
- Vertical configs and prompts: `src/verticals/*`
- UI cards/chat/nav: `src/components/*`

## Docs Map (Deep Dive)
- Docs index: `docs/README.md`
- Setup and run: `docs/SETUP_AND_RUN.md`
- Architecture: `docs/ARCHITECTURE.md`
- Runtime facts/constants: `docs/RUNTIME_FACTS.md`
- Coverage map: `docs/COVERAGE_MATRIX.md`
- Prompt/parser/action contracts: `docs/contracts/*`

## Security Notes (Demo Only)
- API keys and Swiggy token data are intentionally stored in browser `localStorage`.
- Use only personal test credentials.
- Avoid shared devices/profiles.
- Revoke/disconnect tokens after demos.

## License
- This project is source-available under a custom non-commercial license (see `LICENSE`).
- You can use, modify, and share it for non-commercial purposes.
- Any commercial use is strictly not allowed without prior written permission.

## Thanks
Thank you to Hariom Palkar for making this MCP available: https://github.com/Swiggy/swiggy-mcp-server-manifest
