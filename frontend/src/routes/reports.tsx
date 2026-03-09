import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

import {
  getMonthlyReport,
  loginWithSeedUser,
  type MonthlyReport,
} from '#/lib/api'

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

function ReportsPage() {
  const [data, setData] = useState<MonthlyReport | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        setIsLoading(true)
        setError(null)
        await loginWithSeedUser()
        const report = await getMonthlyReport()

        if (!cancelled) {
          setData(report)
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'Unable to load monthly report.'
          )
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
  }, [])

  return (
    <main className="page-wrap px-4 pb-12 pt-12">
      <section className="island-shell rise-in relative overflow-hidden rounded-[2rem] px-6 py-8 sm:px-10 sm:py-10">
        <div className="pointer-events-none absolute -left-16 -top-12 h-48 w-48 rounded-full bg-[radial-gradient(circle,rgba(47,106,74,0.22),transparent_70%)]" />
        <p className="island-kicker mb-3">Reports</p>
        <h1 className="display-title text-4xl leading-[1.02] font-bold tracking-tight text-[var(--sea-ink)] sm:text-5xl">
          Monthly performance report
        </h1>
        <p className="mt-3 max-w-2xl text-base text-[var(--sea-ink-soft)] sm:text-lg">
          Category breakdowns, daily cash flow, and account movement from the
          backend reporting endpoint.
        </p>
      </section>

      {isLoading ? (
        <section className="island-shell mt-8 rounded-2xl p-6 text-sm text-[var(--sea-ink-soft)]">
          Loading monthly report...
        </section>
      ) : error ? (
        <section className="island-shell mt-8 rounded-2xl border-[rgba(167,60,43,0.24)] p-6 text-sm text-[var(--sea-ink)]">
          <p className="m-0 font-semibold">Report unavailable</p>
          <p className="mt-2 mb-0 text-[var(--sea-ink-soft)]">{error}</p>
        </section>
      ) : data ? (
        <>
          <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {[
              ['Income', formatCurrency(data.totals.income)],
              ['Expenses', formatCurrency(data.totals.expenses)],
              ['Net', formatCurrency(data.totals.net)],
              ['Transfers', formatCurrency(data.totals.transfers)],
              ['Transactions', String(data.totals.transactionCount)],
            ].map(([label, value], index) => (
              <article
                key={label}
                className="island-shell feature-card rise-in rounded-2xl p-5"
                style={{ animationDelay: `${index * 80 + 60}ms` }}
              >
                <p className="island-kicker mb-2">{label}</p>
                <p className="m-0 text-2xl font-bold text-[var(--sea-ink)]">
                  {value}
                </p>
              </article>
            ))}
          </section>

          <section className="mt-8 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
            <article className="island-shell rounded-2xl p-6">
              <p className="island-kicker mb-2">Top Expenses</p>
              <h2 className="m-0 text-2xl font-semibold text-[var(--sea-ink)]">
                Highest spend categories
              </h2>

              <div className="mt-5 space-y-3">
                {data.topExpenseCategories.map((item, index) => (
                  <div
                    key={`${item.category?.id ?? 'uncategorized'}-${index}`}
                    className="rounded-2xl border border-[var(--line)] bg-[rgba(255,255,255,0.45)] px-4 py-3"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <span className="font-semibold text-[var(--sea-ink)]">
                        {item.category?.name ?? 'Uncategorized'}
                      </span>
                      <span className="text-sm font-semibold text-[var(--sea-ink)]">
                        {formatCurrency(item.amount)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </article>

            <article className="island-shell rounded-2xl p-6">
              <p className="island-kicker mb-2">Daily Cash Flow</p>
              <h2 className="m-0 text-2xl font-semibold text-[var(--sea-ink)]">
                Month timeline
              </h2>

              <div className="mt-5 space-y-3">
                {data.dailyCashFlow.map((day) => (
                  <div
                    key={day.date}
                    className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-3 rounded-2xl border border-[var(--line)] bg-[rgba(255,255,255,0.45)] px-4 py-3 text-sm"
                  >
                    <span className="font-semibold text-[var(--sea-ink)]">
                      {day.date}
                    </span>
                    <span className="text-[var(--palm)]">
                      +{formatCurrency(day.income)}
                    </span>
                    <span className="text-[var(--sea-ink-soft)]">
                      -{formatCurrency(day.expenses)}
                    </span>
                    <span className="font-semibold text-[var(--sea-ink)]">
                      {formatCurrency(day.net)}
                    </span>
                  </div>
                ))}
              </div>
            </article>
          </section>

          <section className="mt-8 grid gap-6 xl:grid-cols-2">
            <article className="island-shell rounded-2xl p-6">
              <p className="island-kicker mb-2">Expense Breakdown</p>
              <div className="mt-4 space-y-3">
                {data.expenseCategoryBreakdown.map((item, index) => (
                  <div
                    key={`${item.category?.id ?? 'expense'}-${index}`}
                    className="flex items-center justify-between gap-4 rounded-2xl border border-[var(--line)] bg-[rgba(255,255,255,0.45)] px-4 py-3"
                  >
                    <span className="font-semibold text-[var(--sea-ink)]">
                      {item.category?.name ?? 'Uncategorized'}
                    </span>
                    <span className="text-sm text-[var(--sea-ink-soft)]">
                      {formatCurrency(item.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </article>

            <article className="island-shell rounded-2xl p-6">
              <p className="island-kicker mb-2">Account Activity</p>
              <div className="mt-4 space-y-3">
                {data.accountActivity.map((account) => (
                  <div
                    key={account.accountId}
                    className="rounded-2xl border border-[var(--line)] bg-[rgba(255,255,255,0.45)] px-4 py-3"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <span className="font-semibold text-[var(--sea-ink)]">
                        {account.accountName}
                      </span>
                      <span className="text-sm font-semibold text-[var(--sea-ink)]">
                        {formatCurrency(account.net)}
                      </span>
                    </div>
                    <p className="mt-2 mb-0 text-sm text-[var(--sea-ink-soft)]">
                      Income {formatCurrency(account.income)} • Expenses{' '}
                      {formatCurrency(account.expenses)} • Transfers in{' '}
                      {formatCurrency(account.transfersIn)}
                    </p>
                  </div>
                ))}
              </div>
            </article>
          </section>
        </>
      ) : null}
    </main>
  )
}
