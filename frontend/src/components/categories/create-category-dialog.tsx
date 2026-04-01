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
import { createCategory } from '#/lib/api'
import { CATEGORY_TYPE_OPTIONS } from '#/lib/finance'

const categorySchema = z.object({
  name: z.string().trim().min(1, 'Category name is required').max(80),
  type: z.enum(['INCOME', 'EXPENSE']),
  color: z.string().trim().min(1, 'Color is required'),
  icon: z.string().trim().max(10).optional(),
})

type CategoryFormValues = z.infer<typeof categorySchema>

interface CreateCategoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => Promise<void>
}

export function CreateCategoryDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateCategoryDialogProps) {
  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      type: 'EXPENSE',
      color: '#176b6c',
      icon: '',
    },
  })

  async function handleSubmit(values: CategoryFormValues) {
    try {
      await createCategory(values)
      form.reset({ name: '', type: 'EXPENSE', color: '#176b6c', icon: '' })
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
      description="Add a new income or expense bucket for classifying transactions."
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
          <FormField
            control={form.control}
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
