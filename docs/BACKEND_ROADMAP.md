# Backend Implementation Roadmap

## Current State

- Express 5 + TypeScript + Prisma scaffolded in `backend/`
- Middleware skeleton exists for error handling, request logging, schema validation, sanitization, and not-found handling
- No API routes are currently mounted in `backend/src/index.ts`
- Prisma schema is still empty, with no domain models or migrations yet

## Recommended Starting Point

Start with the finance domain foundation before authentication.

Why:

- Core finance entities define the backend shape the rest of the app will depend on
- Authentication can be layered on cleanly once the data model and CRUD boundaries are clear
- The current backend is missing both models and routes, so domain-first work gives the fastest usable progress

## Phase 1: Database Foundation

- [ ] Define Prisma models in `backend/prisma/schema.prisma`
- [ ] Add `User` model
- [ ] Add `Account` model for bank, cash, and credit accounts
- [ ] Add `Category` model for income and expense grouping
- [ ] Add `Transaction` model for money movement records
- [ ] Add `Budget` model for monthly category planning
- [ ] Add enums where useful, such as account type and transaction type
- [ ] Generate Prisma client
- [ ] Create the initial migration

### Proposed Initial Models

- `User`: id, email, passwordHash, name, createdAt, updatedAt
- `Account`: id, userId, name, type, balance, currency, isArchived, createdAt, updatedAt
- `Category`: id, userId, name, type, color, icon, createdAt, updatedAt
- `Transaction`: id, userId, accountId, categoryId, amount, description, date, type, notes, createdAt, updatedAt
- `Budget`: id, userId, categoryId, amount, month, year, createdAt, updatedAt

## Phase 2: Feature Structure

- [ ] Create `backend/src/features/`
- [ ] Add `transactions/` feature module
- [ ] Add `accounts/` feature module
- [ ] Add `categories/` feature module
- [ ] Add `budgets/` feature module
- [ ] Follow backend feature pattern:
  - `.controller.ts`
  - `.service.ts`
  - `.schema.ts`
  - `.routes.ts`
  - `.util.ts`

## Phase 3: Core API Implementation

- [ ] Implement transaction endpoints
- [ ] Implement account endpoints
- [ ] Implement category endpoints
- [ ] Implement budget endpoints
- [ ] Add Zod request validation for create and update flows
- [ ] Return consistent JSON response shapes

### Suggested First Endpoints

- `GET /api/v1/transactions`
- `POST /api/v1/transactions`
- `PATCH /api/v1/transactions/:id`
- `DELETE /api/v1/transactions/:id`
- `GET /api/v1/accounts`
- `POST /api/v1/accounts`
- `GET /api/v1/categories`
- `POST /api/v1/categories`
- `GET /api/v1/budgets`
- `POST /api/v1/budgets`

## Phase 4: Integration

- [ ] Mount versioned API routes in `backend/src/index.ts`
- [ ] Wire in request logger middleware
- [ ] Ensure sanitization and validation middleware are used consistently
- [ ] Add health check endpoint
- [ ] Verify error handling across happy and failure paths

## Phase 5: Authentication

- [ ] Add auth feature module under `backend/src/features/auth/`
- [ ] Implement register and login endpoints
- [ ] Hash passwords with bcrypt
- [ ] Issue JWTs
- [ ] Add protected route middleware
- [ ] Scope finance data by authenticated user

## Phase 6: Quality and Hardening

- [ ] Add backend test runner instead of placeholder test script
- [ ] Add feature-level tests for services and routes
- [ ] Add environment validation on startup
- [ ] Add Prisma client singleton and graceful shutdown handling
- [ ] Review logging to avoid sensitive data exposure

## Execution Order

1. Database schema and migration
2. Transaction feature
3. Account and category features
4. Budget feature
5. Route integration and health check
6. Authentication
7. Tests and hardening

## Immediate Next Step

Design and implement the Prisma schema in `backend/prisma/schema.prisma`, then generate the client and create the first migration.
