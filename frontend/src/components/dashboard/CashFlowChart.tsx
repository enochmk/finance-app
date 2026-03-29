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

interface CashFlowEntry {
  label: string
  income: number
  expenses: number
}

interface CashFlowChartProps {
  data: CashFlowEntry[]
  cadenceLabel: string
  activePeriodLabel: string
  netCashFlowMetric: ComparisonMetric
}

export function CashFlowChart({
  data,
  cadenceLabel,
  activePeriodLabel,
  netCashFlowMetric,
}: CashFlowChartProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle>Cash Flow</CardTitle>
            <CardDescription>
              {cadenceLabel} income vs expenses for {activePeriodLabel}
            </CardDescription>
          </div>
          <ComparisonPill metric={netCashFlowMetric} />
        </div>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <Alert>
            <AlertTitle>No cash flow data</AlertTitle>
            <AlertDescription>
              No transactions found for this period.
            </AlertDescription>
          </Alert>
        ) : (
          <ChartContainer>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
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
                  width={72}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip content={<ChartTooltipContent />} />
                <Legend />
                <Bar
                  dataKey="income"
                  name="Income"
                  fill="var(--primary)"
                  radius={[3, 3, 0, 0]}
                />
                <Bar
                  dataKey="expenses"
                  name="Expenses"
                  fill="var(--destructive)"
                  radius={[3, 3, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
