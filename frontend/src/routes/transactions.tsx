import { createFileRoute, useSearch } from '@tanstack/react-router'
import {
  ArrowUpDown,
  Eye,
  Pencil,
  Search,
  Trash2,
  Plus,
  DollarSign,
  Calendar,
  FileText,
  Building2,
  ArrowRightLeft,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Heart,
  CreditCard,
  Smartphone,
  Wallet,
} from 'lucide-react'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'

import { ConfirmActionDialog } from '#/components/confirm-action-dialog'
import { CrudDialogShell } from '#/components/crud-dialog-shell'
import { CrudPageShell } from '#/components/crud-page-shell'
import { CrudTableCard } from '#/components/crud-table-card'
import { PaginationControls } from '#/components/pagination-controls'
import { RowActionsMenu } from '#/components/row-actions-menu'
import { useSession } from '#/components/session-provider'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '#/components/ui/form'
import { Button } from '#/components/ui/button'
import { DialogFooter } from '#/components/ui/dialog'
import { Input } from '#/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#/components/ui/table'
import { Card, CardContent } from '#/components/ui/card'
import { useFinanceWorkspaceData } from '#/hooks/use-finance-workspace-data'
import { useProtectedRoute } from '#/hooks/use-protected-route'
import {
  createTransaction,
  deleteTransaction,
  updateTransaction,
  type Transaction,
} from '#/lib/api'
import {
  ACCOUNT_TYPE_OPTIONS,
  TRANSACTION_TYPE_OPTIONS,
  formatCurrency,
  formatDateTime,
  formatRelativeDate,
  getDateRangeForFilter,
  getTransactionAmountColor,
  getTransactionTypeColor,
  getTransactionTypeLabel,
  paginateItems,
  toDateTimeLocalValue,
} from '#/lib/finance'

function getAccountIcon(iconName?: string | null) {
  switch (iconName) {
    case 'Building2':
      return Building2
    case 'PiggyBank':
      return PiggyBank
    case 'Heart':
      return Heart
    case 'CreditCard':
      return CreditCard
    case 'Smartphone':
      return Smartphone
    case 'Wallet':
      return Wallet
    default:
      return Building2
  }
}

export const Route = createFileRoute('/transactions')({
  component: TransactionsPage,
  validateSearch: (search: Record<string, unknown>): { create?: boolean } =>
    search['create'] === 'true' || search['create'] === true
      ? { create: true }
      : {},
})

const transactionSchema = z.object({
  accountId: z.string().uuid('Select a valid account'),
  categoryId: z.string().optional(),
  transferAccountId: z.string().optional(),
  type: z.enum(['INCOME', 'EXPENSE', 'TRANSFER']),
  amount: z.coerce
    .number()
    .positive('Transaction amount must be greater than zero'),
  description: z.string().trim().min(1, 'Description is required').max(255),
  transactionDate: z.string().min(1, 'Transaction date is required'),
})

type TransactionSortField =
  | 'description'
  | 'type'
  | 'account'
  | 'transactionDate'
  | 'amount'
type SortDirection = 'asc' | 'desc'

