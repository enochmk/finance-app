import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { Alert, AlertDescription, AlertTitle } from '#/components/ui/alert'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#/components/ui/card'
import { ChartContainer, ChartTooltipContent } from '#/components/ui/chart'
import type { ComparisonMetric } from '#/lib/dashboard'
import { ComparisonPill } from './ComparisonPill'

interface BalanceTrendEntry {
  label: string
  balance: number
}

interface BalanceTrendChartProps {
  data: BalanceTrendEntry[]
  cadenceLabel: string
  activePeriodLabel: string
  balanceComparison: ComparisonMetric
}

export function BalanceTrendChart({
  data,
  cadenceLabel,
  activePeriodLabel,
  balanceComparison,
}: BalanceTrendChartProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle>Balance Trend</CardTitle>
            <CardDescription>
              {cadenceLabel} ending balance through {activePeriodLabel}
            </CardDescription>
          </div>
          <ComparisonPill metric={balanceComparison} />
        </div>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <Alert>
            <AlertTitle>No balance data</AlertTitle>
            <AlertDescription>
              No transactions found for this period.
            </AlertDescription>
          </Alert>
        ) : (
          <ChartContainer>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient
                    id="balanceGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor="var(--primary)"
                      stopOpacity={0.45}
                    />
                    <stop
                      offset="100%"
                      stopColor="var(--primary)"
                      stopOpacity={0.05}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  stroke="var(--border)"
                  strokeDasharray="4 4"
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  stroke="var(--muted-foreground)"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11 }}
                />
                <YAxis
                  stroke="var(--muted-foreground)"
                  tickLine={false}
                  axisLine={false}
                  width={80}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="balance"
                  name="Balance"
                  stroke="var(--primary)"
                  fill="url(#balanceGradient)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
