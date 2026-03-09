# Finance App Plan

This file is the single source of truth for what has been built, what the MVP now includes, and what is still left to do.

## Product Direction

The app is a personal finance manager centered on accounts you define yourself.
 
- Accounts can represent buckets such as `Savings`, `Subscription`, `Wedding`, `Bank`, or `Mobile Money`
- Every transaction belongs to an account
- Categories organize spending and income, and can be extended over time
- The dashboard is account-specific, not global
- Reports are not part of the visible MVP for now and should stay hidden from navigation

## Current Status Snapshot

- Backend foundations, authentication, core CRUD APIs, dashboard endpoint, reports endpoint, and recurring transaction flows already exist
- Frontend already has an authenticated finance workspace with management screens for accounts, categories, budgets, transactions, and recurring transactions
- The next major work is product realignment: reshape the current finance workspace to match the MVP instead of broadening features further

## MVP Scope

### 1. Accounts

Users should be able to:

- Create several accounts such as `Savings`, `Subscription`, `Wedding`, `Bank`, and `Mobile Money`
- Add, close, and delete accounts when allowed
- Store these account attributes:
  - account name
  - currency (`GHS` for now, but keep the model extensible)
  - color for UI treatment
  - source mode (`MANUAL` or `AUTOMATED`)

Implementation notes:

- Prefer close/archive for normal account retirement
- Allow delete only when safe and not referenced by transactions

### 2. Transactions

Every transaction is linked to an account.

Required transaction attributes:

- date and time
- source mode (`MANUAL` or `AUTOMATED`)
- category
- account
- amount
- type (`Credit`, `Debit`, `Transfer` in the UI)

Balance rules:

- `Credit` adds to the selected account
- `Debit` deducts from the selected account
- `Transfer` deducts from one account and adds to another account

Domain note:

- Keep backend enum values as `INCOME | EXPENSE | TRANSFER`
- Map UI labels to `Credit | Debit | Transfer`

### 3. Categories

Categories should:

- classify transactions for filtering and tracking
- remain extendable through CRUD
- be viewable even when disabled
- support disable/enable so they do not appear during transaction entry when disabled

Seed these starter categories:

- `Food & Drinks`
- `Shopping`
- `Housing`
- `Transportation`
- `Vehicle`
- `Life & Entertainment`
- `Communications, PC`
- `Financial Expenses`
- `Investments`
- `Income`

### 4. Dashboard

The dashboard should:

- report on a selected account instead of a global portfolio
- use that account's currency
- show balances and transactions only in the context of the selected account

### 5. Reports

- Reports are not part of the current MVP navigation
- Hide the report menu and report calls-to-action in the frontend for now
- Existing report code can remain in the codebase until it is either reused or removed later

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

## Phase 3: Core Finance API And Auth

Status: Completed

- [x] Implement transaction endpoints
- [x] Implement account endpoints
- [x] Implement category endpoints
- [x] Implement budget endpoints
- [x] Implement recurring transaction endpoints
- [x] Add Zod request validation for create and update flows
- [x] Return consistent JSON response shapes
- [x] Add auth feature module under `backend/src/features/auth/`
- [x] Implement register endpoint
- [x] Implement login endpoint
- [x] Implement authenticated `me` endpoint
- [x] Hash passwords with bcrypt
- [x] Issue JWTs
- [x] Add protected route middleware
- [x] Scope finance data by authenticated user

### Implemented API Endpoints

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
- [x] `GET /api/v1/dashboard/summary`
- [x] `GET /api/v1/reports/monthly`
- [x] `POST /api/v1/auth/register`
- [x] `POST /api/v1/auth/login`
- [x] `GET /api/v1/auth/me`

## Phase 4: Integration And Application Shell

Status: Completed

- [x] Mount versioned API routes in `backend/src/index.ts`
- [x] Wire in request logger middleware
- [x] Ensure sanitization and validation middleware are used consistently
- [x] Add health check endpoint
- [x] Add Prisma singleton usage
- [x] Add graceful shutdown handling
- [x] Add environment validation on startup
- [x] Add dev bootstrap and seed flow
- [x] Replace starter UI with a finance-focused frontend
- [x] Introduce reusable component primitives and management pages
- [x] Build an authenticated workspace shell with sidebar navigation
- [x] Add session provider and token-backed auth flow in the frontend

## Phase 5: Current Frontend Coverage

Status: Completed But Needs Realignment

