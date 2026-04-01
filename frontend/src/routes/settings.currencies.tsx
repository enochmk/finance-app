import { createFileRoute } from '@tanstack/react-router'
import { CircleDollarSign, Plus, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

import { ConfirmActionDialog } from '#/components/confirm-action-dialog'
import { CrudPageShell } from '#/components/crud-page-shell'
import { CreateCurrencyDialog } from '#/components/currencies/create-currency-dialog'
import { CurrencyTable } from '#/components/currencies/currency-table'
import { EditCurrencyDialog } from '#/components/currencies/edit-currency-dialog'
import { useSession } from '#/components/session-provider'
import { Button } from '#/components/ui/button'
import { useFinanceWorkspaceData } from '#/hooks/use-finance-workspace-data'
import { useProtectedRoute } from '#/hooks/use-protected-route'
import { deleteCurrency, type Currency } from '#/lib/api'
import { paginateItems } from '#/lib/finance'

export const Route = createFileRoute('/settings/currencies')({
  component: CurrenciesPage,
})

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
      <CurrencyTable
        currencies={currencies}
        sortedCurrencies={sortedCurrencies}
        pageItems={paginated.pageItems}
        currentPage={paginated.currentPage}
        totalPages={paginated.totalPages}
        totalItems={paginated.totalItems}
        search={search}
        sortField={sortField}
        sortDirection={sortDirection}
        onSearchChange={setSearch}
        onSort={updateSort}
        onPageChange={setCurrentPage}
        onEdit={setEditingCurrency}
        onDelete={setDeletingCurrency}
      />

      <CreateCurrencyDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSuccess={refreshAll}
      />

      <EditCurrencyDialog
        currency={editingCurrency}
        onClose={() => setEditingCurrency(null)}
        onSuccess={refreshAll}
      />

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
