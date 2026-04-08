import { createFileRoute, useSearch } from '@tanstack/react-router'
import {
  ArrowUpDown,
  Building2,
  Check,
  CheckCircle2,
  CreditCard,
  Eye,
  Heart,
  Pencil,
  PiggyBank,
  Plus,
  Search,
  ShieldBan,
  Smartphone,
  Trash2,
  Wallet,
  X,
} from 'lucide-react'
import {
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type FormEvent,
  type SetStateAction,
} from 'react'
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
  FormDescription,
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
  createAccount,
  deleteAccount,
  updateAccount,
  type Account,
  type Currency,
} from '#/lib/api'
import {
  formatAmountInput,
  formatCurrency,
  formatShortDate,
  paginateItems,
  parseAmountInput,
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

const ACCOUNT_ICON_OPTIONS = [
  { value: 'Building2', label: 'Building' },
  { value: 'PiggyBank', label: 'Piggy Bank' },
  { value: 'Heart', label: 'Heart' },
  { value: 'CreditCard', label: 'Credit Card' },
  { value: 'Smartphone', label: 'Smartphone' },
  { value: 'Wallet', label: 'Wallet' },
] as const

export const Route = createFileRoute('/settings/accounts')({
  component: AccountsPage,
  validateSearch: (search: Record<string, unknown>): { create?: boolean } =>
    search['create'] === 'true' || search['create'] === true
      ? { create: true }
      : {},
})

const accountSchema = z.object({
  name: z.string().trim().min(1, 'Account name is required').max(120),
  currency: z.string().trim().min(1, 'Select a currency'),
  color: z.string().trim().min(1, 'Color is required').max(32),
  icon: z.string().trim().max(32).optional(),
  openingBalance: z.coerce.number().finite(),
  institutionName: z.string().trim().max(120).optional(),
  accountNumberMasked: z.string().trim().max(32).optional(),
})

type AccountFormValues = z.infer<typeof accountSchema>
type AccountEditValues = AccountFormValues & {
  currentBalance: number
}
type AccountStatusFilter = 'ALL' | 'ENABLED' | 'DISABLED'
type AccountSortField =
  | 'name'
  | 'currency'
  | 'openingBalance'
  | 'currentBalance'
  | 'updatedAt'
type SortDirection = 'asc' | 'desc'

type EditAccountState = {
  account: Account
  values: AccountEditValues
  hasCurrentBalanceOverride: boolean
}

const editAccountSchema = accountSchema.extend({
  currentBalance: z.coerce.number().finite(),
})

function getDefaultAccountValues(): AccountFormValues {
  return {
    name: '',
    currency: 'GHS',
    color: '#176b6c',
    icon: '',
    openingBalance: 0,
    institutionName: '',
    accountNumberMasked: '',
  }
}

function getAccountFormValues(account: Account): AccountEditValues {
  return {
    name: account.name,
    currency: account.currency,
    color: account.color ?? '#176b6c',
    icon: account.icon ?? '',
    openingBalance: Number(account.openingBalance),
    currentBalance: Number(account.currentBalance),
    institutionName: account.institutionName ?? '',
    accountNumberMasked: account.accountNumberMasked ?? '',
  }
}

function compareValues(
  left: string | number,
  right: string | number,
  direction: SortDirection
) {
  const multiplier = direction === 'asc' ? 1 : -1

  if (typeof left === 'number' && typeof right === 'number') {
    return (left - right) * multiplier
  }

  return String(left).localeCompare(String(right)) * multiplier
}

function AccountsPage() {
  const { isAuthenticated } = useSession()
  const { isLoading: isSessionLoading } = useProtectedRoute()
  const { accounts, currencies, error, isLoading, refreshAll } =
    useFinanceWorkspaceData(isAuthenticated)
  const { create } = useSearch({ from: '/settings/accounts' })
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  useEffect(() => {
    if (create) setIsCreateOpen(true)
  }, [create])
  const [editingAccount, setEditingAccount] = useState<EditAccountState | null>(
    null
  )
  const [deletingAccount, setDeletingAccount] = useState<Account | null>(null)
  const [viewingAccount, setViewingAccount] = useState<Account | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<AccountStatusFilter>('ALL')
  const [sortField, setSortField] = useState<AccountSortField>('updatedAt')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  const createForm = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: getDefaultAccountValues(),
  })

  useEffect(() => {
    setCurrentPage(1)
  }, [search, statusFilter, sortField, sortDirection])

  const filteredAccounts = useMemo(() => {
    return accounts.filter((account) => {
      const query = search.trim().toLowerCase()
      const matchesSearch =
        query.length === 0 ||
        account.name.toLowerCase().includes(query) ||
        account.currency.toLowerCase().includes(query) ||
        (account.institutionName ?? '').toLowerCase().includes(query) ||
        (account.accountNumberMasked ?? '').toLowerCase().includes(query)

      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'ENABLED' && !account.isArchived) ||
        (statusFilter === 'DISABLED' && account.isArchived)

      return matchesSearch && matchesStatus
    })
  }, [accounts, search, statusFilter])

  const sortedAccounts = useMemo(() => {
    const items = [...filteredAccounts]

    items.sort((left, right) => {
      switch (sortField) {
        case 'name':
          return compareValues(left.name, right.name, sortDirection)
        case 'currency':
          return compareValues(left.currency, right.currency, sortDirection)
        case 'openingBalance':
          return compareValues(
            Number(left.openingBalance),
            Number(right.openingBalance),
            sortDirection
          )
        case 'currentBalance':
          return compareValues(
            Number(left.currentBalance),
            Number(right.currentBalance),
            sortDirection
          )
        case 'updatedAt':
        default:
          return compareValues(
            new Date(left.updatedAt ?? 0).getTime(),
            new Date(right.updatedAt ?? 0).getTime(),
            sortDirection
          )
      }
    })

    return items
  }, [filteredAccounts, sortDirection, sortField])

  const paginatedAccounts = paginateItems(sortedAccounts, currentPage, 8)

  async function handleCreateAccount(values: AccountFormValues) {
    try {
      await createAccount({
        name: values.name,
        currency: values.currency,
        color: values.color,
        icon: values.icon || undefined,
        openingBalance: values.openingBalance,
        currentBalance: values.openingBalance,
        institutionName: values.institutionName || undefined,
        accountNumberMasked: values.accountNumberMasked || undefined,
      })

      createForm.reset(getDefaultAccountValues())
      setIsCreateOpen(false)
      await refreshAll()
      toast.success('Account created')
    } catch (createError) {
      toast.error('Unable to create account', {
        description:
          createError instanceof Error ? createError.message : 'Request failed',
      })
    }
  }

  function openEditAccount(account: Account) {
    setEditingAccount({
      account,
      values: getAccountFormValues(account),
      hasCurrentBalanceOverride: false,
    })
  }

  async function submitEditAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!editingAccount) {
      return
    }

    const result = editAccountSchema.safeParse(editingAccount.values)

    if (!result.success) {
      const firstIssue =
        result.error.issues[0]?.message ?? 'Check the account details'
      toast.error('Unable to update account', {
        description: firstIssue,
      })
      return
    }

    const derivedCurrentBalance =
      Number(editingAccount.account.currentBalance) +
      (result.data.openingBalance -
        Number(editingAccount.account.openingBalance))

    const hasBalanceAdjustment =
      editingAccount.hasCurrentBalanceOverride &&
      result.data.currentBalance !== derivedCurrentBalance

    try {
      await updateAccount(editingAccount.account.id, {
        name: result.data.name,
        currency: result.data.currency,
        color: result.data.color,
        icon: result.data.icon || undefined,
        openingBalance: result.data.openingBalance,
        currentBalance: editingAccount.hasCurrentBalanceOverride
          ? result.data.currentBalance
          : undefined,
        institutionName: result.data.institutionName || undefined,
        accountNumberMasked: result.data.accountNumberMasked || undefined,
      })

      await refreshAll()
      setEditingAccount(null)
      toast.success(
        hasBalanceAdjustment
          ? 'Account updated and balance adjustment recorded'
          : 'Account updated'
      )
    } catch (updateError) {
      toast.error('Unable to update account', {
        description:
          updateError instanceof Error ? updateError.message : 'Request failed',
      })
    }
  }

  async function toggleAccountStatus(account: Account) {
    try {
      await updateAccount(account.id, {
        isArchived: !account.isArchived,
      })

      await refreshAll()
      toast.success(account.isArchived ? 'Account enabled' : 'Account disabled')
    } catch (toggleError) {
      toast.error('Unable to update account status', {
        description:
          toggleError instanceof Error ? toggleError.message : 'Request failed',
      })
    }
  }

  async function confirmDeleteAccount() {
    if (!deletingAccount) {
      return
    }

    try {
      await deleteAccount(deletingAccount.id)
      await refreshAll()
      setDeletingAccount(null)
      toast.success('Account deleted')
    } catch (deleteError) {
      toast.error('Unable to delete account', {
        description:
          deleteError instanceof Error ? deleteError.message : 'Request failed',
      })
    }
  }

  function updateSort(field: AccountSortField) {
    if (sortField === field) {
      setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'))
      return
    }

    setSortField(field)
    setSortDirection(field === 'name' ? 'asc' : 'desc')
  }

  if (!isAuthenticated && !isSessionLoading) {
    return null
  }

  return (
    <CrudPageShell
      badge="Finance workspace"
      title="Wallets"
      description="Create, edit, disable, and retire money buckets without losing control of dashboard visibility or transaction safety."
      icon={Building2}
      actions={
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          Add wallet
        </Button>
      }
    >
      {' '}
      {error ? (
        <CrudTableCard
          title="Wallets"
          description="Manage the wallets that power balances, dashboard views, and transaction sources."
          emptyTitle="Wallets unavailable"
          emptyDescription={error}
          isEmpty
        >
          <div />
        </CrudTableCard>
      ) : (
        <CrudTableCard
          title="Wallets"
          description="Track wallet health, search quickly, and control which wallets stay active in the workspace."
          emptyTitle={
            accounts.length === 0
              ? 'No wallets yet'
              : 'No wallets match your filters'
          }
          emptyDescription={
            accounts.length === 0
              ? 'Create the first wallet to start tracking balances and transactions.'
              : 'Adjust the search, filters, or sorting to find the wallet you need.'
          }
          isEmpty={sortedAccounts.length === 0}
          toolbar={
            <div className="grid gap-4 xl:grid-cols-[1.2fr_220px_220px_220px]">
              <div className="flex flex-col gap-2">
                <label htmlFor="account-search" className="text-sm font-medium">
                  Search wallets
                </label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="account-search"
                    placeholder="Name, currency, institution"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label
                  htmlFor="account-status-filter"
                  className="text-sm font-medium"
                >
                  Status
                </label>
                <Select
                  value={statusFilter}
                  onValueChange={(value) =>
                    setStatusFilter(value as AccountStatusFilter)
                  }
                >
                  <SelectTrigger id="account-status-filter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All statuses</SelectItem>
                    <SelectItem value="ENABLED">Enabled only</SelectItem>
                    <SelectItem value="DISABLED">Disabled only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                <label
                  htmlFor="account-sort-field"
                  className="text-sm font-medium"
                >
                  Sort by
                </label>
                <Select
                  value={sortField}
                  onValueChange={(value) =>
                    updateSort(value as AccountSortField)
                  }
                >
                  <SelectTrigger id="account-sort-field">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="updatedAt">Last updated</SelectItem>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="currency">Currency</SelectItem>
                    <SelectItem value="openingBalance">
                      Opening balance
                    </SelectItem>
                    <SelectItem value="currentBalance">
                      Current balance
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          }
          footer={
            sortedAccounts.length > 0 ? (
              <PaginationControls
                currentPage={paginatedAccounts.currentPage}
                totalPages={paginatedAccounts.totalPages}
                totalItems={paginatedAccounts.totalItems}
                pageSize={8}
                itemLabel="wallets"
                onPageChange={setCurrentPage}
              />
            ) : null
          }
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <SortableHead
                  label="Wallet"
                  onClick={() => updateSort('name')}
                  isActive={sortField === 'name'}
                  direction={sortDirection}
                />
                <TableHead>Status</TableHead>
                <SortableHead
                  label="Currency"
                  onClick={() => updateSort('currency')}
                  isActive={sortField === 'currency'}
                  direction={sortDirection}
                />
                <SortableHead
                  label="Opening"
                  onClick={() => updateSort('openingBalance')}
                  isActive={sortField === 'openingBalance'}
                  direction={sortDirection}
                  className="text-right"
                />
                <SortableHead
                  label="Balance"
                  onClick={() => updateSort('currentBalance')}
                  isActive={sortField === 'currentBalance'}
                  direction={sortDirection}
                  className="text-right"
                />
                <SortableHead
                  label="Updated"
                  onClick={() => updateSort('updatedAt')}
                  isActive={sortField === 'updatedAt'}
                  direction={sortDirection}
                />
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedAccounts.pageItems.map((account, index) => (
                <TableRow
                  key={account.id}
                  className="cursor-pointer hover:brightness-95 dark:hover:brightness-110"
                  style={{
                    backgroundColor: `${account.color ?? '#176b6c'}18`,
                    borderLeft: `3px solid ${account.color ?? '#176b6c'}`,
                  }}
                  onClick={() => setViewingAccount(account)}
                >
                  <TableCell className="font-mono text-sm text-muted-foreground">
                    {(currentPage - 1) * 8 + index + 1}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {(() => {
                        const IconComponent = getAccountIcon(account.icon)
                        return (
                          <IconComponent className="h-4 w-4 shrink-0 text-muted-foreground" />
                        )
                      })()}
                      <div>
                        <p className="font-medium text-foreground">
                          {account.name}
                        </p>
                        {(account.institutionName ||
                          account.accountNumberMasked) && (
                          <p className="text-xs text-muted-foreground">
                            {account.institutionName ||
                              account.accountNumberMasked}
                          </p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={account.isArchived ? 'outline' : 'secondary'}
                      className="font-semibold"
                    >
                      {account.isArchived ? 'Disabled' : 'Enabled'}
                    </Badge>
                  </TableCell>
                  <TableCell>{account.currency}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(account.openingBalance, account.currency)}
                  </TableCell>
                  <TableCell
                    className={`text-right font-medium ${
                      Number(account.currentBalance) < 0
                        ? 'text-destructive'
                        : ''
                    }`}
                  >
                    {formatCurrency(account.currentBalance, account.currency)}
                  </TableCell>
                  <TableCell>
                    {account.updatedAt
                      ? formatShortDate(account.updatedAt)
                      : 'Just now'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div
                      className="flex justify-end"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <RowActionsMenu
                        actions={[
                          {
                            label: 'View',
                            onSelect: () => setViewingAccount(account),
                            icon: Eye,
                          },
                          {
                            label: 'Edit',
                            onSelect: () => openEditAccount(account),
                            icon: Pencil,
                          },
                          {
                            label: account.isArchived ? 'Enable' : 'Disable',
                            onSelect: () => {
                              void toggleAccountStatus(account)
                            },
                            icon: account.isArchived ? CheckCircle2 : ShieldBan,
                          },
                          {
                            label: 'Delete',
                            onSelect: () => setDeletingAccount(account),
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
        title="Create account"
        description="Add a money bucket with the details needed for balances, transactions, and dashboard filtering."
        icon={Plus}
      >
        <Form {...createForm}>
          <form
            onSubmit={createForm.handleSubmit(handleCreateAccount)}
            className="space-y-4"
          >
            <AccountFormFields form={createForm} currencies={currencies} />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
              >
                <X className="h-4 w-4" />
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                <Check className="h-4 w-4" />
                Create account
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </CrudDialogShell>
      <CrudDialogShell
        open={Boolean(editingAccount)}
        onOpenChange={(open) => !open && setEditingAccount(null)}
        title="Edit account"
        description="Update how this account appears, how it is tracked, and the details used around the workspace."
        icon={Pencil}
      >
        {editingAccount ? (
          <form onSubmit={submitEditAccount} className="space-y-4">
            <div className="rounded-2xl border border-border bg-(--secondary)/40 px-4 py-3 text-sm text-muted-foreground">
              Changing the opening balance shifts the derived balance without
              touching history. If you also set the actual current balance, the
              app records the unexplained difference as an automatic transaction
              in the Unknown category.
            </div>
            <AccountEditFields
              account={editingAccount.account}
              values={editingAccount.values}
              hasCurrentBalanceOverride={
                editingAccount.hasCurrentBalanceOverride
              }
              setEditingAccount={setEditingAccount}
              currencies={currencies}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingAccount(null)}
              >
                <X className="h-4 w-4" />
                Cancel
              </Button>
              <Button type="submit">
                <Check className="h-4 w-4" />
                Save changes
              </Button>
            </DialogFooter>
          </form>
        ) : null}
      </CrudDialogShell>
      <CrudDialogShell
        open={Boolean(viewingAccount)}
        onOpenChange={(open) => !open && setViewingAccount(null)}
        title="Account details"
        description="View the complete account information."
        icon={Eye}
      >
        {viewingAccount && (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium">Name</label>
                <p className="text-sm text-muted-foreground">
                  {viewingAccount.name}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium">Currency</label>
                <p className="text-sm text-muted-foreground">
                  {viewingAccount.currency}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium">Icon</label>
                <div className="flex items-center gap-2">
                  {(() => {
                    const IconComponent = getAccountIcon(viewingAccount.icon)
                    return <IconComponent className="h-4 w-4" />
                  })()}
                  <p className="text-sm text-muted-foreground">
                    {ACCOUNT_ICON_OPTIONS.find(
                      (option) => option.value === viewingAccount.icon
                    )?.label || 'Building'}
                  </p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Opening Balance</label>
                <p className="text-sm text-muted-foreground">
                  {formatCurrency(
                    viewingAccount.openingBalance,
                    viewingAccount.currency
                  )}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium">Current Balance</label>
                <p className="text-sm text-muted-foreground">
                  {formatCurrency(
                    viewingAccount.currentBalance,
                    viewingAccount.currency
                  )}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium">Status</label>
                <p className="text-sm text-muted-foreground">
                  {viewingAccount.isArchived ? 'Disabled' : 'Enabled'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium">Color</label>
                <div className="flex items-center gap-2">
                  <span
                    className="inline-flex h-4 w-4 rounded-full border border-border"
                    style={{
                      backgroundColor: viewingAccount.color ?? '#176b6c',
                    }}
                  />
                  <p className="text-sm text-muted-foreground">
                    {viewingAccount.color ?? '#176b6c'}
                  </p>
                </div>
              </div>
            </div>
            {(viewingAccount.institutionName ||
              viewingAccount.accountNumberMasked) && (
              <div>
                <label className="text-sm font-medium">
                  Institution Details
                </label>
                <div className="space-y-1">
                  {viewingAccount.institutionName && (
                    <p className="text-sm text-muted-foreground">
                      Institution: {viewingAccount.institutionName}
                    </p>
                  )}
                  {viewingAccount.accountNumberMasked && (
                    <p className="text-sm text-muted-foreground">
                      Account: {viewingAccount.accountNumberMasked}
                    </p>
                  )}
                </div>
              </div>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setViewingAccount(null)}
              >
                <X className="h-4 w-4" />
                Close
              </Button>
            </DialogFooter>
          </div>
        )}
      </CrudDialogShell>
      <ConfirmActionDialog
        open={Boolean(deletingAccount)}
        onOpenChange={(open) => !open && setDeletingAccount(null)}
        title="Delete account"
        description="This permanently deletes the account and erases every transaction tied to it. Surviving account balances will be recalculated after the purge."
        confirmLabel="Delete account"
        onConfirm={confirmDeleteAccount}
        icon={Trash2}
        confirmIcon={Trash2}
      />
    </CrudPageShell>
  )
}

function AccountFormFields({
  form,
  currencies,
}: {
  form: ReturnType<typeof useForm<AccountFormValues>>
  currencies: Currency[]
}) {
  return (
    <>
      <FormField
        control={form.control}
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

      <div className="grid gap-4 md:grid-cols-2">
        <FormField
          control={form.control}
          name="currency"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Currency</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {currencies.map((c) => (
                    <SelectItem key={c.shortcode} value={c.shortcode}>
                      {c.symbol} {c.name} ({c.shortcode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
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
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <FormField
          control={form.control}
          name="icon"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Icon</FormLabel>
              <FormControl>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ACCOUNT_ICON_OPTIONS.map((option) => (
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

      <FormField
        control={form.control}
        name="openingBalance"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Opening balance</FormLabel>
            <FormControl>
              <Input
                type="text"
                inputMode="decimal"
                value={formatAmountInput(field.value ?? 0)}
                onChange={(event) => {
                  const raw = parseAmountInput(event.target.value)
                  if (raw === '' || /^\d*\.?\d*$/.test(raw)) {
                    field.onChange(raw)
                  }
                }}
              />
            </FormControl>
            <FormDescription>
              New accounts start with this same opening and current balance.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <FormField
          control={form.control}
          name="institutionName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Institution name</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={field.value ?? ''}
                  placeholder="Optional"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="accountNumberMasked"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Account reference</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={field.value ?? ''}
                  placeholder="Optional masked number"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </>
  )
}

function AccountEditFields({
  account,
  values,
  hasCurrentBalanceOverride,
  setEditingAccount,
  currencies,
}: {
  account: Account
  values: AccountEditValues
  hasCurrentBalanceOverride: boolean
  setEditingAccount: Dispatch<SetStateAction<EditAccountState | null>>
  currencies: Currency[]
}) {
  function updateField<Key extends keyof AccountEditValues>(
    field: Key,
    value: AccountEditValues[Key]
  ) {
    setEditingAccount((current) => {
      if (!current) {
        return current
      }

      if (field === 'openingBalance') {
        const nextOpeningBalance = Number(value)
        const openingBalanceDelta =
          nextOpeningBalance - Number(current.values.openingBalance)

        return {
          ...current,
          values: {
            ...current.values,
            openingBalance: nextOpeningBalance,
            currentBalance: current.hasCurrentBalanceOverride
              ? current.values.currentBalance
              : current.values.currentBalance + openingBalanceDelta,
          },
        }
      }

      if (field === 'currentBalance') {
        return {
          ...current,
          hasCurrentBalanceOverride: true,
          values: {
            ...current.values,
            currentBalance: Number(value),
          },
        }
      }

      return {
        ...current,
        values: {
          ...current.values,
          [field]: value,
        },
      }
    })
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="edit-account-name" className="text-sm font-medium">
            Account name
          </label>
          <Input
            id="edit-account-name"
            value={values.name}
            onChange={(event) => updateField('name', event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <label
            htmlFor="edit-account-currency"
            className="text-sm font-medium"
          >
            Currency
          </label>
          <Select
            value={values.currency}
            onValueChange={(value) => updateField('currency', value)}
          >
            <SelectTrigger id="edit-account-currency">
              <SelectValue placeholder="Select currency" />
            </SelectTrigger>
            <SelectContent>
              {currencies.map((c) => (
                <SelectItem key={c.shortcode} value={c.shortcode}>
                  {c.symbol} {c.name} ({c.shortcode})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="edit-account-color" className="text-sm font-medium">
            Color
          </label>
          <Input
            id="edit-account-color"
            type="color"
            value={values.color}
            onChange={(event) => updateField('color', event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="edit-account-opening" className="text-sm font-medium">
            Opening balance
          </label>
          <Input
            id="edit-account-opening"
            type="text"
            inputMode="decimal"
            value={formatAmountInput(values.openingBalance)}
            onChange={(event) => {
              const raw = parseAmountInput(event.target.value)
              if (raw === '' || /^\d*\.?\d*$/.test(raw)) {
                updateField('openingBalance', Number(raw) || 0)
              }
            }}
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <label
              htmlFor="edit-account-current"
              className="text-sm font-medium"
            >
              Actual current balance
            </label>
            {hasCurrentBalanceOverride ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setEditingAccount((current) => {
                    if (!current) {
                      return current
                    }

                    const derivedBalance =
                      Number(account.currentBalance) +
                      (Number(current.values.openingBalance) -
                        Number(account.openingBalance))

                    return {
                      ...current,
                      hasCurrentBalanceOverride: false,
                      values: {
                        ...current.values,
                        currentBalance: derivedBalance,
                      },
                    }
                  })
                }}
              >
                Use derived balance
              </Button>
            ) : null}
          </div>
          <Input
            id="edit-account-current"
            type="text"
            inputMode="decimal"
            value={formatAmountInput(values.currentBalance)}
            onChange={(event) => {
              const raw = parseAmountInput(event.target.value)
              if (raw === '' || /^\d*\.?\d*$/.test(raw)) {
                updateField('currentBalance', Number(raw) || 0)
              }
            }}
          />
          <p className="text-xs text-muted-foreground">
            If this differs from the tracked balance, an Unknown-category
            transaction is created automatically.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label
            htmlFor="edit-account-institution"
            className="text-sm font-medium"
          >
            Institution name
          </label>
          <Input
            id="edit-account-institution"
            value={values.institutionName ?? ''}
            onChange={(event) =>
              updateField('institutionName', event.target.value)
            }
            placeholder="Optional"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="edit-account-number" className="text-sm font-medium">
            Account reference
          </label>
          <Input
            id="edit-account-number"
            value={values.accountNumberMasked ?? ''}
            onChange={(event) =>
              updateField('accountNumberMasked', event.target.value)
            }
            placeholder="Optional masked number"
          />
        </div>
      </div>
    </div>
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
        className="inline-flex items-center gap-1 text-left font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        {label}
        <ArrowUpDown
          className={isActive ? 'h-4 w-4 text-foreground' : 'h-4 w-4'}
        />
        {isActive ? <span className="sr-only">sorted {direction}</span> : null}
      </button>
    </TableHead>
  )
}
