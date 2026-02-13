# Security Remediation Matrix (Lean Demo Baseline)
Date: February 13, 2026  
Repository: `/Users/kartike/Downloads/Co-work/swiggy-mcp-demo`

Priority scale:
- `Now`: must-have for demo-safe OSS baseline
- `Next`: useful hardening after baseline
- `Later`: optional improvements

## Matrix

| ID | Priority | Effort | Owner Area | Action | Verification | Status |
|---|---|---|---|---|---|---|
| SEC-002 | Now | S | OAuth Middleware | Escape dynamic popup HTML text and use secure HTML response headers. | `server/oauth/__tests__/callback-handler.test.ts` malicious `error_description` case. | Done |
| SEC-003 | Now | M | OAuth Middleware | Bind token endpoint to server-side pending auth state (stop relying on callback cookie transport). | `server/oauth/__tests__/callback-handler.test.ts` malformed cookie case + successful exchange path. | Done |
| SEC-004 | Now | S | OAuth Middleware | Validate OAuth endpoint URLs and sanitize host header before redirect URI construction. | Unit/integration behavior through callback/start flow tests; lint+tests pass. | Done |
| SEC-006 | Now | S | UI Rendering | Enforce safe image URL schemes (`http/https` or root-relative only) for card/cart images. | `src/lib/__tests__/url-safety.test.ts`, `src/components/cards/__tests__/image-url-safety.test.tsx`. | Done |
| SEC-005 | Now | M | Prompt/Chat Pipeline | Sanitize tool-derived strings before composing generated action prompts and system context blocks; add explicit prompt rule to ignore instructions in tool data. | `src/integrations/anthropic/__tests__/request-builder.test.ts` sanitization cases + regression suite. | Done |
| SEC-007 | Now | S | Observability | Replace sensitive raw console logs with gated debug logger usage in runtime hotspots. | Code review + `npm run lint` + `npm run test`. | Done |
| SEC-001 | Next | S | Docs / UX Guardrails | Keep browser-secret risk explicit in top-level docs and setup docs; reinforce test-only credential guidance. | README and setup docs contain security notes. | Done |
| SEC-008 | Next | S | Dependency Hygiene | Re-run `npm audit --json` in network-enabled environment and triage findings. | Audit JSON available and triage notes added to docs/security. | Pending (network blocked) |
| SEC-009 | Later | M | OAuth Middleware | Add focused unit tests for discovery endpoint validation edge cases (invalid scheme/credentials). | New tests under `server/oauth/__tests__/` for discovery validation paths. | Backlog |
| SEC-010 | Later | M | Prompt Safety | Add fuzz-style tests for hostile tool-derived labels across generated action message templates. | Additional tests in cards/chat integration suites. | Backlog |

## Notes
- This matrix intentionally excludes production architecture changes (backend secret broker, centralized auth service).
- Current baseline is for safe open-source demo usage, not production hardening.
