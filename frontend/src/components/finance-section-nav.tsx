import { Link, useRouterState } from '@tanstack/react-router'

import { financeSectionLinks } from '#/lib/finance-navigation'
import { cn } from '#/lib/utils'

export function FinanceSectionNav() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })

  return (
    <div className="mb-6 flex flex-wrap gap-2">
      {financeSectionLinks.map((item) => {
        const active = pathname === item.to

        return (
          <Link
            key={item.to}
            to={item.to}
            className={cn(
              'rounded-full border px-4 py-2 text-sm font-medium no-underline transition-colors',
              active
                ? 'border-transparent bg-[var(--primary)] text-[var(--primary-foreground)]'
                : 'border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] hover:bg-[var(--accent)]'
            )}
          >
            {item.label}
          </Link>
        )
      })}
    </div>
  )
}
