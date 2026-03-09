import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'

import {
  getDashboardSummary,
  loginWithSeedUser,
  type DashboardSummary,
} from '#/lib/api'

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

function DashboardPage() {
  const [data, setData] = useState<DashboardSummary | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        setIsLoading(true)
        setError(null)
        await loginWithSeedUser()
        const summary = await getDashboardSummary()

        if (!cancelled) {
          setData(summary)
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'Unable to load dashboard summary.'
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

  const headline = useMemo(() => {
    if (!data) {
      return 'Your finance snapshot'
    }

    return `Month ${data.period.month}, ${data.period.year}`
  }, [data])

  return (
    <main className="page-wrap px-4 pb-12 pt-12">
      <section className="island-shell rise-in relative overflow-hidden rounded-[2rem] px-6 py-8 sm:px-10 sm:py-10">
        <div className="pointer-events-none absolute -right-14 -top-14 h-52 w-52 rounded-full bg-[radial-gradient(circle,rgba(79,184,178,0.28),transparent_68%)]" />
        <p className="island-kicker mb-3">Dashboard</p>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="display-title text-4xl leading-[1.02] font-bold tracking-tight text-[var(--sea-ink)] sm:text-5xl">
              {headline}
            </h1>
            <p className="mt-3 max-w-2xl text-base text-[var(--sea-ink-soft)] sm:text-lg">
              Live totals from your backend summary endpoint with balances,
              budgets, and recent movements.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              to="/reports"
              className="rounded-full border border-[rgba(50,143,151,0.3)] bg-[rgba(79,184,178,0.14)] px-5 py-2.5 text-sm font-semibold text-[var(--lagoon-deep)] no-underline transition hover:-translate-y-0.5 hover:bg-[rgba(79,184,178,0.24)]"
            >
              Open Reports
            </Link>
          </div>
        </div>
      </section>

      {isLoading ? (
        <section className="island-shell mt-8 rounded-2xl p-6 text-sm text-[var(--sea-ink-soft)]">
          Loading dashboard summary...
        </section>
      ) : error ? (
        <section className="island-shell mt-8 rounded-2xl border-[rgba(167,60,43,0.24)] p-6 text-sm text-[var(--sea-ink)]">
          <p className="m-0 font-semibold">Dashboard unavailable</p>
          <p className="mt-2 mb-0 text-[var(--sea-ink-soft)]">{error}</p>
        </section>
      ) : data ? (
        <>
          <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[
              ['Total Balance', formatCurrency(data.overview.totalBalance)],
              ['Income', formatCurrency(data.overview.totalIncome)],
              ['Expenses', formatCurrency(data.overview.totalExpenses)],
              ['Net Cash Flow', formatCurrency(data.overview.netCashFlow)],
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

          <section className="mt-8 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            <article className="island-shell rounded-2xl p-6">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <p className="island-kicker mb-2">Recent Transactions</p>
                  <h2 className="m-0 text-2xl font-semibold text-[var(--sea-ink)]">
                    Latest activity
                  </h2>
                </div>
              </div>

              <div className="space-y-3">
                {data.recentTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="rounded-2xl border border-[var(--line)] bg-[rgba(255,255,255,0.45)] px-4 py-3"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="m-0 font-semibold text-[var(--sea-ink)]">
                          {transaction.description}
                        </p>
                        <p className="mt-1 mb-0 text-sm text-[var(--sea-ink-soft)]">
                          {transaction.account.name}
                          {transaction.category
                            ? ` • ${transaction.category.name}`
                            : ''}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="m-0 font-semibold text-[var(--sea-ink)]">
                          {formatCurrency(Number(transaction.amount))}
                        </p>
                        <p className="mt-1 mb-0 text-xs uppercase tracking-[0.16em] text-[var(--kicker)]">
                          {transaction.type}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </article>

            <article className="island-shell rounded-2xl p-6">
              <p className="island-kicker mb-2">Budget Usage</p>
              <h2 className="m-0 text-2xl font-semibold text-[var(--sea-ink)]">
                Current month budgets
              </h2>

              <div className="mt-5 space-y-4">
                {data.budgets.map((budget) => {
                  const progress = Math.min(Math.max(budget.utilizationRate * 100, 0), 100)

                  return (
                    <div key={budget.id}>
                      <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                        <span className="font-semibold text-[var(--sea-ink)]">
                          {budget.category.name}
                        </span>
                        <span className="text-[var(--sea-ink-soft)]">
                          {formatCurrency(budget.spent)} / {formatCurrency(budget.amount)}
                        </span>
                      </div>
                      <div className="h-3 rounded-full bg-[rgba(23,58,64,0.08)]">
                        <div
                          className="h-3 rounded-full bg-[linear-gradient(90deg,var(--lagoon),#7ed3bf)]"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </article>
          </section>

          <section className="mt-8 grid gap-4 lg:grid-cols-3">
            {data.accounts.map((account) => (
              <article key={account.id} className="island-shell rounded-2xl p-5">
                <p className="island-kicker mb-2">{account.type.replaceAll('_', ' ')}</p>
                <h3 className="m-0 text-xl font-semibold text-[var(--sea-ink)]">
                  {account.name}
                </h3>
                <p className="mt-3 mb-0 text-2xl font-bold text-[var(--sea-ink)]">
                  {formatCurrency(account.currentBalance)}
                </p>
              </article>
            ))}
          </section>
        </>
      ) : null}
    </main>
  )
}
