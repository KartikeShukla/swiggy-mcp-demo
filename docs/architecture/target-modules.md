# Target Modules

## Integration Layer
`src/integrations/anthropic`
- Owns Anthropic request shape, stream execution, retry, and tool error handling.

## Domain Parsing Layer
`src/lib/parsers`
- Owns conversion of tool payloads to UI-friendly result unions.

## Feature UI Layer
`src/components`
- Owns conversation rendering, card presentation, and interaction emission.

## Orchestration Layer
`src/hooks`
- Owns auth/chat state progression and persistence boundaries.

## Dev Middleware Layer
`server/oauth`
- Owns OAuth start/callback and discovery/PKCE helpers for dev workflows.