function TransactionsPage() {
  const { isAuthenticated } = useSession()
  const { isLoading: isSessionLoading } = useProtectedRoute()
  const { accounts, categories, transactions, error, refreshAll } =
    useFinanceWorkspaceData(isAuthenticated)
  const { create } = useSearch({ from: '/transactions' })
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  useEffect(() => {
    if (create) setIsCreateOpen(true)
  }, [create])
  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null)
  const [deletingTransaction, setDeletingTransaction] =
    useState<Transaction | null>(null)
  const [viewingTransaction, setViewingTransaction] =
    useState<Transaction | null>(null)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [accountFilter, setAccountFilter] = useState('ALL')
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const [dateFilter, setDateFilter] = useState('ALL')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [isCustomDateModalOpen, setIsCustomDateModalOpen] = useState(false)
  const [tempDateFrom, setTempDateFrom] = useState('')
  const [tempDateTo, setTempDateTo] = useState('')
  const [sortField, setSortField] =
    useState<TransactionSortField>('transactionDate')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [pageSize, setPageSize] = useState(5)
  const [currentPage, setCurrentPage] = useState(1)

  const createForm = useForm<z.infer<typeof transactionSchema>>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      accountId: '',
      categoryId: '',
      transferAccountId: '',
      type: 'EXPENSE',
      amount: 0,
      description: '',
      transactionDate: toDateTimeLocalValue(),
    },
  })

  const [editValues, setEditValues] = useState({
    accountId: '',
    categoryId: '',
    transferAccountId: '',
    type: 'EXPENSE',
    amount: '0',
    description: '',
    transactionDate: toDateTimeLocalValue(),
  })

  useEffect(() => {
    setCurrentPage(1)
  }, [
    search,
    typeFilter,
    accountFilter,
    categoryFilter,
    dateFilter,
    dateFrom,
    dateTo,
    sortField,
    sortDirection,
    pageSize,
  ])

  const watchedCreateType = createForm.watch('type')
  const watchedCreateAmount = createForm.watch('amount')

  const availableAccounts = useMemo(
    () => accounts.filter((account) => !account.isArchived),
    [accounts]
  )

  const watchedAccountId = createForm.watch('accountId')

  const selectedAccount = availableAccounts.find(
    (account) => account.id === watchedAccountId
  )

  const selectedAccountProjection = useMemo(() => {
    if (!selectedAccount) {
      return null
    }

    const current = Number(selectedAccount.currentBalance)
    const amt = Number(watchedCreateAmount) || 0
    const projected =
      watchedCreateType === 'INCOME'
        ? current + amt
        : watchedCreateType === 'EXPENSE'
          ? current - amt
          : current - amt

    return {
      projected,
      color: projected >= 0 ? 'text-green-600' : 'text-red-600',
    }
  }, [selectedAccount, watchedCreateAmount, watchedCreateType])

  const editAccountOptions = useMemo(() => {
    if (!editingTransaction) {
      return availableAccounts
    }

    return accounts.filter(
      (account) =>
        !account.isArchived || account.id === editingTransaction.account.id
    )
  }, [accounts, availableAccounts, editingTransaction])

  const editTransferAccountOptions = useMemo(() => {
    if (!editingTransaction) {
      return availableAccounts.filter(
        (account) => account.id !== editValues.accountId
      )
    }

    return accounts.filter(
      (account) =>
        account.id !== editValues.accountId &&
        (!account.isArchived ||
          account.id === editingTransaction.transferAccount?.id)
    )
  }, [accounts, availableAccounts, editValues.accountId, editingTransaction])

  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
      const query = search.toLowerCase()
      const matchesSearch =
        transaction.description.toLowerCase().includes(query) ||
        transaction.account.name.toLowerCase().includes(query) ||
        (transaction.category?.name ?? '').toLowerCase().includes(query)

      const matchesType =
        typeFilter === 'ALL' || transaction.type === typeFilter

      const matchesAccount =
        accountFilter === 'ALL' || transaction.account.id === accountFilter

      const matchesCategory =
        categoryFilter === 'ALL' || transaction.category?.id === categoryFilter

      const transactionDate = new Date(transaction.transactionDate)
      let matchesDate = true

      if (dateFilter !== 'ALL') {
        if (dateFilter === 'custom') {
          const matchesDateFrom =
            !dateFrom || transactionDate >= new Date(dateFrom)
          const matchesDateTo =
            !dateTo || transactionDate <= new Date(dateTo + 'T23:59:59')
          matchesDate = matchesDateFrom && matchesDateTo
        } else {
          const range = getDateRangeForFilter(dateFilter)
          if (range) {
            const fromDate = new Date(range.from)
            const toDate = new Date(range.to + 'T23:59:59')
            matchesDate =
              transactionDate >= fromDate && transactionDate <= toDate
          }
        }
      }

      return (
        matchesSearch &&
        matchesType &&
        matchesAccount &&
        matchesCategory &&
        matchesDate
      )
    })
  }, [
    transactions,
    search,
    typeFilter,
    accountFilter,
    categoryFilter,
    dateFilter,
    dateFrom,
    dateTo,
  ])

  const sortedTransactions = useMemo(() => {
    const items = [...filteredTransactions]

    items.sort((left, right) => {
      const multiplier = sortDirection === 'asc' ? 1 : -1

      switch (sortField) {
        case 'description':
          return left.description.localeCompare(right.description) * multiplier
        case 'type':
          return left.type.localeCompare(right.type) * multiplier
        case 'account':
          return (
            left.account.name.localeCompare(right.account.name) * multiplier
          )
        case 'transactionDate':
          const leftDate = new Date(left.transactionDate).getTime()
          const rightDate = new Date(right.transactionDate).getTime()
          if (sortDirection === 'desc') {
            return rightDate - leftDate // Descending: newer dates first
          } else {
            return leftDate - rightDate // Ascending: older dates first
          }
        case 'amount':
          return (Number(left.amount) - Number(right.amount)) * multiplier
        default:
          return 0
      }
    })

    return items
  }, [filteredTransactions, sortDirection, sortField])

  const paginatedTransactions = paginateItems(
    sortedTransactions,
    currentPage,
    pageSize
  )

  const insights = useMemo(() => {
    const income = filteredTransactions
      .filter((t) => t.type === 'INCOME')
      .reduce((sum, t) => sum + Number(t.amount), 0)
    const expenses = filteredTransactions
      .filter((t) => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + Number(t.amount), 0)
    const transfers = filteredTransactions
      .filter((t) => t.type === 'TRANSFER')
      .reduce((sum, t) => sum + Number(t.amount), 0)
    return {
      income,
      expenses,
      netFlow: income - expenses,
      transfers,
      incomeCount: filteredTransactions.filter((t) => t.type === 'INCOME')
        .length,
      expenseCount: filteredTransactions.filter((t) => t.type === 'EXPENSE')
        .length,
      transferCount: filteredTransactions.filter((t) => t.type === 'TRANSFER')
        .length,
    }
  }, [filteredTransactions])

  async function handleCreateTransaction(
    values: z.infer<typeof transactionSchema>
  ) {
    try {
      await createTransaction({
        accountId: values.accountId,
        categoryId:
          values.type === 'TRANSFER'
            ? undefined
            : values.categoryId || undefined,
        transferAccountId:
          values.type === 'TRANSFER'
            ? values.transferAccountId || undefined
            : undefined,
        type: values.type,
        amount: values.amount,
        description: values.description,
        transactionDate: new Date(values.transactionDate).toISOString(),
      })

      createForm.reset({
        accountId: '',
        categoryId: '',
        transferAccountId: '',
        type: 'EXPENSE',
        amount: 0,
        description: '',
        transactionDate: toDateTimeLocalValue(),
      })
      setIsCreateOpen(false)
      await refreshAll()
      toast.success('Transaction created')
    } catch (createError) {
      toast.error('Unable to create transaction', {
        description:
          createError instanceof Error ? createError.message : 'Request failed',
      })
    }
  }

  function openEditTransaction(transaction: Transaction) {
    setEditValues({
      accountId: transaction.account.id,
      categoryId: transaction.category?.id ?? '',
      transferAccountId: transaction.transferAccount?.id ?? '',
      type: transaction.type,
      amount: String(transaction.amount),
      description: transaction.description,
      transactionDate: toDateTimeLocalValue(transaction.transactionDate),
    })
    setEditingTransaction(transaction)
  }

  async function submitEditTransaction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!editingTransaction) {
      return
    }

    try {
      await updateTransaction(editingTransaction.id, {
        accountId: editValues.accountId,
        categoryId:
          editValues.type === 'TRANSFER'
            ? undefined
            : editValues.categoryId || undefined,
        transferAccountId:
          editValues.type === 'TRANSFER'
            ? editValues.transferAccountId || undefined
            : undefined,
        type: editValues.type,
        amount: Number(editValues.amount),
        description: editValues.description,
        transactionDate: new Date(editValues.transactionDate).toISOString(),
      })
      await refreshAll()
      setEditingTransaction(null)
      toast.success('Transaction updated')
    } catch (updateError) {
      toast.error('Unable to update transaction', {
        description:
          updateError instanceof Error ? updateError.message : 'Request failed',
      })
    }
  }

  async function confirmDeleteTransaction() {
    if (!deletingTransaction) {
      return
    }

    try {
      await deleteTransaction(deletingTransaction.id)
      await refreshAll()
      setDeletingTransaction(null)
      toast.success('Transaction deleted')
    } catch (deleteError) {
      toast.error('Unable to delete transaction', {
        description:
          deleteError instanceof Error ? deleteError.message : 'Request failed',
      })
    }
  }

  function updateSort(field: TransactionSortField) {
    if (sortField === field) {
      setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'))
      return
    }

    setSortField(field)
    setSortDirection(field === 'transactionDate' ? 'desc' : 'asc')
  }

  if (!isAuthenticated && !isSessionLoading) {
    return null
  }

  return (
    <CrudPageShell
      badge="Finance workspace"
      title="Transactions"
      description="Capture credits, debits, and transfers with enough context to track where money moved and how it was entered."
      icon={DollarSign}
      actions={
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add transaction
        </Button>
      }
    >
      {!error && availableAccounts.length > 0 && (
        <div className="mb-6">
          <div className="flex gap-3 overflow-x-auto pb-2">
            <button
              type="button"
              onClick={() => setAccountFilter('ALL')}
              className={`flex-shrink-0 w-28 rounded-xl border cursor-pointer transition-all text-left p-4 ${
                accountFilter === 'ALL'
                  ? 'ring-2 ring-[var(--primary)] border-[var(--primary)] bg-[var(--accent)]'
                  : 'border-[var(--border)] bg-[var(--card)] hover:bg-[var(--accent)]'
              }`}
            >
              <div className="flex items-center gap-2 mb-3">
                <Wallet className="h-4 w-4 text-[var(--muted-foreground)]" />
              </div>
              <p className="text-sm font-semibold text-[var(--foreground)]">
                All accounts
              </p>
              <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                {availableAccounts.length} account
                {availableAccounts.length !== 1 ? 's' : ''}
              </p>
            </button>

            {availableAccounts.map((account) => {
              const AccountIcon = getAccountIcon(account.icon)
              const isSelected = accountFilter === account.id
              const typeLabel =
                ACCOUNT_TYPE_OPTIONS.find((o) => o.value === account.type)
                  ?.label ?? account.type
              return (
                <button
                  key={account.id}
                  type="button"
                  onClick={() => {
                    setAccountFilter(account.id)
                    createForm.setValue('accountId', account.id)
                  }}
                  className={`flex-shrink-0 w-44 rounded-xl border cursor-pointer transition-all text-left p-4 ${
                    isSelected
                      ? 'ring-2 ring-[var(--primary)] border-[var(--primary)] bg-[var(--accent)]'
                      : 'border-[var(--border)] bg-[var(--card)] hover:bg-[var(--accent)]'
                  }`}
                  style={
                    account.color && !isSelected
                      ? { borderLeftColor: account.color, borderLeftWidth: 3 }
                      : undefined
                  }
                >
                  <div className="flex items-center gap-2 mb-3">
                    <AccountIcon
                      className="h-4 w-4"
                      style={
                        account.color ? { color: account.color } : undefined
                      }
                    />
                    <span className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wide truncate">
                      {typeLabel}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-[var(--foreground)] truncate mb-1">
                    {account.name}
                  </p>
                  <p
                    className={`text-lg font-bold ${
                      Number(account.currentBalance) >= 0
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    {formatCurrency(account.currentBalance, account.currency)}
                  </p>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {!error && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wide">
                  Credited
                </span>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </div>
              <p className="text-xl font-bold text-green-600">
                {formatCurrency(insights.income)}
              </p>
              <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                {insights.incomeCount} transaction
                {insights.incomeCount !== 1 ? 's' : ''}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wide">
                  Debited
                </span>
                <TrendingDown className="h-4 w-4 text-red-600" />
              </div>
              <p className="text-xl font-bold text-red-600">
                {formatCurrency(insights.expenses)}
              </p>
              <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                {insights.expenseCount} transaction
                {insights.expenseCount !== 1 ? 's' : ''}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wide">
                  Net flow
                </span>
                <ArrowRightLeft
                  className={`h-4 w-4 ${
                    insights.netFlow >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                />
              </div>
              <p
                className={`text-xl font-bold ${
                  insights.netFlow >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {insights.netFlow < 0 ? '-' : ''}
                {formatCurrency(Math.abs(insights.netFlow))}
              </p>
              <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                {insights.netFlow >= 0 ? 'Surplus' : 'Deficit'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wide">
                  Transfers
                </span>
                <ArrowRightLeft className="h-4 w-4 text-yellow-600" />
              </div>
              <p className="text-xl font-bold text-yellow-600">
                {formatCurrency(insights.transfers)}
              </p>
              <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                {insights.transferCount} transaction
                {insights.transferCount !== 1 ? 's' : ''}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {error ? (
        <CrudTableCard
          emptyTitle="Transactions unavailable"
          emptyDescription={error}
          isEmpty
        >
          <div />
        </CrudTableCard>
      ) : (
        <CrudTableCard
          emptyTitle={
            transactions.length === 0
              ? 'No transactions yet'
              : 'No transactions match your filters'
          }
          emptyDescription={
            transactions.length === 0
              ? 'Create your first transaction to start tracking financial activity.'
              : 'Adjust the search, filters, or sorting to find the transactions you need.'
          }
          isEmpty={sortedTransactions.length === 0}
          toolbar={
            <div className="grid gap-4 xl:grid-cols-[1.2fr_180px_180px_180px_180px_140px_140px_140px_140px]">
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="transaction-search"
                  className="text-sm font-medium"
                >
                  Search transactions
                </label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
                  <Input
                    id="transaction-search"
                    placeholder="Description, account, category"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label
                  htmlFor="transaction-filter-type"
                  className="text-sm font-medium"
                >
                  Type
                </label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger id="transaction-filter-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All types</SelectItem>
                    {TRANSACTION_TYPE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                <label
                  htmlFor="transaction-filter-account"
                  className="text-sm font-medium"
                >
                  Account
                </label>
                <Select value={accountFilter} onValueChange={setAccountFilter}>
                  <SelectTrigger id="transaction-filter-account">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All accounts</SelectItem>
                    {availableAccounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                <label
                  htmlFor="transaction-filter-category"
                  className="text-sm font-medium"
                >
                  Category
                </label>
                <Select
                  value={categoryFilter}
                  onValueChange={setCategoryFilter}
                >
                  <SelectTrigger id="transaction-filter-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                <label
                  htmlFor="transaction-filter-date"
                  className="text-sm font-medium"
                >
                  Date range
                </label>
                <Select
                  value={dateFilter}
                  onValueChange={(value) => {
                    if (value === 'custom') {
                      setTempDateFrom(dateFrom)
                      setTempDateTo(dateTo)
                      setIsCustomDateModalOpen(true)
                    } else {
                      setDateFilter(value)
                      if (value !== 'custom') {
                        setDateFrom('')
                        setDateTo('')
                      }
                    }
                  }}
                >
                  <SelectTrigger id="transaction-filter-date">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All dates</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="last24hours">Last 24 hours</SelectItem>
                    <SelectItem value="last7days">Last 7 days</SelectItem>
                    <SelectItem value="last30days">Last 30 days</SelectItem>
                    <SelectItem value="last6months">Last 6 months</SelectItem>
                    <SelectItem value="custom">Custom range</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                <label
                  htmlFor="transaction-sort-field"
                  className="text-sm font-medium"
                >
                  Sort by
                </label>
                <Select
                  value={sortField}
                  onValueChange={(value) =>
                    updateSort(value as TransactionSortField)
                  }
                >
                  <SelectTrigger id="transaction-sort-field">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="transactionDate">Date</SelectItem>
                    <SelectItem value="description">Description</SelectItem>
                    <SelectItem value="type">Type</SelectItem>
                    <SelectItem value="account">Account</SelectItem>
                    <SelectItem value="amount">Amount</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                <label
                  htmlFor="transaction-page-size"
                  className="text-sm font-medium"
                >
                  Show
                </label>
                <Select
                  value={String(pageSize)}
                  onValueChange={(value) => setPageSize(Number(value))}
                >
                  <SelectTrigger id="transaction-page-size">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          }
          footer={
            sortedTransactions.length > 0 ? (
              <PaginationControls
                currentPage={paginatedTransactions.currentPage}
                totalPages={paginatedTransactions.totalPages}
                totalItems={paginatedTransactions.totalItems}
                pageSize={pageSize}
                itemLabel="transactions"
                onPageChange={setCurrentPage}
              />
            ) : null
          }
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16 min-w-[4rem]">#</TableHead>
                <SortableHead
                  label="Description"
                  onClick={() => updateSort('description')}
                  isActive={sortField === 'description'}
                  direction={sortDirection}
                />
                <SortableHead
                  label="Type"
                  onClick={() => updateSort('type')}
                  isActive={sortField === 'type'}
                  direction={sortDirection}
                />
                <SortableHead
                  label="Account"
                  onClick={() => updateSort('account')}
                  isActive={sortField === 'account'}
                  direction={sortDirection}
                />
                <SortableHead
                  label="Date"
                  onClick={() => updateSort('transactionDate')}
                  isActive={sortField === 'transactionDate'}
                  direction={sortDirection}
                />
                <SortableHead
                  label="Amount"
                  onClick={() => updateSort('amount')}
                  isActive={sortField === 'amount'}
                  direction={sortDirection}
                  className="text-right"
                />
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedTransactions.pageItems.map((transaction, index) => (
                <TableRow
                  key={transaction.id}
                  className="cursor-pointer hover:bg-[var(--accent)]"
                  onClick={() => setViewingTransaction(transaction)}
                >
                  <TableCell className="font-mono text-sm text-[var(--muted-foreground)]">
                    {(currentPage - 1) * pageSize + index + 1}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-[var(--foreground)]">
                        {transaction.description}
                      </p>
                      <p className="text-xs text-[var(--muted-foreground)] flex items-center gap-1">
                        {transaction.category?.icon && (
                          <span>{transaction.category.icon}</span>
                        )}
                        {transaction.category?.name ??
                          (transaction.type === 'TRANSFER'
                            ? 'Transfer'
                            : transaction.transferAccount
                              ? `Transfer to ${transaction.transferAccount.name}`
                              : 'Uncategorized')}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={getTransactionTypeColor(transaction.type)}>
                      {getTransactionTypeLabel(transaction.type)}
                    </span>
                  </TableCell>
                  <TableCell>{transaction.account.name}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-[var(--foreground)]">
                        {formatDateTime(transaction.transactionDate)}
                      </p>
                      <p className="text-xs text-[var(--muted-foreground)]">
                        {formatRelativeDate(transaction.transactionDate)}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <span
                      className={getTransactionAmountColor(transaction.type)}
                    >
                      {formatCurrency(
                        transaction.amount,
                        transaction.account.currency
                      )}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end">
                      <RowActionsMenu
                        actions={[
                          {
                            label: 'View',
                            onSelect: () => setViewingTransaction(transaction),
                            icon: Search,
                          },
                          {
                            label: 'Edit',
                            onSelect: () => openEditTransaction(transaction),
                            icon: Pencil,
                          },
                          {
                            label: 'Delete',
                            onSelect: () => setDeletingTransaction(transaction),
                            icon: Trash2,
                            destructive: true,
                          },
                        ]}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CrudTableCard>
      )}

      <CrudDialogShell
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        title="Create transaction"
        description="Record a one-off credit, debit, or transfer."
        icon={Plus}
        className="transition-colors"
        style={
          selectedAccount?.color
            ? { backgroundColor: selectedAccount.color }
            : {}
        }
      >
        <Form {...createForm}>
          <form
            onSubmit={createForm.handleSubmit(handleCreateTransaction)}
            className="space-y-4"
          >
            <FormField
              control={createForm.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <FormControl>
                    <div className="flex gap-2">
                      {TRANSACTION_TYPE_OPTIONS.map((option) => {
                        const isSelected = field.value === option.value
                        const Icon =
                          option.value === 'INCOME'
                            ? TrendingUp
                            : option.value === 'EXPENSE'
                              ? TrendingDown
                              : ArrowRightLeft
                        return (
                          <Button
                            key={option.value}
                            type="button"
                            variant={isSelected ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => field.onChange(option.value)}
                            className="flex-1"
                          >
                            <Icon className="mr-2 h-4 w-4" />
                            {option.label}
                          </Button>
                        )
                      })}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={createForm.control}
                name="accountId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <Building2 className="inline mr-2 h-4 w-4" />
                      Account
                    </FormLabel>
                    <FormControl>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select account" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableAccounts.map((account) => (
                            <SelectItem key={account.id} value={account.id}>
                              {account.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {watchedCreateType === 'TRANSFER' ? (
                <FormField
                  control={createForm.control}
                  name="transferAccountId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        <ArrowRightLeft className="inline mr-2 h-4 w-4" />
                        Transfer account
                      </FormLabel>
                      <FormControl>
                        <Select
                          value={field.value || ''}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select destination account" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableAccounts
                              .filter(
                                (account) =>
                                  account.id !== createForm.watch('accountId')
                              )
                              .map((account) => (
                                <SelectItem key={account.id} value={account.id}>
                                  {account.name}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : (
                <FormField
                  control={createForm.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        <FileText className="inline mr-2 h-4 w-4" />
                        Category
                      </FormLabel>
                      <FormControl>
                        <Select
                          value={field.value || ''}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories
                              .filter((category) => !category.isArchived)
                              .map((category) => (
                                <SelectItem
                                  key={category.id}
                                  value={category.id}
                                >
                                  {category.name}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {selectedAccount && (
              <div className="rounded-lg border border-[var(--border)] bg-[var(--muted)] px-4 py-3 flex items-center justify-between gap-4 mb-4">
                <div>
                  <p className="text-xs text-[var(--muted-foreground)] mb-0.5">
                    Current balance
                  </p>
                  <p
                    className={`text-sm font-semibold ${
                      Number(selectedAccount.currentBalance) >= 0
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    {formatCurrency(
                      selectedAccount.currentBalance,
                      selectedAccount.currency
                    )}
                  </p>
                </div>
                <ArrowRightLeft className="h-4 w-4 text-[var(--muted-foreground)] flex-shrink-0" />
                <div className="text-right">
                  <p className="text-xs text-[var(--muted-foreground)] mb-0.5">
                    After transaction
                  </p>
                  <p
                    className={`text-sm font-semibold ${
                      selectedAccountProjection?.color ??
                      'text-[var(--muted-foreground)]'
                    }`}
                  >
                    {selectedAccountProjection
                      ? formatCurrency(
                          selectedAccountProjection.projected,
                          selectedAccount.currency
                        )
                      : ''}
                  </p>
                </div>
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={createForm.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <DollarSign className="inline mr-2 h-4 w-4" />
                      Amount
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        value={String(field.value ?? 0)}
                        onChange={(event) => field.onChange(event.target.value)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={createForm.control}
                name="transactionDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <Calendar className="inline mr-2 h-4 w-4" />
                      Date
                    </FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={createForm.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    <FileText className="inline mr-2 h-4 w-4" />
                    Description
                  </FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">
                <Plus className="mr-2 h-4 w-4" />
                Create transaction
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </CrudDialogShell>

      <CrudDialogShell
        open={isCustomDateModalOpen}
        onOpenChange={setIsCustomDateModalOpen}
        title="Select Custom Date Range"
        description="Choose the date range for filtering transactions."
      >
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label htmlFor="custom-date-from" className="text-sm font-medium">
                From Date
              </label>
              <Input
                id="custom-date-from"
                type="date"
                value={tempDateFrom}
                onChange={(event) => setTempDateFrom(event.target.value)}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="custom-date-to" className="text-sm font-medium">
                To Date
              </label>
              <Input
                id="custom-date-to"
                type="date"
                value={tempDateTo}
                onChange={(event) => setTempDateTo(event.target.value)}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsCustomDateModalOpen(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => {
              setDateFrom(tempDateFrom)
              setDateTo(tempDateTo)
              setDateFilter('custom')
              setIsCustomDateModalOpen(false)
            }}
          >
            Apply Range
          </Button>
        </DialogFooter>
      </CrudDialogShell>

      <CrudDialogShell
        open={Boolean(editingTransaction)}
        onOpenChange={(open) => !open && setEditingTransaction(null)}
        title="Edit transaction"
        description="Correct the transaction details or reclassify the activity."
        icon={Pencil}
      >
        <form onSubmit={submitEditTransaction} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Select
              value={editValues.accountId}
              onValueChange={(value) =>
                setEditValues((current) => ({ ...current, accountId: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Account" />
              </SelectTrigger>
              <SelectContent>
                {editAccountOptions.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {editValues.type === 'TRANSFER' ? (
              <Select
                value={editValues.transferAccountId}
                onValueChange={(value) =>
                  setEditValues((current) => ({
                    ...current,
                    transferAccountId: value,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Transfer account" />
                </SelectTrigger>
                <SelectContent>
                  {editTransferAccountOptions.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Select
                value={editValues.categoryId}
                onValueChange={(value) =>
                  setEditValues((current) => ({
                    ...current,
                    categoryId: value,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories
                    .filter(
                      (category) =>
                        !category.isArchived ||
                        category.id === editValues.categoryId
                    )
                    .map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Select
              value={editValues.type}
              onValueChange={(value) =>
                setEditValues((current) => ({
                  ...current,
                  type: value,
                  categoryId: value === 'TRANSFER' ? '' : current.categoryId,
                  transferAccountId:
                    value === 'TRANSFER' ? current.transferAccountId : '',
                }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TRANSACTION_TYPE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="number"
              value={editValues.amount}
              onChange={(event) =>
                setEditValues((current) => ({
                  ...current,
                  amount: event.target.value,
                }))
              }
            />
          </div>
          <Input
            value={editValues.description}
            onChange={(event) =>
              setEditValues((current) => ({
                ...current,
                description: event.target.value,
              }))
            }
          />
          <Input
            type="datetime-local"
            value={editValues.transactionDate}
            onChange={(event) =>
              setEditValues((current) => ({
                ...current,
                transactionDate: event.target.value,
              }))
            }
          />
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditingTransaction(null)}
            >
              Cancel
            </Button>
            <Button type="submit">Save changes</Button>
          </DialogFooter>
        </form>
      </CrudDialogShell>

      <CrudDialogShell
        open={Boolean(viewingTransaction)}
        onOpenChange={(open) => !open && setViewingTransaction(null)}
        title="Transaction details"
        description="View the complete transaction information."
        icon={Eye}
      >
        {viewingTransaction && (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium">Description</label>
                <p className="text-sm text-[var(--muted-foreground)]">
                  {viewingTransaction.description}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium">Type</label>
                <p
                  className={`text-sm ${getTransactionTypeColor(viewingTransaction.type)}`}
                >
                  {getTransactionTypeLabel(viewingTransaction.type)}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium">Account</label>
                <p className="text-sm text-[var(--muted-foreground)]">
                  {viewingTransaction.account.name}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium">Amount</label>
                <p
                  className={`text-sm ${getTransactionAmountColor(viewingTransaction.type)}`}
                >
                  {formatCurrency(
                    viewingTransaction.amount,
                    viewingTransaction.account.currency
                  )}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium">Date</label>
                <p className="text-sm text-[var(--muted-foreground)]">
                  {formatDateTime(viewingTransaction.transactionDate)}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium">Category</label>
                <p className="text-sm text-[var(--muted-foreground)] flex items-center gap-1">
                  {viewingTransaction.category?.icon && (
                    <span>{viewingTransaction.category.icon}</span>
                  )}
                  {viewingTransaction.category?.name ??
                    (viewingTransaction.type === 'TRANSFER'
                      ? 'Transfer'
                      : viewingTransaction.transferAccount
                        ? `Transfer to ${viewingTransaction.transferAccount.name}`
                        : 'Uncategorized')}
                </p>
              </div>
            </div>
            {viewingTransaction.notes && (
              <div>
                <label className="text-sm font-medium">Notes</label>
                <p className="text-sm text-[var(--muted-foreground)]">
                  {viewingTransaction.notes}
                </p>
              </div>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setViewingTransaction(null)}
              >
                Close
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setViewingTransaction(null)
                  openEditTransaction(viewingTransaction)
                }}
              >
                Edit
              </Button>
            </DialogFooter>
          </div>
        )}
      </CrudDialogShell>

      <ConfirmActionDialog
        open={Boolean(deletingTransaction)}
        onOpenChange={(open) => !open && setDeletingTransaction(null)}
        title="Delete transaction"
        description="This removes the selected transaction from the workspace. This action cannot be undone."
        confirmLabel="Delete transaction"
        onConfirm={confirmDeleteTransaction}
      />
    </CrudPageShell>
  )
}

function SortableHead({
  label,
  onClick,
  isActive,
  direction,
  className,
}: {
  label: string
  onClick: () => void
  isActive: boolean
  direction: SortDirection
  className?: string
}) {
  return (
    <TableHead className={className}>
      <button
        type="button"
        onClick={onClick}
        className="inline-flex items-center gap-1 text-left font-medium text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
      >
        {label}
        <ArrowUpDown
          className={isActive ? 'h-4 w-4 text-[var(--foreground)]' : 'h-4 w-4'}
        />
        {isActive ? <span className="sr-only">sorted {direction}</span> : null}
      </button>
    </TableHead>
  )
}
