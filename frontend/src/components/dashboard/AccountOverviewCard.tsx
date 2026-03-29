import { Card, CardContent } from '#/components/ui/card'
import { formatCurrency } from '#/lib/finance'
import { getDeltaMessage, getDeltaTone } from '#/lib/dashboard'
import type { ComparisonMetric } from '#/lib/dashboard'
import { ComparisonPill } from './ComparisonPill'

interface AccountOverviewCardProps {
  name: string
  type: string
  currency: string
  currentBalance: number
  liveCurrentBalance: number
  periodStartBalance: number
  activePeriodLabel: string
  balanceComparison: ComparisonMetric
  hasLiveBalanceDelta: boolean
}

export function AccountOverviewCard({
  name,
  type,
  currency,
  currentBalance,
  liveCurrentBalance,
  periodStartBalance,
  activePeriodLabel,
  balanceComparison,
  hasLiveBalanceDelta,
}: AccountOverviewCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="flex flex-col gap-4 p-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-3xl font-semibold text-foreground">{name}</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {type.replaceAll('_', ' ')} · {currency}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <ComparisonPill metric={balanceComparison} />
            <p className="text-sm text-muted-foreground">
              {getDeltaMessage(
                getDeltaTone(balanceComparison.change),
                balanceComparison.changePct
              )}
            </p>
          </div>
        </div>
        <div className="text-left lg:text-right">
          <p className="text-sm text-muted-foreground">
            Ending balance for {activePeriodLabel}
          </p>
          <p className="text-4xl font-semibold text-foreground">
            {formatCurrency(currentBalance, currency)}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Started at {formatCurrency(periodStartBalance, currency)}
          </p>
          {hasLiveBalanceDelta ? (
            <p className="mt-1 text-sm text-muted-foreground">
              Live now {formatCurrency(liveCurrentBalance, currency)}
            </p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}
