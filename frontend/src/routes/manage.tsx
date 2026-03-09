import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

import { useSession } from '#/components/session-provider'
import { Alert, AlertDescription, AlertTitle } from '#/components/ui/alert'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/components/ui/card'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '#/components/ui/select'
import { Separator } from '#/components/ui/separator'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '#/components/ui/table'
import {
  createAccount,
  createBudget,
  createCategory,
  createRecurringTransaction,
  createTransaction,
  getAccounts,
  getBudgets,
  getCategories,
  getRecurringTransactions,
  getTransactions,
  runRecurringTransactions,
  type Account,
  type Budget,
  type Category,
  type RecurringTransaction,
  type Transaction,
} from '#/lib/api'

export const Route = createFileRoute('/manage')({
  component: ManagePage,
})

function formatCurrency(value: number | string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(Number(value))
}

function ManagePage() {
  const navigate = useNavigate()
  const { isAuthenticated, isLoading } = useSession()
  const [error, setError] = useState<string | null>(null)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [recurringTransactions, setRecurringTransactions] = useState<
    RecurringTransaction[]
  >([])

  const [accountForm, setAccountForm] = useState({
    name: '',
    type: 'CHECKING',
    openingBalance: '0',
  })
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    type: 'EXPENSE',
    color: '#176b6c',
  })
  const [budgetForm, setBudgetForm] = useState({
    categoryId: '',
    amount: '0',
    month: String(new Date().getMonth() + 1),
    year: String(new Date().getFullYear()),
  })
  const [transactionForm, setTransactionForm] = useState({
    accountId: '',
    categoryId: '',
    type: 'EXPENSE',
    amount: '0',
    description: '',
    transactionDate: new Date().toISOString().slice(0, 16),
  })
  const [recurringForm, setRecurringForm] = useState({
    accountId: '',
    categoryId: '',
    type: 'EXPENSE',
    amount: '0',
    description: '',
    frequency: 'MONTHLY',
    dayOfMonth: '1',
    dayOfWeek: '1',
    startDate: new Date().toISOString().slice(0, 16),
  })

  const hasData = useMemo(
    () => accounts.length > 0 || categories.length > 0,
    [accounts.length, categories.length]
  )

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      void navigate({ to: '/sign-in' })
    }
  }, [isAuthenticated, isLoading, navigate])

  useEffect(() => {
    if (!isAuthenticated) {
      return
    }

    let cancelled = false

    async function loadData() {
      try {
        const [nextAccounts, nextCategories, nextBudgets, nextTransactions, nextRecurringTransactions] =
          await Promise.all([
            getAccounts(),
            getCategories(),
            getBudgets(),
            getTransactions(),
            getRecurringTransactions(),
          ])

        if (!cancelled) {
          setAccounts(nextAccounts)
          setCategories(nextCategories)
          setBudgets(nextBudgets)
          setTransactions(nextTransactions)
          setRecurringTransactions(nextRecurringTransactions)
          setError(null)
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'Unable to load finance resources.'
          )
        }
      }
    }

    void loadData()

    return () => {
      cancelled = true
    }
  }, [isAuthenticated])

  if (!isAuthenticated && !isLoading) {
    return null
  }

  async function refreshAll() {
    const [nextAccounts, nextCategories, nextBudgets, nextTransactions, nextRecurringTransactions] =
      await Promise.all([
        getAccounts(),
        getCategories(),
        getBudgets(),
        getTransactions(),
        getRecurringTransactions(),
      ])

    setAccounts(nextAccounts)
    setCategories(nextCategories)
    setBudgets(nextBudgets)
    setTransactions(nextTransactions)
    setRecurringTransactions(nextRecurringTransactions)
  }

  async function handleCreateAccount(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    try {
      await createAccount({
        name: accountForm.name,
        type: accountForm.type,
        openingBalance: Number(accountForm.openingBalance),
        currentBalance: Number(accountForm.openingBalance),
      })

      setAccountForm({ name: '', type: 'CHECKING', openingBalance: '0' })
      await refreshAll()
      toast.success('Account created')
    } catch (createError) {
      toast.error('Unable to create account', {
        description:
          createError instanceof Error ? createError.message : 'Request failed',
      })
    }
  }

  async function handleCreateCategory(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    try {
      await createCategory(categoryForm)
      setCategoryForm({ name: '', type: 'EXPENSE', color: '#176b6c' })
      await refreshAll()
      toast.success('Category created')
    } catch (createError) {
      toast.error('Unable to create category', {
        description:
          createError instanceof Error ? createError.message : 'Request failed',
      })
    }
  }

  async function handleCreateBudget(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    try {
      await createBudget({
        categoryId: budgetForm.categoryId,
        amount: Number(budgetForm.amount),
        month: Number(budgetForm.month),
        year: Number(budgetForm.year),
      })

      await refreshAll()
      toast.success('Budget created')
    } catch (createError) {
      toast.error('Unable to create budget', {
        description:
          createError instanceof Error ? createError.message : 'Request failed',
      })
    }
  }

  async function handleCreateTransaction(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    try {
      await createTransaction({
        accountId: transactionForm.accountId,
        categoryId: transactionForm.categoryId || undefined,
        type: transactionForm.type,
        amount: Number(transactionForm.amount),
        description: transactionForm.description,
        transactionDate: new Date(transactionForm.transactionDate).toISOString(),
      })

      await refreshAll()
      toast.success('Transaction created')
    } catch (createError) {
      toast.error('Unable to create transaction', {
        description:
          createError instanceof Error ? createError.message : 'Request failed',
      })
    }
  }

  async function handleCreateRecurringTransaction(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()

    try {
      await createRecurringTransaction({
        accountId: recurringForm.accountId,
        categoryId: recurringForm.categoryId || undefined,
        type: recurringForm.type,
        amount: Number(recurringForm.amount),
        description: recurringForm.description,
        frequency: recurringForm.frequency,
        dayOfMonth:
          recurringForm.frequency === 'WEEKLY'
            ? undefined
            : Number(recurringForm.dayOfMonth),
        dayOfWeek:
          recurringForm.frequency === 'WEEKLY'
            ? Number(recurringForm.dayOfWeek)
            : undefined,
        startDate: new Date(recurringForm.startDate).toISOString(),
      })

      await refreshAll()
      toast.success('Recurring transaction created')
    } catch (createError) {
      toast.error('Unable to create recurring transaction', {
        description:
          createError instanceof Error ? createError.message : 'Request failed',
      })
    }
  }

  async function handleRunRecurringTransactions() {
    try {
      const result = await runRecurringTransactions()
      await refreshAll()
      toast.success('Recurring transactions processed', {
        description: `${result.processedCount} scheduled items were processed.`,
      })
    } catch (runError) {
      toast.error('Unable to process recurring transactions', {
        description: runError instanceof Error ? runError.message : 'Request failed',
      })
    }
  }

  return (
    <main className="w-full px-4 py-8 lg:px-8 xl:px-10">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Badge variant="secondary" className="mb-3">
            Finance management
          </Badge>
          <h1 className="display-title text-4xl font-bold tracking-tight text-[var(--foreground)] sm:text-5xl">
            Create and manage the financial system behind your dashboard.
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-[var(--muted-foreground)]">
            Real forms for accounts, categories, budgets, transactions, and recurring entries now live inside the app.
          </p>
        </div>

        <Button variant="outline" asChild>
          <Link to="/dashboard">Back to dashboard</Link>
        </Button>
      </div>

      {error ? (
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Unable to load resources</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Create account</CardTitle>
            <CardDescription>Add a wallet, bank account, or card.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateAccount} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="account-name">Name</Label>
                <Input id="account-name" value={accountForm.name} onChange={(event) => setAccountForm((current) => ({ ...current, name: event.target.value }))} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="account-type">Type</Label>
                <Select value={accountForm.type} onValueChange={(value) => setAccountForm((current) => ({ ...current, type: value }))}>
                  <SelectTrigger id="account-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {['CASH', 'CHECKING', 'SAVINGS', 'CREDIT_CARD', 'INVESTMENT', 'LOAN'].map((type) => (
                      <SelectItem key={type} value={type}>{type.replaceAll('_', ' ')}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="opening-balance">Opening balance</Label>
                <Input id="opening-balance" type="number" value={accountForm.openingBalance} onChange={(event) => setAccountForm((current) => ({ ...current, openingBalance: event.target.value }))} />
              </div>
              <Button type="submit">Create account</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Create category</CardTitle>
            <CardDescription>Set up income and expense buckets.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateCategory} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="category-name">Name</Label>
                <Input id="category-name" value={categoryForm.name} onChange={(event) => setCategoryForm((current) => ({ ...current, name: event.target.value }))} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category-type">Type</Label>
                <Select value={categoryForm.type} onValueChange={(value) => setCategoryForm((current) => ({ ...current, type: value }))}>
                  <SelectTrigger id="category-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INCOME">Income</SelectItem>
                    <SelectItem value="EXPENSE">Expense</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="category-color">Color</Label>
                <Input id="category-color" type="color" value={categoryForm.color} onChange={(event) => setCategoryForm((current) => ({ ...current, color: event.target.value }))} />
              </div>
              <Button type="submit">Create category</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Create budget</CardTitle>
            <CardDescription>Assign a monthly budget to a category.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateBudget} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="budget-category">Category</Label>
                <Select value={budgetForm.categoryId} onValueChange={(value) => setBudgetForm((current) => ({ ...current, categoryId: value }))}>
                  <SelectTrigger id="budget-category">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.filter((category) => category.type === 'EXPENSE').map((category) => (
                      <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="budget-amount">Amount</Label>
                  <Input id="budget-amount" type="number" value={budgetForm.amount} onChange={(event) => setBudgetForm((current) => ({ ...current, amount: event.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="budget-month">Month</Label>
                  <Input id="budget-month" type="number" value={budgetForm.month} onChange={(event) => setBudgetForm((current) => ({ ...current, month: event.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="budget-year">Year</Label>
                  <Input id="budget-year" type="number" value={budgetForm.year} onChange={(event) => setBudgetForm((current) => ({ ...current, year: event.target.value }))} />
                </div>
              </div>
              <Button type="submit">Create budget</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Create transaction</CardTitle>
            <CardDescription>Record a one-off income, expense, or transfer.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateTransaction} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="transaction-account">Account</Label>
                  <Select value={transactionForm.accountId} onValueChange={(value) => setTransactionForm((current) => ({ ...current, accountId: value }))}>
                    <SelectTrigger id="transaction-account">
                      <SelectValue placeholder="Select account" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>{account.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="transaction-category">Category</Label>
                  <Select value={transactionForm.categoryId} onValueChange={(value) => setTransactionForm((current) => ({ ...current, categoryId: value }))}>
                    <SelectTrigger id="transaction-category">
                      <SelectValue placeholder="Optional category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="transaction-type">Type</Label>
                  <Select value={transactionForm.type} onValueChange={(value) => setTransactionForm((current) => ({ ...current, type: value }))}>
                    <SelectTrigger id="transaction-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INCOME">Income</SelectItem>
                      <SelectItem value="EXPENSE">Expense</SelectItem>
                      <SelectItem value="TRANSFER">Transfer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="transaction-amount">Amount</Label>
                  <Input id="transaction-amount" type="number" value={transactionForm.amount} onChange={(event) => setTransactionForm((current) => ({ ...current, amount: event.target.value }))} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="transaction-description">Description</Label>
                <Input id="transaction-description" value={transactionForm.description} onChange={(event) => setTransactionForm((current) => ({ ...current, description: event.target.value }))} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="transaction-date">Date</Label>
                <Input id="transaction-date" type="datetime-local" value={transactionForm.transactionDate} onChange={(event) => setTransactionForm((current) => ({ ...current, transactionDate: event.target.value }))} />
              </div>
              <Button type="submit">Create transaction</Button>
            </form>
          </CardContent>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle>Create recurring transaction</CardTitle>
              <CardDescription>Schedule a recurring entry with next-run logic from the backend.</CardDescription>
            </div>
            <Button type="button" variant="outline" onClick={handleRunRecurringTransactions} disabled={!hasData}>
              Run due recurring items now
            </Button>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateRecurringTransaction} className="grid gap-4 xl:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="recurring-account">Account</Label>
                <Select value={recurringForm.accountId} onValueChange={(value) => setRecurringForm((current) => ({ ...current, accountId: value }))}>
                  <SelectTrigger id="recurring-account">
                    <SelectValue placeholder="Select account" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>{account.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="recurring-category">Category</Label>
                <Select value={recurringForm.categoryId} onValueChange={(value) => setRecurringForm((current) => ({ ...current, categoryId: value }))}>
                  <SelectTrigger id="recurring-category">
                    <SelectValue placeholder="Optional category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="recurring-description">Description</Label>
                <Input id="recurring-description" value={recurringForm.description} onChange={(event) => setRecurringForm((current) => ({ ...current, description: event.target.value }))} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="recurring-amount">Amount</Label>
                <Input id="recurring-amount" type="number" value={recurringForm.amount} onChange={(event) => setRecurringForm((current) => ({ ...current, amount: event.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="recurring-type">Type</Label>
                <Select value={recurringForm.type} onValueChange={(value) => setRecurringForm((current) => ({ ...current, type: value }))}>
                  <SelectTrigger id="recurring-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INCOME">Income</SelectItem>
                    <SelectItem value="EXPENSE">Expense</SelectItem>
                    <SelectItem value="TRANSFER">Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="recurring-frequency">Frequency</Label>
                <Select value={recurringForm.frequency} onValueChange={(value) => setRecurringForm((current) => ({ ...current, frequency: value }))}>
                  <SelectTrigger id="recurring-frequency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WEEKLY">Weekly</SelectItem>
                    <SelectItem value="MONTHLY">Monthly</SelectItem>
                    <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                    <SelectItem value="YEARLY">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {recurringForm.frequency === 'WEEKLY' ? (
                <div className="space-y-2">
                  <Label htmlFor="recurring-day-of-week">Day of week</Label>
                  <Input id="recurring-day-of-week" type="number" value={recurringForm.dayOfWeek} onChange={(event) => setRecurringForm((current) => ({ ...current, dayOfWeek: event.target.value }))} />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="recurring-day-of-month">Day of month</Label>
                  <Input id="recurring-day-of-month" type="number" value={recurringForm.dayOfMonth} onChange={(event) => setRecurringForm((current) => ({ ...current, dayOfMonth: event.target.value }))} />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="recurring-start-date">Start date</Label>
                <Input id="recurring-start-date" type="datetime-local" value={recurringForm.startDate} onChange={(event) => setRecurringForm((current) => ({ ...current, startDate: event.target.value }))} />
              </div>
              <div className="xl:col-span-2">
                <Button type="submit">Create recurring transaction</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      <Separator className="my-8" />

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Accounts</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accounts.map((account) => (
                  <TableRow key={account.id}>
                    <TableCell>{account.name}</TableCell>
                    <TableCell>{account.type}</TableCell>
                    <TableCell className="text-right">{formatCurrency(account.currentBalance)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recurring schedule</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead>Frequency</TableHead>
                  <TableHead className="text-right">Next run</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recurringTransactions.map((recurringTransaction) => (
                  <TableRow key={recurringTransaction.id}>
                    <TableCell>{recurringTransaction.description}</TableCell>
                    <TableCell>{recurringTransaction.frequency}</TableCell>
                    <TableCell className="text-right">
                      {new Date(recurringTransaction.nextRunAt).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
