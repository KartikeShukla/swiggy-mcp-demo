# Documentation Index

This documentation set is organized for both AI agents and engineers. It prioritizes code-truth behavior and explicit module relationships.

## Read Paths

### Path 1: AI Agent Fast Path
1. `docs/RUNTIME_FACTS.md`
2. `docs/ARCHITECTURE.md`
3. `docs/contracts/prompt-contract.md`
4. `docs/contracts/parser-contract.md`
5. `docs/COVERAGE_MATRIX.md`

### Path 2: New Engineer Onboarding
1. `docs/SETUP_AND_RUN.md`
2. `docs/ARCHITECTURE.md`
3. `docs/DIRECTORY_MAP.md`
4. `docs/DEPENDENCY_GRAPH.md`
5. `docs/VERTICALS.md`

### Path 3: Prompt And MCP Deep Dive
1. `docs/architecture/ai-prompt-runtime.md`
2. `docs/MCP_TOOLS.md`
3. `docs/DATA_MODELS.md`
4. `docs/QUIRKS_AND_PATTERNS.md`

## Primary Reference Docs
- `docs/RUNTIME_FACTS.md`: canonical runtime constants and guardrail-sensitive facts.
- `docs/ARCHITECTURE.md`: full end-to-end narrative and sequence.
- `docs/COVERAGE_MATRIX.md`: proof that all major code areas are documented.

## Contracts
- `docs/contracts/prompt-contract.md`
- `docs/contracts/parser-contract.md`
- `docs/contracts/action-message-contract.md`

## Changelog For This Overhaul
- Replaced stale constants/counts with code-truth values.
- Added synced runtime facts mechanism for `AGENTS.md` and `CLAUDE.md`.
- Added verification automation (`docs:sync`, `docs:verify`).
- Added module coverage matrix and clarified legacy prompt-file status.
