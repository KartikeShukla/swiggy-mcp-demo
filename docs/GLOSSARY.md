# Glossary

## Action Message
Deterministic text or structured `ChatAction` emitted by UI cards and controls, then re-sent through chat pipeline.

## Content Block
Assistant block unit: text, MCP tool-use, or MCP tool-result.

## Context Management
Anthropic feature used in request payload to trim tool history when token budget crosses threshold.

## Coverage Matrix
Documentation map showing which docs cover each major code area.

## MCP Toolset
Anthropic tool declaration that enables runtime MCP tool discovery for a given MCP server name.

## ParsedToolResult
Discriminated union returned by parser orchestrator and rendered by card routing components.

## Prompt Profile
Structured vertical prompt definition in prompt-spec (`mission`, scope, slot rules, policies, fallbacks).

## Runtime Facts
Canonical, sync-driven markdown source of drift-prone runtime values and behavior claims.

## Session Summary
Compact system context block derived from recent user signals and optional selected address.

## Vertical
A product persona + prompt strategy bound to one MCP server configuration.

## Related Docs
- [Runtime Facts](./RUNTIME_FACTS.md)
- [Architecture](./ARCHITECTURE.md)
