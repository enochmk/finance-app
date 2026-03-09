# Finance App Roadmap

This roadmap tracks the current implementation status for the full project so future work can continue from the right place.

## Current Status Snapshot

- Backend is ahead of the frontend and already provides a usable authenticated finance API
- Frontend now has a shadcn-style admin shell, live dashboard and reports, and a management workspace
- Core missing work has shifted from foundation to product polish, editing workflows, and UX depth

## Phase 1: Foundation And Data Model

Status: Completed

- [x] Set up Express 5 + TypeScript backend scaffold
- [x] Configure Prisma for PostgreSQL
- [x] Define core Prisma models in `backend/prisma/schema.prisma`
- [x] Add `User` model
- [x] Add `Account` model
- [x] Add `Category` model
- [x] Add `Transaction` model
- [x] Add `Budget` model
- [x] Add finance enums for account, category, and transaction types
- [x] Generate Prisma client
- [x] Create and apply the initial migration

## Phase 2: Backend Feature Structure

Status: Completed

- [x] Create `backend/src/features/`
- [x] Add `transactions/` feature module
- [x] Add `accounts/` feature module
- [x] Add `categories/` feature module
- [x] Add `budgets/` feature module
- [x] Add `auth/` feature module
- [x] Add `dashboard/` feature module
- [x] Add `reports/` feature module
- [x] Add `recurring-transactions/` feature module
- [x] Follow backend feature pattern with schema, middleware, controller, service, and routes files

## Phase 3: Core Finance API

Status: Completed

- [x] Implement transaction endpoints
- [x] Implement account endpoints
- [x] Implement category endpoints
- [x] Implement budget endpoints
- [x] Add Zod request validation for create and update flows
- [x] Return consistent JSON response shapes
- [x] Add recurring transaction CRUD endpoints
- [x] Add manual recurring run-due action

### Implemented Backend Endpoints

- [x] `GET /api/v1/transactions`
- [x] `POST /api/v1/transactions`
- [x] `PATCH /api/v1/transactions/:id`
- [x] `DELETE /api/v1/transactions/:id`
- [x] `GET /api/v1/accounts`
- [x] `POST /api/v1/accounts`
- [x] `PATCH /api/v1/accounts/:id`
- [x] `DELETE /api/v1/accounts/:id`
- [x] `GET /api/v1/categories`
- [x] `POST /api/v1/categories`
- [x] `PATCH /api/v1/categories/:id`
- [x] `DELETE /api/v1/categories/:id`
- [x] `GET /api/v1/budgets`
- [x] `POST /api/v1/budgets`
- [x] `PATCH /api/v1/budgets/:id`
- [x] `DELETE /api/v1/budgets/:id`
- [x] `GET /api/v1/recurring-transactions`
- [x] `POST /api/v1/recurring-transactions`
- [x] `PATCH /api/v1/recurring-transactions/:id`
- [x] `DELETE /api/v1/recurring-transactions/:id`
- [x] `POST /api/v1/recurring-transactions/run-due`

## Phase 4: Integration And Infrastructure

Status: Completed

- [x] Mount versioned API routes in `backend/src/index.ts`
- [x] Wire in request logger middleware
- [x] Ensure sanitization and validation middleware are used consistently
- [x] Add health check endpoint
- [x] Add Prisma singleton usage
- [x] Add graceful shutdown handling
- [x] Add environment validation on startup
- [x] Add dev bootstrap and seed flow
- [x] Verify error handling across success and failure paths during implementation

## Phase 5: Authentication

Status: Completed

- [x] Add auth feature module under `backend/src/features/auth/`
- [x] Implement register endpoint
- [x] Implement login endpoint
- [x] Implement authenticated `me` endpoint
- [x] Hash passwords with bcrypt
- [x] Issue JWTs
- [x] Add protected route middleware
- [x] Scope finance data by authenticated user

### Implemented Auth Endpoints

