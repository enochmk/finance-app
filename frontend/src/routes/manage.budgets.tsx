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
  createBudget,
  deleteBudget,
  updateBudget,
  type Budget,
} from '#/lib/api'
import { formatCurrency, formatMonthYear, paginateItems } from '#/lib/finance'

export const Route = createFileRoute('/manage/budgets')({
  component: BudgetsPage,
})

const budgetSchema = z.object({
  categoryId: z.string().uuid('Select a valid category'),
  amount: z.coerce.number().positive('Budget amount must be greater than zero'),
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2000).max(9999),
})

function BudgetsPage() {
  const { isAuthenticated } = useSession()
  const { isLoading: isSessionLoading } = useProtectedRoute()
  const { budgets, categories, error, refreshAll } =
    useFinanceWorkspaceData(isAuthenticated)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null)
  const [deletingBudget, setDeletingBudget] = useState<Budget | null>(null)
  const [currentPage, setCurrentPage] = useState(1)

  const expenseCategories = categories.filter(
    (category) => category.type === 'EXPENSE'
  )

  const createForm = useForm<z.infer<typeof budgetSchema>>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      categoryId: '',
      amount: 0,
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
    },
  })

  const [editValues, setEditValues] = useState({
    categoryId: '',
    amount: '0',
    month: String(new Date().getMonth() + 1),
    year: String(new Date().getFullYear()),
  })

  const paginatedBudgets = paginateItems(budgets, currentPage, 8)

  async function handleCreateBudget(values: z.infer<typeof budgetSchema>) {
    try {
      await createBudget(values)
      createForm.reset({
        categoryId: '',
        amount: 0,
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
      })
      setIsCreateOpen(false)
      await refreshAll()
      toast.success('Budget created')
    } catch (createError) {
      toast.error('Unable to create budget', {
        description:
          createError instanceof Error ? createError.message : 'Request failed',
      })
    }
  }

  function openEditBudget(budget: Budget) {
    setEditValues({
      categoryId: budget.category.id,
      amount: String(budget.amount),
      month: String(budget.month),
      year: String(budget.year),
    })
    setEditingBudget(budget)
  }

  async function submitEditBudget(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!editingBudget) {
      return
    }

    try {
      await updateBudget(editingBudget.id, {
        categoryId: editValues.categoryId,
        amount: Number(editValues.amount),
        month: Number(editValues.month),
        year: Number(editValues.year),
      })
      await refreshAll()
      setEditingBudget(null)
      toast.success('Budget updated')
    } catch (updateError) {
      toast.error('Unable to update budget', {
        description:
          updateError instanceof Error ? updateError.message : 'Request failed',
      })
    }
  }

  async function confirmDeleteBudget() {
    if (!deletingBudget) {
      return
    }

    try {
      await deleteBudget(deletingBudget.id)
      await refreshAll()
      setDeletingBudget(null)
      toast.success('Budget deleted')
    } catch (deleteError) {
      toast.error('Unable to delete budget', {
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
      title="Budgets"
      description="Shape monthly spending targets and keep category plans aligned with your reports."
      navigation={<FinanceSectionNav />}
      actions={
        <Button onClick={() => setIsCreateOpen(true)}>Add budget</Button>
      }
    >
      {error ? (
        <CrudTableCard
          title="Budgets"
          description="Monthly category targets for expense planning."
          emptyTitle="Budgets unavailable"
          emptyDescription={error}
          isEmpty
        >
          <div />
        </CrudTableCard>
      ) : (
        <CrudTableCard
          title="Budgets"
          description="Monthly category targets for expense planning."
          emptyTitle="No budgets yet"
          emptyDescription="Create a budget to compare category spending against a monthly plan."
          isEmpty={budgets.length === 0}
          footer={
            budgets.length > 0 ? (
              <PaginationControls
                currentPage={paginatedBudgets.currentPage}
                totalPages={paginatedBudgets.totalPages}
                totalItems={paginatedBudgets.totalItems}
                pageSize={8}
                itemLabel="budgets"
                onPageChange={setCurrentPage}
              />
            ) : null
          }
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead>Period</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedBudgets.pageItems.map((budget) => (
                <TableRow key={budget.id}>
                  <TableCell className="font-medium">
                    {budget.category.name}
                  </TableCell>
                  <TableCell>
                    {formatMonthYear(budget.month, budget.year)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(budget.amount)}
                  </TableCell>
                  <TableCell>{budget.notes ?? 'No notes'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end">
                      <RowActionsMenu
                        actions={[
                          {
                            label: 'Edit',
                            onSelect: () => openEditBudget(budget),
                            icon: Pencil,
                          },
                          {
                            label: 'Delete',
                            onSelect: () => setDeletingBudget(budget),
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
        title="Create budget"
        description="Assign a monthly amount to an expense category."
      >
        <Form {...createForm}>
          <form
            onSubmit={createForm.handleSubmit(handleCreateBudget)}
            className="space-y-4"
          >
            <FormField
              control={createForm.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {expenseCategories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid gap-4 md:grid-cols-3">
              <FormField
                control={createForm.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        value={String(field.value ?? 0)}
                        onChange={(event) => field.onChange(event.target.value)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={createForm.control}
                name="month"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Month</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        value={String(field.value ?? '')}
                        onChange={(event) => field.onChange(event.target.value)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={createForm.control}
                name="year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Year</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        value={String(field.value ?? '')}
                        onChange={(event) => field.onChange(event.target.value)}
                      />
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
                Cancel
              </Button>
              <Button type="submit">Create budget</Button>
            </DialogFooter>
          </form>
        </Form>
      </CrudDialogShell>

      <CrudDialogShell
        open={Boolean(editingBudget)}
        onOpenChange={(open) => !open && setEditingBudget(null)}
        title="Edit budget"
        description="Adjust the category, period, or monthly amount."
      >
        <form onSubmit={submitEditBudget} className="space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="edit-budget-category"
              className="text-sm font-medium"
            >
              Category
            </label>
            <Select
              value={editValues.categoryId}
              onValueChange={(value) =>
                setEditValues((current) => ({ ...current, categoryId: value }))
              }
            >
              <SelectTrigger id="edit-budget-category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {expenseCategories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <Input
              type="number"
              value={editValues.amount}
              onChange={(event) =>
                setEditValues((current) => ({
                  ...current,
                  amount: event.target.value,
                }))
              }
            />
            <Input
              type="number"
              value={editValues.month}
              onChange={(event) =>
                setEditValues((current) => ({
                  ...current,
                  month: event.target.value,
                }))
              }
            />
            <Input
              type="number"
              value={editValues.year}
              onChange={(event) =>
                setEditValues((current) => ({
                  ...current,
                  year: event.target.value,
                }))
              }
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditingBudget(null)}
            >
              Cancel
            </Button>
            <Button type="submit">Save changes</Button>
          </DialogFooter>
        </form>
      </CrudDialogShell>

      <ConfirmActionDialog
        open={Boolean(deletingBudget)}
        onOpenChange={(open) => !open && setDeletingBudget(null)}
        title="Delete budget"
        description="This removes the selected budget from the workspace. This action cannot be undone."
        confirmLabel="Delete budget"
        onConfirm={confirmDeleteBudget}
      />
    </CrudPageShell>
  )
}
