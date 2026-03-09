import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import {
  ArrowRight,
  Landmark,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { toast } from 'sonner'

import { useSession } from '#/components/session-provider'
import { getDashboardSummary, type DashboardSummary } from '#/lib/api'
import { Alert, AlertDescription, AlertTitle } from '#/components/ui/alert'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#/components/ui/card'
import { ChartContainer, ChartTooltipContent } from '#/components/ui/chart'
import { Progress } from '#/components/ui/progress'
import { Skeleton } from '#/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '#/components/ui/tabs'

export const Route = createFileRoute('/dashboard')({
  component: DashboardPage,
})

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(value)
}

function DashboardLoadingState() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index}>
            <CardHeader className="space-y-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-32" />
            </CardHeader>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[280px] w-full" />
        </CardContent>
      </Card>
    </div>
  )
}

function DashboardPage() {
  const navigate = useNavigate()
  const { isAuthenticated, isLoading: isSessionLoading } = useSession()
  const [data, setData] = useState<DashboardSummary | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

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
        const summary = await getDashboardSummary()

        if (!cancelled) {
          setData(summary)
        }
      } catch (loadError) {
        if (!cancelled) {
          const message =
            loadError instanceof Error
              ? loadError.message
              : 'Unable to load dashboard summary.'

          setError(message)
          toast.error('Dashboard unavailable', {
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
  }, [isAuthenticated])

  const transactionChartData = useMemo(() => {
    if (!data) {
      return []
    }

    return [...data.recentTransactions].reverse().map((transaction) => ({
      label: new Date(transaction.transactionDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      amount: Number(transaction.amount),
    }))
  }, [data])

  return (
    <main className="w-full px-4 py-8 lg:px-8 xl:px-10">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Badge variant="secondary" className="mb-3">
            Live dashboard
          </Badge>
          <h1 className="display-title text-4xl font-bold tracking-tight text-[var(--foreground)] sm:text-5xl">
            Monthly money command center
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-[var(--muted-foreground)]">
            Review balances, budget pressure, and recent movement without
            leaving the admin workspace.
          </p>
        </div>

        <Button asChild>
          <Link to="/reports">
            Open reports
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      {!isAuthenticated && !isSessionLoading ? null : null}

      {isLoading ? (
        <DashboardLoadingState />
      ) : error ? (
        <Alert variant="destructive">
          <AlertTitle>Dashboard unavailable</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : data ? (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[
              {
                label: 'Total balance',
                value: formatCurrency(data.overview.totalBalance),
                icon: Wallet,
                hint: 'All active accounts',
              },
              {
                label: 'Income',
                value: formatCurrency(data.overview.totalIncome),
                icon: TrendingUp,
                hint: 'Selected month',
              },
              {
                label: 'Expenses',
                value: formatCurrency(data.overview.totalExpenses),
                icon: TrendingDown,
                hint: 'Selected month',
              },
              {
                label: 'Budgeted',
                value: formatCurrency(data.overview.totalBudgeted),
                icon: Landmark,
                hint: 'Current budget plan',
              },
            ].map((item) => {
              const Icon = item.icon

              return (
                <Card key={item.label}>
                  <CardHeader className="flex flex-row items-start justify-between space-y-0">
                    <div>
                      <CardDescription>{item.label}</CardDescription>
                      <CardTitle className="mt-3 text-3xl">
                        {item.value}
                      </CardTitle>
                    </div>
                    <div className="rounded-full bg-[var(--primary-soft)] p-2 text-[var(--primary)]">
                      <Icon className="h-4 w-4" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-[var(--muted-foreground)]">
                      {item.hint}
                    </p>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
            <Card>
              <CardHeader>
                <CardTitle>Recent movement curve</CardTitle>
                <CardDescription>
                  Last {data.recentTransactions.length} transactions from the
                  live summary endpoint.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {transactionChartData.length === 0 ? (
                  <Alert>
                    <AlertTitle>No recent movement yet</AlertTitle>
                    <AlertDescription>
                      Add transactions from the management workspace to unlock
                      your trend chart.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <ChartContainer>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={transactionChartData}>
                        <defs>
                          <linearGradient
                            id="dashboardArea"
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
                        />
                        <YAxis
                          stroke="var(--muted-foreground)"
                          tickLine={false}
                          axisLine={false}
                          width={70}
                        />
                        <Tooltip content={<ChartTooltipContent />} />
                        <Area
                          type="monotone"
                          dataKey="amount"
                          stroke="var(--primary)"
                          fill="url(#dashboardArea)"
                          strokeWidth={2}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Budget utilization</CardTitle>
                <CardDescription>
                  Category pressure for the current period.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {data.budgets.length === 0 ? (
                  <Alert>
                    <AlertTitle>No budgets for this month</AlertTitle>
                    <AlertDescription>
                      Create a budget in the management workspace to see
                      category utilization here.
                    </AlertDescription>
                  </Alert>
                ) : (
                  data.budgets.map((budget) => {
                    const percent = Math.min(
                      Math.round(budget.utilizationRate * 100),
                      100
                    )

                    return (
                      <div key={budget.id} className="space-y-2">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium text-[var(--foreground)]">
                              {budget.category.name}
                            </p>
                            <p className="text-xs text-[var(--muted-foreground)]">
                              {formatCurrency(budget.spent)} spent
                            </p>
                          </div>
                          <Badge
                            variant={percent >= 85 ? 'warning' : 'default'}
                          >
                            {percent}%
                          </Badge>
                        </div>
                        <Progress value={percent} />
                      </div>
                    )
                  })
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle>Recurring schedule</CardTitle>
                <CardDescription>
                  Upcoming recurring transactions from the backend schedule
                  engine.
                </CardDescription>
              </div>
              <Button variant="outline" asChild>
                <Link to="/manage/recurring">Manage recurring items</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {data.recurringTransactions.length === 0 ? (
                <Alert>
                  <AlertTitle>No recurring schedules yet</AlertTitle>
                  <AlertDescription>
                    Create recurring transactions in the recurring section to
                    preview upcoming automated cash flow.
                  </AlertDescription>
                </Alert>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Description</TableHead>
                      <TableHead>Frequency</TableHead>
                      <TableHead>Account</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Next run</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.recurringTransactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell className="font-medium">
                          {transaction.description}
                        </TableCell>
                        <TableCell>{transaction.frequency}</TableCell>
                        <TableCell>{transaction.account.name}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              transaction.status === 'ACTIVE'
                                ? 'success'
                                : 'outline'
                            }
                          >
                            {transaction.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {new Date(transaction.nextRunAt).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Tabs defaultValue="activity" className="space-y-4">
            <TabsList>
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <TabsTrigger value="accounts">Accounts</TabsTrigger>
            </TabsList>

            <TabsContent value="activity">
              <Card>
                <CardHeader>
                  <CardTitle>Recent transactions</CardTitle>
                  <CardDescription>
                    Latest synced activity from the backend.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {data.recentTransactions.length === 0 ? (
                    <Alert>
                      <AlertTitle>No transactions recorded</AlertTitle>
                      <AlertDescription>
                        Visit the management page to add your first transaction
                        and unlock recent activity insights.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Description</TableHead>
                          <TableHead>Account</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.recentTransactions.map((transaction) => (
                          <TableRow key={transaction.id}>
                            <TableCell className="font-medium">
                              {transaction.description}
                            </TableCell>
                            <TableCell>{transaction.account.name}</TableCell>
                            <TableCell>
                              {transaction.category?.name ?? 'Uncategorized'}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {transaction.type}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(Number(transaction.amount))}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="accounts">
              <div className="grid gap-4 lg:grid-cols-3">
                {data.accounts.map((account) => (
                  <Card key={account.id}>
                    <CardHeader>
                      <CardDescription>
                        {account.type.replaceAll('_', ' ')}
                      </CardDescription>
                      <CardTitle>{account.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p className="text-3xl font-semibold text-[var(--foreground)]">
                        {formatCurrency(account.currentBalance)}
                      </p>
                      <p className="text-sm text-[var(--muted-foreground)]">
                        Opening balance {formatCurrency(account.openingBalance)}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      ) : null}
    </main>
  )
}
