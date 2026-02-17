# Security Audit Report (Lean Demo Baseline)
Date: February 13, 2026  
Repository: `swiggy-mcp-demo`

## Executive Summary
This audit targeted **basic demo-safe hardening** for an open-source, browser-first MCP demo.  
No critical remote-code-execution class issue was found in the current codebase.  

The major practical risks were:
1. Browser-side credential storage (by design).
2. OAuth popup HTML interpolation and endpoint integrity controls.
3. Tool-output-derived text reuse in generated action prompts.
4. Unvalidated external image URL schemes.

Core baseline fixes were implemented in this audit. The app is now materially safer for open-source demo usage, with one explicit residual risk accepted by design: browser-stored credentials.

## Scope
Reviewed and validated:
- Secret handling and token lifecycle:
  - `src/lib/storage.ts`
  - `src/hooks/useAuth.ts`
  - `src/lib/anthropic.ts`
- OAuth flow and middleware:
  - `server/oauth/start-handler.ts`
  - `server/oauth/callback-handler.ts`
  - `server/oauth/discovery.ts`
  - `server/oauth/plugin.ts`
- XSS/rendering and tool-output surfaces:
  - `src/lib/markdown.ts`
  - `src/components/chat/*`
  - `src/components/cards/*`
  - `src/components/cart/CartPanel.tsx`
- Prompt/tool-output safety:
  - `src/integrations/anthropic/request-builder.ts`
  - `src/components/chat/ChatView.tsx`
  - `src/verticals/shared-prompt.ts`
- Logging and dependency hygiene:
  - `src/integrations/anthropic/stream-runner.ts`
  - `src/lib/parsers/orchestrator.ts`
  - `src/hooks/useCart.ts`
  - `package.json`

Out of scope (intentionally):
- Backend redesign/token-broker architecture
- Enterprise controls/compliance mappings

## Validation Evidence
- `npm run lint`: passed.
- `npm run test`: passed (`48` files, `557` tests).
- `npm audit --json`: **not available in this environment** (DNS/network failure to `registry.npmjs.org`).

## Findings By Severity

### High
#### SEC-001: Browser-stored API/session credentials (Accepted Demo Risk)
- Affected:
  - `src/lib/anthropic.ts`
  - `src/lib/storage.ts`
  - `src/hooks/useAuth.ts`
- Risk:
  - Any XSS or compromised browser profile can expose API key and Swiggy token.
- Status:
  - **Open by design** (demo architecture).
- Practical mitigation applied:
  - Added explicit demo-security guidance in:
    - `README.md`
    - `docs/SETUP_AND_RUN.md`
    - `.env.example`

### Medium
#### SEC-002: OAuth popup HTML interpolation could reflect unsafe strings
- Affected:
  - `server/oauth/start-handler.ts`
  - `server/oauth/callback-handler.ts`
- Risk:
  - Reflected HTML/script injection in popup error pages from unescaped provider/network error text.
- Fix implemented:
  - Added HTML escaping and secure HTML response writer:
    - `server/oauth/security.ts`
  - OAuth handlers now use escaped output + security headers.
- Status: **Fixed**

#### SEC-003: OAuth token endpoint integrity relied on client cookie transport
- Affected:
  - `server/oauth/start-handler.ts`
  - `server/oauth/callback-handler.ts`
  - `server/oauth/types.ts`
- Risk:
  - Callback endpoint target could be influenced by cookie path/state handling.
- Fix implemented:
  - Token endpoint moved to server-side `pendingAuth` state.
  - Callback now reads endpoint from validated server-side state.
- Status: **Fixed**

#### SEC-004: OAuth endpoint protocol/URL validation was weak
- Affected:
  - `server/oauth/discovery.ts`
  - `server/oauth/callback-handler.ts`
  - `server/oauth/start-handler.ts`
- Risk:
  - Unsafe endpoint schemes/credentials could be accepted in overrides/discovery.
- Fix implemented:
  - Added strict endpoint validation (`https`, or loopback `http` for local debug only).
  - Added host-header sanitization for redirect URI construction.
- Status: **Fixed**

#### SEC-005: Tool-derived strings could be reinjected into action prompts
- Affected:
  - `src/components/chat/ChatView.tsx`
  - `src/components/cards/ProductGrid.tsx`
  - `src/components/cards/RestaurantCard.tsx`
  - `src/components/cards/AddressPicker.tsx`
  - `src/components/cards/TimeSlotPicker.tsx`
  - `src/components/cart/CartPanel.tsx`
  - `src/integrations/anthropic/request-builder.ts`
  - `src/verticals/shared-prompt.ts`
- Risk:
  - Prompt/tool-output injection via malicious names/labels propagated into generated instructions.
- Fix implemented:
  - Added prompt-text neutralization utilities:
    - `src/lib/prompt-safety.ts`
  - Sanitized tool-derived strings before prompt/action composition.
  - Added explicit shared prompt instruction to treat tool data as data only.
- Status: **Fixed (baseline)**

#### SEC-006: Untrusted image URL schemes were not filtered
- Affected:
  - `src/components/cards/ProductCard.tsx`
  - `src/components/cards/RestaurantCard.tsx`
  - `src/components/cart/CartPanel.tsx`
- Risk:
  - Non-http image schemes (e.g., `javascript:`, `data:`) were not blocked.
- Fix implemented:
  - Added URL safety utility:
    - `src/lib/url-safety.ts`
  - Enforced safe image source filtering in card/cart rendering.
- Status: **Fixed**

### Low
#### SEC-007: Runtime debug logs were verbose in sensitive paths
- Affected:
  - `src/integrations/anthropic/stream-runner.ts`
  - `src/hooks/useCart.ts`
  - `src/lib/parsers/orchestrator.ts`
  - `src/hooks/useChat.ts`
  - `src/hooks/useChatApi.ts`
  - `src/components/chat/CollapsibleToolGroup.tsx`
- Risk:
  - Excessive operational/debug data leakage in logs.
- Fix implemented:
  - Switched from raw console logging to `logger.debug` in sensitive hot paths.
- Status: **Fixed (baseline)**

#### SEC-008: Dependency vulnerability report unavailable offline
- Affected:
  - `package.json` / lockfile audit process
- Risk:
  - CVE visibility gap when network checks cannot run.
- Status:
  - **Open (environmental/pending)**
- Action:
  - Re-run `npm audit --json` in a network-enabled environment.

## Test Cases Requested In Plan (Status)
1. OAuth callback handles malicious `error_description` safely: **Implemented + passing test**
   - `server/oauth/__tests__/callback-handler.test.ts`
2. Malformed token-endpoint cookie cannot crash callback flow: **Implemented + passing test**
   - `server/oauth/__tests__/callback-handler.test.ts`
3. No executable content injection via message markdown rendering: **Implemented + passing test**
   - `src/lib/__tests__/markdown.test.ts`
4. Unsafe external image URLs handled safely: **Implemented + passing tests**
   - `src/lib/__tests__/url-safety.test.ts`
   - `src/components/cards/__tests__/image-url-safety.test.tsx`
5. Lint/tests green: **Passed**

## Public API / Interface Impact
No public API contract changes.  
All modifications are internal hardening and documentation updates.

## Open-Source Demo Readiness Verdict
**Pass (Demo-Safe Baseline)**, with explicit caveat:
- Browser credential storage remains a known, documented tradeoff and should not be treated as production-safe architecture.

