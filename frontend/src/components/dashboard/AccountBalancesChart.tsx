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

interface AccountBalanceEntry {
  name: string
  fullName: string
  balance: number
  currency: string
  fill: string
}

interface AccountBalancesChartProps {
  data: AccountBalanceEntry[]
  activePeriodLabel: string
  defaultCurrency: string
}

export function AccountBalancesChart({
  data,
  activePeriodLabel,
  defaultCurrency,
}: AccountBalancesChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Balance by Accounts</CardTitle>
        <CardDescription>
          Ending balance across active accounts for {activePeriodLabel}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <Alert>
            <AlertTitle>No accounts</AlertTitle>
            <AlertDescription>No accounts found.</AlertDescription>
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
                  width={120}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip
                  formatter={(
                    value: unknown,
                    _name: unknown,
                    props: { payload?: { currency?: string } }
                  ) =>
                    formatCurrency(
                      Number(value),
                      props.payload?.currency ?? defaultCurrency
                    )
                  }
                  labelFormatter={(_label: unknown, payload) =>
                    payload?.[0]?.payload?.fullName ?? ''
                  }
                />
                <Bar dataKey="balance" name="Balance" radius={[0, 4, 4, 0]}>
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
