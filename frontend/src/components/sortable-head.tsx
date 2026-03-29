import { ArrowUpDown } from 'lucide-react'

import { TableHead } from '#/components/ui/table'

export function SortableHead({
  label,
  onClick,
  isActive,
  direction,
  className,
}: {
  label: string
  onClick: () => void
  isActive: boolean
  direction: 'asc' | 'desc'
  className?: string
}) {
  return (
    <TableHead className={className}>
      <button
        type="button"
        onClick={onClick}
        className="inline-flex items-center gap-1 text-left font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        {label}
        <ArrowUpDown
          className={isActive ? 'h-4 w-4 text-foreground' : 'h-4 w-4'}
        />
        {isActive ? <span className="sr-only">sorted {direction}</span> : null}
      </button>
    </TableHead>
  )
}
