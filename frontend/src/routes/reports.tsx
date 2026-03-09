import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { CalendarRange, CircleDollarSign, Landmark, TrendingDown, TrendingUp } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { toast } from 'sonner'

import {
  getMonthlyReport,
  type MonthlyReport,
} from '#/lib/api'
import { useSession } from '#/components/session-provider'
import { Alert, AlertDescription, AlertTitle } from '#/components/ui/alert'
import { Badge } from '#/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/components/ui/card'
import { ChartContainer, ChartTooltipContent } from '#/components/ui/chart'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '#/components/ui/select'
import { Skeleton } from '#/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '#/components/ui/table'

export const Route = createFileRoute('/reports')({
  component: ReportsPage,
})

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(value)
}

function ReportsLoadingState() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <Card key={index}>
            <CardHeader className="space-y-3">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-28" />
            </CardHeader>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-36" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[320px] w-full" />
        </CardContent>
      </Card>
    </div>
  )
}

function ReportsPage() {
  const navigate = useNavigate()
  const { isAuthenticated, isLoading: isSessionLoading } = useSession()
  const [data, setData] = useState<MonthlyReport | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [month, setMonth] = useState<string>('')
  const [year, setYear] = useState<string>('')

  useEffect(() => {
    if (!isSessionLoading && !isAuthenticated) {
      void navigate({ to: '/sign-in' })
    }
  }, [isAuthenticated, isSessionLoading, navigate])

  useEffect(() => {
    if (!isAuthenticated) {
      return
    }

    let cancelled = false

    async function load() {
      try {
        setIsLoading(true)
        setError(null)

        const query = new URLSearchParams()
        if (month) {
          query.set('month', month)
        }
        if (year) {
          query.set('year', year)
        }

        const report = await getMonthlyReport(query.size ? `?${query}` : '')

        if (!cancelled) {
          setData(report)
        }
      } catch (loadError) {
        if (!cancelled) {
          const message =
            loadError instanceof Error
              ? loadError.message
              : 'Unable to load monthly report.'

          setError(message)
          toast.error('Monthly report unavailable', {
            description: message,
          })
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [isAuthenticated, month, year])

  const pieData = useMemo(() => {
    if (!data) {
      return []
    }

    return data.topExpenseCategories.map((item, index) => ({
      name: item.category?.name ?? 'Uncategorized',
      value: item.amount,
      fill: ['#176b6c', '#2f8e8e', '#59b9a4', '#7ecfba', '#a8e6d2'][index % 5],
    }))
  }, [data])

  return (
    <main className="w-full px-4 py-8 lg:px-8 xl:px-10">
      <div className="mb-8 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <Badge variant="secondary" className="mb-3">
            Monthly report
          </Badge>
          <h1 className="display-title text-4xl font-bold tracking-tight text-[var(--foreground)] sm:text-5xl">
            Cash flow, categories, and account movement
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-[var(--muted-foreground)]">
            A reporting workspace built from the backend report endpoint with charts,
            filters, and category breakdowns.
          </p>
        </div>

        <Card className="w-full max-w-xl">
          <CardContent className="grid gap-4 p-6 md:grid-cols-[1fr_1fr_auto] md:items-end">
            <div className="space-y-2">
              <Label htmlFor="report-month">Month</Label>
              <Select value={month || 'auto'} onValueChange={(value) => setMonth(value === 'auto' ? '' : value)}>
                <SelectTrigger id="report-month">
                  <SelectValue placeholder="Current month" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Current month</SelectItem>
                  {Array.from({ length: 12 }).map((_, index) => (
                    <SelectItem key={index + 1} value={String(index + 1)}>
                      {new Date(2026, index, 1).toLocaleDateString('en-US', { month: 'long' })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="report-year">Year</Label>
              <Input
                id="report-year"
                placeholder="2026"
                value={year}
                onChange={(event) => setYear(event.target.value)}
              />
            </div>

            <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
              <CalendarRange className="h-4 w-4" />
              Filter live
            </div>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <ReportsLoadingState />
      ) : error ? (
        <Alert variant="destructive">
          <AlertTitle>Report unavailable</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : data ? (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {[
              { label: 'Income', value: data.totals.income, icon: TrendingUp },
              { label: 'Expenses', value: data.totals.expenses, icon: TrendingDown },
              { label: 'Net', value: data.totals.net, icon: CircleDollarSign },
              { label: 'Transfers', value: data.totals.transfers, icon: Landmark },
              {
                label: 'Transactions',
                value: data.totals.transactionCount,
                icon: CalendarRange,
              },
            ].map((item) => {
              const Icon = item.icon

              return (
                <Card key={item.label}>
                  <CardHeader className="flex flex-row items-start justify-between space-y-0">
                    <div>
                      <CardDescription>{item.label}</CardDescription>
                      <CardTitle className="mt-3 text-3xl">
                        {typeof item.value === 'number' && item.label !== 'Transactions'
                          ? formatCurrency(item.value)
                          : item.value}
                      </CardTitle>
                    </div>
                    <div className="rounded-full bg-[var(--primary-soft)] p-2 text-[var(--primary)]">
                      <Icon className="h-4 w-4" />
                    </div>
                  </CardHeader>
                </Card>
              )
            })}
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <Card>
              <CardHeader>
                <CardTitle>Daily cash flow</CardTitle>
                <CardDescription>Income versus expenses across the selected month.</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer className="h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.dailyCashFlow}>
                      <CartesianGrid stroke="var(--border)" strokeDasharray="4 4" vertical={false} />
                      <XAxis dataKey="date" stroke="var(--muted-foreground)" tickLine={false} axisLine={false} />
                      <YAxis stroke="var(--muted-foreground)" tickLine={false} axisLine={false} width={72} />
                      <Tooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="income" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="expenses" fill="#d97706" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top expense mix</CardTitle>
                <CardDescription>Largest spending categories this month.</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer className="h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Tooltip content={<ChartTooltipContent />} />
                      <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={70} outerRadius={110} paddingAngle={4} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Expense categories</CardTitle>
                <CardDescription>Ranked by total spend for the selected month.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.expenseCategoryBreakdown.map((item, index) => (
                      <TableRow key={`${item.category?.id ?? 'expense'}-${index}`}>
                        <TableCell className="font-medium">
                          {item.category?.name ?? 'Uncategorized'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{item.category?.type ?? 'EXPENSE'}</Badge>
                        </TableCell>
                        <TableCell className="text-right">{formatCurrency(item.amount)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Account activity</CardTitle>
                <CardDescription>Net movement and transfer activity per account.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Account</TableHead>
                      <TableHead>Income</TableHead>
                      <TableHead>Transfers In</TableHead>
                      <TableHead className="text-right">Net</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.accountActivity.map((account) => (
                      <TableRow key={account.accountId}>
                        <TableCell className="font-medium">{account.accountName}</TableCell>
                        <TableCell>{formatCurrency(account.income)}</TableCell>
                        <TableCell>{formatCurrency(account.transfersIn)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(account.net)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : null}
    </main>
  )
}
