import { createFileRoute, useSearch } from '@tanstack/react-router'
import { Plus } from 'lucide-react'
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'

import { ConfirmActionDialog } from '#/components/confirm-action-dialog'
import { CrudPageShell } from '#/components/crud-page-shell'
import { CrudTableCard } from '#/components/crud-table-card'
import { PaginationControls } from '#/components/pagination-controls'
import { useSession } from '#/components/session-provider'
import { Button } from '#/components/ui/button'
import { AccountCardsStrip } from '#/components/transactions/account-cards-strip'
import { InsightsSummaryCards } from '#/components/transactions/insights-summary-cards'
import { TransactionToolbar } from '#/components/transactions/transaction-toolbar'
import { TransactionTable } from '#/components/transactions/transaction-table'
import {
  CreateTransactionDialog,
  transactionSchema,
  type TransactionFormValues,
} from '#/components/transactions/create-transaction-dialog'
import {
  EditTransactionDialog,
  type EditTransactionValues,
} from '#/components/transactions/edit-transaction-dialog'
import { ViewTransactionDialog } from '#/components/transactions/view-transaction-dialog'
import { CustomDateRangeModal } from '#/components/transactions/custom-date-range-modal'
import type {
  TransactionSortField,
  SortDirection,
} from '#/components/transactions/types'
import { useFinanceWorkspaceData } from '#/hooks/use-finance-workspace-data'
import { useProtectedRoute } from '#/hooks/use-protected-route'
import {
  createTransaction,
  deleteTransaction,
  reorderAccounts,
  updateTransaction,
  type Transaction,
} from '#/lib/api'
import {
  getDateRangeForFilter,
  getCurrencySymbol,
  paginateItems,
  toDateTimeLocalValue,
} from '#/lib/finance'

export const Route = createFileRoute('/transactions')({
  component: TransactionsPage,
  validateSearch: (search: Record<string, unknown>): { create?: boolean } =>
    search['create'] === 'true' || search['create'] === true
      ? { create: true }
      : {},
})

