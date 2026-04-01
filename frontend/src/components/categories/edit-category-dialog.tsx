import { Pencil } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { toast } from 'sonner'

import { CrudDialogShell } from '#/components/crud-dialog-shell'
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
import { updateCategory, type Category } from '#/lib/api'
import { CATEGORY_TYPE_OPTIONS } from '#/lib/finance'

interface EditCategoryDialogProps {
  category: Category | null
  onClose: () => void
  onSuccess: () => Promise<void>
}

export function EditCategoryDialog({
  category,
  onClose,
  onSuccess,
}: EditCategoryDialogProps) {
  const [values, setValues] = useState({
    name: '',
    type: 'EXPENSE',
    color: '#176b6c',
    icon: '',
  })

  useEffect(() => {
    if (category) {
      setValues({
        name: category.name,
        type: category.type,
        color: category.color ?? '#176b6c',
        icon: category.icon ?? '',
      })
    }
  }, [category])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!category) return
    try {
      await updateCategory(category.id, values)
      onClose()
      await onSuccess()
      toast.success('Category updated')
    } catch (err) {
      toast.error('Unable to update category', {
        description: err instanceof Error ? err.message : 'Request failed',
      })
    }
  }

  return (
    <CrudDialogShell
      open={Boolean(category)}
      onOpenChange={(open) => !open && onClose()}
      title="Edit category"
      description="Update the category name, type, or color treatment, or use disable to hide it from entry forms."
      icon={Pencil}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="edit-category-name" className="text-sm font-medium">
            Name
          </label>
          <Input
            id="edit-category-name"
            value={values.name}
            onChange={(e) =>
              setValues((prev) => ({ ...prev, name: e.target.value }))
            }
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="edit-category-type" className="text-sm font-medium">
            Type
          </label>
          <Select
            value={values.type}
            onValueChange={(value) =>
              setValues((prev) => ({ ...prev, type: value }))
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
          <label htmlFor="edit-category-color" className="text-sm font-medium">
            Color
          </label>
          <Input
            id="edit-category-color"
            type="color"
            value={values.color}
            onChange={(e) =>
              setValues((prev) => ({ ...prev, color: e.target.value }))
            }
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="edit-category-icon" className="text-sm font-medium">
            Icon (emoji)
          </label>
          <Input
            id="edit-category-icon"
            value={values.icon}
            onChange={(e) =>
              setValues((prev) => ({ ...prev, icon: e.target.value }))
            }
            placeholder="🍽️"
            maxLength={10}
          />
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Save changes</Button>
        </DialogFooter>
      </form>
    </CrudDialogShell>
  )
}
