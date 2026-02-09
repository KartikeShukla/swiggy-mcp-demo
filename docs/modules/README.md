# Module Navigation Guide

## Start Here

1. App shell and routing: `src/App.tsx`
2. Auth/bootstrap: `src/hooks/useAuth.ts`, `src/components/auth/`
3. Chat orchestration: `src/hooks/useChat.ts`, `src/hooks/useChatApi.ts`
4. Anthropic integration: `src/integrations/anthropic/`
5. Tool-result parsing: `src/lib/parsers/`
6. Card rendering: `src/components/cards/`
7. OAuth middleware: `server/oauth/`
8. Vertical configuration/prompts: `src/verticals/`

## Read Order For New Engineers

1. `docs/architecture/system-map.md`
2. `docs/architecture/runtime-sequences.md`
3. `docs/contracts/*.md`
4. Relevant vertical doc in `docs/verticals/`
