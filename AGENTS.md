# AGENTS.md

Repository guidance for coding agents working in `finance-web-app`.

This repo has two separate Node/TypeScript apps:
- `backend/`: Express API, Prisma, PostgreSQL, Zod, Winston logging.
- `frontend/`: TanStack Start + React 19 + Vite + Tailwind CSS v4 + Vitest.

## Rule Files Checked

These rule locations were checked and are currently absent:
- `.cursor/rules/`
- `.cursorrules`
- `.github/copilot-instructions.md`

If any of them are added later, treat them as additional instructions and merge them with this file.

## Repository Shape

- There is no root `package.json`; run npm commands against `backend/` or `frontend/`.
- Backend code is mostly in `backend/src/`, with shared middleware in `backend/src/middlewares/` and logging helpers in `backend/src/libs/`.
- Backend architecture notes in `docs/BACKEND_PATTERNS.md` prefer feature folders like `src/features/<feature>/` with files such as `.controller.ts`, `.service.ts`, `.schema.ts`, `.middleware.ts`, and `.routes.ts`.
- Frontend routes live in `frontend/src/routes/`; shared UI lives in `frontend/src/components/`.
- Frontend path aliases `#/*` and `@/*` both map to `frontend/src/*`, though current code mostly uses relative imports.

## Install And Setup

- Install backend deps: `npm --prefix backend install`
- Install frontend deps: `npm --prefix frontend install`
- Backend env is expected at `backend/.env`; Prisma config is in `backend/prisma.config.ts` and reads `DATABASE_URL`.

## Build / Dev / Test Commands

### Frontend

- Dev server: `npm --prefix frontend run dev`
- Production build: `npm --prefix frontend run build`
- Preview build: `npm --prefix frontend run preview`
- Format code: `npm --prefix frontend run format`
- Run all tests: `npm --prefix frontend run test`
- Run a single test file: `npm --prefix frontend run test -- src/path/to/file.test.tsx`
- Run a single named test: `npm --prefix frontend run test -- -t "test name"`
- Run one file and one named test: `npm --prefix frontend run test -- src/path/to/file.test.tsx -t "test name"`
- Type-check only: `npm --prefix frontend exec tsc -- --noEmit`

### Backend

- Dev server: `npm --prefix backend run dev`
- Production build: `npm --prefix backend run build`
- Start compiled server: `npm --prefix backend run start`
- Format code: `npm --prefix backend run format`
- Test script currently fails intentionally: `npm --prefix backend run test`
- Type-check only: `npm --prefix backend exec tsc -- --noEmit`

### Prisma / Database

- Generate Prisma client: `npm --prefix backend exec prisma generate`
- Create/apply a local migration: `npm --prefix backend exec prisma migrate dev`
- Open Prisma Studio: `npm --prefix backend exec prisma studio`

## Linting Status

- No ESLint config was found at the repo root, `backend/`, or `frontend/`.
- Prettier config is in `backend/.prettierrc` and `frontend/.prettierrc`.
- Format scripts are available: `npm --prefix backend run format` and `npm --prefix frontend run format`.
- Do not invent a lint command in automation output; say explicitly that linting is not configured.

## Testing Status

- Frontend uses Vitest via `frontend/package.json`.
- No frontend test files are present yet, but new tests should follow Vitest conventions.
- Backend has no real test framework configured yet.
- If backend tests are added, prefer introducing a real runner rather than shell-script placeholders.

## General Code Style

- Use Prettier to format code; both apps have `format` scripts.
- Prefer TypeScript everywhere; both apps use `strict: true`.
- Keep functions small and composable; avoid broad refactors unless required.
- Prefer `const` over `let`, explicit returns when helpful, and avoid `any` unless tightly contained.
- Do not add comments for obvious code; add short comments only for non-obvious behavior.

## Formatting Conventions

### Frontend

- Match current frontend style: 2-space indentation, single quotes, no semicolons, trailing commas in multiline arrays/objects/props.
- Keep JSX props one per line when lines get long.
- Favor readable Tailwind utility groupings over overly compressed class strings.

