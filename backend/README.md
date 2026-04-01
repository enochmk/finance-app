# Backend

Express 5 API for the finance app. The backend owns authentication, accounts, categories, transactions, budgets, recurring transactions, reports, and dashboard summary endpoints.

## Stack

- Node.js + TypeScript
- Express 5
- Prisma ORM
- PostgreSQL
- Zod validation
- Winston logging

## Prerequisites

- Node.js 20+
- npm
- PostgreSQL running locally or remotely

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create a local environment file:

```bash
cp .env.example .env
```

3. Update `DATABASE_URL` and `JWT_SECRET` in `.env`.

4. Generate the Prisma client and apply migrations:

```bash
npm exec prisma generate
npm exec prisma migrate dev
```

5. Start the API in development:

```bash
npm run dev
```

The API listens on `http://localhost:4000` by default and serves routes under `http://localhost:4000/api/v1`.

## Environment Variables

Required for normal local development:

- `DATABASE_URL`: PostgreSQL connection string.
- `JWT_SECRET`: Secret used to sign auth tokens. Use at least 32 characters.

Common defaults already provided in `.env.example`:

- `NODE_ENV=development`
- `PORT=4000`
- `FRONTEND_ORIGINS=http://localhost:3000,http://127.0.0.1:3000`
- `JWT_EXPIRES_IN=7d`
- `BCRYPT_ROUNDS=10`
- `LOG_DIRECTORY=logs`
- `LOG_LEVEL=debug`
- `LOG_CONSOLE_LEVEL=debug`
- `LOG_DATE_PATTERN=YYYYMMDD`
- `ENABLE_DEV_SEED=false`
- `DEV_SEED_USER_EMAIL=dev@budget.local`
- `DEV_SEED_USER_NAME=Budget Dev User`
- `DEV_SEED_USER_PASSWORD=dev-password-123`

Example local database URL:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/finance"
```

Generate a secure JWT secret with:

```bash
openssl rand -hex 32
```

## Scripts

- `npm run dev`: Run the API with `ts-node-dev`.
- `npm run build`: Compile TypeScript to `dist/`.
- `npm run start`: Start the compiled server.
- `npm run seed:dev`: Run the development seed script.
- `npm run remove-future-transactions`: Utility script for cleanup.
- `npm run format`: Format backend TypeScript files with Prettier.

## Project Layout

- `src/modules/`: Domain modules such as auth, accounts, transactions, reports, and workspace.
- `src/middlewares/`: Shared middleware including auth, validation, request logging, and error handling.
- `src/libs/`: Shared services such as Prisma and logger setup.
- `prisma/`: Prisma schema and migrations.
- `logs/`: Application log output.

## Notes

- CORS is controlled by `FRONTEND_ORIGINS`.
- Validation happens through Zod schemas and the shared schema validation middleware.
- There is no real backend test runner configured yet. The current `npm run test` script is only a placeholder.
