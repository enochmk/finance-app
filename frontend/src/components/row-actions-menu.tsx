import { MoreHorizontal, Pencil, Eye, Trash2 } from 'lucide-react'

import { Button } from '#/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '#/components/ui/dropdown-menu'

type RowActionsMenuProps = {
  onView: () => void
  onEdit: () => void
  onDelete: () => void
}

export function RowActionsMenu({
  onView,
  onEdit,
  onDelete,
}: RowActionsMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Open row actions">
          <MoreHorizontal data-icon="inline-end" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onView}>
          <Eye data-icon="inline-start" />
          View
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onEdit}>
          <Pencil data-icon="inline-start" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onDelete}>
          <Trash2 data-icon="inline-start" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
