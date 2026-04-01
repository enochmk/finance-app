import type { DashboardSummary } from '#/lib/api'

export const DASHBOARD_ACCOUNT_STORAGE_KEY = 'dashboard-selected-account-id'

export const CHART_COLORS = [
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

export const DASHBOARD_PRESET_OPTIONS = [
  { value: 'today', label: 'Today' },
  { value: 'last7days', label: 'Last 7 days' },
  { value: 'last30days', label: 'Last 30 days' },
  { value: 'thisMonth', label: 'This month' },
  { value: 'lastMonth', label: 'Last month' },
  { value: 'thisYear', label: 'This year' },
  { value: 'lastYear', label: 'Last year' },
] as const

export const COMPARE_BY_OPTIONS = [
  { value: 'day', label: 'Daily' },
  { value: 'week', label: 'Weekly' },
  { value: 'month', label: 'Monthly' },
  { value: 'year', label: 'Yearly' },
] as const

export type DashboardPresetOption =
  (typeof DASHBOARD_PRESET_OPTIONS)[number]['value']
export type DashboardCompareByOption =
  (typeof COMPARE_BY_OPTIONS)[number]['value']
export type ComparisonMetric = DashboardSummary['comparison']['totalBalance']

export function getStoredDashboardAccountId() {
  if (typeof window === 'undefined') return ''
  return window.localStorage.getItem(DASHBOARD_ACCOUNT_STORAGE_KEY) ?? ''
}

export function storeDashboardAccountId(accountId: string) {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(DASHBOARD_ACCOUNT_STORAGE_KEY, accountId)
  }
}

export function getDefaultCompareByForPreset(
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

export function getPresetLabel(preset: DashboardPresetOption) {
  return DASHBOARD_PRESET_OPTIONS.find((option) => option.value === preset)
    ?.label
}

export function getCompareByLabel(compareBy: DashboardCompareByOption) {
  return COMPARE_BY_OPTIONS.find((option) => option.value === compareBy)?.label
}

export function getDeltaTone(change: number, inverse = false) {
  if (change === 0) {
    return 'neutral'
  }

  const improved = inverse ? change < 0 : change > 0
  return improved ? 'positive' : 'negative'
}

export function formatPercentage(value: number | null) {
  if (value === null) {
    return 'New'
  }

  const digits = Math.abs(value) >= 10 ? 0 : 1
  const formatted = value.toFixed(digits)
  return value > 0 ? `+${formatted}%` : `${formatted}%`
}

export function getDeltaMessage(
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

export function computeRecommendations(data: DashboardSummary): string[] {
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
