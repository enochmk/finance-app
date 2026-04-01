import { Eye } from 'lucide-react'

import { CrudDialogShell } from '#/components/crud-dialog-shell'
import { Button } from '#/components/ui/button'
import { DialogFooter } from '#/components/ui/dialog'
import type { Category } from '#/lib/api'

interface ViewCategoryDialogProps {
  category: Category | null
  onClose: () => void
}

export function ViewCategoryDialog({
  category,
  onClose,
}: ViewCategoryDialogProps) {
  return (
    <CrudDialogShell
      open={Boolean(category)}
      onOpenChange={(open) => !open && onClose()}
      title="Category details"
      description="View the complete category information."
      icon={Eye}
    >
      {category && (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium">Name</label>
              <p className="text-sm text-muted-foreground">{category.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium">Type</label>
              <p className="text-sm text-muted-foreground">
                {category.type === 'INCOME'
                  ? 'Credit'
                  : category.type === 'EXPENSE'
                    ? 'Debit'
                    : 'Transfer'}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium">Status</label>
              <p className="text-sm text-muted-foreground">
                {category.isArchived ? 'Disabled' : 'Enabled'}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium">Color</label>
              <div className="flex items-center gap-2">
                <span
                  className="inline-flex h-4 w-4 rounded-full border border-border"
                  style={{ backgroundColor: category.color ?? '#176b6c' }}
                />
                <p className="text-sm text-muted-foreground">
                  {category.color ?? '#176b6c'}
                </p>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Icon</label>
              <div className="flex items-center gap-2">
                <span className="text-lg">{category.icon || '—'}</span>
                <p className="text-sm text-muted-foreground">
                  {category.icon ? 'Emoji' : 'No icon'}
                </p>
              </div>
            </div>
            {category.parent && (
              <div>
                <label className="text-sm font-medium">Parent category</label>
                <p className="text-sm text-muted-foreground">
                  {category.parent.name}
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Close
            </Button>
          </DialogFooter>
        </div>
      )}
    </CrudDialogShell>
  )
}
