# Module Navigation Guide

## Start Here

1. App shell and routing: `src/App.tsx`
2. Auth/bootstrap: `src/hooks/useAuth.ts`, `src/components/auth/`
3. Chat orchestration: `src/hooks/useChat.ts`, `src/hooks/useChatApi.ts`
4. Anthropic integration: `src/integrations/anthropic/`
5. Prompt compiler and profiles: `src/verticals/prompt-spec/`, `src/verticals/shared-prompt.ts`
6. Tool-result parsing: `src/lib/parsers/`
7. Card rendering: `src/components/cards/`
8. OAuth middleware: `server/oauth/`
9. Vertical configuration/prompts: `src/verticals/`

## Read Order For New Engineers

1. `docs/architecture/system-map.md`
2. `docs/architecture/runtime-sequences.md`
3. `docs/architecture/ai-prompt-runtime.md`
4. `docs/contracts/*.md`
5. Relevant vertical doc in `docs/verticals/`
