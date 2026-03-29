import { type LucideIcon, X } from 'lucide-react'

import { Button } from '#/components/ui/button'
import { DialogFooter } from '#/components/ui/dialog'
import { CrudDialogShell } from '#/components/crud-dialog-shell'

type ConfirmActionDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmLabel?: string
  onConfirm: () => void
  icon?: LucideIcon
  confirmIcon?: LucideIcon
  isLoading?: boolean
}

export function ConfirmActionDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  onConfirm,
  icon,
  confirmIcon,
  isLoading = false,
}: ConfirmActionDialogProps) {
  const ConfirmIcon = confirmIcon
  return (
    <CrudDialogShell
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      icon={icon}
      className="max-w-lg"
    >
      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          disabled={isLoading}
          onClick={() => onOpenChange(false)}
        >
          <X className="h-4 w-4" />
          Cancel
        </Button>
        <Button
          type="button"
          variant="destructive"
          disabled={isLoading}
          onClick={onConfirm}
        >
          {ConfirmIcon && <ConfirmIcon className="h-4 w-4" />}
          {confirmLabel}
        </Button>
      </DialogFooter>
    </CrudDialogShell>
  )
}
