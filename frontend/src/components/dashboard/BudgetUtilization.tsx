import { Alert, AlertDescription, AlertTitle } from '#/components/ui/alert'
import { Badge } from '#/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#/components/ui/card'
import { Progress } from '#/components/ui/progress'
import { formatCurrency } from '#/lib/finance'

interface BudgetItem {
  id: string
  amount: number
  spent: number
  utilizationRate: number
  category: { name: string }
}

interface BudgetUtilizationProps {
  budgets: BudgetItem[]
  activePeriodLabel: string
  currency: string
}

export function BudgetUtilization({
  budgets,
  activePeriodLabel,
  currency,
}: BudgetUtilizationProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Budget Utilization</CardTitle>
        <CardDescription>
          Category pressure for {activePeriodLabel}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {budgets.length === 0 ? (
          <Alert>
            <AlertTitle>No budgets in range</AlertTitle>
            <AlertDescription>
              Create a budget to compare planned vs actual spending.
            </AlertDescription>
          </Alert>
        ) : (
          budgets.map((budget) => {
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
                      {formatCurrency(budget.spent, currency)} of{' '}
                      {formatCurrency(budget.amount, currency)}
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
  )
}
