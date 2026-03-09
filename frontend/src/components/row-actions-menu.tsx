import { MoreHorizontal, type LucideIcon } from 'lucide-react'

import { Button } from '#/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '#/components/ui/dropdown-menu'
import { cn } from '#/lib/utils'

type RowAction = {
  label: string
  onSelect: () => void
  icon?: LucideIcon
  destructive?: boolean
  disabled?: boolean
}

type RowActionsMenuProps = {
  actions: RowAction[]
  ariaLabel?: string
}

export function RowActionsMenu({
  actions,
  ariaLabel = 'Open row actions',
}: RowActionsMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={ariaLabel}>
          <MoreHorizontal data-icon="inline-end" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {actions.map((action) => {
          const Icon = action.icon

          return (
            <DropdownMenuItem
              key={action.label}
              disabled={action.disabled}
              className={cn(
                action.destructive &&
                  'text-[var(--destructive)] focus:text-[var(--destructive)]'
              )}
              onSelect={action.onSelect}
            >
              {Icon ? <Icon data-icon="inline-start" /> : null}
              {action.label}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
