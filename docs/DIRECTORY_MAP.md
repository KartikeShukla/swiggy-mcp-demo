# Directory Map

Annotated directory tree for the Swiggy MCP Demo. Every file and folder is listed with a one-liner describing its purpose. For architecture context see [ARCHITECTURE.md](./ARCHITECTURE.md); for data shapes see [DATA_MODELS.md](./DATA_MODELS.md).

---

## Root Config Files

| File | Purpose |
|------|---------|
| `package.json` | Scripts, prod deps (14), dev deps (15); `"type": "module"` |
| `tsconfig.json` | Project-reference root (references `tsconfig.app.json`) |
| `tsconfig.app.json` | Strict TS 5.9 config — `erasableSyntaxOnly`, `verbatimModuleSyntax`, path alias `@/*` → `./src/*` |
| `vite.config.ts` | Vite 7 — React plugin, Tailwind CSS 4 plugin, OAuth dev middleware, `@` alias |
| `vitest.config.ts` | Merges Vite config + jsdom environment, globals enabled, setup file |
| `eslint.config.js` | Flat config (v9) — TS + React hooks + React refresh rules |
| `index.html` | Entry HTML — dark-mode script runs before React mounts |
| `CLAUDE.md` | AI agent instructions — architecture summary, commands, gotchas |

---

## `src/` — Application Source

### `src/lib/` — Shared Library

| File | Purpose |
|------|---------|
| `anthropic.ts` | SDK client factory — `createClient(apiKey)` with `dangerouslyAllowBrowser: true`, `maxRetries: 0` |
| `constants.ts` | All magic constants: model ID, MCP server URLs, storage keys, limits, timeouts |
| `types.ts` | All TypeScript interfaces: config, content blocks, chat messages, parsed types, actions |
| `schemas.ts` | Zod 4 (`zod/v4`) runtime validation schemas mirroring `types.ts` |
| `storage.ts` | localStorage wrapper — API key, Swiggy token, selected address, chat history per vertical |
| `logger.ts` | Level-filtered logger — debug in dev, warn+ in prod |
| `fetchAddresses.ts` | Onboarding address fetch — makes a dedicated MCP call to Instamart for saved addresses |
| `chat-actions.ts` | Chat action type guards and message extractors |
| `content-blocks.ts` | `DisplaySegment` type, `groupBlocks()` for tool group rendering, `findPrecedingToolName()` |
| `markdown.ts` | Lite markdown renderer — headings, bold, code, lists (no external library) |
| `utils.ts` | `cn()` — Tailwind class merge utility (clsx + tailwind-merge) |

### `src/lib/parsers/` — Tool Result Parsers (15 files)

| File | Purpose |
|------|---------|
| `index.ts` | Re-exports `parseToolResult` (orchestrator) and `parseVariantsFromText` |
| `orchestrator.ts` | Heuristic router — regex on tool name → specialized parser; signal key analysis; fallback chain |
| `unwrap.ts` | `unwrapContent()` — normalizes Anthropic's BetaMCPToolResultBlock; `extractPayload()` — recursively drills into wrapper keys; `flattenCategoryItems()` — flattens menu categories |
| `primitives.ts` | Low-level helpers: `asArray`, `asArrayOrWrap`, `str`, `num`, `numFromCurrency`, `scanForPrice` |
| `products.ts` | Product parser — field extraction from 20+ key patterns, paise-to-rupee conversion, variant expansion, grouping metadata |
| `restaurants.ts` | Restaurant parser — cuisine, rating, offers, locality extraction |
| `cart.ts` | Cart parser — 3-level nesting (`obj.cart.items`, `obj.data.items`, `obj.data.cart.items`), lineItems bill breakdown |
| `time-slots.ts` | Time slot parser — string or object slots |
| `addresses.ts` | Address parser — id, label, address, lat/lng |
| `confirmation.ts` | Confirmation parser — `order_placed` vs `booking_confirmed` based on tool name |
| `status.ts` | Status parser — success/message extraction, nested error unwrapping, overload normalization |
| `info.ts` | Info parser — catch-all key/value card from any non-empty object |
| `shape-detect.ts` | Shape-based detection fallback — examines object keys to infer type without tool name |
| `format.ts` | Formatting helpers for info cards — `humanizeKey`, `stringifyValue` |
| `variants-text.ts` | Parses product variants from assistant text responses |

### `src/hooks/` — React Hooks (5 files)

| File | Purpose |
|------|---------|
| `useAuth.ts` | Credentials + OAuth popup + token staleness detection + onboarding step machine |
| `useChat.ts` | Composes `useChatApi` + `useChatPersistence` + session summary + loading context labels |
| `useChatApi.ts` | Core API hook — creates client, builds params, runs stream, retry loop (max 2), error classification |
| `useChatPersistence.ts` | localStorage persistence per vertical — load/save with sanitization |
| `useCart.ts` | Derives cart state by scanning messages in reverse for cart-type tool results |

### `src/verticals/` — AI Vertical Configs

