import { ArrowDownRight, ArrowUpRight } from 'lucide-react'

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#/components/ui/card'
import { formatCurrency } from '#/lib/finance'
import { getDeltaTone } from '#/lib/dashboard'
import type { ComparisonMetric } from '#/lib/dashboard'
import { ComparisonPill } from './ComparisonPill'

interface MetricCardItem {
  key: string
  title: string
  value: number
  metric: ComparisonMetric
  inverse: boolean
}

interface MetricCardsProps {
  metrics: MetricCardItem[]
  currency: string
  previousPeriodLabel: string
}

export function MetricCards({
  metrics,
  currency,
  previousPeriodLabel,
}: MetricCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {metrics.map((metric) => {
        const tone = getDeltaTone(metric.metric.change, metric.inverse)

        return (
          <Card key={metric.key}>
            <CardHeader className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardDescription>{metric.title}</CardDescription>
                  <CardTitle className="mt-2 text-3xl text-foreground">
                    {formatCurrency(metric.value, currency)}
                  </CardTitle>
                </div>
                <ComparisonPill
                  metric={metric.metric}
                  inverse={metric.inverse}
                />
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {tone === 'positive' ? (
                  <ArrowUpRight className="h-4 w-4 text-[rgb(21,128,61)] dark:text-[rgb(74,222,128)]" />
                ) : tone === 'negative' ? (
                  <ArrowDownRight className="h-4 w-4 text-destructive" />
                ) : null}
                <span>
                  {formatCurrency(metric.metric.change, currency)} vs{' '}
                  {previousPeriodLabel}
                </span>
              </div>
            </CardHeader>
          </Card>
        )
      })}
    </div>
  )
}
