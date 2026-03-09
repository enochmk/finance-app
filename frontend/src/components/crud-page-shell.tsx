import type { ReactNode } from 'react'

import { Badge } from '#/components/ui/badge'

type CrudPageShellProps = {
  badge: string
  title: string
  description: string
  actions?: ReactNode
  navigation?: ReactNode
  children: ReactNode
}

export function CrudPageShell({
  badge,
  title,
  description,
  actions,
  navigation,
  children,
}: CrudPageShellProps) {
  return (
    <main className="w-full px-4 py-8 lg:px-8 xl:px-10">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Badge variant="secondary" className="mb-3">
            {badge}
          </Badge>
          <h1 className="display-title text-4xl font-bold tracking-tight text-[var(--foreground)] sm:text-5xl">
            {title}
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-[var(--muted-foreground)]">
            {description}
          </p>
        </div>

        {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
      </div>

      {navigation}

      <div className="space-y-6">{children}</div>
    </main>
  )
}
