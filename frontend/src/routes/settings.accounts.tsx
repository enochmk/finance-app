import { createFileRoute } from '@tanstack/react-router'
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
} from '#/lib/api'
import {
  ACCOUNT_TYPE_OPTIONS,
  formatCurrency,
  formatShortDate,
  paginateItems,
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
})

const accountTypeValues = ACCOUNT_TYPE_OPTIONS.map(
  (option) => option.value
) as [
  (typeof ACCOUNT_TYPE_OPTIONS)[number]['value'],
  ...(typeof ACCOUNT_TYPE_OPTIONS)[number]['value'][],
]

const accountSchema = z.object({
  name: z.string().trim().min(1, 'Account name is required').max(120),
  type: z.enum(accountTypeValues),
  currency: z
    .string()
    .trim()
    .length(3, 'Use a 3-letter currency')
    .transform((value) => value.toUpperCase()),
  color: z.string().trim().min(1, 'Color is required').max(32),
  icon: z.string().trim().max(32).optional(),
  openingBalance: z.coerce.number().finite(),
  institutionName: z.string().trim().max(120).optional(),
  accountNumberMasked: z.string().trim().max(32).optional(),
})

type AccountFormValues = z.infer<typeof accountSchema>
type AccountStatusFilter = 'ALL' | 'ENABLED' | 'DISABLED'
type AccountSortField =
  | 'name'
  | 'type'
  | 'currency'
  | 'openingBalance'
  | 'currentBalance'
  | 'updatedAt'
type SortDirection = 'asc' | 'desc'

type EditAccountState = {
  account: Account
  values: AccountFormValues
}

function getDefaultAccountValues(): AccountFormValues {
  return {
    name: '',
    type: 'CHECKING',
    currency: 'GHS',
    color: '#176b6c',
    icon: '',
    openingBalance: 0,
    institutionName: '',
    accountNumberMasked: '',
  }
}

