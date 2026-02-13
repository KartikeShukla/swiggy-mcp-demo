# Setup And Run

## Prerequisites
- Node.js 18+
- npm
- Anthropic API key
- Swiggy account for OAuth token

## Local Setup
```bash
npm install
npm run dev
```
Open `http://localhost:5173`.

## Core Scripts
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

## Onboarding Sequence
1. Add Anthropic API key.
2. Connect Swiggy via OAuth popup.
3. Pick address (or use fallback path).

## Security Baseline (Demo)
- Credentials are stored in browser localStorage by design for demo simplicity.
- Use low-privilege/test credentials and avoid shared browser sessions.
- Keep OAuth flow dev-only; production hosting should use an external secure token path.
- Clear local data and revoke tokens after testing.

## Validation Workflow
Use this order for documentation + behavior changes:
1. `npm run docs:sync`
2. `npm run docs:verify`
3. `npm run lint`
4. `npm run test`

## Build Notes
- Output is static frontend bundle under `dist/`.
- OAuth middleware in `server/oauth` is dev-only; production must provide an equivalent token path externally.

## Troubleshooting
### Token expired
Reconnect Swiggy from settings; token staleness is time-based and can also be forced by auth errors.

### Rate limits
Retry after cooldown shown in UI.

### Timeout errors
Requests exceeding stream timeout return fallback content; retry with narrower prompts.

### Docs verification failure
Run `npm run docs:sync` and re-run verification.

## Related Docs
- [Architecture](./ARCHITECTURE.md)
- [Runtime Facts](./RUNTIME_FACTS.md)
- [Glossary](./GLOSSARY.md)