| File | Purpose |
|------|---------|
| `index.ts` | Registry — exports `verticals` record and `verticalList` array |
| `food.ts` | NutriCart config — nutrition coach, Instamart MCP |
| `style.ts` | StyleKit config — grooming advisor, Instamart MCP |
| `dining.ts` | TableScout config — dining concierge, Dineout MCP |
| `foodOrder.ts` | FeedMe config — food delivery, Food MCP |
| `shared-prompt.ts` | Shared prompt rules (search efficiency, card-first, tool error, location lock, COD) + `buildSystemPrompt()` |

### `src/verticals/prompt-spec/` — Prompt Specification System

| File | Purpose |
|------|---------|
| `types.ts` | `PromptProfile`, `PromptSlotRule`, `VerticalId` types |
| `profiles.ts` | 4 prompt profiles (food, style, dining, foodorder) — mission, scope, slots, phases, policies |
| `compiler.ts` | `compilePromptProfile()` — assembles profile into structured system prompt text; `findDuplicateInstructionLines()` |

### `src/integrations/anthropic/` — Anthropic API Integration (7 files)

| File | Purpose |
|------|---------|
| `request-builder.ts` | `buildMessageStreamParams()` — system blocks (prompt + address + datetime + session summary), MCP server config, beta flags, context management |
| `stream-runner.ts` | `runMessageStream()` — streaming with 90s timeout, contentBlock error monitoring, abort on limits |
| `message-sanitizer.ts` | `sanitizeAssistantBlocks()` / `sanitizeMessagesForApi()` — matches tool_use/result pairs by ID, drops orphans |
| `session-summary.ts` | `buildSessionStateSummary()` — compact state string from last 16 user messages (slots, intent, restaurant, location, datetime) |
| `error-classifier.ts` | `classifyApiError()` — HTTP status codes → user-friendly messages |
| `mcp-tool-errors.ts` | `classifyMcpError()` — categorizes MCP tool errors (auth/server/validation/address); `ABORT_MESSAGES` |
| `retry-policy.ts` | `isRetryableAnthropicError()` + `waitForRetryAttempt()` — exponential backoff (500ms base, 2x, 20% jitter, 5s cap) |

### `src/components/` — React Components

#### `src/components/ui/` — shadcn/ui Primitives (13 files)

`avatar.tsx`, `badge.tsx`, `button.tsx`, `card.tsx`, `collapsible.tsx`, `dialog.tsx`, `dropdown-menu.tsx`, `input.tsx`, `label.tsx`, `popover.tsx`, `scroll-area.tsx`, `separator.tsx`, `sheet.tsx`, `textarea.tsx`, `tooltip.tsx`

#### `src/components/chat/` — Chat Interface (9 files)

| File | Purpose |
|------|---------|
| `ChatView.tsx` | Main chat view — vertical routing, ChatViewInner (keyed on verticalId for remount), unified selection, optimistic cart |
| `MessageList.tsx` | Scrollable message list with auto-scroll and safe bottom padding |
| `AssistantMessageBubble.tsx` | Renders assistant messages — `groupBlocks()` → CollapsibleToolGroup → card rendering |
| `UserMessageBubble.tsx` | Renders user messages |
| `MessageBubble.tsx` | Shared bubble wrapper |
| `ChatInput.tsx` | Text input with textarea auto-resize |
| `CollapsibleToolGroup.tsx` | Expandable tool use/result group — shows tool trace + parsed card |
| `CollapsibleText.tsx` | Collapsible long text with threshold |
| `ToolTrace.tsx` | Debug view for tool name and input |
| `DetailSheet.tsx` | Bottom sheet for item details |
| `LoadingIndicator.tsx` | Animated loading with contextual labels |

#### `src/components/cards/` — Data Cards (12 files)

| File | Purpose |
|------|---------|
| `ProductCard.tsx` | Single product card with image, price, quantity controls |
| `ProductGrid.tsx` | Grid/rail layout for product cards with grouping |
| `RestaurantCard.tsx` | Restaurant card with cuisine, rating, offers |
| `CartSummaryCard.tsx` | Cart summary with items and totals |
| `TimeSlotPicker.tsx` | Time slot selection grid |
| `AddressPicker.tsx` | Address selection list |
| `ItemCardGrid.tsx` | Generic grid that routes ParsedToolResult → specific card component |
| `ToolSectionCard.tsx` | Wrapper for tool result sections |
| `InfoCard.tsx` | Key/value info card |
| `StatusCard.tsx` | Success/error status card |
| `BookingConfirmationSheet.tsx` | Booking confirmation bottom sheet |
| `BookingConfirmedCard.tsx` | Confirmed booking card |
| `OrderConfirmationCard.tsx` | Order confirmation card |

#### `src/components/cart/` — Cart UI (3 files)

| File | Purpose |
|------|---------|
| `CartFloatingButton.tsx` | Floating cart button with item count badge |
| `CartPanel.tsx` | Full cart panel in bottom sheet |
| `OrderConfirmation.tsx` | Order confirmation display |