function getAccountFormValues(account: Account): AccountFormValues {
  return {
    name: account.name,
    type: account.type as AccountFormValues['type'],
    currency: account.currency,
    color: account.color ?? '#176b6c',
    icon: account.icon ?? '',
    openingBalance: Number(account.openingBalance),
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
  const { accounts, error, isLoading, refreshAll } =
    useFinanceWorkspaceData(isAuthenticated)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState<EditAccountState | null>(
    null
  )
  const [deletingAccount, setDeletingAccount] = useState<Account | null>(null)
  const [viewingAccount, setViewingAccount] = useState<Account | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<AccountStatusFilter>('ALL')
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [sortField, setSortField] = useState<AccountSortField>('updatedAt')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  const createForm = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: getDefaultAccountValues(),
  })

  useEffect(() => {
    setCurrentPage(1)
  }, [search, statusFilter, typeFilter, sortField, sortDirection])

  const filteredAccounts = useMemo(() => {
    return accounts.filter((account) => {
      const query = search.trim().toLowerCase()
      const matchesSearch =
        query.length === 0 ||
        account.name.toLowerCase().includes(query) ||
        account.currency.toLowerCase().includes(query) ||
        account.type.replaceAll('_', ' ').toLowerCase().includes(query) ||
        (account.institutionName ?? '').toLowerCase().includes(query) ||
        (account.accountNumberMasked ?? '').toLowerCase().includes(query)

      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'ENABLED' && !account.isArchived) ||
        (statusFilter === 'DISABLED' && account.isArchived)

      const matchesType = typeFilter === 'ALL' || account.type === typeFilter

      return matchesSearch && matchesStatus && matchesType
    })
  }, [accounts, search, statusFilter, typeFilter])

  const sortedAccounts = useMemo(() => {
    const items = [...filteredAccounts]

    items.sort((left, right) => {
      switch (sortField) {
        case 'name':
          return compareValues(left.name, right.name, sortDirection)
        case 'type':
          return compareValues(left.type, right.type, sortDirection)
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

  const accountCounts = useMemo(() => {
    return {
      total: accounts.length,
      enabled: accounts.filter((account) => !account.isArchived).length,
      disabled: accounts.filter((account) => account.isArchived).length,
    }
  }, [accounts])

  async function handleCreateAccount(values: AccountFormValues) {
    try {
      await createAccount({
        name: values.name,
        type: values.type,
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
    })
  }

  async function submitEditAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!editingAccount) {
      return
    }

    const result = accountSchema.safeParse(editingAccount.values)

    if (!result.success) {
      const firstIssue =
        result.error.issues[0]?.message ?? 'Check the account details'
      toast.error('Unable to update account', {
        description: firstIssue,
      })
      return
    }

    try {
      await updateAccount(editingAccount.account.id, {
        name: result.data.name,
        type: result.data.type,
        currency: result.data.currency,
        color: result.data.color,
        icon: result.data.icon || undefined,
        openingBalance: result.data.openingBalance,
        institutionName: result.data.institutionName || undefined,
        accountNumberMasked: result.data.accountNumberMasked || undefined,
      })

      await refreshAll()
      setEditingAccount(null)
      toast.success('Account updated')
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
      title="Accounts"
      description="Create, edit, disable, and retire money buckets without losing control of dashboard visibility or transaction safety."
      icon={Building2}
      actions={
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          Add account
        </Button>
      }
    >
      <div className="grid gap-4 md:grid-cols-3">
        <AccountStatCard label="Total accounts" value={accountCounts.total} />
        <AccountStatCard label="Enabled" value={accountCounts.enabled} />
        <AccountStatCard label="Disabled" value={accountCounts.disabled} />
      </div>

      {error ? (
        <CrudTableCard
          title="Accounts"
          description="Manage the accounts that power balances, dashboard views, and transaction sources."
          emptyTitle="Accounts unavailable"
          emptyDescription={error}
          isEmpty
        >
          <div />
        </CrudTableCard>
      ) : (
        <CrudTableCard
          title="Accounts"
          description="Track account health, search quickly, and control which accounts stay active in the workspace."
          emptyTitle={
            accounts.length === 0
              ? 'No accounts yet'
              : 'No accounts match your filters'
          }
          emptyDescription={
            accounts.length === 0
              ? 'Create the first account to start tracking balances and transactions.'
              : 'Adjust the search, filters, or sorting to find the account you need.'
          }
          isEmpty={sortedAccounts.length === 0}
          toolbar={
            <div className="grid gap-4 xl:grid-cols-[1.2fr_220px_220px_220px]">
              <div className="flex flex-col gap-2">
                <label htmlFor="account-search" className="text-sm font-medium">
                  Search accounts
                </label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
                  <Input
                    id="account-search"
                    placeholder="Name, type, currency, institution"
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
                  htmlFor="account-type-filter"
                  className="text-sm font-medium"
                >
                  Type
                </label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger id="account-type-filter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All types</SelectItem>
                    {ACCOUNT_TYPE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
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
                    <SelectItem value="type">Type</SelectItem>
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
                itemLabel="accounts"
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
                  label="Account"
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
                  className="cursor-pointer hover:bg-[var(--accent)]"
                  onClick={() => setViewingAccount(account)}
                >
                  <TableCell className="font-mono text-sm text-[var(--muted-foreground)]">
                    {(currentPage - 1) * 8 + index + 1}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <span
                        className="inline-flex h-3.5 w-3.5 flex-shrink-0 rounded-full border border-[var(--border)]"
                        style={{
                          backgroundColor: account.color ?? '#176b6c',
                        }}
                      />
                      {(() => {
                        const IconComponent = getAccountIcon(account.icon)
                        return (
                          <IconComponent className="h-4 w-4 flex-shrink-0 text-[var(--muted-foreground)]" />
                        )
                      })()}
                      <div>
                        <p className="font-medium text-[var(--foreground)]">
                          {account.name}
                        </p>
                        {(account.institutionName ||
                          account.accountNumberMasked) && (
                          <p className="text-xs text-[var(--muted-foreground)]">
                            {account.institutionName ||
                              account.accountNumberMasked}
                          </p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={account.isArchived ? 'outline' : 'success'}>
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
            <AccountFormFields form={createForm} />
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
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--secondary)]/40 px-4 py-3 text-sm text-[var(--muted-foreground)]">
              Changing the opening balance also shifts the current balance by
              the same amount, so existing transaction history stays intact.
            </div>
            <AccountEditFields
              values={editingAccount.values}
              setEditingAccount={setEditingAccount}
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
                <p className="text-sm text-[var(--muted-foreground)]">
                  {viewingAccount.name}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium">Type</label>
                <p className="text-sm text-[var(--muted-foreground)]">
                  {viewingAccount.type.replaceAll('_', ' ')}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium">Currency</label>
                <p className="text-sm text-[var(--muted-foreground)]">
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
                  <p className="text-sm text-[var(--muted-foreground)]">
                    {ACCOUNT_ICON_OPTIONS.find(
                      (option) => option.value === viewingAccount.icon
                    )?.label || 'Building'}
                  </p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Opening Balance</label>
                <p className="text-sm text-[var(--muted-foreground)]">
                  {formatCurrency(
                    viewingAccount.openingBalance,
                    viewingAccount.currency
                  )}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium">Current Balance</label>
                <p className="text-sm text-[var(--muted-foreground)]">
                  {formatCurrency(
                    viewingAccount.currentBalance,
                    viewingAccount.currency
                  )}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium">Status</label>
                <p className="text-sm text-[var(--muted-foreground)]">
                  {viewingAccount.isArchived ? 'Disabled' : 'Enabled'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium">Color</label>
                <div className="flex items-center gap-2">
                  <span
                    className="inline-flex h-4 w-4 rounded-full border border-[var(--border)]"
                    style={{
                      backgroundColor: viewingAccount.color ?? '#176b6c',
                    }}
                  />
                  <p className="text-sm text-[var(--muted-foreground)]">
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
                    <p className="text-sm text-[var(--muted-foreground)]">
                      Institution: {viewingAccount.institutionName}
                    </p>
                  )}
                  {viewingAccount.accountNumberMasked && (
                    <p className="text-sm text-[var(--muted-foreground)]">
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
}: {
  form: ReturnType<typeof useForm<AccountFormValues>>
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
              <FormControl>
                <Input
                  {...field}
                  maxLength={3}
                  onChange={(event) =>
                    field.onChange(event.target.value.toUpperCase())
                  }
                />
              </FormControl>
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
                    {ACCOUNT_TYPE_OPTIONS.map((option) => (
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
                type="number"
                value={String(field.value ?? 0)}
                onChange={(event) => field.onChange(event.target.value)}
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
  values,
  setEditingAccount,
}: {
  values: AccountFormValues
  setEditingAccount: Dispatch<SetStateAction<EditAccountState | null>>
}) {
  function updateField<Key extends keyof AccountFormValues>(
    field: Key,
    value: AccountFormValues[Key]
  ) {
    setEditingAccount((current) => {
      if (!current) {
        return current
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
          <Input
            id="edit-account-currency"
            maxLength={3}
            value={values.currency}
            onChange={(event) =>
              updateField('currency', event.target.value.toUpperCase())
            }
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="edit-account-type" className="text-sm font-medium">
            Type
          </label>
          <Select
            value={values.type}
            onValueChange={(value) =>
              updateField('type', value as AccountFormValues['type'])
            }
          >
            <SelectTrigger id="edit-account-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ACCOUNT_TYPE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
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
            type="number"
            value={String(values.openingBalance)}
            onChange={(event) =>
              updateField('openingBalance', Number(event.target.value))
            }
          />
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

function AccountStatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-3xl border border-[var(--border)] bg-[var(--card)] px-5 py-4 shadow-sm">
      <p className="text-sm text-[var(--muted-foreground)]">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-[var(--foreground)]">
        {value}
      </p>
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
