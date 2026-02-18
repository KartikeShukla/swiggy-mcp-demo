# Swiggy MCP Demo

Browser-first React demo that connects Anthropic chat streaming with Swiggy MCP tools across four tabs: `Nutrition`, `Styling`, `Dine`, and `Food`.

## Important Warning
- This demo was built completely through iterative prompting with CC (Claude Code) and Codex.
- Reliability is not great and can break in edge cases (intent understanding, cart state, tool flows, rate-limit behavior).
- Only use this project for demos and experimentation.

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

## Known Issues (Work in Progress)

This demo has rough edges. The following are the most prominent issues I'm aware of:

### Dining Tab — Location and Slot Reliability
- The **Dine** tab often fails to pull restaurants for a specified location, requiring multiple attempts before results appear. This is the most unreliable part of the demo.
- Available booking slots are not always surfaced correctly. When a requested time slot is unavailable, the chat may still display a "booking confirmed" card, while the accompanying text message notes the actual issue. Use the see details bottom sheet to see the raw output and tool calls whenever the behaviour is confusing (applies to all the tabs).

### Cart Behavior — Multi-Item Ambiguity
- Adding multiple items to the cart in a single turn — especially when items are loosely described rather than exactly specified — can lead to unexpected cart state.
- The total amount for food orders and instamart item can be inaccurate depending on the offers available and the extra charges.

## Demo Video

<div style="padding:56.25% 0 0 0;position:relative;"><iframe src="https://player.vimeo.com/video/1165983820?badge=0&amp;autopause=0&amp;player_id=0&amp;app_id=58479&amp;autoplay=1&amp;muted=1&amp;loop=1" frameborder="0" allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share" referrerpolicy="strict-origin-when-cross-origin" style="position:absolute;top:0;left:0;width:100%;height:100%;" title="Swiggy MCP Demo"></iframe></div><script src="https://player.vimeo.com/api/player.js"></script>

<div style="padding:56.25% 0 0 0;position:relative;"><iframe src="https://player.vimeo.com/video/1165983957?badge=0&amp;autopause=0&amp;player_id=0&amp;app_id=58479&amp;autoplay=1&amp;muted=1&amp;loop=1" frameborder="0" allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share" referrerpolicy="strict-origin-when-cross-origin" style="position:absolute;top:0;left:0;width:100%;height:100%;" title="Swiggy MCP Demo - Food Ordering"></iframe></div><script src="https://player.vimeo.com/api/player.js"></script>

It does work, <img width="590" height="1278" alt="IMG_2861" src="https://github.com/user-attachments/assets/2316627f-3364-4e20-8894-efbd4974e0ba" />

---

## License
- This project is source-available under a custom non-commercial license (see `LICENSE`).
- You can use, modify, and share it for non-commercial purposes.
- Any commercial use is strictly not allowed without prior written permission.

## Thanks
Thanks to Hariom Palkar for making this MCP available: https://github.com/Swiggy/swiggy-mcp-server-manifest
