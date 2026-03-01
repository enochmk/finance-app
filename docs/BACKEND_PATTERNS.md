# Backend Directory Pattern

The goal is a **clear, feature‑centric layout** with a couple of shared service/middleware folders. Use this as a template for new projects or to guide an automated agent.

## 📁 Top‑level folders

```
src/
  features/
  middlewares/
  services/
  …(other top‑level modules, e.g. db/, libs/ etc.)
```

## 🔹 `features/` – one folder per domain area

Each feature lives in its own sub‑directory under `features`. Inside a feature you can expect the usual pieces:

```
features/
  <featureName>/
    <featureName>.controller.ts
    <featureName>.service.ts
    <featureName>.schema.ts
    <featureName>.middleware.ts
    <featureName>.routes.ts
```

> **Example**
> `features/payment/payment.controller.ts`
> `features/payment/payment.service.ts`
> …

This groups all related code together and makes it easy for the agent to scaffold or locate items:

- `*.controller.ts` – HTTP handlers
- `*.service.ts` – business logic, data access
- `*.schema.ts` – validation or Prisma/ORM schema for that feature
- `*.middleware.ts` – any request-level middleware specific to that feature
- `*.routes.ts` – Express/Koa/Routing‑logic wiring for the feature

## 🔹 `middlewares/` – shared, cross‑cutting middleware

```
middlewares/
  audit-log.middleware.ts
  auth.middleware.ts
  error-handler.middleware.ts
  …
```

Use this for pieces that are **not bound to a single feature** but apply across routes.

## 🔹 `services/` – globally used domain services

```
services/
  email.service.ts
  …
```

Keep external‑API wrappers or long‑lived singleton logic here.

---

## ✅ How an agent should use the pattern

1. **When creating a new feature:**
   - make `features/<name>` directory
   - generate the five files above with appropriate stub content.

2. **When needing shared logic:**
   - look in `middlewares/` for request filters
   - look in `services/` for reusable service clients

3. **Searching:**
   - feature code is always under `features/*`
   - file names end with `.controller`, `.service`, etc.

Feel free to copy/paste this into any project's README or architecture notes to keep layouts consistent and tooling predictable.
