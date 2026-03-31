import { createFileRoute } from '@tanstack/react-router'
import {
  ArrowUpDown,
  Check,
  CircleDollarSign,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
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
  createCurrency,
  deleteCurrency,
  updateCurrency,
  type Currency,
} from '#/lib/api'
import { paginateItems } from '#/lib/finance'

export const Route = createFileRoute('/settings/currencies')({
  component: CurrenciesPage,
})

const currencySchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(80),
  shortcode: z
    .string()
    .trim()
    .min(1, 'Shortcode is required')
    .max(10)
    .transform((v) => v.toUpperCase()),
  symbol: z.string().trim().min(1, 'Symbol is required').max(10),
})

const editCurrencySchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(80),
  symbol: z.string().trim().min(1, 'Symbol is required').max(10),
})

type CurrencyFormValues = z.infer<typeof currencySchema>
type EditCurrencyFormValues = z.infer<typeof editCurrencySchema>
type SortField = 'name' | 'shortcode' | 'symbol'
type SortDirection = 'asc' | 'desc'

function compareValues(left: string, right: string, direction: SortDirection) {
  const multiplier = direction === 'asc' ? 1 : -1
  return left.localeCompare(right) * multiplier
}

function CurrenciesPage() {
  const { isAuthenticated } = useSession()
  const { isLoading: isSessionLoading } = useProtectedRoute()
  const { currencies, refreshAll } = useFinanceWorkspaceData(isAuthenticated)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingCurrency, setEditingCurrency] = useState<Currency | null>(null)
  const [deletingCurrency, setDeletingCurrency] = useState<Currency | null>(
    null
  )
  const [currentPage, setCurrentPage] = useState(1)
  const [search, setSearch] = useState('')
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')

  const createForm = useForm<CurrencyFormValues>({
    resolver: zodResolver(currencySchema),
    defaultValues: { name: '', shortcode: '', symbol: '' },
  })

  const editForm = useForm<EditCurrencyFormValues>({
    resolver: zodResolver(editCurrencySchema),
    defaultValues: { name: '', symbol: '' },
  })

  useEffect(() => {
    setCurrentPage(1)
  }, [search, sortField, sortDirection])

  const filteredCurrencies = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return currencies
    return currencies.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        c.shortcode.toLowerCase().includes(query) ||
        c.symbol.toLowerCase().includes(query)
    )
  }, [currencies, search])

  const sortedCurrencies = useMemo(() => {
    return [...filteredCurrencies].sort((a, b) =>
      compareValues(a[sortField], b[sortField], sortDirection)
    )
  }, [filteredCurrencies, sortField, sortDirection])

  const paginated = paginateItems(sortedCurrencies, currentPage, 10)

  function updateSort(field: SortField) {
    if (sortField === field) {
      setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'))
      return
    }
    setSortField(field)
    setSortDirection('asc')
  }

  function openEdit(currency: Currency) {
    editForm.reset({ name: currency.name, symbol: currency.symbol })
    setEditingCurrency(currency)
  }

  async function handleCreate(values: CurrencyFormValues) {
    try {
      await createCurrency(values)
      createForm.reset({ name: '', shortcode: '', symbol: '' })
      setIsCreateOpen(false)
      await refreshAll()
      toast.success('Currency created')
    } catch (err) {
      toast.error('Unable to create currency', {
        description: err instanceof Error ? err.message : 'Request failed',
      })
    }
  }

  async function handleEdit(values: EditCurrencyFormValues) {
    if (!editingCurrency) return
    try {
      await updateCurrency(editingCurrency.id, values)
      setEditingCurrency(null)
      await refreshAll()
      toast.success('Currency updated')
    } catch (err) {
      toast.error('Unable to update currency', {
        description: err instanceof Error ? err.message : 'Request failed',
      })
    }
  }

  async function confirmDelete() {
    if (!deletingCurrency) return
    try {
      await deleteCurrency(deletingCurrency.id)
      setDeletingCurrency(null)
      await refreshAll()
      toast.success('Currency deleted')
    } catch (err) {
      toast.error('Unable to delete currency', {
        description: err instanceof Error ? err.message : 'Request failed',
      })
    }
  }

  if (!isAuthenticated && !isSessionLoading) {
    return null
  }

  return (
    <CrudPageShell
      badge="Finance workspace"
      title="Currencies"
      description="Manage the currencies used across accounts and transactions. Each currency has a name, shortcode, and symbol."
      icon={CircleDollarSign}
      actions={
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          Add currency
        </Button>
      }
    >
      <CrudTableCard
        title="Currencies"
        description="All available currencies in the workspace."
        emptyTitle={
          currencies.length === 0
            ? 'No currencies yet'
            : 'No currencies match your search'
        }
        emptyDescription={
          currencies.length === 0
            ? 'Add the first currency to get started.'
            : 'Adjust the search to find the currency you need.'
        }
        isEmpty={sortedCurrencies.length === 0}
        toolbar={
          <div className="flex flex-col gap-2 sm:max-w-sm">
            <label htmlFor="currency-search" className="text-sm font-medium">
              Search currencies
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
              <Input
                id="currency-search"
                placeholder="Name, shortcode, or symbol"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        }
        footer={
          sortedCurrencies.length > 0 ? (
            <PaginationControls
              currentPage={paginated.currentPage}
              totalPages={paginated.totalPages}
              totalItems={paginated.totalItems}
              pageSize={10}
              itemLabel="currencies"
              onPageChange={setCurrentPage}
            />
          ) : null
        }
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10 font-mono text-xs">#</TableHead>
              <SortableHead
                label="Name"
                field="name"
                sortField={sortField}
                sortDirection={sortDirection}
                onSort={updateSort}
              />
              <SortableHead
                label="Shortcode"
                field="shortcode"
                sortField={sortField}
                sortDirection={sortDirection}
                onSort={updateSort}
              />
              <SortableHead
                label="Symbol"
                field="symbol"
                sortField={sortField}
                sortDirection={sortDirection}
                onSort={updateSort}
              />
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.pageItems.map((currency, index) => (
              <TableRow key={currency.id}>
                <TableCell className="font-mono text-sm text-[var(--muted-foreground)]">
                  {(currentPage - 1) * 10 + index + 1}
                </TableCell>
                <TableCell className="font-medium">{currency.name}</TableCell>
                <TableCell>
                  <span className="rounded bg-[var(--secondary)] px-2 py-0.5 font-mono text-sm">
                    {currency.shortcode}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-lg font-semibold">
                    {currency.symbol}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div
                    className="flex justify-end"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <RowActionsMenu
                      actions={[
                        {
                          label: 'Edit',
                          onSelect: () => openEdit(currency),
                          icon: Pencil,
                        },
                        {
                          label: 'Delete',
                          onSelect: () => setDeletingCurrency(currency),
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

      {/* Create dialog */}
      <CrudDialogShell
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        title="Add currency"
        description="Define a new currency with a name, unique shortcode, and symbol."
        icon={Plus}
      >
        <Form {...createForm}>
          <form
            onSubmit={createForm.handleSubmit(handleCreate)}
            className="space-y-4"
          >
            <FormField
              control={createForm.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Ghana Cedis" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={createForm.control}
                name="shortcode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Shortcode</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. GHS"
                        maxLength={10}
                        {...field}
                        onChange={(e) =>
                          field.onChange(e.target.value.toUpperCase())
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={createForm.control}
                name="symbol"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Symbol</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. ₵" maxLength={10} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
              >
                <X className="h-4 w-4" />
                Cancel
              </Button>
              <Button type="submit">
                <Check className="h-4 w-4" />
                Add currency
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </CrudDialogShell>

      {/* Edit dialog */}
      <CrudDialogShell
        open={Boolean(editingCurrency)}
        onOpenChange={(open) => !open && setEditingCurrency(null)}
        title="Edit currency"
        description="Update the display name or symbol. The shortcode cannot be changed."
        icon={Pencil}
      >
        {editingCurrency && (
          <Form {...editForm}>
            <form
              onSubmit={editForm.handleSubmit(handleEdit)}
              className="space-y-4"
            >
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--secondary)]/40 px-4 py-3 text-sm text-[var(--muted-foreground)]">
                Shortcode:{' '}
                <span className="font-mono font-semibold text-[var(--foreground)]">
                  {editingCurrency.shortcode}
                </span>
              </div>
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="symbol"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Symbol</FormLabel>
                    <FormControl>
                      <Input maxLength={10} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingCurrency(null)}
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
          </Form>
        )}
      </CrudDialogShell>

      <ConfirmActionDialog
        open={Boolean(deletingCurrency)}
        onOpenChange={(open) => !open && setDeletingCurrency(null)}
        title="Delete currency"
        description="This permanently removes the currency. Accounts using this currency will retain their shortcode but lose the symbol lookup."
        confirmLabel="Delete currency"
        onConfirm={confirmDelete}
        icon={Trash2}
        confirmIcon={Trash2}
      />
    </CrudPageShell>
  )
}

function SortableHead({
  label,
  field,
  sortField,
  sortDirection,
  onSort,
}: {
  label: string
  field: SortField
  sortField: SortField
  sortDirection: SortDirection
  onSort: (field: SortField) => void
}) {
  return (
    <TableHead>
      <button
        type="button"
        onClick={() => onSort(field)}
        className="inline-flex items-center gap-1 text-left font-medium text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
      >
        {label}
        <ArrowUpDown
          className={
            sortField === field ? 'h-4 w-4 text-[var(--foreground)]' : 'h-4 w-4'
          }
        />
        {sortField === field ? (
          <span className="sr-only">sorted {sortDirection}</span>
        ) : null}
      </button>
    </TableHead>
  )
}
