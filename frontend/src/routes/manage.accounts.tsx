import { createFileRoute } from '@tanstack/react-router'
import { Pencil, Trash2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'
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
  FormDescription,
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
  createAccount,
  deleteAccount,
  updateAccount,
  type Account,
} from '#/lib/api'
import {
  ACCOUNT_TYPE_OPTIONS,
  formatCurrency,
  paginateItems,
} from '#/lib/finance'

export const Route = createFileRoute('/manage/accounts')({
  component: AccountsPage,
})

const accountSchema = z.object({
  name: z.string().trim().min(1, 'Account name is required').max(120),
  type: z.enum([
    'CASH',
    'CHECKING',
    'SAVINGS',
    'CREDIT_CARD',
    'INVESTMENT',
    'LOAN',
  ]),
  openingBalance: z.coerce.number().finite(),
})

function AccountsPage() {
  const { isAuthenticated } = useSession()
  const { isLoading: isSessionLoading } = useProtectedRoute()
  const { accounts, error, refreshAll } =
    useFinanceWorkspaceData(isAuthenticated)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState<Account | null>(null)
  const [deletingAccount, setDeletingAccount] = useState<Account | null>(null)
  const [currentPage, setCurrentPage] = useState(1)

  const createForm = useForm<z.infer<typeof accountSchema>>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      name: '',
      type: 'CHECKING',
      openingBalance: 0,
    },
  })

  const [editValues, setEditValues] = useState({
    name: '',
    type: 'CHECKING',
    currentBalance: '0',
  })

  const paginatedAccounts = paginateItems(accounts, currentPage, 8)

  async function handleCreateAccount(values: z.infer<typeof accountSchema>) {
    try {
      await createAccount({
        name: values.name,
        type: values.type,
        openingBalance: values.openingBalance,
        currentBalance: values.openingBalance,
      })

      createForm.reset({
        name: '',
        type: 'CHECKING',
        openingBalance: 0,
      })
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
    setEditValues({
      name: account.name,
      type: account.type,
      currentBalance: String(account.currentBalance),
    })
    setEditingAccount(account)
  }

  async function submitEditAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!editingAccount) {
      return
    }

    try {
      await updateAccount(editingAccount.id, {
        name: editValues.name,
        type: editValues.type,
        currentBalance: Number(editValues.currentBalance),
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

  if (!isAuthenticated && !isSessionLoading) {
    return null
  }

  return (
    <CrudPageShell
      badge="Finance workspace"
      title="Accounts"
      description="Manage every balance-holding resource that powers the dashboard and reports."
      navigation={<FinanceSectionNav />}
      actions={
        <Button onClick={() => setIsCreateOpen(true)}>Add account</Button>
      }
    >
      {error ? (
        <CrudTableCard
          title="Accounts"
          description="Bank accounts, cards, cash, investments, and loans."
          emptyTitle="Accounts unavailable"
          emptyDescription={error}
          isEmpty
        >
          <div />
        </CrudTableCard>
      ) : (
        <CrudTableCard
          title="Accounts"
          description="Bank accounts, cards, cash, investments, and loans."
          emptyTitle="No accounts yet"
          emptyDescription="Create an account to start tracking balances across your workspace."
          isEmpty={accounts.length === 0}
          footer={
            accounts.length > 0 ? (
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
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Institution</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedAccounts.pageItems.map((account) => (
                <TableRow key={account.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium text-[var(--foreground)]">
                        {account.name}
                      </p>
                      <p className="text-xs text-[var(--muted-foreground)]">
                        {account.accountNumberMasked
                          ? `•••• ${account.accountNumberMasked}`
                          : account.isArchived
                            ? 'Archived'
                            : 'Active'}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>{account.type.replaceAll('_', ' ')}</TableCell>
                  <TableCell>
                    {account.institutionName ?? 'Manual account'}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(account.currentBalance, account.currency)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end">
                      <RowActionsMenu
                        actions={[
                          {
                            label: 'Edit',
                            onSelect: () => openEditAccount(account),
                            icon: Pencil,
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
        description="Add a wallet, bank account, credit card, investment account, or loan."
      >
        <Form {...createForm}>
          <form
            onSubmit={createForm.handleSubmit(handleCreateAccount)}
            className="space-y-4"
          >
            <FormField
              control={createForm.control}
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
              control={createForm.control}
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
              control={createForm.control}
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
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Create account</Button>
            </DialogFooter>
          </form>
        </Form>
      </CrudDialogShell>

      <CrudDialogShell
        open={Boolean(editingAccount)}
        onOpenChange={(open) => !open && setEditingAccount(null)}
        title="Edit account"
        description="Update the account name, classification, or current balance."
      >
        <form onSubmit={submitEditAccount} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="edit-account-name" className="text-sm font-medium">
              Name
            </label>
            <Input
              id="edit-account-name"
              value={editValues.name}
              onChange={(event) =>
                setEditValues((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="edit-account-type" className="text-sm font-medium">
              Type
            </label>
            <Select
              value={editValues.type}
              onValueChange={(value) =>
                setEditValues((current) => ({ ...current, type: value }))
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
          <div className="space-y-2">
            <label
              htmlFor="edit-account-balance"
              className="text-sm font-medium"
            >
              Current balance
            </label>
            <Input
              id="edit-account-balance"
              type="number"
              value={editValues.currentBalance}
              onChange={(event) =>
                setEditValues((current) => ({
                  ...current,
                  currentBalance: event.target.value,
                }))
              }
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditingAccount(null)}
            >
              Cancel
            </Button>
            <Button type="submit">Save changes</Button>
          </DialogFooter>
        </form>
      </CrudDialogShell>

      <ConfirmActionDialog
        open={Boolean(deletingAccount)}
        onOpenChange={(open) => !open && setDeletingAccount(null)}
        title="Delete account"
        description="This removes the selected account from the workspace. This action cannot be undone."
        confirmLabel="Delete account"
        onConfirm={confirmDeleteAccount}
      />
    </CrudPageShell>
  )
}
