import type { ReactNode } from 'react'

import { cn } from '#/lib/utils'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#/components/ui/card'

type CrudTableCardProps = {
  title?: string
  description?: string
  toolbar?: ReactNode
  footer?: ReactNode
  emptyTitle: string
  emptyDescription: string
  isEmpty: boolean
  children: ReactNode
  className?: string
}

export function CrudTableCard({
  title,
  description,
  toolbar,
  footer,
  emptyTitle,
  emptyDescription,
  isEmpty,
  children,
  className,
}: CrudTableCardProps) {
  return (
    <Card className={className}>
      {title && (
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent className={!title ? 'pt-4' : undefined}>
        {toolbar ? <div className="mb-4">{toolbar}</div> : null}

        {isEmpty ? (
          <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--secondary)]/35 px-6 py-10 text-center">
            <p className="text-base font-semibold text-[var(--foreground)]">
              {emptyTitle}
            </p>
            <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
              {emptyDescription}
            </p>
          </div>
        ) : (
          <div
            className={cn(
              'overflow-hidden rounded-2xl border border-[var(--border)]/70'
            )}
          >
            {children}
          </div>
        )}

        {footer ? <div className="mt-4">{footer}</div> : null}
      </CardContent>
    </Card>
  )
}
