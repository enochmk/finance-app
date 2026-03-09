import { useCallback, useEffect, useState } from 'react'

import {
  getAccounts,
  getBudgets,
  getCategories,
  getRecurringTransactions,
  getTransactions,
  type Account,
  type Budget,
  type Category,
  type RecurringTransaction,
  type Transaction,
} from '#/lib/api'

type FinanceWorkspaceData = {
  accounts: Account[]
  categories: Category[]
  budgets: Budget[]
  transactions: Transaction[]
  recurringTransactions: RecurringTransaction[]
}

const EMPTY_DATA: FinanceWorkspaceData = {
  accounts: [],
  categories: [],
  budgets: [],
  transactions: [],
  recurringTransactions: [],
}

export function useFinanceWorkspaceData(enabled: boolean) {
  const [data, setData] = useState<FinanceWorkspaceData>(EMPTY_DATA)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refreshAll = useCallback(async () => {
    const [accounts, categories, budgets, transactions, recurringTransactions] =
      await Promise.all([
        getAccounts(),
        getCategories(),
        getBudgets(),
        getTransactions(),
        getRecurringTransactions(),
      ])

    setData({
      accounts,
      categories,
      budgets,
      transactions,
      recurringTransactions,
    })
    setError(null)
  }, [])

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false)
      return
    }

    let cancelled = false

    async function load() {
      try {
        setIsLoading(true)

        const [
          accounts,
          categories,
          budgets,
          transactions,
          recurringTransactions,
        ] = await Promise.all([
          getAccounts(),
          getCategories(),
          getBudgets(),
          getTransactions(),
          getRecurringTransactions(),
        ])

        if (!cancelled) {
          setData({
            accounts,
            categories,
            budgets,
            transactions,
            recurringTransactions,
          })
          setError(null)
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'Unable to load finance resources.'
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
  }, [enabled])

  return {
    ...data,
    isLoading,
    error,
    refreshAll,
  }
}
