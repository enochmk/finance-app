import { createFileRoute } from '@tanstack/react-router'
import {
  ArrowUpDown,
  Eye,
  EyeOff,
  Pencil,
  Plus,
  RefreshCcw,
  Search,
  Tag,
  Trash2,
} from 'lucide-react'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
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
  createCategory,
  deleteCategory,
  updateCategory,
  type Category,
} from '#/lib/api'
import { CATEGORY_TYPE_OPTIONS, paginateItems } from '#/lib/finance'

export const Route = createFileRoute('/settings/categories')({
  component: CategoriesPage,
})

const categorySchema = z.object({
  name: z.string().trim().min(1, 'Category name is required').max(80),
  type: z.enum(['INCOME', 'EXPENSE']),
  color: z.string().trim().min(1, 'Color is required'),
  icon: z.string().trim().max(10).optional(),
})

type CategoryStatusFilter = 'ALL' | 'ENABLED' | 'DISABLED'
type CategorySortField = 'name' | 'type' | 'status'
type SortDirection = 'asc' | 'desc'

function CategoriesPage() {
  const { isAuthenticated } = useSession()
  const { isLoading: isSessionLoading } = useProtectedRoute()
  const { categories, error, refreshAll } =
    useFinanceWorkspaceData(isAuthenticated)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
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

  const createForm = useForm<z.infer<typeof categorySchema>>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      type: 'EXPENSE',
      color: '#176b6c',
      icon: '',
    },
  })

  const [editValues, setEditValues] = useState({
    name: '',
    type: 'EXPENSE',
    color: '#176b6c',
    icon: '',
  })

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

  const paginatedCategories = paginateItems(
    sortedCategories,
    currentPage,
    pageSize
  )

  async function handleCreateCategory(values: z.infer<typeof categorySchema>) {
    try {
      await createCategory(values)
      createForm.reset({
        name: '',
        type: 'EXPENSE',
        color: '#176b6c',
        icon: '',
      })
      setIsCreateOpen(false)
      await refreshAll()
      toast.success('Category created')
    } catch (createError) {
      toast.error('Unable to create category', {
        description:
          createError instanceof Error ? createError.message : 'Request failed',
      })
    }
  }

  function openEditCategory(category: Category) {
    setEditValues({
      name: category.name,
      type: category.type,
      color: category.color ?? '#176b6c',
      icon: category.icon ?? '',
    })
    setEditingCategory(category)
  }

  async function submitEditCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!editingCategory) {
      return
    }

    try {
      await updateCategory(editingCategory.id, editValues)
      await refreshAll()
      setEditingCategory(null)
      toast.success('Category updated')
    } catch (updateError) {
      toast.error('Unable to update category', {
        description:
          updateError instanceof Error ? updateError.message : 'Request failed',
      })
    }
  }

  async function confirmDeleteCategory() {
    if (!deletingCategory) {
      return
    }

    try {
      await deleteCategory(deletingCategory.id)
      await refreshAll()
      setDeletingCategory(null)
      toast.success('Category deleted')
    } catch (deleteError) {
      toast.error('Unable to delete category', {
        description:
          deleteError instanceof Error ? deleteError.message : 'Request failed',
      })
    }
  }

  async function toggleCategoryVisibility(category: Category) {
    try {
      await updateCategory(category.id, {
        isArchived: !category.isArchived,
      })
      await refreshAll()
      toast.success(
        category.isArchived ? 'Category enabled' : 'Category disabled'
      )
    } catch (toggleError) {
      toast.error('Unable to update category visibility', {
        description:
          toggleError instanceof Error ? toggleError.message : 'Request failed',
      })
    }
  }

  function updateSort(field: CategorySortField) {
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
      {error ? (
        <CrudTableCard
          title="Categories"
          description="Classification buckets for all finance activity, including disabled categories kept for history."
          emptyTitle="Categories unavailable"
          emptyDescription={error}
          isEmpty
        >
          <div />
        </CrudTableCard>
      ) : (
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
                <label
                  htmlFor="category-search"
                  className="text-sm font-medium"
                >
                  Search categories
                </label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
                  <Input
                    id="category-search"
                    placeholder="Name or type"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
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
                    setStatusFilter(value as CategoryStatusFilter)
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
                <Select value={typeFilter} onValueChange={setTypeFilter}>
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
                  onValueChange={(value) =>
                    updateSort(value as CategorySortField)
                  }
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
                <label
                  htmlFor="category-page-size"
                  className="text-sm font-medium"
                >
                  Show
                </label>
                <Select
                  value={String(pageSize)}
                  onValueChange={(value) => setPageSize(Number(value))}
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
                currentPage={paginatedCategories.currentPage}
                totalPages={paginatedCategories.totalPages}
                totalItems={paginatedCategories.totalItems}
                pageSize={pageSize}
                itemLabel="categories"
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
                  label="Name"
                  onClick={() => updateSort('name')}
                  isActive={sortField === 'name'}
                  direction={sortDirection}
                />
                <SortableHead
                  label="Status"
                  onClick={() => updateSort('status')}
                  isActive={sortField === 'status'}
                  direction={sortDirection}
                />
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedCategories.pageItems.map((category, index) => (
                <TableRow
                  key={category.id}
                  className="cursor-pointer hover:brightness-95 dark:hover:brightness-110"
                  style={{
                    backgroundColor: `${category.color ?? '#176b6c'}18`,
                    borderLeft: `3px solid ${category.color ?? '#176b6c'}`,
                  }}
                  onClick={() => setViewingCategory(category)}
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
                            onSelect: () => setViewingCategory(category),
                            icon: Eye,
                          },
                          {
                            label: 'Edit',
                            onSelect: () => openEditCategory(category),
                            icon: Pencil,
                          },
                          {
                            label: category.isArchived ? 'Enable' : 'Disable',
                            onSelect: () => toggleCategoryVisibility(category),
                            icon: category.isArchived ? RefreshCcw : EyeOff,
                          },
                          {
                            label: 'Delete',
                            onSelect: () => setDeletingCategory(category),
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
        title="Create category"
        description="Add a new income or expense bucket for classifying transactions."
        icon={Plus}
      >
        <Form {...createForm}>
          <form
            onSubmit={createForm.handleSubmit(handleCreateCategory)}
            className="space-y-4"
          >
            <FormField
              control={createForm.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category name</FormLabel>
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
                        {CATEGORY_TYPE_OPTIONS.map((option) => (
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
            <FormField
              control={createForm.control}
              name="icon"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Icon (emoji)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="🍽️" maxLength={10} />
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
              <Button type="submit">Create category</Button>
            </DialogFooter>
          </form>
        </Form>
      </CrudDialogShell>

      <CrudDialogShell
        open={Boolean(editingCategory)}
        onOpenChange={(open) => !open && setEditingCategory(null)}
        title="Edit category"
        description="Update the category name, type, or color treatment, or use disable to hide it from entry forms."
        icon={Pencil}
      >
        <form onSubmit={submitEditCategory} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="edit-category-name" className="text-sm font-medium">
              Name
            </label>
            <Input
              id="edit-category-name"
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
            <label htmlFor="edit-category-type" className="text-sm font-medium">
              Type
            </label>
            <Select
              value={editValues.type}
              onValueChange={(value) =>
                setEditValues((current) => ({ ...current, type: value }))
              }
            >
              <SelectTrigger id="edit-category-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORY_TYPE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label
              htmlFor="edit-category-color"
              className="text-sm font-medium"
            >
              Color
            </label>
            <Input
              id="edit-category-color"
              type="color"
              value={editValues.color}
              onChange={(event) =>
                setEditValues((current) => ({
                  ...current,
                  color: event.target.value,
                }))
              }
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="edit-category-icon" className="text-sm font-medium">
              Icon (emoji)
            </label>
            <Input
              id="edit-category-icon"
              value={editValues.icon}
              onChange={(event) =>
                setEditValues((current) => ({
                  ...current,
                  icon: event.target.value,
                }))
              }
              placeholder="🍽️"
              maxLength={10}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditingCategory(null)}
            >
              Cancel
            </Button>
            <Button type="submit">Save changes</Button>
          </DialogFooter>
        </form>
      </CrudDialogShell>

      <CrudDialogShell
        open={Boolean(viewingCategory)}
        onOpenChange={(open) => !open && setViewingCategory(null)}
        title="Category details"
        description="View the complete category information."
        icon={Eye}
      >
        {viewingCategory && (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium">Name</label>
                <p className="text-sm text-[var(--muted-foreground)]">
                  {viewingCategory.name}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium">Type</label>
                <p className="text-sm text-[var(--muted-foreground)]">
                  {viewingCategory.type}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium">Status</label>
                <p className="text-sm text-[var(--muted-foreground)]">
                  {viewingCategory.isArchived ? 'Disabled' : 'Enabled'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium">Color</label>
                <div className="flex items-center gap-2">
                  <span
                    className="inline-flex h-4 w-4 rounded-full border border-[var(--border)]"
                    style={{
                      backgroundColor: viewingCategory.color ?? '#176b6c',
                    }}
                  />
                  <p className="text-sm text-[var(--muted-foreground)]">
                    {viewingCategory.color ?? '#176b6c'}
                  </p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Icon</label>
                <div className="flex items-center gap-2">
                  <span className="text-lg">{viewingCategory.icon || '—'}</span>
                  <p className="text-sm text-[var(--muted-foreground)]">
                    {viewingCategory.icon ? 'Emoji' : 'No icon'}
                  </p>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setViewingCategory(null)}
              >
                Close
              </Button>
            </DialogFooter>
          </div>
        )}
      </CrudDialogShell>

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
