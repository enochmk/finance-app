import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { AlertTriangle, ArrowRight, Lightbulb, RefreshCw } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import { Skeleton } from '#/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#/components/ui/table'
import {
  formatCurrency,
  getTransactionAmountColor,
  getTransactionTypeLabel,
} from '#/lib/finance'

export const Route = createFileRoute('/dashboard')({
  component: DashboardPage,
})

const DASHBOARD_ACCOUNT_STORAGE_KEY = 'dashboard-selected-account-id'

const MONTH_LABELS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]

const PIE_COLORS = [
  'var(--primary)',
  '#2bb8ad',
  '#20878a',
  '#5a9ea0',
  '#8ec6c8',
  '#3d6b6d',
  '#a8d5d6',
  '#1a5658',
  '#6db3b5',
  '#b5dfe0',
]

function getStoredDashboardAccountId() {
  if (typeof window === 'undefined') return ''
  return window.localStorage.getItem(DASHBOARD_ACCOUNT_STORAGE_KEY) ?? ''
}

function storeDashboardAccountId(accountId: string) {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(DASHBOARD_ACCOUNT_STORAGE_KEY, accountId)
  }
}

function buildPeriodOptions() {
  const now = new Date()
  const options: Array<{ label: string; month: number; year: number }> = []
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    options.push({
      label: `${MONTH_LABELS[d.getMonth()]} ${d.getFullYear()}`,
      month: d.getMonth() + 1,
      year: d.getFullYear(),
    })
  }
  return options
}

function DashboardLoadingState() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="space-y-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-32" />
            </CardHeader>
          </Card>
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-40" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[240px] w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

function computeRecommendations(data: DashboardSummary): string[] {
  const recs: string[] = []
  const { overview, budgets, expensesByCategory, previousPeriod } = data

  if (overview.totalIncome > 0) {
    const savingsRate = (overview.netCashFlow / overview.totalIncome) * 100
    if (savingsRate < 0) {
      recs.push(
        `You're spending more than you earn this period. Expenses exceeded income by ${Math.abs(savingsRate).toFixed(1)}%.`
      )
    } else if (savingsRate < 20) {
      recs.push(
        `Savings rate is ${savingsRate.toFixed(1)}% — consider targeting 20%+ to build a stronger financial cushion.`
      )
    }
  }

  const overBudget = budgets.filter((b) => b.utilizationRate > 1)
  if (overBudget.length > 0) {
    recs.push(
      `${overBudget.length} budget ${overBudget.length === 1 ? 'category is' : 'categories are'} over limit: ${overBudget.map((b) => b.category.name).join(', ')}.`
    )
  }

  const nearBudget = budgets.filter(
    (b) => b.utilizationRate >= 0.8 && b.utilizationRate <= 1
  )
  if (nearBudget.length > 0) {
    recs.push(
      `${nearBudget.map((b) => b.category.name).join(', ')} ${nearBudget.length === 1 ? 'is' : 'are'} close to their budget limits (≥80%).`
    )
  }

  if (expensesByCategory.length > 0 && overview.totalExpenses > 0) {
    const top = expensesByCategory[0]
    const pct = (top.amount / overview.totalExpenses) * 100
    if (pct > 40) {
      recs.push(
        `"${top.name}" accounts for ${pct.toFixed(1)}% of all expenses — review whether this aligns with your goals.`
      )
    }
  }

  if (previousPeriod.totalExpenses > 0 && overview.totalExpenses > 0) {
    const changePct =
      ((overview.totalExpenses - previousPeriod.totalExpenses) /
        previousPeriod.totalExpenses) *
      100
    if (changePct > 20) {
      recs.push(
        `Expenses grew ${changePct.toFixed(1)}% vs last period — consider reviewing discretionary spending.`
      )
    }
  }

  if (overview.totalIncome === 0) {
    recs.push(
      'No income recorded this period. Add income transactions to get a full cash-flow picture.'
    )
  }

  if (recs.length === 0) {
    recs.push(
      'Looking healthy! Keep tracking consistently to spot patterns early.'
    )
  }

  return recs
}

