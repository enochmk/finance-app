# Backend Patterns

This document describes the preferred backend feature structure and coding style for `backend/src/`.

## Feature Layout

Create new backend work under `src/modules/<module>/` when it belongs to a specific domain.

- `<feature>.schema.ts`: Zod request schemas and exported inferred request types
- `<feature>.middleware.ts`: request-scoped checks that must happen before controller or service business logic
- `<feature>.controller.ts`: thin HTTP handlers that map typed requests to service calls
- `<feature>.service.ts`: business logic and persistence
- `<feature>.routes.ts`: Express router wiring

## Schemas And Request Types

Define request schemas with explicit `params`, `query`, and `body` keys so validation and controller typing stay aligned.

```ts
export const listTransactionsSchema = z.object({
  params: z.object({}),
  query: z.object({
    limit: z.coerce.number().int().min(1).max(100).optional(),
  }),
  body: z.object({}).optional(),
})

export type ListTransactionsQuery = z.infer<
  typeof listTransactionsSchema
>['query']
```

Use type names that describe the request segment they represent.

- `*Query` for query-string input
- `*Body` for JSON body input
- `*Params` for route params

## Controllers

Controllers should stay thin and typed.

- Use arrow-function class fields so routes can pass handlers directly without `.bind(controller)`
- Type `Request` with the inferred schema types used by that handler
- Read validated values directly from `req.params`, `req.query`, and `req.body`
- Leave domain rules and data access to services or feature middleware

```ts
type ListTransactionsRequest = Request<
  Record<string, never>,
  unknown,
  Record<string, never>,
  ListTransactionsQuery
>

class TransactionsController {
  list = async (
    req: ListTransactionsRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const transactions = await transactionsService.list(req.user!.id, req.query)

      return res.status(200).json({
        data: transactions,
        count: transactions.length,
      })
    } catch (error) {
      return next(error)
    }
  }
}
```

## Routes

Routes should compose middleware in the order the request is processed.

1. authentication
2. schema validation
3. feature-specific guard middleware
4. controller handler

Because controllers use arrow methods, pass them directly.

```ts
transactionsRoutes.post(
  '/',
  resourceValidator(createTransactionSchema),
  validateCreateTransactionOwnership,
  transactionsController.create
)
```

## Middleware-First Guards

Move repeated preconditions out of services when they are request-scoped guards.

Good candidates:

- ownership checks
- resource existence checks
- merged validation for partial updates
- request-specific authorization rules

This keeps service entry points focused on the main business action.

```ts
export const validateUpdateTransactionOwnership = async (
  req: UpdateTransactionRequest,
  _res: Response,
  next: NextFunction
) => {
  try {
    const ownershipData = await transactionsService.resolveUpdateOwnershipValidationData(
      req.params.id,
      req.user!.id,
      req.body
    )

    await transactionsService.validateOwnership(ownershipData)

    return next()
  } catch (error) {
    return next(error)
  }
}
```

## Services

Services should use arrow-function methods as well.

- Keep public service methods straightforward and action-oriented
- Assume route middleware already handled request-specific guards when that pattern applies
- Keep reusable domain helpers inside the service when multiple middleware or service methods need them
- Throw structured HTTP errors for expected failures

## Comments

Prefer self-explanatory naming first. Add short comments only when behavior is not obvious from the code itself.

Good examples:

- why a partial update must merge persisted data before validation
- why a query uses a non-obvious sort order
- why a value must be normalized before persistence

Avoid comments that only restate the next line.
