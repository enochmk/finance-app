import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '#/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-[var(--primary-soft)] text-[var(--primary)]',
        secondary:
          'border-transparent bg-[var(--secondary)] text-[var(--secondary-foreground)]',
        outline: 'border-[var(--border)] text-[var(--foreground)]',
        success:
          'border-transparent bg-[rgba(34,197,94,0.14)] text-[rgb(21,128,61)] dark:text-[rgb(74,222,128)]',
        warning:
          'border-transparent bg-[rgba(245,158,11,0.14)] text-[rgb(180,83,9)] dark:text-[rgb(251,191,36)]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<'div'> & VariantProps<typeof badgeVariants>) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
