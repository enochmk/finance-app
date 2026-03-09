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
  createCategory,
  deleteCategory,
  updateCategory,
  type Category,
} from '#/lib/api'
import { CATEGORY_TYPE_OPTIONS, paginateItems } from '#/lib/finance'

export const Route = createFileRoute('/manage/categories')({
  component: CategoriesPage,
})

const categorySchema = z.object({
  name: z.string().trim().min(1, 'Category name is required').max(80),
  type: z.enum(['INCOME', 'EXPENSE']),
  color: z.string().trim().min(1, 'Color is required'),
})

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
  const [currentPage, setCurrentPage] = useState(1)

  const createForm = useForm<z.infer<typeof categorySchema>>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      type: 'EXPENSE',
      color: '#176b6c',
    },
  })

  const [editValues, setEditValues] = useState({
    name: '',
    type: 'EXPENSE',
    color: '#176b6c',
  })

  const paginatedCategories = paginateItems(categories, currentPage, 10)

  async function handleCreateCategory(values: z.infer<typeof categorySchema>) {
    try {
      await createCategory(values)
      createForm.reset({ name: '', type: 'EXPENSE', color: '#176b6c' })
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

  if (!isAuthenticated && !isSessionLoading) {
    return null
  }

  return (
    <CrudPageShell
      badge="Finance workspace"
      title="Categories"
      description="Keep reporting and budgeting clean with consistent income and expense buckets."
      navigation={<FinanceSectionNav />}
      actions={
        <Button onClick={() => setIsCreateOpen(true)}>Add category</Button>
      }
    >
      {error ? (
        <CrudTableCard
          title="Categories"
          description="Classification buckets for all finance activity."
          emptyTitle="Categories unavailable"
          emptyDescription={error}
          isEmpty
        >
          <div />
        </CrudTableCard>
      ) : (
        <CrudTableCard
          title="Categories"
          description="Classification buckets for all finance activity."
          emptyTitle="No categories yet"
          emptyDescription="Create your first category to organize income and expense activity."
          isEmpty={categories.length === 0}
          footer={
            categories.length > 0 ? (
              <PaginationControls
                currentPage={paginatedCategories.currentPage}
                totalPages={paginatedCategories.totalPages}
                totalItems={paginatedCategories.totalItems}
                pageSize={10}
                itemLabel="categories"
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
                <TableHead>Color</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedCategories.pageItems.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="font-medium">{category.name}</TableCell>
                  <TableCell>{category.type}</TableCell>
                  <TableCell>
                    <span
                      className="inline-flex h-5 w-5 rounded-full border border-[var(--border)]"
                      style={{ backgroundColor: category.color ?? '#176b6c' }}
                    />
                  </TableCell>
                  <TableCell>
                    {category.isArchived ? 'Archived' : 'Active'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end">
                      <RowActionsMenu
                        actions={[
                          {
                            label: 'Edit',
                            onSelect: () => openEditCategory(category),
                            icon: Pencil,
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
        description="Add a new income or expense bucket for budgeting and reports."
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
        description="Update the category name, type, or color treatment."
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
