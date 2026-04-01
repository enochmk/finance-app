import { createFileRoute, useSearch } from '@tanstack/react-router'
import { Plus, Tag } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

import { ConfirmActionDialog } from '#/components/confirm-action-dialog'
import {
  CategoryTable,
  type CategorySortField,
  type CategoryStatusFilter,
  type SortDirection,
} from '#/components/categories/category-table'
import { CreateCategoryDialog } from '#/components/categories/create-category-dialog'
import { EditCategoryDialog } from '#/components/categories/edit-category-dialog'
import { ViewCategoryDialog } from '#/components/categories/view-category-dialog'
import { CrudPageShell } from '#/components/crud-page-shell'
import { useSession } from '#/components/session-provider'
import { Button } from '#/components/ui/button'
import { useFinanceWorkspaceData } from '#/hooks/use-finance-workspace-data'
import { useProtectedRoute } from '#/hooks/use-protected-route'
import { deleteCategory, updateCategory, type Category } from '#/lib/api'
import { paginateItems } from '#/lib/finance'

export const Route = createFileRoute('/settings/categories')({
  component: CategoriesPage,
  validateSearch: (search: Record<string, unknown>): { create?: boolean } =>
    search['create'] === 'true' || search['create'] === true
      ? { create: true }
      : {},
})

function CategoriesPage() {
  const { isAuthenticated } = useSession()
  const { isLoading: isSessionLoading } = useProtectedRoute()
  const { categories, error, refreshAll } =
    useFinanceWorkspaceData(isAuthenticated)
  const { create } = useSearch({ from: '/settings/categories' })
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  useEffect(() => {
    if (create) setIsCreateOpen(true)
  }, [create])

  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(
    null
  )
  const [viewingCategory, setViewingCategory] = useState<Category | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<CategoryStatusFilter>('ALL')
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [sortField, setSortField] = useState<CategorySortField>('name')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [pageSize, setPageSize] = useState(5)

  useEffect(() => {
    setCurrentPage(1)
  }, [search, statusFilter, typeFilter, sortField, sortDirection, pageSize])

  const filteredCategories = useMemo(() => {
    return categories.filter((category) => {
      const query = search.trim().toLowerCase()
      const matchesSearch =
        query.length === 0 ||
        category.name.toLowerCase().includes(query) ||
        category.type.toLowerCase().includes(query)

      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'ENABLED' && !category.isArchived) ||
        (statusFilter === 'DISABLED' && category.isArchived)

      const matchesType = typeFilter === 'ALL' || category.type === typeFilter

      return matchesSearch && matchesStatus && matchesType
    })
  }, [categories, search, statusFilter, typeFilter])

  const sortedCategories = useMemo(() => {
    const items = [...filteredCategories]
    items.sort((left, right) => {
      const multiplier = sortDirection === 'asc' ? 1 : -1
      switch (sortField) {
        case 'name':
          return left.name.localeCompare(right.name) * multiplier
        case 'type':
          return left.type.localeCompare(right.type) * multiplier
        case 'status':
        default:
          return (
            (left.isArchived ? 1 : 0) - (right.isArchived ? 1 : 0) * multiplier
          )
      }
    })
    return items
  }, [filteredCategories, sortDirection, sortField])

  const paginated = paginateItems(sortedCategories, currentPage, pageSize)

  function updateSort(field: CategorySortField) {
    if (sortField === field) {
      setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'))
      return
    }
    setSortField(field)
    setSortDirection(field === 'name' ? 'asc' : 'desc')
  }

  async function toggleCategoryVisibility(category: Category) {
    try {
      await updateCategory(category.id, { isArchived: !category.isArchived })
      await refreshAll()
      toast.success(
        category.isArchived ? 'Category enabled' : 'Category disabled'
      )
    } catch (err) {
      toast.error('Unable to update category visibility', {
        description: err instanceof Error ? err.message : 'Request failed',
      })
    }
  }

  async function confirmDeleteCategory() {
    if (!deletingCategory) return
    try {
      await deleteCategory(deletingCategory.id)
      await refreshAll()
      setDeletingCategory(null)
      toast.success('Category deleted')
    } catch (err) {
      toast.error('Unable to delete category', {
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
      title="Categories"
      description="Keep transaction entry clean with categories you can extend, disable, and reuse over time."
      icon={Tag}
      actions={
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          Add category
        </Button>
      }
    >
      <CategoryTable
        categories={categories}
        sortedCategories={sortedCategories}
        pageItems={paginated.pageItems}
        currentPage={paginated.currentPage}
        totalPages={paginated.totalPages}
        totalItems={paginated.totalItems}
        search={search}
        statusFilter={statusFilter}
        typeFilter={typeFilter}
        sortField={sortField}
        sortDirection={sortDirection}
        pageSize={pageSize}
        error={error}
        onSearchChange={setSearch}
        onStatusFilterChange={setStatusFilter}
        onTypeFilterChange={setTypeFilter}
        onSort={updateSort}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
        onView={setViewingCategory}
        onEdit={setEditingCategory}
        onToggleVisibility={toggleCategoryVisibility}
        onDelete={setDeletingCategory}
      />

      <CreateCategoryDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSuccess={refreshAll}
        categories={categories}
      />

      <EditCategoryDialog
        category={editingCategory}
        categories={categories}
        onClose={() => setEditingCategory(null)}
        onSuccess={refreshAll}
      />

      <ViewCategoryDialog
        category={viewingCategory}
        onClose={() => setViewingCategory(null)}
      />

      <ConfirmActionDialog
        open={Boolean(deletingCategory)}
        onOpenChange={(open) => !open && setDeletingCategory(null)}
        title="Delete category"
        description="This removes the selected category from the workspace. This action cannot be undone."
        confirmLabel="Delete category"
        onConfirm={confirmDeleteCategory}
      />
    </CrudPageShell>
  )
}
