import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { toast } from 'sonner'
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Lightbulb,
  RefreshCw,
  SlidersHorizontal,
} from 'lucide-react'

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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '#/components/ui/dropdown-menu'
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
import { cn } from '#/lib/utils'

export const Route = createFileRoute('/dashboard')({
  component: DashboardPage,
})

const DASHBOARD_ACCOUNT_STORAGE_KEY = 'dashboard-selected-account-id'

const CHART_COLORS = [
  '#0f766e',
  '#dc2626',
  '#2563eb',
  '#d97706',
  '#7c3aed',
  '#be123c',
  '#0891b2',
  '#65a30d',
  '#4338ca',
  '#ea580c',
]

const DASHBOARD_PRESET_OPTIONS = [
  { value: 'today', label: 'Today' },
  { value: 'last7days', label: 'Last 7 days' },
  { value: 'last30days', label: 'Last 30 days' },
  { value: 'thisMonth', label: 'This month' },
  { value: 'lastMonth', label: 'Last month' },
  { value: 'thisYear', label: 'This year' },
  { value: 'lastYear', label: 'Last year' },
] as const

const COMPARE_BY_OPTIONS = [
  { value: 'day', label: 'Daily' },
  { value: 'week', label: 'Weekly' },
  { value: 'month', label: 'Monthly' },
  { value: 'year', label: 'Yearly' },
] as const

type DashboardPresetOption = (typeof DASHBOARD_PRESET_OPTIONS)[number]['value']
type DashboardCompareByOption = (typeof COMPARE_BY_OPTIONS)[number]['value']
type ComparisonMetric = DashboardSummary['comparison']['totalBalance']

function getStoredDashboardAccountId() {
  if (typeof window === 'undefined') return ''
  return window.localStorage.getItem(DASHBOARD_ACCOUNT_STORAGE_KEY) ?? ''
}

function storeDashboardAccountId(accountId: string) {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(DASHBOARD_ACCOUNT_STORAGE_KEY, accountId)
  }
}

function getDefaultCompareByForPreset(
  preset: DashboardPresetOption
): DashboardCompareByOption {
  if (preset === 'today') {
    return 'day'
  }

  if (preset === 'thisYear' || preset === 'lastYear') {
    return 'month'
  }

  return 'week'
}

function getPresetLabel(preset: DashboardPresetOption) {
  return DASHBOARD_PRESET_OPTIONS.find((option) => option.value === preset)
    ?.label
}

function getCompareByLabel(compareBy: DashboardCompareByOption) {
  return COMPARE_BY_OPTIONS.find((option) => option.value === compareBy)?.label
}

function getDeltaTone(change: number, inverse = false) {
  if (change === 0) {
    return 'neutral'
  }

  const improved = inverse ? change < 0 : change > 0
  return improved ? 'positive' : 'negative'
}

function formatPercentage(value: number | null) {
  if (value === null) {
    return 'New'
  }

  const digits = Math.abs(value) >= 10 ? 0 : 1
  const formatted = value.toFixed(digits)
  return value > 0 ? `+${formatted}%` : `${formatted}%`
}

