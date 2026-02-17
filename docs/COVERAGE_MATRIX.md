# Coverage Matrix

This matrix maps each major code area to the docs that explain architecture, behavior, and relationships.

| Code Area | Primary Source Paths | Documented In |
|---|---|---|
| App shell and routing | `src/App.tsx`, `src/main.tsx` | `ARCHITECTURE.md`, `DIRECTORY_MAP.md`, `DEPENDENCY_GRAPH.md` |
| Components | `src/components/**` | `DIRECTORY_MAP.md`, `DEPENDENCY_GRAPH.md`, `contracts/action-message-contract.md`, `VERTICALS.md` |
| Hooks | `src/hooks/**` | `ARCHITECTURE.md`, `DIRECTORY_MAP.md`, `DEPENDENCY_GRAPH.md`, `DATA_MODELS.md` |
| Anthropic integration | `src/integrations/anthropic/**` | `ARCHITECTURE.md`, `MCP_TOOLS.md`, `architecture/ai-prompt-runtime.md`, `QUIRKS_AND_PATTERNS.md` |
| Shared library | `src/lib/**` | `DIRECTORY_MAP.md`, `DATA_MODELS.md`, `QUIRKS_AND_PATTERNS.md`, `GLOSSARY.md` |
| Relevance system | `src/lib/relevance/**` | `ARCHITECTURE.md`, `DEPENDENCY_GRAPH.md`, `DIRECTORY_MAP.md` |
| Parser system | `src/lib/parsers/**` | `MCP_TOOLS.md`, `DATA_MODELS.md`, `DEPENDENCY_GRAPH.md`, `contracts/parser-contract.md` |
| Vertical config + prompt spec | `src/verticals/**` | `VERTICALS.md`, `architecture/ai-prompt-runtime.md`, `contracts/prompt-contract.md`, `docs/verticals/*.md` |
| Dev OAuth middleware | `server/oauth/**`, `server/oauth-plugin.ts` | `ARCHITECTURE.md`, `SETUP_AND_RUN.md`, `DIRECTORY_MAP.md`, `architecture/runtime-sequences.md` |
| Project setup and execution | `package.json`, `vite.config.ts`, `tsconfig*.json`, `eslint.config.js`, `vitest.config.ts` | `SETUP_AND_RUN.md`, `DIRECTORY_MAP.md` |
| Terminology and domain language | Whole repo | `GLOSSARY.md` |

## Coverage Notes
- Legacy prompt markdown files in `src/verticals/prompts/*.md` are currently not wired into runtime prompt assembly.
- Runtime prompt assembly is code-driven through `src/verticals/prompt-spec/*` and `src/verticals/shared-prompt.ts`.

## Verification Expectations
1. Every row above must reference at least one current doc.
2. Links should remain valid under `npm run docs:verify`.
3. Runtime constants in docs should match `docs/RUNTIME_FACTS.md` and source code.
