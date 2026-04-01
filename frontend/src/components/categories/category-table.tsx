import {
  ArrowUpDown,
  Eye,
  EyeOff,
  Pencil,
  RefreshCcw,
  Search,
  Trash2,
} from 'lucide-react'

import { CrudTableCard } from '#/components/crud-table-card'
import { PaginationControls } from '#/components/pagination-controls'
import { RowActionsMenu } from '#/components/row-actions-menu'
import { Badge } from '#/components/ui/badge'
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
import type { Category } from '#/lib/api'
import { CATEGORY_TYPE_OPTIONS } from '#/lib/finance'

export type CategoryStatusFilter = 'ALL' | 'ENABLED' | 'DISABLED'
export type CategorySortField = 'name' | 'type' | 'status'
export type SortDirection = 'asc' | 'desc'

interface CategoryTableProps {
  categories: Category[]
  sortedCategories: Category[]
  pageItems: Category[]
  currentPage: number
  totalPages: number
  totalItems: number
  search: string
  statusFilter: CategoryStatusFilter
  typeFilter: string
  sortField: CategorySortField
  sortDirection: SortDirection
  pageSize: number
  error?: string | null
  onSearchChange: (value: string) => void
  onStatusFilterChange: (value: CategoryStatusFilter) => void
  onTypeFilterChange: (value: string) => void
  onSort: (field: CategorySortField) => void
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  onView: (category: Category) => void
  onEdit: (category: Category) => void
  onToggleVisibility: (category: Category) => void
  onDelete: (category: Category) => void
}

export function CategoryTable({
  categories,
  sortedCategories,
  pageItems,
  currentPage,
  totalPages,
  totalItems,
  search,
  statusFilter,
  typeFilter,
  sortField,
  sortDirection,
  pageSize,
  error,
  onSearchChange,
  onStatusFilterChange,
  onTypeFilterChange,
  onSort,
  onPageChange,
  onPageSizeChange,
  onView,
  onEdit,
  onToggleVisibility,
  onDelete,
}: CategoryTableProps) {
  if (error) {
    return (
      <CrudTableCard
        title="Categories"
        description="Classification buckets for all finance activity, including disabled categories kept for history."
        emptyTitle="Categories unavailable"
        emptyDescription={error}
        isEmpty
      >
        <div />
      </CrudTableCard>
    )
  }

  return (
    <CrudTableCard
      title="Categories"
      description="Classification buckets for all finance activity, including disabled categories kept for history."
      emptyTitle={
        categories.length === 0
          ? 'No categories yet'
          : 'No categories match your filters'
      }
      emptyDescription={
        categories.length === 0
          ? 'Create your first category to organize income and expense activity.'
          : 'Adjust the search, filters, or sorting to find the category you need.'
      }
      isEmpty={sortedCategories.length === 0}
      toolbar={
        <div className="grid gap-4 xl:grid-cols-[1.2fr_220px_220px_220px_140px]">
          <div className="flex flex-col gap-2">
            <label htmlFor="category-search" className="text-sm font-medium">
              Search categories
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
              <Input
                id="category-search"
                placeholder="Name or type"
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label
              htmlFor="category-status-filter"
              className="text-sm font-medium"
            >
              Status
            </label>
            <Select
              value={statusFilter}
              onValueChange={(value) =>
                onStatusFilterChange(value as CategoryStatusFilter)
              }
            >
              <SelectTrigger id="category-status-filter">
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
              htmlFor="category-type-filter"
              className="text-sm font-medium"
            >
              Type
            </label>
            <Select value={typeFilter} onValueChange={onTypeFilterChange}>
              <SelectTrigger id="category-type-filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All types</SelectItem>
                {CATEGORY_TYPE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <label
              htmlFor="category-sort-field"
              className="text-sm font-medium"
            >
              Sort by
            </label>
            <Select
              value={sortField}
              onValueChange={(value) => onSort(value as CategorySortField)}
            >
              <SelectTrigger id="category-sort-field">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="type">Type</SelectItem>
                <SelectItem value="status">Status</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="category-page-size" className="text-sm font-medium">
              Show
            </label>
            <Select
              value={String(pageSize)}
              onValueChange={(value) => onPageSizeChange(Number(value))}
            >
              <SelectTrigger id="category-page-size">
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
        sortedCategories.length > 0 ? (
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={pageSize}
            itemLabel="categories"
            onPageChange={onPageChange}
          />
        ) : null
      }
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">#</TableHead>
            <SortableHead
              label="Name"
              onClick={() => onSort('name')}
              isActive={sortField === 'name'}
              direction={sortDirection}
            />
            <SortableHead
              label="Status"
              onClick={() => onSort('status')}
              isActive={sortField === 'status'}
              direction={sortDirection}
            />
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pageItems.map((category, index) => (
            <TableRow
              key={category.id}
              className="cursor-pointer hover:brightness-95 dark:hover:brightness-110"
              style={{
                backgroundColor: `${category.color ?? '#176b6c'}18`,
                borderLeft: `3px solid ${category.color ?? '#176b6c'}`,
              }}
              onClick={() => onView(category)}
            >
              <TableCell className="font-mono text-sm text-[var(--muted-foreground)]">
                {(currentPage - 1) * pageSize + index + 1}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {category.icon && (
                    <span className="text-base leading-none">
                      {category.icon}
                    </span>
                  )}
                  <span className="font-medium">{category.name}</span>
                </div>
              </TableCell>
              <TableCell>
                <Badge
                  variant={category.isArchived ? 'outline' : 'secondary'}
                  className="font-semibold"
                >
                  {category.isArchived ? 'Disabled' : 'Enabled'}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end">
                  <RowActionsMenu
                    actions={[
                      {
                        label: 'View',
                        onSelect: () => onView(category),
                        icon: Eye,
                      },
                      {
                        label: 'Edit',
                        onSelect: () => onEdit(category),
                        icon: Pencil,
                      },
                      {
                        label: category.isArchived ? 'Enable' : 'Disable',
                        onSelect: () => onToggleVisibility(category),
                        icon: category.isArchived ? RefreshCcw : EyeOff,
                      },
                      {
                        label: 'Delete',
                        onSelect: () => onDelete(category),
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
