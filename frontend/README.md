# Frontend

TanStack Start frontend for the finance app. The UI covers authentication, dashboard reporting, transactions, account management, category management, and workspace reset flows.

## Stack

- React 19
- TanStack Start
- TanStack Router
- Tailwind CSS v4
- Radix UI primitives
- Vitest + Testing Library

## Prerequisites

- Node.js 20+
- npm
- Running backend API at `http://localhost:4000/api/v1` or a custom API base URL

## Setup

1. Install dependencies:

```bash
npm install
```

2. Start the frontend:

```bash
npm run dev
```

The app runs on `http://localhost:3000` by default.

## Backend Dependency

By default, the frontend calls:

```text
http://localhost:4000/api/v1
```

If your API runs elsewhere, set a Vite environment variable before starting the dev server:

```bash
VITE_API_BASE_URL=http://localhost:4000/api/v1 npm run dev
```

For persistent local configuration, create a `.env.local` file in this folder:

```env
VITE_API_BASE_URL=http://localhost:4000/api/v1
```

## Scripts

- `npm run dev`: Start the Vite development server on port 3000.
- `npm run build`: Build the production bundle.
- `npm run preview`: Preview the production build locally.
- `npm run test`: Run Vitest.
- `npm run format`: Format frontend TypeScript and TSX files with Prettier.

## Main Routes

- `/`: Marketing and project overview page.
- `/sign-in`: Sign in and sign up flow.
- `/dashboard`: Account-focused financial summary and reporting.
- `/transactions`: Transaction management with filters, sorting, and pagination.
- `/settings/accounts`: Account management.
- `/settings/categories`: Category management.
- `/settings/reset`: Workspace reset flow.

## Project Layout

- `src/routes/`: File-based route definitions.
- `src/components/`: Shared UI building blocks and app shell pieces.
- `src/lib/api.ts`: API client and frontend domain types.
- `src/hooks/`: Shared hooks for route protection and workspace data.
- `src/styles.css`: Theme tokens, typography, and shared styles.

## Notes

- The frontend expects the backend CORS allowlist to include `http://localhost:3000`.
- Route generation is handled by TanStack Router and emits `src/routeTree.gen.ts`.
- Tests are supported with Vitest, but the project currently has little or no test coverage.