- [x] `POST /api/v1/auth/register`
- [x] `POST /api/v1/auth/login`
- [x] `GET /api/v1/auth/me`

## Phase 6: Insights And Reporting

Status: Completed

- [x] Add dashboard summary endpoint
- [x] Add monthly reports endpoint
- [x] Return account balances and totals for the selected period
- [x] Return budget utilization data
- [x] Return recent transactions for dashboard view
- [x] Return recurring transaction preview data in the dashboard
- [x] Return daily cash-flow, category breakdowns, and account activity in reports

### Implemented Insight Endpoints

- [x] `GET /api/v1/dashboard/summary`
- [x] `GET /api/v1/reports/monthly`

## Phase 7: Frontend Application Shell

Status: Completed

- [x] Replace starter UI with a finance-focused frontend
- [x] Introduce shadcn-style UI primitives and reusable component layer
- [x] Build a left-hand admin sidebar layout
- [x] Add collapsible sidebar mode
- [x] Add mobile sidebar sheet fallback
- [x] Add avatar dropdown actions
- [x] Add light/dark theme toggle
- [x] Split public, auth, and protected layouts correctly
- [x] Add session provider and token-backed auth flow in the frontend

## Phase 8: Frontend Data Integration

Status: Completed

- [x] Connect dashboard screen to backend summary endpoint
- [x] Connect reports screen to backend reports endpoint
- [x] Add real sign-in page
- [x] Add finance management workspace
- [x] Add create flows for accounts, categories, budgets, transactions, and recurring transactions
- [x] Add edit and delete flows for accounts, categories, budgets, and transactions
- [x] Add pause, resume, edit, and delete flows for recurring transactions

### Implemented Frontend Routes

- [x] `/`
- [x] `/about`
- [x] `/sign-in`
- [x] `/dashboard`
- [x] `/reports`
- [x] `/manage`

## Phase 9: Quality, Consistency, And Product Polish

Status: In Progress

- [ ] Add inline validation feedback to all frontend forms and dialogs
- [ ] Improve API error surfacing across resource forms
- [ ] Add empty states for dashboard, reports, and management tables
- [ ] Add filtering and search for transactions and recurring schedules
- [ ] Add pagination or virtualized handling where lists can grow large
- [ ] Normalize backend feature conventions everywhere to match `docs/BACKEND_PATTERNS.md`
- [ ] Update remaining backend modules to fully follow middleware-first request guards where needed
- [ ] Review visual consistency across all pages and components

## Phase 10: Next Product Features

Status: Not Started

- [ ] Add transaction filtering by date, account, category, and type
- [ ] Add richer dashboard widgets and drill-down interactions
- [ ] Add recurring transaction calendar or schedule timeline view
- [ ] Add transfer-specific frontend workflows
- [ ] Add account/category archiving flows in the UI
- [ ] Add settings page when ready

## Phase 11: Testing And Hardening

Status: Deferred

- [ ] Add backend test runner
- [ ] Add frontend test coverage
- [ ] Add route and service tests
- [ ] Add deeper auth/session hardening if the project grows beyond personal use

This phase is intentionally deferred because the current focus is product delivery for a personal project.

## Current Recommended Next Step

Focus on product polish now that the main architecture exists.

Recommended order:

1. Add inline validation and better error handling to management dialogs and forms
2. Add transaction and recurring schedule filters/search
3. Improve dashboard and reports empty states and drill-down UX
4. Continue backend/frontend consistency cleanup guided by `docs/BACKEND_PATTERNS.md`

## Handoff Notes For Future Work

- Backend is ahead of the frontend and already exposes the core API surface needed for product iteration
- Frontend already supports authenticated usage and CRUD workflows, but needs polish more than new infrastructure
- If continuing backend work, prefer following `docs/BACKEND_PATTERNS.md`
- If continuing frontend work, preserve the left-sidebar admin layout and shadcn-style component direction
