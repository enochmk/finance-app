import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { Landmark, TrendingDown, TrendingUp, Wallet } from 'lucide-react'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '#/components/ui/tabs'
import { formatCurrency, getTransactionTypeLabel } from '#/lib/finance'

export const Route = createFileRoute('/dashboard')({
  component: DashboardPage,
})

const DASHBOARD_ACCOUNT_STORAGE_KEY = 'dashboard-selected-account-id'

function getStoredDashboardAccountId() {
  if (typeof window === 'undefined') {
    return ''
  }

  return window.localStorage.getItem(DASHBOARD_ACCOUNT_STORAGE_KEY) ?? ''
}

function storeDashboardAccountId(accountId: string) {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(DASHBOARD_ACCOUNT_STORAGE_KEY, accountId)
  }
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
  const [selectedAccountId, setSelectedAccountId] = useState('')

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

        const storedAccountId =
          selectedAccountId || getStoredDashboardAccountId()
        const search = storedAccountId
          ? `?${new URLSearchParams({ accountId: storedAccountId }).toString()}`
          : ''

        const summary = await getDashboardSummary(search)

        if (!cancelled) {
          setData(summary)

          const resolvedAccountId = summary.selectedAccount?.id ?? ''
          setSelectedAccountId(resolvedAccountId)

          if (resolvedAccountId) {
            storeDashboardAccountId(resolvedAccountId)
          }
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
  }, [isAuthenticated, selectedAccountId])

  const selectedCurrency = data?.selectedAccount?.currency ?? 'GHS'

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
      <div className="mb-8 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <Badge variant="secondary" className="mb-3">
            Account dashboard
          </Badge>
          <h1 className="display-title text-4xl font-bold tracking-tight text-[var(--foreground)] sm:text-5xl">
            One account at a time, with cleaner money context
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-[var(--muted-foreground)]">
            Focus on the selected account so balances, movement, and category
            pressure stay tied to the money bucket you are actually reviewing.
          </p>
        </div>

        <Card className="w-full max-w-xl">
          <CardContent className="grid gap-4 p-6 md:grid-cols-[1fr_auto] md:items-end">
            <div className="space-y-2">
              <p className="text-sm font-medium text-[var(--foreground)]">
                Selected account
              </p>
              <Select
                value={selectedAccountId}
                onValueChange={(value) => {
                  setSelectedAccountId(value)
                  storeDashboardAccountId(value)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose account" />
                </SelectTrigger>
                <SelectContent>
                  {data?.accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button asChild variant="outline">
              <Link to="/manage/accounts">Manage accounts</Link>
            </Button>
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
                  <div className="mb-3 flex items-center gap-3">
                    <span
                      className="inline-flex h-4 w-4 rounded-full border border-[var(--border)]"
                      style={{
                        backgroundColor:
                          data.selectedAccount.color ?? '#176b6c',
                      }}
                    />
                    <Badge variant="secondary">
                      {data.selectedAccount.entryMode === 'AUTOMATED'
                        ? 'Automated account'
                        : 'Manual account'}
                    </Badge>
                  </div>
                  <h2 className="text-3xl font-semibold text-[var(--foreground)]">
                    {data.selectedAccount.name}
                  </h2>
                  <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                    {data.selectedAccount.type.replaceAll('_', ' ')} in{' '}
                    {data.selectedAccount.currency}
                  </p>
                </div>

                <div className="text-left lg:text-right">
                  <p className="text-sm text-[var(--muted-foreground)]">
                    Current balance
                  </p>
                  <p className="text-4xl font-semibold text-[var(--foreground)]">
                    {formatCurrency(
                      data.selectedAccount.currentBalance,
                      data.selectedAccount.currency
                    )}
                  </p>
                  <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                    Opening balance{' '}
                    {formatCurrency(
                      data.selectedAccount.openingBalance,
                      data.selectedAccount.currency
                    )}
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {[
                {
                  label: 'Balance',
                  value: formatCurrency(
                    data.overview.totalBalance,
                    selectedCurrency
                  ),
                  icon: Wallet,
                  hint: 'Selected account live balance',
                },
                {
                  label: 'Credits',
                  value: formatCurrency(
                    data.overview.totalIncome,
                    selectedCurrency
                  ),
                  icon: TrendingUp,
                  hint: 'Selected month',
                },
                {
                  label: 'Debits',
                  value: formatCurrency(
                    data.overview.totalExpenses,
                    selectedCurrency
                  ),
                  icon: TrendingDown,
                  hint: 'Selected month',
                },
                {
                  label: 'Budgeted',
                  value: formatCurrency(
                    data.overview.totalBudgeted,
                    selectedCurrency
                  ),
                  icon: Landmark,
                  hint: 'Visible category plan',
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
                    Last {data.recentTransactions.length} entries touching this
                    account.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {transactionChartData.length === 0 ? (
                    <Alert>
                      <AlertTitle>No recent movement yet</AlertTitle>
                      <AlertDescription>
                        Add transactions for this account to unlock its activity
                        trend.
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
                    Category pressure for the current period within this account
                    view.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  {data.budgets.length === 0 ? (
                    <Alert>
                      <AlertTitle>No budgets for this month</AlertTitle>
                      <AlertDescription>
                        Create a budget in the management workspace to compare
                        planned versus actual spending.
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
                                {formatCurrency(budget.spent, selectedCurrency)}{' '}
                                spent
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
                      Latest activity touching {data.selectedAccount.name}.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {data.recentTransactions.length === 0 ? (
                      <Alert>
                        <AlertTitle>No transactions recorded</AlertTitle>
                        <AlertDescription>
                          Visit the management page to add the first transaction
                          for this account.
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Description</TableHead>
                            <TableHead>Counterparty</TableHead>
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
                              <TableCell>
                                {transaction.account.id ===
                                data.selectedAccount?.id
                                  ? (transaction.transferAccount?.name ??
                                    'This account')
                                  : transaction.account.name}
                              </TableCell>
                              <TableCell>
                                {transaction.category?.name ?? 'Uncategorized'}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">
                                  {getTransactionTypeLabel(transaction.type)}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                {formatCurrency(
                                  Number(transaction.amount),
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
              </TabsContent>

              <TabsContent value="accounts">
                <div className="grid gap-4 lg:grid-cols-3">
                  {data.accounts.map((account) => (
                    <Card
                      key={account.id}
                      className={
                        account.id === data.selectedAccount?.id
                          ? 'border-[var(--primary)]'
                          : undefined
                      }
                    >
                      <CardHeader>
                        <CardDescription>
                          {account.type.replaceAll('_', ' ')}
                        </CardDescription>
                        <CardTitle>{account.name}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <p className="text-3xl font-semibold text-[var(--foreground)]">
                          {formatCurrency(
                            account.currentBalance,
                            account.currency
                          )}
                        </p>
                        <p className="text-sm text-[var(--muted-foreground)]">
                          Opening balance{' '}
                          {formatCurrency(
                            account.openingBalance,
                            account.currency
                          )}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
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
