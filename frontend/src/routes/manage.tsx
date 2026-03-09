import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { Pause, Pencil, Play, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

import { useSession } from '#/components/session-provider'
import { Alert, AlertDescription, AlertTitle } from '#/components/ui/alert'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '#/components/ui/form'
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
  deleteAccount,
  deleteBudget,
  deleteCategory,
  deleteRecurringTransaction,
  deleteTransaction,
  getAccounts,
  getBudgets,
  getCategories,
  getRecurringTransactions,
  getTransactions,
  runRecurringTransactions,
  updateAccount,
  updateBudget,
  updateCategory,
  updateRecurringTransaction,
  updateTransaction,
  type Account,
  type Budget,
  type Category,
  type RecurringTransaction,
  type Transaction,
} from '#/lib/api'

export const Route = createFileRoute('/manage')({
  component: ManagePage,
})

type DialogState =
  | { type: null }
  | { type: 'edit-account'; payload: Account }
  | { type: 'delete-account'; payload: Account }
  | { type: 'edit-category'; payload: Category }
  | { type: 'delete-category'; payload: Category }
  | { type: 'edit-budget'; payload: Budget }
  | { type: 'delete-budget'; payload: Budget }
  | { type: 'edit-transaction'; payload: Transaction }
  | { type: 'delete-transaction'; payload: Transaction }
  | { type: 'edit-recurring'; payload: RecurringTransaction }
  | { type: 'delete-recurring'; payload: RecurringTransaction }

const accountSchema = z.object({
  name: z.string().trim().min(1, 'Account name is required').max(120),
  type: z.enum(['CASH', 'CHECKING', 'SAVINGS', 'CREDIT_CARD', 'INVESTMENT', 'LOAN']),
  openingBalance: z.coerce.number().finite(),
})

const categorySchema = z.object({
  name: z.string().trim().min(1, 'Category name is required').max(80),
  type: z.enum(['INCOME', 'EXPENSE']),
  color: z.string().trim().min(1, 'Color is required'),
})

const budgetSchema = z.object({
  categoryId: z.string().uuid('Select a valid category'),
  amount: z.coerce.number().positive('Budget amount must be greater than zero'),
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2000).max(9999),
})

const transactionSchema = z.object({
  accountId: z.string().uuid('Select a valid account'),
  categoryId: z.string().optional(),
  type: z.enum(['INCOME', 'EXPENSE', 'TRANSFER']),
  amount: z.coerce.number().positive('Transaction amount must be greater than zero'),
  description: z.string().trim().min(1, 'Description is required').max(255),
  transactionDate: z.string().min(1, 'Transaction date is required'),
})

