import { createFileRoute } from '@tanstack/react-router'
import { ArrowUpDown, Pencil, Search, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'

import { ConfirmActionDialog } from '#/components/confirm-action-dialog'
import { CrudDialogShell } from '#/components/crud-dialog-shell'
import { CrudPageShell } from '#/components/crud-page-shell'
import { CrudTableCard } from '#/components/crud-table-card'
import { FinanceSectionNav } from '#/components/finance-section-nav'
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
import { useFinanceWorkspaceData } from '#/hooks/use-finance-workspace-data'
import { useProtectedRoute } from '#/hooks/use-protected-route'
import {
  createTransaction,
  deleteTransaction,
  updateTransaction,
  type Transaction,
} from '#/lib/api'
import {
  ENTRY_MODE_OPTIONS,
  TRANSACTION_TYPE_OPTIONS,
  formatCurrency,
  formatDateTime,
  getEntryModeLabel,
  getTransactionTypeLabel,
  paginateItems,
  toDateTimeLocalValue,
} from '#/lib/finance'

export const Route = createFileRoute('/manage/transactions')({
  component: TransactionsPage,
})

const transactionSchema = z.object({
  accountId: z.string().uuid('Select a valid account'),
  categoryId: z.string().optional(),
  transferAccountId: z.string().optional(),
  type: z.enum(['INCOME', 'EXPENSE', 'TRANSFER']),
  entryMode: z.enum(['MANUAL', 'AUTOMATED']),
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
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null)
  const [deletingTransaction, setDeletingTransaction] =
    useState<Transaction | null>(null)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [accountFilter, setAccountFilter] = useState('ALL')
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [sortField, setSortField] =
    useState<TransactionSortField>('transactionDate')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [pageSize, setPageSize] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)

  const createForm = useForm<z.infer<typeof transactionSchema>>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      accountId: '',
      categoryId: '',
      transferAccountId: '',
      type: 'EXPENSE',
      entryMode: 'MANUAL',
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
    entryMode: 'MANUAL' as 'MANUAL' | 'AUTOMATED',
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
    dateFrom,
    dateTo,
    sortField,
    sortDirection,
    pageSize,
  ])

  const watchedCreateType = createForm.watch('type')

  const availableAccounts = useMemo(
    () => accounts.filter((account) => !account.isArchived),
    [accounts]
  )

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
      const matchesDateFrom = !dateFrom || transactionDate >= new Date(dateFrom)
      const matchesDateTo =
        !dateTo || transactionDate <= new Date(dateTo + 'T23:59:59')

      return (
        matchesSearch &&
        matchesType &&
        matchesAccount &&
        matchesCategory &&
        matchesDateFrom &&
        matchesDateTo
      )
    })
  }, [
    transactions,
    search,
    typeFilter,
    accountFilter,
    categoryFilter,
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
          return (
            (new Date(left.transactionDate).getTime() -
              new Date(right.transactionDate).getTime()) *
            multiplier
          )
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
        entryMode: values.entryMode,
        amount: values.amount,
        description: values.description,
        transactionDate: new Date(values.transactionDate).toISOString(),
      })

      createForm.reset({
        accountId: '',
        categoryId: '',
        transferAccountId: '',
        type: 'EXPENSE',
        entryMode: 'MANUAL',
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
      entryMode: transaction.entryMode ?? 'MANUAL',
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
        entryMode: editValues.entryMode,
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
      navigation={<FinanceSectionNav />}
      actions={
        <Button onClick={() => setIsCreateOpen(true)}>Add transaction</Button>
      }
    >
      {error ? (
        <CrudTableCard
          title="Transactions"
          description="One-off credits, debits, and transfers."
          emptyTitle="Transactions unavailable"
          emptyDescription={error}
          isEmpty
        >
          <div />
        </CrudTableCard>
      ) : (
        <CrudTableCard
          title="Transactions"
          description="One-off credits, debits, and transfers."
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
            <div className="grid gap-4 xl:grid-cols-[1.2fr_180px_180px_180px_180px_140px_140px_140px]">
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
                  htmlFor="transaction-date-from"
                  className="text-sm font-medium"
                >
                  Date from
                </label>
                <Input
                  id="transaction-date-from"
                  type="date"
                  value={dateFrom}
                  onChange={(event) => setDateFrom(event.target.value)}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label
                  htmlFor="transaction-date-to"
                  className="text-sm font-medium"
                >
                  Date to
                </label>
                <Input
                  id="transaction-date-to"
                  type="date"
                  value={dateTo}
                  onChange={(event) => setDateTo(event.target.value)}
                />
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
                <TableHead>Source</TableHead>
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
              {paginatedTransactions.pageItems.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium text-[var(--foreground)]">
                        {transaction.description}
                      </p>
                      <p className="text-xs text-[var(--muted-foreground)]">
                        {transaction.category?.name ??
                          (transaction.transferAccount
                            ? `Transfer to ${transaction.transferAccount.name}`
                            : 'Uncategorized')}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getTransactionTypeLabel(transaction.type)}
                  </TableCell>
                  <TableCell>
                    {getEntryModeLabel(transaction.entryMode)}
                  </TableCell>
                  <TableCell>{transaction.account.name}</TableCell>
                  <TableCell>
                    {formatDateTime(transaction.transactionDate)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(
                      transaction.amount,
                      transaction.account.currency
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end">
                      <RowActionsMenu
                        actions={[
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
      >
        <Form {...createForm}>
          <form
            onSubmit={createForm.handleSubmit(handleCreateTransaction)}
            className="space-y-4"
          >
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={createForm.control}
                name="accountId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account</FormLabel>
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
                      <FormLabel>Transfer account</FormLabel>
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
                      <FormLabel>Category</FormLabel>
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
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={createForm.control}
                name="entryMode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Source</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ENTRY_MODE_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={createForm.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
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
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={createForm.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
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
            </div>
            <FormField
              control={createForm.control}
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
              control={createForm.control}
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
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Create transaction</Button>
            </DialogFooter>
          </form>
        </Form>
      </CrudDialogShell>

      <CrudDialogShell
        open={Boolean(editingTransaction)}
        onOpenChange={(open) => !open && setEditingTransaction(null)}
        title="Edit transaction"
        description="Correct the transaction details or reclassify the activity."
      >
        <form onSubmit={submitEditTransaction} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Select
              value={editValues.entryMode}
              onValueChange={(value) =>
                setEditValues((current) => ({
                  ...current,
                  entryMode: value as 'MANUAL' | 'AUTOMATED',
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Source" />
              </SelectTrigger>
              <SelectContent>
                {ENTRY_MODE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
