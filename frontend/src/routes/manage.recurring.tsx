import { createFileRoute } from '@tanstack/react-router'
import { Pause, Pencil, Play, Trash2 } from 'lucide-react'
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
import { Badge } from '#/components/ui/badge'
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
  createRecurringTransaction,
  deleteRecurringTransaction,
  runRecurringTransactions,
  updateRecurringTransaction,
  type RecurringTransaction,
} from '#/lib/api'
import {
  RECURRING_FREQUENCY_OPTIONS,
  RECURRING_STATUS_OPTIONS,
  TRANSACTION_TYPE_OPTIONS,
  formatCurrency,
  formatDateTime,
  paginateItems,
  toDateTimeLocalValue,
} from '#/lib/finance'

export const Route = createFileRoute('/manage/recurring')({
  component: RecurringPage,
})

const recurringSchema = z.object({
  accountId: z.string().uuid('Select a valid account'),
  categoryId: z.string().optional(),
  transferAccountId: z.string().optional(),
  type: z.enum(['INCOME', 'EXPENSE', 'TRANSFER']),
  amount: z.coerce
    .number()
    .positive('Recurring amount must be greater than zero'),
  description: z.string().trim().min(1, 'Description is required').max(255),
  frequency: z.enum(['WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY']),
  dayOfMonth: z.coerce.number().int().min(1).max(31).optional(),
  dayOfWeek: z.coerce.number().int().min(0).max(6).optional(),
  startDate: z.string().min(1, 'Start date is required'),
  status: z.enum(['ACTIVE', 'PAUSED', 'COMPLETED']).optional(),
})

