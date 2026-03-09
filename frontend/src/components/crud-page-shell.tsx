import type { ReactNode } from 'react'

import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/components/ui/card'

type CrudPageShellProps = {
  badge: string
  title: string
  description: string
  actionLabel: string
  onAction: () => void
  children: ReactNode
}

export function CrudPageShell({
  badge,
  title,
  description,
  actionLabel,
  onAction,
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

        <Button onClick={onAction}>{actionLabel}</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </main>
  )
}
