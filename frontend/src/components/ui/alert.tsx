import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '#/lib/utils'

const alertVariants = cva(
  'relative w-full rounded-xl border px-4 py-3 text-sm text-[var(--foreground)]',
  {
    variants: {
      variant: {
        default: 'border-[var(--border)] bg-[var(--card)]',
        destructive:
          'border-[rgba(220,38,38,0.22)] bg-[rgba(220,38,38,0.08)] text-[rgb(153,27,27)] dark:text-[rgb(252,165,165)]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

function Alert({
  className,
  variant,
  ...props
}: React.ComponentProps<'div'> & VariantProps<typeof alertVariants>) {
  return <div role="alert" className={cn(alertVariants({ variant }), className)} {...props} />
}

function AlertTitle({ className, ...props }: React.ComponentProps<'h5'>) {
  return <h5 className={cn('mb-1 font-medium leading-none tracking-tight', className)} {...props} />
}

function AlertDescription({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('text-sm [&_p]:leading-relaxed', className)} {...props} />
}

export { Alert, AlertTitle, AlertDescription }
