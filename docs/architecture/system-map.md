# System Map

## Runtime Topology
- Browser SPA orchestrates chat and rendering.
- Anthropic API handles model inference and MCP tool execution.
- Swiggy MCP endpoints provide commerce tools.
- Vite OAuth middleware supports local token acquisition in dev.

## State Boundaries
1. localStorage: credentials, selected address, per-vertical histories.
2. React state: loading/error/UI visibility and temporary selections.
3. Stream state: managed inside `runMessageStream` during each request.

## Core Flows
1. Auth onboarding flow.
2. Chat + MCP request/stream flow.
3. Card action feedback loop into chat.