function TransactionsPage() {
  const { isAuthenticated } = useSession()
  const { isLoading: isSessionLoading } = useProtectedRoute()
  const { accounts, categories, transactions, currencies, error, refreshAll } =
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
  const [keyboardTransaction, setKeyboardTransaction] =
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
  const [accountOrder, setAccountOrder] = useState<string[]>([])
  const dragOverId = useRef<string | null>(null)

  const createForm = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      accountId: '',
      categoryId: '',
      transferAccountId: '',
      type: 'EXPENSE',
      amount: '',
      description: '',
      transactionDate: toDateTimeLocalValue(),
    },
  })

  const [editValues, setEditValues] = useState<EditTransactionValues>({
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

  // Sync accountOrder when accounts load for the first time
  useEffect(() => {
    if (availableAccounts.length > 0 && accountOrder.length === 0) {
      const ids = availableAccounts.map((a) => a.id)
      setAccountOrder(ids)
    }
  }, [availableAccounts, accountOrder.length])

  // Auto-select the first account once accounts are loaded
  useEffect(() => {
    if (availableAccounts.length > 0 && accountFilter === 'ALL') {
      const firstId =
        accountOrder.length > 0 ? accountOrder[0] : availableAccounts[0].id
      setAccountFilter(firstId)
      createForm.setValue('accountId', firstId)
    }
    // Only run when accounts first become available
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availableAccounts.length > 0])

  const orderedAccounts = useMemo(() => {
    if (accountOrder.length === 0) return availableAccounts
    const orderMap = new Map(accountOrder.map((id, i) => [id, i]))
    return [...availableAccounts].sort((a, b) => {
      const ia = orderMap.get(a.id) ?? 999
      const ib = orderMap.get(b.id) ?? 999
      return ia - ib
    })
  }, [availableAccounts, accountOrder])

  const selectedFilterAccount = useMemo(
    () => availableAccounts.find((a) => a.id === accountFilter) ?? null,
    [availableAccounts, accountFilter]
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

  async function handleCreateTransaction(values: TransactionFormValues) {
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
        amount: Number(values.amount),
        description: values.description,
        transactionDate: new Date(values.transactionDate).toISOString(),
      })

      createForm.reset({
        accountId: accountFilter !== 'ALL' ? accountFilter : '',
        categoryId: '',
        transferAccountId: '',
        type: 'EXPENSE',
        amount: '',
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

  const handleDragStart = useCallback(
    (event: React.DragEvent<HTMLButtonElement>, id: string) => {
      event.dataTransfer.setData('text/plain', id)
      event.dataTransfer.effectAllowed = 'move'
    },
    []
  )

  const handleDragOver = useCallback(
    (event: React.DragEvent<HTMLButtonElement>, id: string) => {
      event.preventDefault()
      event.dataTransfer.dropEffect = 'move'
      dragOverId.current = id
    },
    []
  )

  const handleDrop = useCallback(
    async (event: React.DragEvent<HTMLButtonElement>, targetId: string) => {
      event.preventDefault()
      const draggedId = event.dataTransfer.getData('text/plain')
      if (!draggedId || draggedId === targetId) return

      const base =
        accountOrder.length > 0
          ? accountOrder
          : orderedAccounts.map((a) => a.id)
      const from = base.indexOf(draggedId)
      const to = base.indexOf(targetId)
      if (from === -1 || to === -1) return

      const next = [...base]
      next.splice(from, 1)
      next.splice(to, 0, draggedId)
      setAccountOrder(next)
      dragOverId.current = null

      try {
        await reorderAccounts(next)
      } catch {
        setAccountOrder(base)
        toast.error('Failed to save account order')
      }
    },
    [accountOrder, orderedAccounts]
  )

  // Keyboard shortcuts: N = add, D = delete, E = edit, V = view
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const tag = (event.target as HTMLElement).tagName
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return
      if (event.metaKey || event.ctrlKey || event.altKey) return

      const anyModalOpen =
        isCreateOpen ||
        Boolean(editingTransaction) ||
        Boolean(viewingTransaction) ||
        Boolean(deletingTransaction) ||
        isCustomDateModalOpen

      switch (event.key.toLowerCase()) {
        case 'n':
          if (!anyModalOpen) {
            event.preventDefault()
            setIsCreateOpen(true)
          }
          break
        case 'd':
          if (!anyModalOpen && keyboardTransaction) {
            event.preventDefault()
            setDeletingTransaction(keyboardTransaction)
          }
          break
        case 'e':
          if (!anyModalOpen && keyboardTransaction) {
            event.preventDefault()
            openEditTransaction(keyboardTransaction)
          }
          break
        case 'v':
          if (!anyModalOpen && keyboardTransaction) {
            event.preventDefault()
            setViewingTransaction(keyboardTransaction)
          }
          break
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [
    isCreateOpen,
    editingTransaction,
    viewingTransaction,
    deletingTransaction,
    isCustomDateModalOpen,
    keyboardTransaction,
  ])

  const currencySymbol = getCurrencySymbol(
    selectedFilterAccount?.currency ?? 'GHS',
    currencies
  )

  const CurrencyIcon = useMemo(
    () =>
      function CurrencyIcon({ className }: { className?: string }) {
        return (
          <span
            className={className}
            style={{ fontSize: 'inherit', lineHeight: 1, fontWeight: 700 }}
          >
            {currencySymbol}
          </span>
        )
      },
    [currencySymbol]
  )

  if (!isAuthenticated && !isSessionLoading) {
    return null
  }

  return (
    <CrudPageShell
      badge="Finance workspace"
      title="Transactions"
      description="Capture credits, debits, and transfers with enough context to track where money moved and how it was entered."
      icon={CurrencyIcon}
      actions={
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add transaction
        </Button>
      }
    >
      {!error && (
        <AccountCardsStrip
          accounts={orderedAccounts}
          selectedAccountId={accountFilter}
          onSelect={(id) => {
            setAccountFilter(id)
            createForm.setValue('accountId', id)
          }}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        />
      )}

      {!error && (
        <InsightsSummaryCards
          insights={insights}
          typeFilter={typeFilter}
          onTypeFilterChange={setTypeFilter}
          currency={selectedFilterAccount?.currency}
        />
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
            <TransactionToolbar
              search={search}
              onSearchChange={setSearch}
              typeFilter={typeFilter}
              onTypeFilterChange={setTypeFilter}
              accountFilter={accountFilter}
              onAccountFilterChange={setAccountFilter}
              categoryFilter={categoryFilter}
              onCategoryFilterChange={setCategoryFilter}
              dateFilter={dateFilter}
              onDateFilterChange={(value) => {
                setDateFilter(value)
                setDateFrom('')
                setDateTo('')
              }}
              sortField={sortField}
              onSort={updateSort}
              pageSize={pageSize}
              onPageSizeChange={setPageSize}
              accounts={availableAccounts}
              categories={categories}
              onOpenCustomDateModal={() => {
                setTempDateFrom(dateFrom)
                setTempDateTo(dateTo)
                setIsCustomDateModalOpen(true)
              }}
            />
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
          <TransactionTable
            transactions={paginatedTransactions.pageItems}
            currentPage={currentPage}
            pageSize={pageSize}
            sortField={sortField}
            sortDirection={sortDirection}
            selectedTransactionId={keyboardTransaction?.id}
            onSort={updateSort}
            onRowClick={(transaction) => {
              setKeyboardTransaction(transaction)
              setViewingTransaction(transaction)
            }}
            onView={setViewingTransaction}
            onEdit={openEditTransaction}
            onDelete={setDeletingTransaction}
          />
        </CrudTableCard>
      )}

      <CreateTransactionDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        form={createForm}
        onSubmit={handleCreateTransaction}
        availableAccounts={availableAccounts}
        categories={categories}
        selectedAccount={selectedAccount}
        balanceProjection={selectedAccountProjection}
        watchedType={watchedCreateType}
      />

      <CustomDateRangeModal
        open={isCustomDateModalOpen}
        onOpenChange={setIsCustomDateModalOpen}
        dateFrom={tempDateFrom}
        dateTo={tempDateTo}
        onDateFromChange={setTempDateFrom}
        onDateToChange={setTempDateTo}
        onApply={(from, to) => {
          setDateFrom(from)
          setDateTo(to)
          setDateFilter('custom')
          setIsCustomDateModalOpen(false)
        }}
      />

      <EditTransactionDialog
        transaction={editingTransaction}
        values={editValues}
        onChange={setEditValues}
        onSubmit={submitEditTransaction}
        onClose={() => setEditingTransaction(null)}
        accountOptions={editAccountOptions}
        transferAccountOptions={editTransferAccountOptions}
        categories={categories}
      />

      <ViewTransactionDialog
        transaction={viewingTransaction}
        onClose={() => setViewingTransaction(null)}
        onEdit={openEditTransaction}
      />

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
