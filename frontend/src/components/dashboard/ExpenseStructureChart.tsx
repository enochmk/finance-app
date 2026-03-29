import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
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
import { ChartContainer } from '#/components/ui/chart'
import { formatCurrency } from '#/lib/finance'
import type { ComparisonMetric } from '#/lib/dashboard'
import { ComparisonPill } from './ComparisonPill'

interface ExpenseEntry {
  name: string
  fullName: string
  value: number
  fill: string
}

interface ExpenseStructureChartProps {
  data: ExpenseEntry[]
  activePeriodLabel: string
  totalExpensesMetric: ComparisonMetric
  currency: string
}

export function ExpenseStructureChart({
  data,
  activePeriodLabel,
  totalExpensesMetric,
  currency,
}: ExpenseStructureChartProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle>Expense Structure</CardTitle>
            <CardDescription>
              Spending by category for {activePeriodLabel}
            </CardDescription>
          </div>
          <ComparisonPill metric={totalExpensesMetric} inverse />
        </div>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <Alert>
            <AlertTitle>No expense categories</AlertTitle>
            <AlertDescription>
              No categorised expenses recorded for this period.
            </AlertDescription>
          </Alert>
        ) : (
          <ChartContainer>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                layout="vertical"
                margin={{ left: 12, right: 12 }}
              >
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
                  dataKey="name"
                  type="category"
                  stroke="var(--muted-foreground)"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12 }}
                  width={128}
                />
                <Tooltip
                  formatter={(value: unknown) =>
                    formatCurrency(Number(value), currency)
                  }
                  labelFormatter={(_label: unknown, payload) =>
                    payload?.[0]?.payload?.fullName ?? ''
                  }
                />
                <Bar dataKey="value" name="Expenses" radius={[0, 4, 4, 0]}>
                  {data.map((item, index) => (
                    <Cell key={index} fill={item.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