const recurringSchema = z.object({
  accountId: z.string().uuid('Select a valid account'),
  categoryId: z.string().optional(),
  type: z.enum(['INCOME', 'EXPENSE', 'TRANSFER']),
  amount: z.coerce.number().positive('Recurring amount must be greater than zero'),
  description: z.string().trim().min(1, 'Description is required').max(255),
  frequency: z.enum(['WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY']),
  dayOfMonth: z.coerce.number().int().min(1).max(31).optional(),
  dayOfWeek: z.coerce.number().int().min(0).max(6).optional(),
  startDate: z.string().min(1, 'Start date is required'),
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
  const [dialogState, setDialogState] = useState<DialogState>({ type: null })

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

  const [editAccountForm, setEditAccountForm] = useState({
    name: '',
    type: 'CHECKING',
    currentBalance: '0',
  })
  const [editCategoryForm, setEditCategoryForm] = useState({
    name: '',
    type: 'EXPENSE',
    color: '#176b6c',
  })
  const [editBudgetForm, setEditBudgetForm] = useState({
    categoryId: '',
    amount: '0',
    month: String(new Date().getMonth() + 1),
    year: String(new Date().getFullYear()),
  })
  const [editTransactionForm, setEditTransactionForm] = useState({
    accountId: '',
    categoryId: '',
    type: 'EXPENSE',
    amount: '0',
    description: '',
    transactionDate: new Date().toISOString().slice(0, 16),
  })
  const [editRecurringForm, setEditRecurringForm] = useState({
    accountId: '',
    categoryId: '',
    type: 'EXPENSE',
    amount: '0',
    description: '',
    frequency: 'MONTHLY',
    dayOfMonth: '1',
    dayOfWeek: '1',
    startDate: new Date().toISOString().slice(0, 16),
    status: 'ACTIVE',
  })

  const hasData = useMemo(
    () => accounts.length > 0 || categories.length > 0,
    [accounts.length, categories.length]
  )

  const [transactionSearch, setTransactionSearch] = useState('')
  const [transactionTypeFilter, setTransactionTypeFilter] = useState('ALL')
  const [recurringSearch, setRecurringSearch] = useState('')
  const [recurringStatusFilter, setRecurringStatusFilter] = useState('ALL')

  const accountCreateForm = useForm<z.infer<typeof accountSchema>>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      name: '',
      type: 'CHECKING',
      openingBalance: 0,
    },
  })

  const categoryCreateForm = useForm<z.infer<typeof categorySchema>>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      type: 'EXPENSE',
      color: '#176b6c',
    },
  })

  const budgetCreateForm = useForm<z.infer<typeof budgetSchema>>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      categoryId: '',
      amount: 0,
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
    },
  })

  const transactionCreateForm = useForm<z.infer<typeof transactionSchema>>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      accountId: '',
      categoryId: '',
      type: 'EXPENSE',
      amount: 0,
      description: '',
      transactionDate: new Date().toISOString().slice(0, 16),
    },
  })

  const recurringCreateForm = useForm<z.infer<typeof recurringSchema>>({
    resolver: zodResolver(recurringSchema),
    defaultValues: {
      accountId: '',
      categoryId: '',
      type: 'EXPENSE',
      amount: 0,
      description: '',
      frequency: 'MONTHLY',
      dayOfMonth: 1,
      dayOfWeek: 1,
      startDate: new Date().toISOString().slice(0, 16),
    },
  })

  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
      const matchesSearch =
        transaction.description.toLowerCase().includes(transactionSearch.toLowerCase()) ||
        transaction.account.name.toLowerCase().includes(transactionSearch.toLowerCase()) ||
        (transaction.category?.name ?? '').toLowerCase().includes(transactionSearch.toLowerCase())

      const matchesType =
        transactionTypeFilter === 'ALL' || transaction.type === transactionTypeFilter

      return matchesSearch && matchesType
    })
  }, [transactions, transactionSearch, transactionTypeFilter])

  const filteredRecurringTransactions = useMemo(() => {
    return recurringTransactions.filter((recurringTransaction) => {
      const matchesSearch =
        recurringTransaction.description
          .toLowerCase()
          .includes(recurringSearch.toLowerCase()) ||
        recurringTransaction.account.name
          .toLowerCase()
          .includes(recurringSearch.toLowerCase())

      const matchesStatus =
        recurringStatusFilter === 'ALL' ||
        recurringTransaction.status === recurringStatusFilter

      return matchesSearch && matchesStatus
    })
  }, [recurringTransactions, recurringSearch, recurringStatusFilter])

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

  function closeDialog() {
    setDialogState({ type: null })
  }

  async function handleCreateAccount(values: z.infer<typeof accountSchema>) {
    try {
      await createAccount({
        name: values.name,
        type: values.type,
        openingBalance: values.openingBalance,
        currentBalance: values.openingBalance,
      })

      accountCreateForm.reset({ name: '', type: 'CHECKING', openingBalance: 0 })
      await refreshAll()
      toast.success('Account created')
    } catch (createError) {
      toast.error('Unable to create account', {
        description:
          createError instanceof Error ? createError.message : 'Request failed',
      })
    }
  }

  async function handleCreateCategory(values: z.infer<typeof categorySchema>) {
    try {
      await createCategory(values)
      categoryCreateForm.reset({ name: '', type: 'EXPENSE', color: '#176b6c' })
      await refreshAll()
      toast.success('Category created')
    } catch (createError) {
      toast.error('Unable to create category', {
        description:
          createError instanceof Error ? createError.message : 'Request failed',
      })
    }
  }

  async function handleCreateBudget(values: z.infer<typeof budgetSchema>) {
    try {
      await createBudget({
        categoryId: values.categoryId,
        amount: values.amount,
        month: values.month,
        year: values.year,
      })

      budgetCreateForm.reset({
        categoryId: '',
        amount: 0,
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
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

  async function handleCreateTransaction(values: z.infer<typeof transactionSchema>) {
    try {
      await createTransaction({
        accountId: values.accountId,
        categoryId: values.categoryId || undefined,
        type: values.type,
        amount: values.amount,
        description: values.description,
        transactionDate: new Date(values.transactionDate).toISOString(),
      })

      transactionCreateForm.reset({
        accountId: '',
        categoryId: '',
        type: 'EXPENSE',
        amount: 0,
        description: '',
        transactionDate: new Date().toISOString().slice(0, 16),
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
    values: z.infer<typeof recurringSchema>
  ) {
    try {
      await createRecurringTransaction({
        accountId: values.accountId,
        categoryId: values.categoryId || undefined,
        type: values.type,
        amount: values.amount,
        description: values.description,
        frequency: values.frequency,
        dayOfMonth:
          values.frequency === 'WEEKLY'
            ? undefined
            : values.dayOfMonth,
        dayOfWeek:
          values.frequency === 'WEEKLY'
            ? values.dayOfWeek
            : undefined,
        startDate: new Date(values.startDate).toISOString(),
      })

      recurringCreateForm.reset({
        accountId: '',
        categoryId: '',
        type: 'EXPENSE',
        amount: 0,
        description: '',
        frequency: 'MONTHLY',
        dayOfMonth: 1,
        dayOfWeek: 1,
        startDate: new Date().toISOString().slice(0, 16),
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

  function openEditAccount(account: Account) {
    setEditAccountForm({
      name: account.name,
      type: account.type,
      currentBalance: String(account.currentBalance),
    })
    setDialogState({ type: 'edit-account', payload: account })
  }

  function openEditCategory(category: Category) {
    setEditCategoryForm({
      name: category.name,
      type: category.type,
      color: category.color ?? '#176b6c',
    })
    setDialogState({ type: 'edit-category', payload: category })
  }

  function openEditBudget(budget: Budget) {
    setEditBudgetForm({
      categoryId: budget.category.id,
      amount: String(budget.amount),
      month: String(budget.month),
      year: String(budget.year),
    })
    setDialogState({ type: 'edit-budget', payload: budget })
  }

  function openEditTransaction(transaction: Transaction) {
    setEditTransactionForm({
      accountId: transaction.account.id,
      categoryId: transaction.category?.id ?? '',
      type: transaction.type,
      amount: String(transaction.amount),
      description: transaction.description,
      transactionDate: new Date(transaction.transactionDate).toISOString().slice(0, 16),
    })
    setDialogState({ type: 'edit-transaction', payload: transaction })
  }

  function openEditRecurring(recurringTransaction: RecurringTransaction) {
    setEditRecurringForm({
      accountId: recurringTransaction.account.id,
      categoryId: recurringTransaction.category?.id ?? '',
      type: recurringTransaction.type,
      amount: String(recurringTransaction.amount),
      description: recurringTransaction.description,
      frequency: recurringTransaction.frequency,
      dayOfMonth: String(recurringTransaction.dayOfMonth ?? 1),
      dayOfWeek: String(recurringTransaction.dayOfWeek ?? 1),
      startDate: new Date(recurringTransaction.startDate).toISOString().slice(0, 16),
      status: recurringTransaction.status,
    })
    setDialogState({ type: 'edit-recurring', payload: recurringTransaction })
  }

  async function submitEditAccount(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (dialogState.type !== 'edit-account') return

    try {
      await updateAccount(dialogState.payload.id, {
        name: editAccountForm.name,
        type: editAccountForm.type,
        currentBalance: Number(editAccountForm.currentBalance),
      })
      await refreshAll()
      closeDialog()
      toast.success('Account updated')
    } catch (updateError) {
      toast.error('Unable to update account', {
        description: updateError instanceof Error ? updateError.message : 'Request failed',
      })
    }
  }

  async function submitEditCategory(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (dialogState.type !== 'edit-category') return

    try {
      await updateCategory(dialogState.payload.id, editCategoryForm)
      await refreshAll()
      closeDialog()
      toast.success('Category updated')
    } catch (updateError) {
      toast.error('Unable to update category', {
        description: updateError instanceof Error ? updateError.message : 'Request failed',
      })
    }
  }

  async function submitEditBudget(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (dialogState.type !== 'edit-budget') return

    try {
      await updateBudget(dialogState.payload.id, {
        categoryId: editBudgetForm.categoryId,
        amount: Number(editBudgetForm.amount),
        month: Number(editBudgetForm.month),
        year: Number(editBudgetForm.year),
      })
      await refreshAll()
      closeDialog()
      toast.success('Budget updated')
    } catch (updateError) {
      toast.error('Unable to update budget', {
        description: updateError instanceof Error ? updateError.message : 'Request failed',
      })
    }
  }

  async function submitEditTransaction(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (dialogState.type !== 'edit-transaction') return

    try {
      await updateTransaction(dialogState.payload.id, {
        accountId: editTransactionForm.accountId,
        categoryId: editTransactionForm.categoryId || undefined,
        type: editTransactionForm.type,
        amount: Number(editTransactionForm.amount),
        description: editTransactionForm.description,
        transactionDate: new Date(editTransactionForm.transactionDate).toISOString(),
      })
      await refreshAll()
      closeDialog()
      toast.success('Transaction updated')
    } catch (updateError) {
      toast.error('Unable to update transaction', {
        description: updateError instanceof Error ? updateError.message : 'Request failed',
      })
    }
  }

  async function submitEditRecurring(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (dialogState.type !== 'edit-recurring') return

    try {
      await updateRecurringTransaction(dialogState.payload.id, {
        accountId: editRecurringForm.accountId,
        categoryId: editRecurringForm.categoryId || undefined,
        type: editRecurringForm.type,
        amount: Number(editRecurringForm.amount),
        description: editRecurringForm.description,
        frequency: editRecurringForm.frequency,
        dayOfMonth:
          editRecurringForm.frequency === 'WEEKLY'
            ? undefined
            : Number(editRecurringForm.dayOfMonth),
        dayOfWeek:
          editRecurringForm.frequency === 'WEEKLY'
            ? Number(editRecurringForm.dayOfWeek)
            : undefined,
        startDate: new Date(editRecurringForm.startDate).toISOString(),
        status: editRecurringForm.status,
      })
      await refreshAll()
      closeDialog()
      toast.success('Recurring transaction updated')
    } catch (updateError) {
      toast.error('Unable to update recurring transaction', {
        description: updateError instanceof Error ? updateError.message : 'Request failed',
      })
    }
  }

  async function confirmDelete() {
    try {
      switch (dialogState.type) {
        case 'delete-account':
          await deleteAccount(dialogState.payload.id)
          break
        case 'delete-category':
          await deleteCategory(dialogState.payload.id)
          break
        case 'delete-budget':
          await deleteBudget(dialogState.payload.id)
          break
        case 'delete-transaction':
          await deleteTransaction(dialogState.payload.id)
          break
        case 'delete-recurring':
          await deleteRecurringTransaction(dialogState.payload.id)
          break
        default:
          return
      }

      await refreshAll()
      closeDialog()
      toast.success('Item deleted')
    } catch (deleteError) {
      toast.error('Unable to delete item', {
        description: deleteError instanceof Error ? deleteError.message : 'Request failed',
      })
    }
  }

  async function toggleRecurringStatus(recurringTransaction: RecurringTransaction) {
    try {
      await updateRecurringTransaction(recurringTransaction.id, {
        status: recurringTransaction.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE',
      })
      await refreshAll()
      toast.success(
        recurringTransaction.status === 'ACTIVE'
          ? 'Recurring transaction paused'
          : 'Recurring transaction resumed'
      )
    } catch (toggleError) {
      toast.error('Unable to update recurring status', {
        description: toggleError instanceof Error ? toggleError.message : 'Request failed',
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
            <Form {...accountCreateForm}>
              <form
                onSubmit={accountCreateForm.handleSubmit(handleCreateAccount)}
                className="flex flex-col gap-4"
              >
                <FormField
                  control={accountCreateForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={accountCreateForm.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <FormControl>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {['CASH', 'CHECKING', 'SAVINGS', 'CREDIT_CARD', 'INVESTMENT', 'LOAN'].map((type) => (
                              <SelectItem key={type} value={type}>{type.replaceAll('_', ' ')}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={accountCreateForm.control}
                  name="openingBalance"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Opening balance</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          value={String(field.value ?? 0)}
                          onChange={(event) => field.onChange(event.target.value)}
                        />
                      </FormControl>
                      <FormDescription>
                        This value also initializes the current balance.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit">Create account</Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Create category</CardTitle>
            <CardDescription>Set up income and expense buckets.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...categoryCreateForm}>
              <form
                onSubmit={categoryCreateForm.handleSubmit(handleCreateCategory)}
                className="flex flex-col gap-4"
              >
                <FormField
                  control={categoryCreateForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={categoryCreateForm.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <FormControl>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="INCOME">Income</SelectItem>
                            <SelectItem value="EXPENSE">Expense</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={categoryCreateForm.control}
                  name="color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Color</FormLabel>
                      <FormControl>
                        <Input type="color" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit">Create category</Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Create budget</CardTitle>
            <CardDescription>Assign a monthly budget to a category.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...budgetCreateForm}>
              <form
                onSubmit={budgetCreateForm.handleSubmit(handleCreateBudget)}
                className="flex flex-col gap-4"
              >
                <FormField
                  control={budgetCreateForm.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <FormControl>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.filter((category) => category.type === 'EXPENSE').map((category) => (
                              <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid gap-4 md:grid-cols-3">
                  <FormField
                    control={budgetCreateForm.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount</FormLabel>
                        <FormControl>
                          <Input type="number" value={String(field.value ?? 0)} onChange={(event) => field.onChange(event.target.value)} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={budgetCreateForm.control}
                    name="month"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Month</FormLabel>
                        <FormControl>
                          <Input type="number" value={String(field.value ?? '')} onChange={(event) => field.onChange(event.target.value)} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={budgetCreateForm.control}
                    name="year"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Year</FormLabel>
                        <FormControl>
                          <Input type="number" value={String(field.value ?? '')} onChange={(event) => field.onChange(event.target.value)} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <Button type="submit">Create budget</Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Create transaction</CardTitle>
            <CardDescription>Record a one-off income, expense, or transfer.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...transactionCreateForm}>
              <form
                onSubmit={transactionCreateForm.handleSubmit(handleCreateTransaction)}
                className="flex flex-col gap-4"
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={transactionCreateForm.control}
                    name="accountId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Account</FormLabel>
                        <FormControl>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select account" />
                            </SelectTrigger>
                            <SelectContent>
                              {accounts.map((account) => (
                                <SelectItem key={account.id} value={account.id}>{account.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={transactionCreateForm.control}
                    name="categoryId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <FormControl>
                          <Select value={field.value || ''} onValueChange={field.onChange}>
                            <SelectTrigger>
                              <SelectValue placeholder="Optional category" />
                            </SelectTrigger>
                            <SelectContent>
                              {categories.map((category) => (
                                <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={transactionCreateForm.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type</FormLabel>
                        <FormControl>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="INCOME">Income</SelectItem>
                              <SelectItem value="EXPENSE">Expense</SelectItem>
                              <SelectItem value="TRANSFER">Transfer</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={transactionCreateForm.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount</FormLabel>
                        <FormControl>
                          <Input type="number" value={String(field.value ?? 0)} onChange={(event) => field.onChange(event.target.value)} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={transactionCreateForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={transactionCreateForm.control}
                  name="transactionDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit">Create transaction</Button>
              </form>
            </Form>
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
            <Form {...recurringCreateForm}>
              <form
                onSubmit={recurringCreateForm.handleSubmit(handleCreateRecurringTransaction)}
                className="grid gap-4 xl:grid-cols-2"
              >
                <FormField
                  control={recurringCreateForm.control}
                  name="accountId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account</FormLabel>
                      <FormControl>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select account" />
                          </SelectTrigger>
                          <SelectContent>
                            {accounts.map((account) => (
                              <SelectItem key={account.id} value={account.id}>{account.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={recurringCreateForm.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <FormControl>
                        <Select value={field.value || ''} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue placeholder="Optional category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={recurringCreateForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={recurringCreateForm.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount</FormLabel>
                      <FormControl>
                        <Input type="number" value={String(field.value ?? 0)} onChange={(event) => field.onChange(event.target.value)} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={recurringCreateForm.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <FormControl>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="INCOME">Income</SelectItem>
                            <SelectItem value="EXPENSE">Expense</SelectItem>
                            <SelectItem value="TRANSFER">Transfer</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={recurringCreateForm.control}
                  name="frequency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Frequency</FormLabel>
                      <FormControl>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="WEEKLY">Weekly</SelectItem>
                            <SelectItem value="MONTHLY">Monthly</SelectItem>
                            <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                            <SelectItem value="YEARLY">Yearly</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {recurringCreateForm.watch('frequency') === 'WEEKLY' ? (
                  <FormField
                    control={recurringCreateForm.control}
                    name="dayOfWeek"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Day of week</FormLabel>
                        <FormControl>
                          <Input type="number" value={String(field.value ?? 1)} onChange={(event) => field.onChange(event.target.value)} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : (
                  <FormField
                    control={recurringCreateForm.control}
                    name="dayOfMonth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Day of month</FormLabel>
                        <FormControl>
                          <Input type="number" value={String(field.value ?? 1)} onChange={(event) => field.onChange(event.target.value)} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                <FormField
                  control={recurringCreateForm.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start date</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="xl:col-span-2">
                  <Button type="submit">Create recurring transaction</Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      <Separator className="my-8" />

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Accounts</CardTitle>
            <CardDescription>Edit balances or remove unused accounts.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accounts.map((account) => (
                  <TableRow key={account.id}>
                    <TableCell>{account.name}</TableCell>
                    <TableCell>{account.type}</TableCell>
                    <TableCell className="text-right">{formatCurrency(account.currentBalance)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => openEditAccount(account)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => setDialogState({ type: 'delete-account', payload: account })}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Categories</CardTitle>
            <CardDescription>Keep your income and expense buckets tidy.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Color</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell>{category.name}</TableCell>
                    <TableCell>{category.type}</TableCell>
                    <TableCell>
                      <span className="inline-flex h-5 w-5 rounded-full border border-[var(--border)]" style={{ backgroundColor: category.color ?? '#176b6c' }} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => openEditCategory(category)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => setDialogState({ type: 'delete-category', payload: category })}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Budgets</CardTitle>
            <CardDescription>Adjust monthly limits or remove outdated plans.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>Month</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {budgets.map((budget) => (
                  <TableRow key={budget.id}>
                    <TableCell>{budget.category.name}</TableCell>
                    <TableCell>
                      {budget.month}/{budget.year}
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(budget.amount)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => openEditBudget(budget)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => setDialogState({ type: 'delete-budget', payload: budget })}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Transactions</CardTitle>
            <CardDescription>Correct entries or remove one-offs.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 grid gap-4 md:grid-cols-[1fr_220px]">
              <div className="flex flex-col gap-2">
                <Label htmlFor="transaction-search">Search transactions</Label>
                <Input
                  id="transaction-search"
                  placeholder="Search by description, account, or category"
                  value={transactionSearch}
                  onChange={(event) => setTransactionSearch(event.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="transaction-filter-type">Type</Label>
                <Select value={transactionTypeFilter} onValueChange={setTransactionTypeFilter}>
                  <SelectTrigger id="transaction-filter-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All types</SelectItem>
                    <SelectItem value="INCOME">Income</SelectItem>
                    <SelectItem value="EXPENSE">Expense</SelectItem>
                    <SelectItem value="TRANSFER">Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {filteredTransactions.length === 0 ? (
              <Alert>
                <AlertTitle>No matching transactions</AlertTitle>
                <AlertDescription>
                  Adjust your filters or create a new transaction to start building activity history.
                </AlertDescription>
              </Alert>
            ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>{transaction.description}</TableCell>
                    <TableCell>{transaction.type}</TableCell>
                    <TableCell>{transaction.account.name}</TableCell>
                    <TableCell className="text-right">{formatCurrency(transaction.amount)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => openEditTransaction(transaction)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => setDialogState({ type: 'delete-transaction', payload: transaction })}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recurring schedule</CardTitle>
            <CardDescription>Pause, resume, edit, or remove scheduled items.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 grid gap-4 md:grid-cols-[1fr_220px]">
              <div className="flex flex-col gap-2">
                <Label htmlFor="recurring-search">Search recurring items</Label>
                <Input
                  id="recurring-search"
                  placeholder="Search by description or account"
                  value={recurringSearch}
                  onChange={(event) => setRecurringSearch(event.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="recurring-filter-status">Status</Label>
                <Select value={recurringStatusFilter} onValueChange={setRecurringStatusFilter}>
                  <SelectTrigger id="recurring-filter-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All statuses</SelectItem>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="PAUSED">Paused</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {filteredRecurringTransactions.length === 0 ? (
              <Alert>
                <AlertTitle>No recurring schedules found</AlertTitle>
                <AlertDescription>
                  Try a different filter or create a recurring transaction to automate scheduled cash flow.
                </AlertDescription>
              </Alert>
            ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead>Frequency</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Next run</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecurringTransactions.map((recurringTransaction) => (
                  <TableRow key={recurringTransaction.id}>
                    <TableCell>{recurringTransaction.description}</TableCell>
                    <TableCell>{recurringTransaction.frequency}</TableCell>
                    <TableCell>
                      <Badge variant={recurringTransaction.status === 'ACTIVE' ? 'success' : 'outline'}>
                        {recurringTransaction.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {new Date(recurringTransaction.nextRunAt).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleRecurringStatus(recurringTransaction)}
                        >
                          {recurringTransaction.status === 'ACTIVE' ? (
                            <Pause className="h-4 w-4" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => openEditRecurring(recurringTransaction)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => setDialogState({ type: 'delete-recurring', payload: recurringTransaction })}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={dialogState.type === 'edit-account'} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit account</DialogTitle>
            <DialogDescription>Update account details and current balance.</DialogDescription>
          </DialogHeader>
          <form onSubmit={submitEditAccount} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-account-name">Name</Label>
              <Input id="edit-account-name" value={editAccountForm.name} onChange={(event) => setEditAccountForm((current) => ({ ...current, name: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-account-type">Type</Label>
              <Select value={editAccountForm.type} onValueChange={(value) => setEditAccountForm((current) => ({ ...current, type: value }))}>
                <SelectTrigger id="edit-account-type"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['CASH', 'CHECKING', 'SAVINGS', 'CREDIT_CARD', 'INVESTMENT', 'LOAN'].map((type) => (
                    <SelectItem key={type} value={type}>{type.replaceAll('_', ' ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-account-balance">Current balance</Label>
              <Input id="edit-account-balance" type="number" value={editAccountForm.currentBalance} onChange={(event) => setEditAccountForm((current) => ({ ...current, currentBalance: event.target.value }))} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>Cancel</Button>
              <Button type="submit">Save changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogState.type === 'edit-category'} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit category</DialogTitle>
            <DialogDescription>Update category naming and classification.</DialogDescription>
          </DialogHeader>
          <form onSubmit={submitEditCategory} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-category-name">Name</Label>
              <Input id="edit-category-name" value={editCategoryForm.name} onChange={(event) => setEditCategoryForm((current) => ({ ...current, name: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-category-type">Type</Label>
              <Select value={editCategoryForm.type} onValueChange={(value) => setEditCategoryForm((current) => ({ ...current, type: value }))}>
                <SelectTrigger id="edit-category-type"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="INCOME">Income</SelectItem>
                  <SelectItem value="EXPENSE">Expense</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-category-color">Color</Label>
              <Input id="edit-category-color" type="color" value={editCategoryForm.color} onChange={(event) => setEditCategoryForm((current) => ({ ...current, color: event.target.value }))} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>Cancel</Button>
              <Button type="submit">Save changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogState.type === 'edit-budget'} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit budget</DialogTitle>
            <DialogDescription>Adjust category, month, or amount.</DialogDescription>
          </DialogHeader>
          <form onSubmit={submitEditBudget} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-budget-category">Category</Label>
              <Select value={editBudgetForm.categoryId} onValueChange={(value) => setEditBudgetForm((current) => ({ ...current, categoryId: value }))}>
                <SelectTrigger id="edit-budget-category"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {categories.filter((category) => category.type === 'EXPENSE').map((category) => (
                    <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <Input type="number" value={editBudgetForm.amount} onChange={(event) => setEditBudgetForm((current) => ({ ...current, amount: event.target.value }))} />
              <Input type="number" value={editBudgetForm.month} onChange={(event) => setEditBudgetForm((current) => ({ ...current, month: event.target.value }))} />
              <Input type="number" value={editBudgetForm.year} onChange={(event) => setEditBudgetForm((current) => ({ ...current, year: event.target.value }))} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>Cancel</Button>
              <Button type="submit">Save changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogState.type === 'edit-transaction'} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit transaction</DialogTitle>
            <DialogDescription>Correct the entry details.</DialogDescription>
          </DialogHeader>
          <form onSubmit={submitEditTransaction} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Select value={editTransactionForm.accountId} onValueChange={(value) => setEditTransactionForm((current) => ({ ...current, accountId: value }))}>
                <SelectTrigger><SelectValue placeholder="Account" /></SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>{account.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={editTransactionForm.categoryId} onValueChange={(value) => setEditTransactionForm((current) => ({ ...current, categoryId: value }))}>
                <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Select value={editTransactionForm.type} onValueChange={(value) => setEditTransactionForm((current) => ({ ...current, type: value }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="INCOME">Income</SelectItem>
                  <SelectItem value="EXPENSE">Expense</SelectItem>
                  <SelectItem value="TRANSFER">Transfer</SelectItem>
                </SelectContent>
              </Select>
              <Input type="number" value={editTransactionForm.amount} onChange={(event) => setEditTransactionForm((current) => ({ ...current, amount: event.target.value }))} />
            </div>
            <Input value={editTransactionForm.description} onChange={(event) => setEditTransactionForm((current) => ({ ...current, description: event.target.value }))} />
            <Input type="datetime-local" value={editTransactionForm.transactionDate} onChange={(event) => setEditTransactionForm((current) => ({ ...current, transactionDate: event.target.value }))} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>Cancel</Button>
              <Button type="submit">Save changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogState.type === 'edit-recurring'} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit recurring transaction</DialogTitle>
            <DialogDescription>Adjust the schedule and status.</DialogDescription>
          </DialogHeader>
          <form onSubmit={submitEditRecurring} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Select value={editRecurringForm.accountId} onValueChange={(value) => setEditRecurringForm((current) => ({ ...current, accountId: value }))}>
                <SelectTrigger><SelectValue placeholder="Account" /></SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>{account.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={editRecurringForm.categoryId} onValueChange={(value) => setEditRecurringForm((current) => ({ ...current, categoryId: value }))}>
                <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Input value={editRecurringForm.description} onChange={(event) => setEditRecurringForm((current) => ({ ...current, description: event.target.value }))} />
              <Input type="number" value={editRecurringForm.amount} onChange={(event) => setEditRecurringForm((current) => ({ ...current, amount: event.target.value }))} />
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <Select value={editRecurringForm.type} onValueChange={(value) => setEditRecurringForm((current) => ({ ...current, type: value }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="INCOME">Income</SelectItem>
                  <SelectItem value="EXPENSE">Expense</SelectItem>
                  <SelectItem value="TRANSFER">Transfer</SelectItem>
                </SelectContent>
              </Select>
              <Select value={editRecurringForm.frequency} onValueChange={(value) => setEditRecurringForm((current) => ({ ...current, frequency: value }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="WEEKLY">Weekly</SelectItem>
                  <SelectItem value="MONTHLY">Monthly</SelectItem>
                  <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                  <SelectItem value="YEARLY">Yearly</SelectItem>
                </SelectContent>
              </Select>
              <Select value={editRecurringForm.status} onValueChange={(value) => setEditRecurringForm((current) => ({ ...current, status: value }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="PAUSED">Paused</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {editRecurringForm.frequency === 'WEEKLY' ? (
              <Input type="number" value={editRecurringForm.dayOfWeek} onChange={(event) => setEditRecurringForm((current) => ({ ...current, dayOfWeek: event.target.value }))} />
            ) : (
              <Input type="number" value={editRecurringForm.dayOfMonth} onChange={(event) => setEditRecurringForm((current) => ({ ...current, dayOfMonth: event.target.value }))} />
            )}
            <Input type="datetime-local" value={editRecurringForm.startDate} onChange={(event) => setEditRecurringForm((current) => ({ ...current, startDate: event.target.value }))} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>Cancel</Button>
              <Button type="submit">Save changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={
          dialogState.type === 'delete-account' ||
          dialogState.type === 'delete-category' ||
          dialogState.type === 'delete-budget' ||
          dialogState.type === 'delete-transaction' ||
          dialogState.type === 'delete-recurring'
        }
        onOpenChange={(open) => !open && closeDialog()}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete item</DialogTitle>
            <DialogDescription>
              This action cannot be undone. Remove the selected finance record?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button type="button" variant="destructive" onClick={confirmDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  )
}