function RecurringPage() {
  const { isAuthenticated } = useSession()
  const { isLoading: isSessionLoading } = useProtectedRoute()
  const { accounts, categories, recurringTransactions, error, refreshAll } =
    useFinanceWorkspaceData(isAuthenticated)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingRecurring, setEditingRecurring] =
    useState<RecurringTransaction | null>(null)
  const [deletingRecurring, setDeletingRecurring] =
    useState<RecurringTransaction | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [currentPage, setCurrentPage] = useState(1)

  const createForm = useForm<z.infer<typeof recurringSchema>>({
    resolver: zodResolver(recurringSchema),
    defaultValues: {
      accountId: '',
      categoryId: '',
      transferAccountId: '',
      type: 'EXPENSE',
      amount: 0,
      description: '',
      frequency: 'MONTHLY',
      dayOfMonth: 1,
      dayOfWeek: 1,
      startDate: toDateTimeLocalValue(),
      status: 'ACTIVE',
    },
  })

  const [editValues, setEditValues] = useState({
    accountId: '',
    categoryId: '',
    transferAccountId: '',
    type: 'EXPENSE',
    amount: '0',
    description: '',
    frequency: 'MONTHLY',
    dayOfMonth: '1',
    dayOfWeek: '1',
    startDate: toDateTimeLocalValue(),
    status: 'ACTIVE',
  })

  const watchedCreateType = createForm.watch('type')
  const watchedCreateFrequency = createForm.watch('frequency')

  const filteredRecurringTransactions = useMemo(() => {
    return recurringTransactions.filter((recurringTransaction) => {
      const query = search.toLowerCase()
      const matchesSearch =
        recurringTransaction.description.toLowerCase().includes(query) ||
        recurringTransaction.account.name.toLowerCase().includes(query)

      const matchesStatus =
        statusFilter === 'ALL' || recurringTransaction.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [recurringTransactions, search, statusFilter])

  const paginatedRecurringTransactions = paginateItems(
    filteredRecurringTransactions,
    currentPage,
    10
  )

  async function handleCreateRecurring(
    values: z.infer<typeof recurringSchema>
  ) {
    try {
      await createRecurringTransaction({
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
        frequency: values.frequency,
        dayOfMonth:
          values.frequency === 'WEEKLY' ? undefined : values.dayOfMonth,
        dayOfWeek: values.frequency === 'WEEKLY' ? values.dayOfWeek : undefined,
        startDate: new Date(values.startDate).toISOString(),
        status: values.status,
      })

      createForm.reset({
        accountId: '',
        categoryId: '',
        transferAccountId: '',
        type: 'EXPENSE',
        amount: 0,
        description: '',
        frequency: 'MONTHLY',
        dayOfMonth: 1,
        dayOfWeek: 1,
        startDate: toDateTimeLocalValue(),
        status: 'ACTIVE',
      })
      setIsCreateOpen(false)
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
        description:
          runError instanceof Error ? runError.message : 'Request failed',
      })
    }
  }

  function openEditRecurring(recurringTransaction: RecurringTransaction) {
    setEditValues({
      accountId: recurringTransaction.account.id,
      categoryId: recurringTransaction.category?.id ?? '',
      transferAccountId: recurringTransaction.transferAccount?.id ?? '',
      type: recurringTransaction.type,
      amount: String(recurringTransaction.amount),
      description: recurringTransaction.description,
      frequency: recurringTransaction.frequency,
      dayOfMonth: String(recurringTransaction.dayOfMonth ?? 1),
      dayOfWeek: String(recurringTransaction.dayOfWeek ?? 1),
      startDate: toDateTimeLocalValue(recurringTransaction.startDate),
      status: recurringTransaction.status,
    })
    setEditingRecurring(recurringTransaction)
  }

  async function submitEditRecurring(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!editingRecurring) {
      return
    }

    try {
      await updateRecurringTransaction(editingRecurring.id, {
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
        frequency: editValues.frequency,
        dayOfMonth:
          editValues.frequency === 'WEEKLY'
            ? undefined
            : Number(editValues.dayOfMonth),
        dayOfWeek:
          editValues.frequency === 'WEEKLY'
            ? Number(editValues.dayOfWeek)
            : undefined,
        startDate: new Date(editValues.startDate).toISOString(),
        status: editValues.status,
      })
      await refreshAll()
      setEditingRecurring(null)
      toast.success('Recurring transaction updated')
    } catch (updateError) {
      toast.error('Unable to update recurring transaction', {
        description:
          updateError instanceof Error ? updateError.message : 'Request failed',
      })
    }
  }

  async function confirmDeleteRecurring() {
    if (!deletingRecurring) {
      return
    }

    try {
      await deleteRecurringTransaction(deletingRecurring.id)
      await refreshAll()
      setDeletingRecurring(null)
      toast.success('Recurring transaction deleted')
    } catch (deleteError) {
      toast.error('Unable to delete recurring transaction', {
        description:
          deleteError instanceof Error ? deleteError.message : 'Request failed',
      })
    }
  }

  async function toggleRecurringStatus(
    recurringTransaction: RecurringTransaction
  ) {
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
        description:
          toggleError instanceof Error ? toggleError.message : 'Request failed',
      })
    }
  }

  if (!isAuthenticated && !isSessionLoading) {
    return null
  }

  return (
    <CrudPageShell
      badge="Finance workspace"
      title="Recurring items"
      description="Automate repeat cash flow and keep scheduled entries aligned with upcoming periods."
      navigation={<FinanceSectionNav />}
      actions={
        <>
          <Button variant="outline" onClick={handleRunRecurringTransactions}>
            Run due items now
          </Button>
          <Button onClick={() => setIsCreateOpen(true)}>
            Add recurring item
          </Button>
        </>
      }
    >
      {error ? (
        <CrudTableCard
          title="Recurring schedule"
          description="Scheduled income, expenses, and transfers."
          emptyTitle="Recurring items unavailable"
          emptyDescription={error}
          isEmpty
        >
          <div />
        </CrudTableCard>
      ) : (
        <CrudTableCard
          title="Recurring schedule"
          description="Scheduled income, expenses, and transfers."
          emptyTitle="No recurring schedules found"
          emptyDescription="Try a different filter or create a recurring transaction to automate scheduled cash flow."
          isEmpty={filteredRecurringTransactions.length === 0}
          toolbar={
            <div className="grid gap-4 md:grid-cols-[1fr_220px]">
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="recurring-search"
                  className="text-sm font-medium"
                >
                  Search recurring items
                </label>
                <Input
                  id="recurring-search"
                  placeholder="Search by description or account"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="recurring-filter-status"
                  className="text-sm font-medium"
                >
                  Status
                </label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger id="recurring-filter-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All statuses</SelectItem>
                    {RECURRING_STATUS_OPTIONS.map((option) => (
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
            filteredRecurringTransactions.length > 0 ? (
              <PaginationControls
                currentPage={paginatedRecurringTransactions.currentPage}
                totalPages={paginatedRecurringTransactions.totalPages}
                totalItems={paginatedRecurringTransactions.totalItems}
                pageSize={10}
                itemLabel="recurring items"
                onPageChange={setCurrentPage}
              />
            ) : null
          }
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead>Frequency</TableHead>
                <TableHead>Account</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Next run</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedRecurringTransactions.pageItems.map(
                (recurringTransaction) => (
                  <TableRow key={recurringTransaction.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-[var(--foreground)]">
                          {recurringTransaction.description}
                        </p>
                        <p className="text-xs text-[var(--muted-foreground)]">
                          {formatCurrency(
                            recurringTransaction.amount,
                            recurringTransaction.account.currency
                          )}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{recurringTransaction.frequency}</TableCell>
                    <TableCell>{recurringTransaction.account.name}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          recurringTransaction.status === 'ACTIVE'
                            ? 'success'
                            : 'outline'
                        }
                      >
                        {recurringTransaction.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatDateTime(recurringTransaction.nextRunAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end">
                        <RowActionsMenu
                          actions={[
                            {
                              label:
                                recurringTransaction.status === 'ACTIVE'
                                  ? 'Pause'
                                  : 'Resume',
                              onSelect: () =>
                                toggleRecurringStatus(recurringTransaction),
                              icon:
                                recurringTransaction.status === 'ACTIVE'
                                  ? Pause
                                  : Play,
                            },
                            {
                              label: 'Edit',
                              onSelect: () =>
                                openEditRecurring(recurringTransaction),
                              icon: Pencil,
                            },
                            {
                              label: 'Delete',
                              onSelect: () =>
                                setDeletingRecurring(recurringTransaction),
                              icon: Trash2,
                              destructive: true,
                            },
                          ]}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                )
              )}
            </TableBody>
          </Table>
        </CrudTableCard>
      )}

      <CrudDialogShell
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        title="Create recurring transaction"
        description="Schedule an income, expense, or transfer with backend next-run logic."
      >
        <Form {...createForm}>
          <form
            onSubmit={createForm.handleSubmit(handleCreateRecurring)}
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
            <div className="grid gap-4 md:grid-cols-3">
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
                name="frequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Frequency</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {RECURRING_FREQUENCY_OPTIONS.map((option) => (
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
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {RECURRING_STATUS_OPTIONS.map((option) => (
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
            </div>
            {watchedCreateFrequency === 'WEEKLY' ? (
              <FormField
                control={createForm.control}
                name="dayOfWeek"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Day of week</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        value={String(field.value ?? 1)}
                        onChange={(event) => field.onChange(event.target.value)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : (
              <FormField
                control={createForm.control}
                name="dayOfMonth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Day of month</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        value={String(field.value ?? 1)}
                        onChange={(event) => field.onChange(event.target.value)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <FormField
              control={createForm.control}
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
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Create recurring transaction</Button>
            </DialogFooter>
          </form>
        </Form>
      </CrudDialogShell>

      <CrudDialogShell
        open={Boolean(editingRecurring)}
        onOpenChange={(open) => !open && setEditingRecurring(null)}
        title="Edit recurring transaction"
        description="Adjust the schedule, amount, and status."
      >
        <form onSubmit={submitEditRecurring} className="space-y-4">
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
          <div className="grid gap-4 md:grid-cols-3">
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
            <Select
              value={editValues.frequency}
              onValueChange={(value) =>
                setEditValues((current) => ({ ...current, frequency: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RECURRING_FREQUENCY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={editValues.status}
              onValueChange={(value) =>
                setEditValues((current) => ({ ...current, status: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RECURRING_STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {editValues.frequency === 'WEEKLY' ? (
            <Input
              type="number"
              value={editValues.dayOfWeek}
              onChange={(event) =>
                setEditValues((current) => ({
                  ...current,
                  dayOfWeek: event.target.value,
                }))
              }
            />
          ) : (
            <Input
              type="number"
              value={editValues.dayOfMonth}
              onChange={(event) =>
                setEditValues((current) => ({
                  ...current,
                  dayOfMonth: event.target.value,
                }))
              }
            />
          )}
          <Input
            type="datetime-local"
            value={editValues.startDate}
            onChange={(event) =>
              setEditValues((current) => ({
                ...current,
                startDate: event.target.value,
              }))
            }
          />
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditingRecurring(null)}
            >
              Cancel
            </Button>
            <Button type="submit">Save changes</Button>
          </DialogFooter>
        </form>
      </CrudDialogShell>

      <ConfirmActionDialog
        open={Boolean(deletingRecurring)}
        onOpenChange={(open) => !open && setDeletingRecurring(null)}
        title="Delete recurring transaction"
        description="This removes the selected recurring transaction from the workspace. This action cannot be undone."
        confirmLabel="Delete recurring item"
        onConfirm={confirmDeleteRecurring}
      />
    </CrudPageShell>
  )
}
