import { createFileRoute } from '@tanstack/react-router'
import { Pencil, Trash2 } from 'lucide-react'
import { useMemo, useState, type FormEvent } from 'react'
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
  TRANSACTION_TYPE_OPTIONS,
  formatCurrency,
  formatDateTime,
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
  amount: z.coerce
    .number()
    .positive('Transaction amount must be greater than zero'),
  description: z.string().trim().min(1, 'Description is required').max(255),
  transactionDate: z.string().min(1, 'Transaction date is required'),
})

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

  const watchedCreateType = createForm.watch('type')

  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
      const query = search.toLowerCase()
      const matchesSearch =
        transaction.description.toLowerCase().includes(query) ||
        transaction.account.name.toLowerCase().includes(query) ||
        (transaction.category?.name ?? '').toLowerCase().includes(query)

      const matchesType =
        typeFilter === 'ALL' || transaction.type === typeFilter

      return matchesSearch && matchesType
    })
  }, [transactions, search, typeFilter])

  const paginatedTransactions = paginateItems(
    filteredTransactions,
    currentPage,
    10
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

  if (!isAuthenticated && !isSessionLoading) {
    return null
  }

  return (
    <CrudPageShell
      badge="Finance workspace"
      title="Transactions"
      description="Capture one-off money movement with filters that make large histories easier to scan."
      navigation={<FinanceSectionNav />}
      actions={
        <Button onClick={() => setIsCreateOpen(true)}>Add transaction</Button>
      }
    >
      {error ? (
        <CrudTableCard
          title="Transactions"
          description="One-off income, expenses, and transfers."
          emptyTitle="Transactions unavailable"
          emptyDescription={error}
          isEmpty
        >
          <div />
        </CrudTableCard>
      ) : (
        <CrudTableCard
          title="Transactions"
          description="One-off income, expenses, and transfers."
          emptyTitle="No matching transactions"
          emptyDescription="Adjust your filters or add a transaction to start building activity history."
          isEmpty={filteredTransactions.length === 0}
          toolbar={
            <div className="grid gap-4 md:grid-cols-[1fr_220px]">
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="transaction-search"
                  className="text-sm font-medium"
                >
                  Search transactions
                </label>
                <Input
                  id="transaction-search"
                  placeholder="Search by description, account, or category"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
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
            </div>
          }
          footer={
            filteredTransactions.length > 0 ? (
              <PaginationControls
                currentPage={paginatedTransactions.currentPage}
                totalPages={paginatedTransactions.totalPages}
                totalItems={paginatedTransactions.totalItems}
                pageSize={10}
                itemLabel="transactions"
                onPageChange={setCurrentPage}
              />
            ) : null
          }
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Account</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Amount</TableHead>
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
                  <TableCell>{transaction.type}</TableCell>
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
        description="Record a one-off income, expense, or transfer."
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
                          {accounts.map((account) => (
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
                            {accounts
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
                            <SelectValue placeholder="Optional category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category.id} value={category.id}>
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
              value={editValues.accountId}
              onValueChange={(value) =>
                setEditValues((current) => ({ ...current, accountId: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Account" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((account) => (
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
                  {accounts
                    .filter((account) => account.id !== editValues.accountId)
                    .map((account) => (
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
                  {categories.map((category) => (
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