### Backend

- Backend now uses Prettier: 2-space indentation, single quotes, semicolons enabled.
- Run `npm --prefix backend run format` to ensure consistent formatting.


## Imports

- Group imports as external first, then internal.
- Preserve blank lines between groups when the file already uses them.
- Prefer `import type` for type-only imports.
- Use frontend aliases `#/*` or `@/*` for deep cross-folder imports; keep relative imports for nearby files if that matches local style.
- Avoid unused imports; frontend TypeScript enforces `noUnusedLocals` and `noUnusedParameters`.

## Naming Conventions

- Use PascalCase for React components and component filenames, e.g. `Header.tsx`, `ThemeToggle.tsx`.
- Use camelCase for variables, functions, and helpers.
- Use UPPER_SNAKE_CASE for top-level configuration constants like `PORT`, `NODE_ENV`, and `GENERIC_ERROR`.
- Use kebab-case for backend filenames, especially middleware and future feature modules.
- Follow the suffix conventions in `docs/BACKEND_PATTERNS.md` for new backend feature files.

## Types

- Prefer explicit domain types and narrow signatures over loose object shapes.
- Reuse framework types from Express, React, and Vitest instead of redefining them.
- In backend handlers and middleware, strongly type `Request`, `Response`, and `NextFunction` where practical.
- In frontend components, type small props inline and extract named types when reused.
- Preserve narrow literal unions such as `'light' | 'dark' | 'auto'` when the domain is finite.

## Error Handling

- Backend error handling is centralized in `backend/src/middlewares/error-handler.middleware.ts`.
- Prefer raising or forwarding structured HTTP errors instead of returning ad hoc error shapes throughout the app.
- Existing backend code uses `http-errors`; follow that pattern for handled failures.
- Validation failures are handled directly in `backend/src/middlewares/schema-validation.middleware.ts` with a `400` JSON response; preserve that contract unless intentionally redesigning it.
- Frontend should fail gracefully in UI logic and avoid throwing during render for expected states.

## Logging And Sensitive Data

- Use `getLogger(label)` from `backend/src/libs/logger.ts` instead of ad hoc backend logging.
- Use descriptive logger labels tied to the module or feature.
- Never log raw credentials, tokens, PINs, SSNs, or full authorization headers.
- Keep request context in logs when useful, but sanitize sensitive fields.

## Backend Implementation Notes

- Express 5 is in use.
- Middleware order matters: keep security and parsing middleware before routes, and keep not-found/error middleware last.
- API bootstrap currently lives in `backend/src/index.ts`.
- Return JSON from API middleware and handlers consistently.
- Prefer new domain work under `backend/src/features/`; keep shared cross-cutting middleware in `backend/src/middlewares/`.

## Frontend Implementation Notes

- Frontend uses TanStack Router file routes; route files live in `frontend/src/routes/`.
- The root document shell is in `frontend/src/routes/__root.tsx`.
- Keep components accessible with semantic elements, `aria-label`s where needed, and preserved screen-reader text patterns.
- Preserve the current visual language: custom CSS variables, editorial typography, layered gradients, and subtle motion.
- Do not replace the existing design with generic default Tailwind/ShadCN styling unless a redesign is explicitly requested.

## When Adding Tests

- Prefer colocated frontend tests named `*.test.tsx` or `*.test.ts` near the feature being tested.
- Use Testing Library for React behavior tests; it is already installed in `frontend/`.
- Test visible behavior and route/component outcomes rather than implementation details.
- During development, narrow frontend test runs with a file path, `-t`, or both.

## Agent Workflow Expectations

- Inspect the target folder before editing and mirror its conventions.
- Confirm commands from `package.json` or config files before claiming they exist.
- If a requested verification step is impossible because tooling is missing, say so clearly and name the missing tool.
- Prefer minimal, focused changes that leave unrelated files untouched.
- Update this file when repository conventions or scripts materially change.
