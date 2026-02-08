# MCP Vertical Demo

**Same MCP tools + different system prompts = different AI-powered verticals.**

This demo shows how one set of MCP tools can power completely different product experiences through prompt engineering alone. Connect your Anthropic API key and Swiggy account to get three working AI verticals — all locally, no deployment needed.

## Three Verticals

| Vertical | What it does | MCP Server |
|----------|-------------|------------|
| **NutriCart** | AI nutrition assistant — meal plans, recipes with macros, order ingredients | Swiggy Instamart |
| **StyleBox** | Personal grooming advisor — skincare/haircare routines, order products | Swiggy Instamart |
| **TableScout** | AI dining concierge — restaurant discovery, table bookings | Swiggy Dineout |

NutriCart and StyleBox use the **same** Instamart MCP server with different system prompts. The AI behavior is entirely driven by the prompt, not the tools.

## Architecture

```
Browser (React SPA)
  |
  +-- Anthropic Messages API (via @anthropic-ai/sdk, browser mode)
  |     +-- MCP Connector: Anthropic connects to Swiggy MCP servers
  |           +-- mcp.swiggy.com/im (Instamart)
  |           +-- mcp.swiggy.com/dineout (Dineout)
  |
  +-- Vite Dev Server (localhost:5173)
        +-- OAuth callback handler (~50 lines)
```

**No backend needed for chat.** The Anthropic SDK supports browser usage. MCP Connector works because Anthropic's servers — not the browser — connect to Swiggy's MCP servers.

## Quick Start

```bash
git clone <repo-url>
cd swiggy-mcp-demo
npm install
npm run dev
```

1. Open `http://localhost:5173`
2. Enter your [Anthropic API key](https://console.anthropic.com/settings/keys)
3. Pick a vertical and start chatting
4. Connect your Swiggy account to enable ordering tools (OAuth or manual token paste)

## Connecting Swiggy

Two options:

**OAuth (automatic):** Click "Connect Swiggy" — a popup handles the OAuth flow and captures the token.

**Manual token paste:** If OAuth doesn't work, extract an access token from another MCP client (Cursor, Claude Desktop) and paste it using the "Paste token" option.

## Tech Stack

- **React 19** + **TypeScript** + **Vite 7**
- **Tailwind CSS 4** (CSS-first config)
- **@anthropic-ai/sdk** with MCP Connector (beta)
- **Lucide React** for icons
- No backend framework — Vite plugin handles OAuth

## Credentials

All credentials are stored in `localStorage` on your machine:
- `mcp-demo:api-key` — your Anthropic API key
- `mcp-demo:swiggy-token` — your Swiggy OAuth token

No environment variables needed. Everything is entered via the UI.

## How MCP Connector Works

Each chat message triggers a single API call to Anthropic with:
- `mcp_servers`: the Swiggy MCP server URL + auth token
- `tools`: `[{ type: "mcp_toolset" }]` — tells Claude to discover tools from the server

Anthropic's servers connect to Swiggy, discover available tools, let Claude decide which to call, execute the calls, and return the results — all in one round trip.

## Project Structure

```
src/
  lib/           # Constants, types, storage, Anthropic client
  hooks/         # useChat (API + MCP), useAuth (credentials)
  verticals/     # NutriCart, StyleBox, TableScout configs
  components/
    chat/        # ChatView, MessageBubble, ToolTrace, ChatInput
    auth/        # ApiKeyModal, SwiggyConnect, SettingsMenu
    layout/      # Header, VerticalNav
    home/        # LandingPage, VerticalCard
server/
  oauth-plugin.ts  # Vite dev server plugin for Swiggy OAuth
```

## License

MIT
