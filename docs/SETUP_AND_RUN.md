# Setup and Run

Prerequisites, installation, commands, testing, and troubleshooting for the Swiggy MCP Demo.

See also: [ARCHITECTURE.md](./ARCHITECTURE.md), [GLOSSARY.md](./GLOSSARY.md)

---

## Prerequisites

| Requirement | Version | Notes |
|-------------|---------|-------|
| Node.js | 18+ | Required for Vite 7 and modern ESM |
| npm | 9+ | Comes with Node.js |
| Anthropic API key | — | Obtain from [console.anthropic.com](https://console.anthropic.com) |
| Swiggy account | — | Required for MCP tool access via OAuth |

---

## Quick Start

```bash
# Clone the repository
git clone <repo-url>
cd swiggy-mcp-demo

# Install dependencies
npm install

# Start dev server
npm run dev

# Open in browser
open http://localhost:5173
```

---

## Environment Variables

**No `.env` file is needed.** All credentials are entered via the in-app UI and stored in localStorage.

Optional environment variables for OAuth debugging (only relevant when running the dev server):

| Variable | Purpose |
|----------|---------|
| `SWIGGY_OAUTH_AUTHORIZATION_ENDPOINT` | Override OAuth authorization endpoint |
| `SWIGGY_OAUTH_TOKEN_ENDPOINT` | Override OAuth token endpoint |
| `SWIGGY_OAUTH_CLIENT_ID` | Override OAuth client ID |
| `SWIGGY_OAUTH_SCOPES` | Override OAuth scopes (comma or space separated) |
| `SWIGGY_OAUTH_DISCOVERY_URL` | Override OAuth discovery URL (skips cascade) |

---

## Onboarding Flow

On first visit, the app walks through a three-step onboarding:

1. **API Key** — Enter your Anthropic API key. Stored in localStorage (`mcp-demo:api-key`).
2. **Swiggy Connect** — OAuth popup authenticates with Swiggy. Token stored in localStorage (`mcp-demo:swiggy-token`). The OAuth flow runs through the Vite dev middleware (`/api/auth/start` → Swiggy → `/api/auth/callback` → `postMessage`).
3. **Address Select** — Fetches saved Swiggy delivery addresses via a dedicated MCP call and lets you pick one. Stored in localStorage (`mcp-demo:selected-address`).

After completing onboarding, you can navigate to any vertical and start chatting.

---

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server at `localhost:5173` with HMR, Tailwind CSS, and OAuth middleware |
| `npm run build` | TypeScript type-check (`tsc -b`) + Vite production build |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint with flat config (TS + React rules) |
| `npm run test` | Run all tests once with Vitest |
| `npm run test:watch` | Run Vitest in watch mode |
| `npm run test:coverage` | Run tests with coverage report |

---

## Testing

### Stack

- **Vitest 4** — Vite-native test runner
- **React Testing Library** — Component testing
- **jsdom** — Browser environment simulation
- **Globals enabled** — `describe`, `it`, `expect` available without imports

### Configuration

- Config: `vitest.config.ts` (merges `vite.config.ts`)
- Setup: `src/test/setup.ts` (imports `@testing-library/jest-dom/vitest`)
- Environment: `jsdom`

### Test File Locations (43 files, 7 areas)

| Area | Location | Count | Description |
|------|----------|-------|-------------|
| Parser tests | `src/lib/parsers/__tests__/` | 13 | All 13 parsers + orchestrator + unwrap |
| Lib tests | `src/lib/__tests__/` | 4 | markdown, content-blocks, storage, chat-actions |
| Hook tests | `src/hooks/__tests__/` | 2 | useCart, useChatApi |
| Vertical tests | `src/verticals/__tests__/` | 4 | prompts, compiler, budget, scenario-matrix |
| Integration tests | `src/integrations/anthropic/__tests__/` | 4 | message-sanitizer, request-builder, session-summary, stream-runner |
| Component tests | `src/components/*/__tests__/` | 15 | Cards, cart, chat, layout, auth, ui |
| Server tests | `server/oauth/__tests__/` | 1 | start-handler |

### Running Subsets

```bash
# Run a specific test file
npx vitest run src/lib/parsers/__tests__/products.test.ts

# Run tests matching a pattern
npx vitest run --reporter=verbose cart

# Run tests in a directory
npx vitest run src/hooks/

# Watch a specific file
npx vitest src/lib/parsers/__tests__/orchestrator.test.ts
```

---

## Build and Deploy

The app builds to a **static SPA** — no server required in production.

```bash
npm run build
# Output: dist/
```

The build includes:
- TypeScript type checking (`tsc -b`)
- Vite production bundling with React, Tailwind CSS 4

**Important:** The OAuth middleware is **dev-only** (`server/oauth/plugin.ts` is a Vite plugin). In production, users must obtain Swiggy tokens through other means, or the OAuth flow must be hosted separately.

### Deploy Targets

Any static hosting works: Vercel, Netlify, Cloudflare Pages, S3 + CloudFront, etc.

Routes are client-side (`/`, `/:verticalId`), so configure your hosting for SPA fallback (serve `index.html` for all routes).

---

## Troubleshooting

### Token Expired

**Symptom:** "Your Swiggy session has expired" error after ~1 hour.

**Fix:** Click the settings icon → **Connect Swiggy** to re-authenticate. Swiggy tokens have a 1-hour TTL (`TOKEN_STALENESS_MS = 3_600_000`). The app shows a stale-token warning in the header.

### OAuth Discovery Fails

**Symptom:** OAuth popup shows an error about discovery endpoints.

**Fix:**
1. Check that `mcp.swiggy.com` is reachable
2. Try setting `SWIGGY_OAUTH_DISCOVERY_URL` to a specific URL
3. As a last resort, set both `SWIGGY_OAUTH_AUTHORIZATION_ENDPOINT` and `SWIGGY_OAUTH_TOKEN_ENDPOINT` directly

The discovery cascade tries 14+ well-known URL patterns. If none work, the MCP server may have changed its OAuth configuration.

### Rate Limits (429)

**Symptom:** "Rate limit exceeded" errors.

**Fix:** Wait a moment and retry. The app has a retry policy that automatically retries 429 errors with exponential backoff (500ms → 1s → 2s). If you hit persistent rate limits, you may need to upgrade your Anthropic API plan.

### Empty Tool Results

**Symptom:** Tool calls succeed but show "raw" content instead of cards.

**Possible causes:**
1. The MCP server returned data in an unexpected format — check the tool trace (click the collapsed tool group) to see raw data
2. The parser didn't match — the tool name may not match expected regex patterns
3. The payload structure changed — check if Swiggy updated their MCP response format

### Stream Timeout

**Symptom:** "This request took longer than expected and timed out" after 90 seconds.

**Fix:** Try a shorter or more specific request. The 90-second timeout (`STREAM_REQUEST_TIMEOUT_MS`) catches stuck streams. Complex multi-tool queries (e.g., searching + carting + confirming in one turn) may exceed this.

### API Key Invalid

**Symptom:** "Invalid API key" error on first message.

**Fix:** Click settings → **Change API Key** and enter a valid Anthropic API key. Ensure the key starts with `sk-ant-`.

### Chat History Issues

**Symptom:** Stale or corrupted messages appearing after app update.

**Fix:** Click settings → **Clear Chats**. This clears all chat history from localStorage. The app also sanitizes stored history on startup (removing orphaned tool_use/result blocks).

---

## Cross-References

- [ARCHITECTURE.md](./ARCHITECTURE.md) — System design and request lifecycle
- [GLOSSARY.md](./GLOSSARY.md) — Terminology reference
