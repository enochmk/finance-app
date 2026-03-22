import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#/components/ui/card'
import { ChartContainer } from '#/components/ui/chart'
import { formatCurrency } from '#/lib/finance'
import type { ComparisonMetric } from '#/lib/dashboard'
import { ComparisonPill } from './ComparisonPill'

interface PeriodComparisonEntry {
  label: string
  current: number
  previous: number
  metric: ComparisonMetric
  inverse: boolean
}

interface PeriodComparisonChartProps {
  data: PeriodComparisonEntry[]
  activePeriodLabel: string
  previousPeriodLabel: string
  currency: string
}

export function PeriodComparisonChart({
  data,
  activePeriodLabel,
  previousPeriodLabel,
  currency,
}: PeriodComparisonChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Period Comparison</CardTitle>
        <CardDescription>
          {activePeriodLabel} vs {previousPeriodLabel}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ChartContainer>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ left: 16 }}>
              <CartesianGrid
                stroke="var(--border)"
                strokeDasharray="4 4"
                horizontal={false}
              />
              <XAxis
                type="number"
                stroke="var(--muted-foreground)"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11 }}
              />
              <YAxis
                dataKey="label"
                type="category"
                stroke="var(--muted-foreground)"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 12 }}
                width={72}
              />
              <Tooltip
                formatter={(value: unknown) =>
                  formatCurrency(Number(value), currency)
                }
              />
              <Legend />
              <Bar
                dataKey="current"
                name={activePeriodLabel}
                fill="var(--primary)"
                radius={[0, 3, 3, 0]}
              />
              <Bar
                dataKey="previous"
                name={previousPeriodLabel}
                fill="var(--secondary-strong)"
                radius={[0, 3, 3, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>

        <div className="grid gap-3 sm:grid-cols-2">
          {data.map((item) => (
            <div
              key={item.label}
              className="rounded-xl border border-border bg-card px-4 py-3"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-foreground">
                  {item.label}
                </p>
                <ComparisonPill metric={item.metric} inverse={item.inverse} />
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {formatCurrency(item.current, currency)} now
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {formatCurrency(item.previous, currency)} in{' '}
                {previousPeriodLabel}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