#### `src/components/auth/` — Authentication (4 files)

| File | Purpose |
|------|---------|
| `ApiKeyModal.tsx` | API key input dialog |
| `SwiggyConnect.tsx` | Swiggy OAuth connect button |
| `OnboardingSheet.tsx` | Multi-step onboarding (API key → Swiggy connect → address select) |
| `SettingsMenu.tsx` | Settings dropdown menu |

#### `src/components/layout/` — Layout (5 files + 1 oddity)

| File | Purpose |
|------|---------|
| `Header.tsx` | App header with connection status and datetime |
| `PhoneFrame.tsx` | Phone mockup frame with safe area insets (`--safe-top`, `--safe-bottom`) |
| `VerticalNav.tsx` | Vertical tab navigation |
| `phone-frame-context.ts` | **Non-component:** React context for phone frame dimensions |
| `header-datetime.ts` | **Non-component:** Date/time formatting helper for the header |
| `header-location.ts` | **Non-component:** Location display helper for the header |

#### `src/components/home/` — Landing Page (2 files)

| File | Purpose |
|------|---------|
| `LandingPage.tsx` | Landing page with vertical cards |
| `VerticalCard.tsx` | Individual vertical preview card |

#### `src/components/ErrorBoundary.tsx`

React error boundary wrapper.

### `src/test/`

| File | Purpose |
|------|---------|
| `setup.ts` | Test setup — imports `@testing-library/jest-dom/vitest` |

---

## `server/` — Dev Server OAuth

| File | Purpose |
|------|---------|
| `oauth-plugin.ts` | Re-exports `oauthPlugin` from `server/oauth/plugin.ts` |

### `server/oauth/` — PKCE OAuth Implementation (7 files)

| File | Purpose |
|------|---------|
| `plugin.ts` | Vite dev middleware plugin — routes `/api/auth/start` and `/api/auth/callback` |
| `types.ts` | `PendingAuth` interface (codeVerifier, redirectUri, createdAt) |
| `discovery.ts` | OAuth discovery — tries 14+ well-known URL patterns across 3 resource paths |
| `pkce.ts` | PKCE code verifier/challenge generation |
| `cookies.ts` | Cookie helpers for state management during OAuth flow |
| `start-handler.ts` | `/api/auth/start` handler — discovers endpoints, generates PKCE, redirects to Swiggy |
| `callback-handler.ts` | `/api/auth/callback` handler — exchanges code for token, posts back via `postMessage` |

---

## `docs/` — Documentation

### Existing Docs (13 files)

| Path | Purpose |
|------|---------|
| `docs/adr/0001-refactor-boundaries.md` | ADR: refactor boundary decisions |
| `docs/architecture/system-map.md` | System map diagram |
| `docs/architecture/runtime-sequences.md` | Runtime sequence diagrams |
| `docs/architecture/ai-prompt-runtime.md` | AI prompt runtime documentation |
| `docs/architecture/target-modules.md` | Target module structure |
| `docs/contracts/parser-contract.md` | Parser contract specification |
| `docs/contracts/action-message-contract.md` | Action message contract |
| `docs/contracts/prompt-contract.md` | Prompt contract specification |
| `docs/modules/README.md` | Module documentation index |
| `docs/verticals/food.md` | NutriCart vertical documentation |
| `docs/verticals/style.md` | StyleKit vertical documentation |
| `docs/verticals/dining.md` | TableScout vertical documentation |
| `docs/verticals/foodorder.md` | FeedMe vertical documentation |

### New Root-Level Docs (this layer)

| File | Purpose |
|------|---------|
| `DIRECTORY_MAP.md` | This file — annotated directory tree |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System design with Mermaid diagrams |
| [MCP_TOOLS.md](./MCP_TOOLS.md) | MCP tool documentation |
| [VERTICALS.md](./VERTICALS.md) | Vertical deep dives |
| [DEPENDENCY_GRAPH.md](./DEPENDENCY_GRAPH.md) | Module and dependency graphs |
| [DATA_MODELS.md](./DATA_MODELS.md) | TypeScript interfaces and Zod schemas |
| [QUIRKS_AND_PATTERNS.md](./QUIRKS_AND_PATTERNS.md) | Tribal knowledge and gotchas |
| [SETUP_AND_RUN.md](./SETUP_AND_RUN.md) | Setup, commands, troubleshooting |
| [GLOSSARY.md](./GLOSSARY.md) | Terminology reference |

---

## Test Files (43 files, 7 areas)

| Area | Location | Count |
|------|----------|-------|
| Parser tests | `src/lib/parsers/__tests__/` | 13 |
| Lib tests | `src/lib/__tests__/` | 4 |
| Hook tests | `src/hooks/__tests__/` | 2 |
| Vertical tests | `src/verticals/__tests__/` | 4 |
| Integration tests | `src/integrations/anthropic/__tests__/` | 4 |
| Component tests | `src/components/*/__tests__/` | 15 |
| Server tests | `server/oauth/__tests__/` | 1 |
