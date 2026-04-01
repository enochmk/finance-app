import { ArrowUpDown, Pencil, Search, Trash2 } from 'lucide-react'

import { CrudTableCard } from '#/components/crud-table-card'
import { PaginationControls } from '#/components/pagination-controls'
import { RowActionsMenu } from '#/components/row-actions-menu'
import { Input } from '#/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#/components/ui/table'
import type { Currency } from '#/lib/api'

export type SortField = 'name' | 'shortcode' | 'symbol'
export type SortDirection = 'asc' | 'desc'

interface CurrencyTableProps {
  currencies: Currency[]
  sortedCurrencies: Currency[]
  pageItems: Currency[]
  currentPage: number
  totalPages: number
  totalItems: number
  search: string
  sortField: SortField
  sortDirection: SortDirection
  onSearchChange: (value: string) => void
  onSort: (field: SortField) => void
  onPageChange: (page: number) => void
  onEdit: (currency: Currency) => void
  onDelete: (currency: Currency) => void
}

export function CurrencyTable({
  currencies,
  sortedCurrencies,
  pageItems,
  currentPage,
  totalPages,
  totalItems,
  search,
  sortField,
  sortDirection,
  onSearchChange,
  onSort,
  onPageChange,
  onEdit,
  onDelete,
}: CurrencyTableProps) {
  return (
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
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="currency-search"
              placeholder="Name, shortcode, or symbol"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      }
      footer={
        sortedCurrencies.length > 0 ? (
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={10}
            itemLabel="currencies"
            onPageChange={onPageChange}
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
              onSort={onSort}
            />
            <SortableHead
              label="Shortcode"
              field="shortcode"
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={onSort}
            />
            <SortableHead
              label="Symbol"
              field="symbol"
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={onSort}
            />
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pageItems.map((currency, index) => (
            <TableRow key={currency.id}>
              <TableCell className="font-mono text-sm text-muted-foreground">
                {(currentPage - 1) * 10 + index + 1}
              </TableCell>
              <TableCell className="font-medium">{currency.name}</TableCell>
              <TableCell>
                <span className="rounded bg-secondary px-2 py-0.5 font-mono text-sm">
                  {currency.shortcode}
                </span>
              </TableCell>
              <TableCell>
                <span className="text-lg font-semibold">{currency.symbol}</span>
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
                        onSelect: () => onEdit(currency),
                        icon: Pencil,
                      },
                      {
                        label: 'Delete',
                        onSelect: () => onDelete(currency),
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
        className="inline-flex items-center gap-1 text-left font-medium text-muted-foreground transition-colors hover:text-foreground"
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