function getDeltaMessage(
  tone: ReturnType<typeof getDeltaTone>,
  changePct: number | null
) {
  if (changePct === null) {
    return 'No prior baseline'
  }

  if (tone === 'positive') {
    return 'Better than previous period'
  }

  if (tone === 'negative') {
    return 'Worse than previous period'
  }

  return 'No change from previous period'
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
              <Skeleton className="h-60 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

function ComparisonPill({
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

function computeRecommendations(data: DashboardSummary): string[] {
  const recs: string[] = []
  const { overview, expensesByCategory, comparison } = data

  if (comparison.totalBalance.change < 0) {
    recs.push(
      `Ending balance is lower than ${data.previousPeriod.label}. Review the outflows that pulled the account down.`
    )
  }

  if (overview.totalIncome > 0) {
    const savingsRate = (overview.netCashFlow / overview.totalIncome) * 100
    if (savingsRate < 0) {
      recs.push(
        `You're spending more than you earn in ${data.period.label}. Expenses exceeded income by ${Math.abs(savingsRate).toFixed(1)}%.`
      )
    } else if (savingsRate < 20) {
      recs.push(
        `Savings rate is ${savingsRate.toFixed(1)}%. Consider targeting 20%+ to build a stronger buffer.`
      )
    }
  }

  if (expensesByCategory.length > 0 && overview.totalExpenses > 0) {
    const top = expensesByCategory[0]
    const pct = (top.amount / overview.totalExpenses) * 100
    if (pct > 40) {
      recs.push(
        `${top.name} represents ${pct.toFixed(1)}% of spending. That category is dominating the period.`
      )
    }
  }

  if (
    comparison.totalExpenses.changePct !== null &&
    comparison.totalExpenses.changePct > 20
  ) {
    recs.push(
      `Expenses increased ${comparison.totalExpenses.changePct.toFixed(0)}% versus ${data.previousPeriod.label}. Check discretionary transactions first.`
    )
  }

  if (overview.totalIncome === 0) {
    recs.push(
      'No income recorded in this period. Add income transactions to get a complete trend.'
    )
  }

  if (recs.length === 0) {
    recs.push(
      'This account is trending in a healthy direction. Keep tracking consistently.'
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
  const [selectedPreset, setSelectedPreset] =
    useState<DashboardPresetOption>('thisMonth')
  const [compareBy, setCompareBy] = useState<DashboardCompareByOption>(
    getDefaultCompareByForPreset('thisMonth')
  )

  const refreshCountRef = useRef(0)
  const [refreshTick, setRefreshTick] = useState(0)

  useEffect(() => {
    if (!isSessionLoading && !isAuthenticated) {
      void navigate({ to: '/sign-in' })
    }
  }, [isAuthenticated, isSessionLoading, navigate])

  const loadData = useCallback(
    async (
      accountId: string,
      preset: DashboardPresetOption,
      nextCompareBy: DashboardCompareByOption,
      silent = false
    ) => {
      if (!isAuthenticated) return
      if (!silent) setIsLoading(true)
      else setIsRefreshing(true)
      setError(null)

      try {
        const storedId = accountId || getStoredDashboardAccountId()
        const summary = await getDashboardSummary({
          accountId: storedId || undefined,
          preset,
          compareBy: nextCompareBy,
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
    void loadData(selectedAccountId, selectedPreset, compareBy)
  }, [compareBy, isAuthenticated, loadData, selectedAccountId, selectedPreset])

  useEffect(() => {
    if (refreshTick === 0) return
    void loadData(selectedAccountId, selectedPreset, compareBy, true)
  }, [compareBy, loadData, refreshTick, selectedAccountId, selectedPreset])

  const handleRefresh = () => {
    refreshCountRef.current += 1
    setRefreshTick(refreshCountRef.current)
  }

  const handleAccountChange = (value: string) => {
    setSelectedAccountId(value)
    storeDashboardAccountId(value)
  }

  const handlePresetChange = (value: string) => {
    const nextPreset = value as DashboardPresetOption
    setSelectedPreset(nextPreset)
    setCompareBy(getDefaultCompareByForPreset(nextPreset))
  }

  const selectedCurrency = data?.selectedAccount?.currency ?? 'GHS'
  const activePeriodLabel =
    data?.period.label ?? getPresetLabel(selectedPreset) ?? 'Period'
  const previousPeriodLabel = data?.previousPeriod.label ?? 'Previous period'
  const cadenceLabel =
    getCompareByLabel(data?.period.compareBy ?? compareBy) ?? 'Weekly'

  const cashFlowChartData = useMemo(
    () =>
      (data?.dailyCashFlow ?? []).map((entry) => ({
        label: entry.label,
        income: entry.income,
        expenses: entry.expenses,
      })),
    [data]
  )

  const balanceTrendData = useMemo(
    () =>
      (data?.balanceTrend ?? []).map((entry) => ({
        label: entry.label,
        balance: entry.balance,
      })),
    [data]
  )

  const expenseChartData = useMemo(
    () =>
      (data?.expensesByCategory ?? []).slice(0, 8).map((item, index) => ({
        name: item.name.length > 18 ? `${item.name.slice(0, 18)}…` : item.name,
        fullName: item.name,
        value: item.amount,
        fill: CHART_COLORS[index % CHART_COLORS.length],
      })),
    [data]
  )

  const periodComparisonData = useMemo(() => {
    if (!data) return []

    return [
      {
        label: 'Balance',
        current: data.comparison.totalBalance.current,
        previous: data.comparison.totalBalance.previous,
        metric: data.comparison.totalBalance,
        inverse: false,
      },
      {
        label: 'Income',
        current: data.comparison.totalIncome.current,
        previous: data.comparison.totalIncome.previous,
        metric: data.comparison.totalIncome,
        inverse: false,
      },
      {
        label: 'Expenses',
        current: data.comparison.totalExpenses.current,
        previous: data.comparison.totalExpenses.previous,
        metric: data.comparison.totalExpenses,
        inverse: true,
      },
      {
        label: 'Net',
        current: data.comparison.netCashFlow.current,
        previous: data.comparison.netCashFlow.previous,
        metric: data.comparison.netCashFlow,
        inverse: false,
      },
    ]
  }, [data])

  const accountBalanceData = useMemo(
    () =>
      [...(data?.accounts ?? [])]
        .sort((left, right) => right.currentBalance - left.currentBalance)
        .map((account, index) => ({
          name:
            account.name.length > 14
              ? `${account.name.slice(0, 14)}…`
              : account.name,
          fullName: account.name,
          balance: account.currentBalance,
          currency: account.currency,
          fill: account.color ?? CHART_COLORS[index % CHART_COLORS.length],
        })),
    [data]
  )

  const summaryMetrics = useMemo(() => {
    if (!data) return []

    return [
      {
        key: 'balance',
        title: 'Ending balance',
        value: data.comparison.totalBalance.current,
        metric: data.comparison.totalBalance,
        inverse: false,
      },
      {
        key: 'income',
        title: 'Income',
        value: data.comparison.totalIncome.current,
        metric: data.comparison.totalIncome,
        inverse: false,
      },
      {
        key: 'expenses',
        title: 'Expenses',
        value: data.comparison.totalExpenses.current,
        metric: data.comparison.totalExpenses,
        inverse: true,
      },
      {
        key: 'net',
        title: 'Net cash flow',
        value: data.comparison.netCashFlow.current,
        metric: data.comparison.netCashFlow,
        inverse: false,
      },
    ]
  }, [data])

  const recommendations = useMemo(
    () => (data ? computeRecommendations(data) : []),
    [data]
  )

  const hasLiveBalanceDelta =
    data?.selectedAccount &&
    Math.abs(
      data.selectedAccount.liveCurrentBalance -
        data.selectedAccount.currentBalance
    ) > 0.009

  return (
    <main className="w-full px-4 py-8 lg:px-8 xl:px-10">
      <div className="mb-8 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <Badge variant="secondary" className="mb-3">
            Account dashboard
          </Badge>
          <h1 className="display-title text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            See whether the account is improving or slipping
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-muted-foreground">
            Compare today, weekly, monthly, or yearly performance with a prior
            period so the trend answers whether you have more money than before.
          </p>
        </div>

        <Card className="w-full max-w-2xl">
          <CardContent className="space-y-4 p-6">
            <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
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

              <div className="flex flex-wrap gap-2 md:justify-end">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleRefresh}
                  disabled={isLoading || isRefreshing}
                  title="Refresh dashboard"
                >
                  <RefreshCw
                    className={cn('h-4 w-4', isRefreshing && 'animate-spin')}
                  />
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="gap-2">
                      <SlidersHorizontal className="h-4 w-4" />
                      Configure
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64">
                    <DropdownMenuLabel>Range preset</DropdownMenuLabel>
                    <DropdownMenuRadioGroup
                      value={selectedPreset}
                      onValueChange={handlePresetChange}
                    >
                      {DASHBOARD_PRESET_OPTIONS.map((option) => (
                        <DropdownMenuRadioItem
                          key={option.value}
                          value={option.value}
                        >
                          {option.label}
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>Trend cadence</DropdownMenuLabel>
                    <DropdownMenuRadioGroup
                      value={compareBy}
                      onValueChange={(value) =>
                        setCompareBy(value as DashboardCompareByOption)
                      }
                    >
                      {COMPARE_BY_OPTIONS.map((option) => (
                        <DropdownMenuRadioItem
                          key={option.value}
                          value={option.value}
                        >
                          {option.label}
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button asChild variant="outline">
                  <Link to="/settings/accounts">Manage</Link>
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <Badge variant="outline">{activePeriodLabel}</Badge>
              <Badge variant="outline">{cadenceLabel} trend</Badge>
              <span>Compared with {previousPeriodLabel}</span>
            </div>
          </CardContent>
        </Card>
      </div>

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
            <Card className="overflow-hidden">
              <CardContent className="flex flex-col gap-4 p-6 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-3xl font-semibold text-foreground">
                    {data.selectedAccount.name}
                  </h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {data.selectedAccount.currency}
                  </p>
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <ComparisonPill metric={data.comparison.totalBalance} />
                    <p className="text-sm text-muted-foreground">
                      {getDeltaMessage(
                        getDeltaTone(data.comparison.totalBalance.change),
                        data.comparison.totalBalance.changePct
                      )}
                    </p>
                  </div>
                </div>
                <div className="text-left lg:text-right">
                  <p className="text-sm text-muted-foreground">
                    Ending balance for {activePeriodLabel}
                  </p>
                  <p className="text-4xl font-semibold text-foreground">
                    {formatCurrency(
                      data.selectedAccount.currentBalance,
                      data.selectedAccount.currency
                    )}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Started at{' '}
                    {formatCurrency(
                      data.selectedAccount.periodStartBalance,
                      data.selectedAccount.currency
                    )}
                  </p>
                  {hasLiveBalanceDelta ? (
                    <p className="mt-1 text-sm text-muted-foreground">
                      Live now{' '}
                      {formatCurrency(
                        data.selectedAccount.liveCurrentBalance,
                        data.selectedAccount.currency
                      )}
                    </p>
                  ) : null}
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {summaryMetrics.map((metric) => {
                const tone = getDeltaTone(metric.metric.change, metric.inverse)

                return (
                  <Card key={metric.key}>
                    <CardHeader className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <CardDescription>{metric.title}</CardDescription>
                          <CardTitle className="mt-2 text-3xl text-foreground">
                            {formatCurrency(metric.value, selectedCurrency)}
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
                          {formatCurrency(
                            metric.metric.change,
                            selectedCurrency
                          )}{' '}
                          vs {previousPeriodLabel}
                        </span>
                      </div>
                    </CardHeader>
                  </Card>
                )
              })}
            </div>

            {recommendations.length > 0 && (
              <Card>
                <CardHeader className="flex flex-row items-center gap-2 pb-3">
                  <div className="rounded-full bg-primary-soft p-2 text-primary">
                    <Lightbulb className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle>Recommendations</CardTitle>
                    <CardDescription>
                      Trend-driven insights for {activePeriodLabel}
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

            <div className="grid gap-6 xl:grid-cols-2">
              <Card>
                <CardHeader>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <CardTitle>Cash Flow</CardTitle>
                      <CardDescription>
                        {cadenceLabel} income vs expenses for{' '}
                        {activePeriodLabel}
                      </CardDescription>
                    </div>
                    <ComparisonPill metric={data.comparison.netCashFlow} />
                  </div>
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

              <Card>
                <CardHeader>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <CardTitle>Expense Structure</CardTitle>
                      <CardDescription>
                        Spending by category for {activePeriodLabel}
                      </CardDescription>
                    </div>
                    <ComparisonPill
                      metric={data.comparison.totalExpenses}
                      inverse
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  {expenseChartData.length === 0 ? (
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
                          data={expenseChartData}
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
                              formatCurrency(Number(value), selectedCurrency)
                            }
                            labelFormatter={(_label: unknown, payload) =>
                              payload?.[0]?.payload?.fullName ?? ''
                            }
                          />
                          <Bar
                            dataKey="value"
                            name="Expenses"
                            radius={[0, 4, 4, 0]}
                          >
                            {expenseChartData.map((item, index) => (
                              <Cell key={index} fill={item.fill} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              <Card>
                <CardHeader>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <CardTitle>Balance Trend</CardTitle>
                      <CardDescription>
                        {cadenceLabel} ending balance through{' '}
                        {activePeriodLabel}
                      </CardDescription>
                    </div>
                    <ComparisonPill metric={data.comparison.totalBalance} />
                  </div>
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
                          width={72}
                        />
                        <Tooltip
                          formatter={(value: unknown) =>
                            formatCurrency(Number(value), selectedCurrency)
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
                    {periodComparisonData.map((item) => (
                      <div
                        key={item.label}
                        className="rounded-xl border border-border bg-card px-4 py-3"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-medium text-foreground">
                            {item.label}
                          </p>
                          <ComparisonPill
                            metric={item.metric}
                            inverse={item.inverse}
                          />
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground">
                          {formatCurrency(item.current, selectedCurrency)} now
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatCurrency(item.previous, selectedCurrency)} in{' '}
                          {previousPeriodLabel}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
              <Card>
                <CardHeader>
                  <CardTitle>Balance by Accounts</CardTitle>
                  <CardDescription>
                    Ending balance across active accounts for{' '}
                    {activePeriodLabel}
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
                        <BarChart
                          data={accountBalanceData}
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
                                props.payload?.currency ?? selectedCurrency
                              )
                            }
                            labelFormatter={(_label: unknown, payload) =>
                              payload?.[0]?.payload?.fullName ?? ''
                            }
                          />
                          <Bar
                            dataKey="balance"
                            name="Balance"
                            radius={[0, 4, 4, 0]}
                          >
                            {accountBalanceData.map((item, index) => (
                              <Cell key={index} fill={item.fill} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Last Records Overview</CardTitle>
                  <CardDescription>
                    Latest activity for {data.selectedAccount.name} in{' '}
                    {activePeriodLabel}.
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
                            {tx.category?.name ??
                              (tx.type === 'TRANSFER' ? (
                                'Transfer'
                              ) : (
                                <span className="text-muted-foreground">
                                  Uncategorized
                                </span>
                              ))}
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