- [x] Add real sign-in page
- [x] Add finance management workspace
- [x] Add create flows for accounts, categories, budgets, transactions, and recurring transactions
- [x] Add edit and delete flows for accounts, categories, budgets, and transactions
- [x] Add pause, resume, edit, and delete flows for recurring transactions
- [x] Connect dashboard screen to backend summary endpoint
- [x] Connect reports screen to backend reports endpoint

### Implemented Frontend Routes

- [x] `/`
- [x] `/about`
- [x] `/sign-in`
- [x] `/dashboard`
- [x] `/reports`
- [x] `/manage`

## Phase 6: MVP Realignment

Status: In Progress

### Accounts

- [x] Reframe accounts as user-defined personal finance buckets instead of bank-product-first records
- [x] Add account color support end to end
- [x] Add account source mode (`MANUAL` or `AUTOMATED`)
- [x] Default new accounts to `GHS` for MVP
- [x] Update account create and edit flows to match the MVP fields
- [x] Replace generic archive language with close-account language where appropriate

### Transactions

- [x] Support transaction entry with date/time, category, account, amount, type, and source mode
- [x] Keep backend transaction enum values as `INCOME | EXPENSE | TRANSFER`
- [x] Show UI labels as `Credit | Debit | Transfer`
- [x] Ensure credit adds to account balance
- [x] Ensure debit deducts from account balance
- [x] Ensure transfer moves money atomically between two accounts
- [x] Tighten transfer-specific validation and UX

### Categories

- [x] Add explicit disable and enable workflows backed by `isArchived`
- [x] Exclude disabled categories from transaction-entry selectors by default
- [x] Seed the agreed starter categories for new/dev environments
- [x] Keep disabled categories visible in management screens

## Phase 7: Account-Scoped Dashboard

Status: Next

- [ ] Change dashboard queries to focus on a selected account instead of all active accounts combined
- [ ] Add account selector state in the frontend dashboard
- [ ] Persist the selected account in a lightweight way
- [ ] Format dashboard amounts using the selected account currency
- [ ] Show recent transactions for the selected account only
- [ ] Show category activity and trends for the selected account only
- [ ] Update empty states for accounts with no activity yet

## Phase 8: MVP Navigation And Simplification

Status: Next

- [ ] Hide `Reports` from sidebar and workspace navigation
- [ ] Remove report-oriented calls-to-action from dashboard and landing pages
- [ ] Keep report code hidden but available in the codebase for later use
- [ ] Review whether budgets and recurring flows should stay visible during the earliest MVP pass

## Phase 9: Quality, Consistency, And Product Polish

Status: In Progress

- [ ] Add inline validation feedback to all frontend forms and dialogs
- [ ] Improve API error surfacing across resource forms
- [ ] Add empty states for dashboard and management tables
- [ ] Add transaction filtering by date, account, category, and type
- [ ] Add pagination or virtualization where lists can grow large
- [ ] Normalize backend feature conventions everywhere to match `docs/BACKEND_PATTERNS.md`
- [ ] Update remaining backend modules to fully follow middleware-first request guards where needed
- [ ] Review visual consistency across all pages and components

## Phase 10: Deferred Or Later

Status: Deferred

- [ ] Decide whether budgets remain in MVP or move fully to later scope
- [ ] Decide whether recurring transactions remain in MVP or move fully to later scope
- [ ] Reintroduce reports when account-scoped reporting requirements are clear
- [ ] Add settings page when ready
- [ ] Add export workflows when needed
- [ ] Add deeper auth/session hardening if the project grows beyond personal use

## Phase 11: Testing And Hardening

Status: Deferred

- [ ] Add backend test runner
- [ ] Add frontend test coverage
- [ ] Add route and service tests

This phase is intentionally deferred because the current focus is MVP product delivery for a personal project.

## Current Recommended Next Step

Focus on MVP realignment before adding new feature breadth.

Recommended order:

1. Realign accounts to the desired personal-finance bucket model
2. Realign transaction UX and balance behavior around `Credit`, `Debit`, and `Transfer`
3. Add category disable/enable workflows and seed the agreed categories
4. Make the dashboard account-specific
5. Hide reports from navigation and remove report CTAs
6. Continue form validation and UX polish

## Handoff Notes For Future Work

- Existing backend and frontend coverage is broader than the current MVP, so prefer narrowing and refining instead of adding more surface area
- Preserve the current backend feature structure described in `docs/BACKEND_PATTERNS.md`
- Preserve the existing frontend visual language while simplifying the visible product flow
- Treat this file as the canonical roadmap and update it whenever scope or implementation status changes materially
