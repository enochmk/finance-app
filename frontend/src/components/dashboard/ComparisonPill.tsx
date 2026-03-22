import { cn } from '#/lib/utils'
import { formatPercentage, getDeltaTone } from '#/lib/dashboard'
import type { ComparisonMetric } from '#/lib/dashboard'

export function ComparisonPill({
  metric,
  inverse = false,
}: {
  metric: ComparisonMetric
  inverse?: boolean
}) {
  const tone = getDeltaTone(metric.change, inverse)

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold',
        tone === 'positive' &&
          'bg-[rgba(34,197,94,0.14)] text-[rgb(21,128,61)] dark:text-[rgb(74,222,128)]',
        tone === 'negative' && 'bg-destructive/10 text-destructive',
        tone === 'neutral' && 'bg-secondary text-secondary-foreground'
      )}
    >
      {formatPercentage(metric.changePct)}
    </span>
  )
}
