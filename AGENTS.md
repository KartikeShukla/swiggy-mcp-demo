# Repository Guidelines

## Project Structure & Module Organization
- `src/` contains the React + TypeScript app.
- `src/components/` is organized by feature (`auth`, `chat`, `cards`, `cart`, `layout`, `ui`, `home`).
- `src/hooks/` holds orchestration/state hooks (`useAuth`, `useChat`, `useCart`, etc.).
- `src/lib/` contains shared types, constants, storage helpers, parser pipeline, and Anthropic integration utilities.
- `src/verticals/` defines the 4 vertical configs (`food`, `style`, `dining`, `foodorder`) and prompt specs.
- `server/oauth/` contains Vite middleware for Swiggy OAuth (dev flow).
- `docs/` contains architecture notes, contracts, and vertical docs.
- Tests are colocated under `__tests__` folders near related modules.

## Build, Test, and Dev Commands
- `npm run dev`: start Vite on `localhost:5173`.
- `npm run build`: TypeScript project build (`tsc -b`) + Vite production bundle.
- `npm run preview`: serve the production build locally.
- `npm run lint`: run ESLint.
- `npm run test`: run Vitest once.
- `npm run test:watch`: run Vitest in watch mode.
- `npm run test:coverage`: run tests with coverage output.

## Coding Style & Naming Conventions
- TypeScript-first, functional React components only.
- Match existing style: 2-space indentation, semicolons, double quotes.
- Use PascalCase for components (`RestaurantCard.tsx`), camelCase for hooks/utilities (`useChatApi.ts`), and kebab-like domain names only where already established.
- Keep modules focused by concern (UI, parsing, auth, vertical config).
- Prefer explicit types at boundaries (`src/lib/types.ts`, parser return shapes).

## Testing Guidelines
- Framework: Vitest + Testing Library (`jsdom` environment).
- Keep tests near code in `__tests__/`.
- Test file naming: `<module>.test.ts` or `<feature>.test.tsx`.
- For behavior changes, add or update focused tests first, then run at least:
  - `npm run lint`
  - `npm run test`

## Commit & Pull Request Guidelines
- Follow Conventional Commit style seen in history:
  - `feat: ...`
  - `fix: ...`
  - `refactor: ...`
  - `style: ...`
- Keep commits scoped to one change set (UI polish, parser fix, OAuth robustness, etc.).
- PRs should include:
  - concise problem/solution summary,
  - impacted areas (paths/verticals),
  - test evidence (commands run),
  - screenshots/GIFs for UI changes.

## Security & Configuration Notes
- No `.env` is required for normal local use.
- API key and Swiggy token are intentionally browser-side and stored in `localStorage`; do not log secrets.
- OAuth middleware is for local dev flow; validate error handling paths when touching `server/oauth/*`.
