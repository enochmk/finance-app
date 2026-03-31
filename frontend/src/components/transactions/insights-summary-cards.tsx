import { ArrowRightLeft, TrendingDown, TrendingUp } from 'lucide-react'

import { Card, CardContent } from '#/components/ui/card'
import { formatCurrency } from '#/lib/finance'

interface Insights {
  income: number
  expenses: number
  netFlow: number
  transfers: number
  incomeCount: number
  expenseCount: number
  transferCount: number
}

interface InsightsSummaryCardsProps {
  insights: Insights
  typeFilter: string
  onTypeFilterChange: (value: string) => void
  currency?: string
}

export function InsightsSummaryCards({
  insights,
  typeFilter,
  onTypeFilterChange,
  currency,
}: InsightsSummaryCardsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <Card
        className="cursor-pointer hover:bg-accent transition-colors"
        onClick={() =>
          onTypeFilterChange(typeFilter === 'INCOME' ? 'ALL' : 'INCOME')
        }
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Credited
            </span>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </div>
          <p className="text-xl font-bold text-green-600">
            {formatCurrency(insights.income, currency)}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {insights.incomeCount} transaction
            {insights.incomeCount !== 1 ? 's' : ''}
          </p>
        </CardContent>
      </Card>

      <Card
        className="cursor-pointer hover:bg-accent transition-colors"
        onClick={() =>
          onTypeFilterChange(typeFilter === 'EXPENSE' ? 'ALL' : 'EXPENSE')
        }
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Debited
            </span>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </div>
          <p className="text-xl font-bold text-red-600">
            {formatCurrency(insights.expenses, currency)}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {insights.expenseCount} transaction
            {insights.expenseCount !== 1 ? 's' : ''}
          </p>
        </CardContent>
      </Card>

      <Card className="cursor-default">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Net flow
            </span>
            <ArrowRightLeft
              className={`h-4 w-4 ${insights.netFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}
            />
          </div>
          <p
            className={`text-xl font-bold ${insights.netFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}
          >
            {insights.netFlow < 0 ? '-' : ''}
            {formatCurrency(Math.abs(insights.netFlow), currency)}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {insights.netFlow >= 0 ? 'Surplus' : 'Deficit'}
          </p>
        </CardContent>
      </Card>

      <Card
        className="cursor-pointer hover:bg-accent transition-colors"
        onClick={() =>
          onTypeFilterChange(typeFilter === 'TRANSFER' ? 'ALL' : 'TRANSFER')
        }
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Transfers
            </span>
            <ArrowRightLeft className="h-4 w-4 text-yellow-600" />
          </div>
          <p className="text-xl font-bold text-yellow-600">
            {formatCurrency(insights.transfers, currency)}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {insights.transferCount} transaction
            {insights.transferCount !== 1 ? 's' : ''}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
