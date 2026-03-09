import * as React from 'react'

import { cn } from '#/lib/utils'

function ChartContainer({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('h-[280px] w-full text-xs', className)} {...props} />
}

function ChartTooltipContent({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ name?: string; value?: number; color?: string }>
  label?: string
}) {
  if (!active || !payload?.length) {
    return null
  }

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--popover)] px-3 py-2 text-sm shadow-lg">
      {label ? <p className="mb-2 font-medium text-[var(--foreground)]">{label}</p> : null}
      <div className="space-y-1">
        {payload.map((item, index) => (
          <div key={`${item.name}-${index}`} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-[var(--muted-foreground)]">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              {item.name}
            </span>
            <span className="font-medium text-[var(--foreground)]">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export { ChartContainer, ChartTooltipContent }
