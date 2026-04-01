import { Plus } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'

import { CrudDialogShell } from '#/components/crud-dialog-shell'
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
import { createCategory, type Category } from '#/lib/api'
import { CATEGORY_TYPE_OPTIONS } from '#/lib/finance'

const categorySchema = z.object({
  name: z.string().trim().min(1, 'Category name is required').max(80),
  type: z.enum(['INCOME', 'EXPENSE', 'TRANSFER']),
  color: z.string().trim().min(1, 'Color is required'),
  icon: z.string().trim().max(10).optional(),
  parentId: z.string().uuid().optional(),
})

type CategoryFormValues = z.infer<typeof categorySchema>

interface CreateCategoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => Promise<void>
  categories: Category[]
}

export function CreateCategoryDialog({
  open,
  onOpenChange,
  onSuccess,
  categories,
}: CreateCategoryDialogProps) {
  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      type: 'EXPENSE',
      color: '#176b6c',
      icon: '',
      parentId: undefined,
    },
  })

  const watchedType = form.watch('type')
  const parentOptions = categories.filter(
    (c) => !c.parentId && c.type === watchedType && !c.isArchived
  )

  async function handleSubmit(values: CategoryFormValues) {
    try {
      await createCategory({
        name: values.name,
        type: values.type,
        color: values.color,
        icon: values.icon,
        parentId: values.parentId ?? null,
      })
      form.reset({
        name: '',
        type: 'EXPENSE',
        color: '#176b6c',
        icon: '',
        parentId: undefined,
      })
      onOpenChange(false)
      await onSuccess()
      toast.success('Category created')
    } catch (err) {
      toast.error('Unable to create category', {
        description: err instanceof Error ? err.message : 'Request failed',
      })
    }
  }

  return (
    <CrudDialogShell
      open={open}
      onOpenChange={onOpenChange}
      title="Create category"
      description="Add a new category for classifying transactions. Optionally nest it under a parent category."
      icon={Plus}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <FormField
            control={form.control}
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
          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <FormControl>
                    <Select
                      value={field.value}
                      onValueChange={(v) => {
                        field.onChange(v)
                        form.setValue('parentId', undefined)
                      }}
                    >
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
              control={form.control}
              name="parentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Parent category</FormLabel>
                  <FormControl>
                    <Select
                      value={field.value ?? '__none__'}
                      onValueChange={(v) =>
                        field.onChange(v === '__none__' ? undefined : v)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="None (root category)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">
                          None (root category)
                        </SelectItem>
                        {parentOptions.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
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
          <div className="grid gap-4 md:grid-cols-2">
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
            <FormField
              control={form.control}
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
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Create category</Button>
          </DialogFooter>
        </form>
      </Form>
    </CrudDialogShell>
  )
}
