import { useCallback, useEffect, useState } from 'react'

import {
  getAccounts,
  getBudgets,
  getCategories,
  getTransactions,
  type Account,
  type Budget,
  type Category,
  type Transaction,
} from '#/lib/api'

type FinanceWorkspaceData = {
  accounts: Account[]
  categories: Category[]
  budgets: Budget[]
  transactions: Transaction[]
}

const EMPTY_DATA: FinanceWorkspaceData = {
  accounts: [],
  categories: [],
  budgets: [],
  transactions: [],
}

function sortCategoriesForWorkspace(categories: Category[]) {
  return [...categories].sort((left, right) => {
    if (left.isArchived !== right.isArchived) {
      return left.isArchived ? 1 : -1
    }

    if (left.type !== right.type) {
      return left.type.localeCompare(right.type)
    }

    return left.name.localeCompare(right.name)
  })
}

export function useFinanceWorkspaceData(enabled: boolean) {
  const [data, setData] = useState<FinanceWorkspaceData>(EMPTY_DATA)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refreshAll = useCallback(async () => {
    const [accounts, categories, budgets, transactions] = await Promise.all([
      getAccounts(),
      getCategories(),
      getBudgets(),
      getTransactions(),
    ])

    setData({
      accounts,
      categories: sortCategoriesForWorkspace(categories),
      budgets,
      transactions,
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
        ] = await Promise.all([
          getAccounts(),
          getCategories(),
          getBudgets(),
          getTransactions(),
        ])

        if (!cancelled) {
          setData({
            accounts,
            categories: sortCategoriesForWorkspace(categories),
            budgets,
            transactions,
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
