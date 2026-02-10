# ADR-0001: Refactor Module Boundaries For Behavior-Safe Evolution

## Status

Accepted

## Context

The codebase grew around large mixed-responsibility files (chat API orchestration, OAuth middleware, message rendering, card routing). This made behavior-preserving changes slower and increased regression risk.

## Decision

Split by responsibility while preserving public behavior:

1. Anthropic integration logic moved into dedicated modules.
2. OAuth middleware split into handler/util/plugin modules.
3. Chat and card rendering broken into smaller composable components.
4. Vertical base prompts moved to versioned prompt files.

## Consequences

Positive:

1. Easier onboarding and targeted debugging.
2. Better testability by seam.
3. Lower risk of accidental cross-feature regressions.

Neutral:

1. More files and explicit imports.

Negative:

1. Initial migration effort and temporary dual-path complexity during refactor.