function DashboardPage() {
  const navigate = useNavigate()
  const { isAuthenticated, isLoading: isSessionLoading } = useSession()

  const [data, setData] = useState<DashboardSummary | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [selectedAccountId, setSelectedAccountId] = useState(
    getStoredDashboardAccountId
  )

  const periodOptions = useMemo(() => buildPeriodOptions(), [])
  const now = new Date()
  const defaultPeriodKey = `${now.getMonth() + 1}-${now.getFullYear()}`
  const [selectedPeriodKey, setSelectedPeriodKey] = useState(defaultPeriodKey)

  const selectedPeriod = useMemo(
    () =>
      periodOptions.find((p) => `${p.month}-${p.year}` === selectedPeriodKey) ??
      periodOptions[0],
    [periodOptions, selectedPeriodKey]
  )

  const refreshCountRef = useRef(0)
  const [refreshTick, setRefreshTick] = useState(0)

  useEffect(() => {
    if (!isSessionLoading && !isAuthenticated) {
      void navigate({ to: '/sign-in' })
    }
  }, [isAuthenticated, isSessionLoading, navigate])

  const loadData = useCallback(
    async (accountId: string, month: number, year: number, silent = false) => {
      if (!isAuthenticated) return
      if (!silent) setIsLoading(true)
      else setIsRefreshing(true)
      setError(null)

      try {
        const storedId = accountId || getStoredDashboardAccountId()
        const summary = await getDashboardSummary({
          accountId: storedId || undefined,
          month,
          year,
        })

        setData(summary)

        const resolvedId = summary.selectedAccount?.id ?? ''
        setSelectedAccountId(resolvedId)
        if (resolvedId) storeDashboardAccountId(resolvedId)

        if (silent) toast.success('Dashboard refreshed')
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Unable to load dashboard.'
        setError(message)
        toast.error('Dashboard unavailable', { description: message })
      } finally {
        if (!silent) setIsLoading(false)
        else setIsRefreshing(false)
      }
    },
    [isAuthenticated]
  )

  useEffect(() => {
    if (!isAuthenticated) return
    void loadData(selectedAccountId, selectedPeriod.month, selectedPeriod.year)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, selectedAccountId, selectedPeriodKey])

  useEffect(() => {
    if (refreshTick === 0) return
    void loadData(
      selectedAccountId,
      selectedPeriod.month,
      selectedPeriod.year,
      true
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTick])

  const handleRefresh = () => {
    refreshCountRef.current += 1
    setRefreshTick(refreshCountRef.current)
  }

  const handleAccountChange = (value: string) => {
    setSelectedAccountId(value)
    storeDashboardAccountId(value)
  }

  const selectedCurrency = data?.selectedAccount?.currency ?? 'GHS'

  const cashFlowChartData = useMemo(
    () =>
      (data?.dailyCashFlow ?? []).map((d) => ({
        date: d.date.slice(5),
        income: d.income,
        expenses: d.expenses,
      })),
    [data]
  )

  const balanceTrendData = useMemo(
    () =>
      (data?.balanceTrend ?? []).map((d) => ({
        date: d.date.slice(5),
        balance: d.balance,
      })),
    [data]
  )

  const expensePieData = useMemo(
    () =>
      (data?.expensesByCategory ?? [])
        .slice(0, 8)
        .map((item) => ({ name: item.name, value: item.amount })),
    [data]
  )

  const periodComparisonData = useMemo(() => {
    if (!data) return []
    return [
      {
        label: 'Income',
        current: data.overview.totalIncome,
        previous: data.previousPeriod.totalIncome,
      },
      {
        label: 'Expenses',
        current: data.overview.totalExpenses,
        previous: data.previousPeriod.totalExpenses,
      },
      {
        label: 'Net',
        current: data.overview.netCashFlow,
        previous: data.previousPeriod.netCashFlow,
      },
    ]
  }, [data])

  const accountBalanceData = useMemo(
    () =>
      (data?.accounts ?? []).map((a) => ({
        name: a.name.length > 12 ? `${a.name.slice(0, 12)}…` : a.name,
        fullName: a.name,
        balance: a.currentBalance,
        currency: a.currency,
      })),
    [data]
  )

  const recommendations = useMemo(
    () => (data ? computeRecommendations(data) : []),
    [data]
  )

  const prevMonthLabel = data
    ? `${MONTH_LABELS[data.previousPeriod.month - 1]} ${data.previousPeriod.year}`
    : 'prev period'

  return (
    <main className="w-full px-4 py-8 lg:px-8 xl:px-10">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <Badge variant="secondary" className="mb-3">
            Account dashboard
          </Badge>
          <h1 className="display-title text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            One account at a time, with cleaner money context
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-muted-foreground">
            Focus on the selected account so balances, movement, and category
            pressure stay tied to the money bucket you are actually reviewing.
          </p>
        </div>

        <Card className="w-full max-w-xl">
          <CardContent className="grid gap-4 p-6 md:grid-cols-[1fr_1fr_auto] md:items-end">
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Account</p>
              <Select
                value={selectedAccountId}
                onValueChange={handleAccountChange}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose account" />
                </SelectTrigger>
                <SelectContent>
                  {(data?.accounts ?? []).map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Period</p>
              <Select
                value={selectedPeriodKey}
                onValueChange={setSelectedPeriodKey}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {periodOptions.map((p) => (
                    <SelectItem
                      key={`${p.month}-${p.year}`}
                      value={`${p.month}-${p.year}`}
                    >
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={handleRefresh}
                disabled={isLoading || isRefreshing}
                title="Refresh dashboard"
              >
                <RefreshCw
                  className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`}
                />
              </Button>
              <Button asChild variant="outline">
                <Link to="/settings/accounts">Manage</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Body */}
      {isLoading ? (
        <DashboardLoadingState />
      ) : error ? (
        <Alert variant="destructive">
          <AlertTitle>Dashboard unavailable</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : data ? (
        data.selectedAccount ? (
          <div className="space-y-6">
            {/* Account banner */}
            <Card className="overflow-hidden">
              <CardContent className="flex flex-col gap-4 p-6 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-3xl font-semibold text-foreground">
                    {data.selectedAccount.name}
                  </h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {data.selectedAccount.type.replaceAll('_', ' ')} ·{' '}
                    {data.selectedAccount.currency}
                  </p>
                </div>
                <div className="text-left lg:text-right">
                  <p className="text-sm text-muted-foreground">
                    Current balance
                  </p>
                  <p className="text-4xl font-semibold text-foreground">
                    {formatCurrency(
                      data.selectedAccount.currentBalance,
                      data.selectedAccount.currency
                    )}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Opening{' '}
                    {formatCurrency(
                      data.selectedAccount.openingBalance,
                      data.selectedAccount.currency
                    )}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Recommendations */}
            {recommendations.length > 0 && (
              <Card>
                <CardHeader className="flex flex-row items-center gap-2 pb-3">
                  <div className="rounded-full bg-primary-soft p-2 text-primary">
                    <Lightbulb className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle>Recommendations</CardTitle>
                    <CardDescription>
                      Auto-generated insights for this period
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {recommendations.map((rec, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-sm text-foreground"
                      >
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        {rec}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Row 1: Cash Flow + Expense Structure */}
            <div className="grid gap-6 xl:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Cash Flow</CardTitle>
                  <CardDescription>
                    Daily income vs expenses for the selected period
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {cashFlowChartData.length === 0 ? (
                    <Alert>
                      <AlertTitle>No cash flow data</AlertTitle>
                      <AlertDescription>
                        No transactions found for this period.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <ChartContainer>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={cashFlowChartData}>
                          <CartesianGrid
                            stroke="var(--border)"
                            strokeDasharray="4 4"
                            vertical={false}
                          />
                          <XAxis
                            dataKey="date"
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

              <Card>
                <CardHeader>
                  <CardTitle>Expense Structure</CardTitle>
                  <CardDescription>
                    Spending by category this period
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {expensePieData.length === 0 ? (
                    <Alert>
                      <AlertTitle>No expense categories</AlertTitle>
                      <AlertDescription>
                        No categorised expenses recorded for this period.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <ChartContainer>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={expensePieData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius="35%"
                            outerRadius="65%"
                            paddingAngle={2}
                          >
                            {expensePieData.map((_, index) => (
                              <Cell
                                key={index}
                                fill={PIE_COLORS[index % PIE_COLORS.length]}
                              />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value: unknown) =>
                              formatCurrency(Number(value), selectedCurrency)
                            }
                          />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Row 2: Balance Trend + Period Comparison */}
            <div className="grid gap-6 xl:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Balance Trend</CardTitle>
                  <CardDescription>
                    Running balance through the selected period
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {balanceTrendData.length === 0 ? (
                    <Alert>
                      <AlertTitle>No balance data</AlertTitle>
                      <AlertDescription>
                        No transactions found for this period.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <ChartContainer>
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={balanceTrendData}>
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
                            dataKey="date"
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

              <Card>
                <CardHeader>
                  <CardTitle>Period Comparison</CardTitle>
                  <CardDescription>
                    Current period vs {prevMonthLabel}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={periodComparisonData}
                        layout="vertical"
                        margin={{ left: 16 }}
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
                          dataKey="label"
                          type="category"
                          stroke="var(--muted-foreground)"
                          tickLine={false}
                          axisLine={false}
                          tick={{ fontSize: 12 }}
                          width={64}
                        />
                        <Tooltip
                          formatter={(v: unknown) =>
                            formatCurrency(Number(v), selectedCurrency)
                          }
                        />
                        <Legend />
                        <Bar
                          dataKey="current"
                          name="This period"
                          fill="var(--primary)"
                          radius={[0, 3, 3, 0]}
                        />
                        <Bar
                          dataKey="previous"
                          name={prevMonthLabel}
                          fill="var(--secondary-strong)"
                          radius={[0, 3, 3, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>

            {/* Row 3: Balance by Accounts + Budget Utilization */}
            <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
              <Card>
                <CardHeader>
                  <CardTitle>Balance by Accounts</CardTitle>
                  <CardDescription>
                    Current balance across all active accounts
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {accountBalanceData.length === 0 ? (
                    <Alert>
                      <AlertTitle>No accounts</AlertTitle>
                      <AlertDescription>No accounts found.</AlertDescription>
                    </Alert>
                  ) : (
                    <ChartContainer>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={accountBalanceData}>
                          <CartesianGrid
                            stroke="var(--border)"
                            strokeDasharray="4 4"
                            vertical={false}
                          />
                          <XAxis
                            dataKey="name"
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
                          <Tooltip
                            formatter={(
                              v: unknown,
                              _name: unknown,
                              props: { payload?: { currency?: string } }
                            ) =>
                              formatCurrency(
                                Number(v),
                                props.payload?.currency ?? selectedCurrency
                              )
                            }
                          />
                          <Bar
                            dataKey="balance"
                            name="Balance"
                            radius={[4, 4, 0, 0]}
                          >
                            {accountBalanceData.map((_, index) => (
                              <Cell
                                key={index}
                                fill={PIE_COLORS[index % PIE_COLORS.length]}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Budget Utilization</CardTitle>
                  <CardDescription>
                    Category pressure this period
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  {data.budgets.length === 0 ? (
                    <Alert>
                      <AlertTitle>No budgets this month</AlertTitle>
                      <AlertDescription>
                        Create a budget to compare planned vs actual spending.
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
                              <p className="text-sm font-medium text-foreground">
                                {budget.category.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatCurrency(budget.spent, selectedCurrency)}{' '}
                                of{' '}
                                {formatCurrency(
                                  budget.amount,
                                  selectedCurrency
                                )}
                              </p>
                            </div>
                            <Badge
                              variant={
                                percent >= 100
                                  ? 'warning'
                                  : percent >= 85
                                    ? 'warning'
                                    : 'default'
                              }
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

            {/* Tabs */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Last Records Overview</CardTitle>
                  <CardDescription>
                    Latest activity for {data.selectedAccount.name} this period.
                  </CardDescription>
                </div>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/transactions">
                    View all <ArrowRight className="ml-1 h-3 w-3" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                {data.recentTransactions.length === 0 ? (
                  <Alert>
                    <AlertTitle>No transactions recorded</AlertTitle>
                    <AlertDescription>
                      Visit the management page to add transactions.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.recentTransactions.map((tx) => (
                        <TableRow key={tx.id}>
                          <TableCell className="whitespace-nowrap text-muted-foreground">
                            {new Date(tx.transactionDate).toLocaleDateString(
                              'en-US',
                              { month: 'short', day: 'numeric' }
                            )}
                          </TableCell>
                          <TableCell className="font-medium">
                            {tx.description}
                          </TableCell>
                          <TableCell>
                            {tx.category?.name ?? (
                              <span className="text-muted-foreground">
                                Uncategorized
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {getTransactionTypeLabel(tx.type)}
                            </Badge>
                          </TableCell>
                          <TableCell
                            className={`text-right font-medium ${getTransactionAmountColor(tx.type)}`}
                          >
                            {tx.type === 'EXPENSE' ? '-' : ''}
                            {formatCurrency(
                              Number(tx.amount),
                              selectedCurrency
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          <Alert>
            <AlertTitle>No active accounts yet</AlertTitle>
            <AlertDescription>
              Create an account in the management workspace to unlock the
              account-specific dashboard.
            </AlertDescription>
          </Alert>
        )
      ) : null}
    </main>
  )
}
