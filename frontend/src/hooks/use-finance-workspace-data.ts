import { useCallback, useEffect, useState } from 'react'

import {
  getAccounts,
  getCategories,
  getCurrencies,
  getTransactions,
  type Account,
  type Category,
  type Currency,
  type Transaction,
} from '#/lib/api'

type FinanceWorkspaceData = {
  accounts: Account[]
  categories: Category[]
  transactions: Transaction[]
  currencies: Currency[]
}

const EMPTY_DATA: FinanceWorkspaceData = {
  accounts: [],
  categories: [],
  transactions: [],
  currencies: [],
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
    const [accounts, categories, transactions, currencies] = await Promise.all([
      getAccounts(),
      getCategories(),
      getTransactions(),
      getCurrencies(),
    ])

    setData({
      accounts,
      categories: sortCategoriesForWorkspace(categories),
      transactions,
      currencies,
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

        const [accounts, categories, transactions, currencies] =
          await Promise.all([
            getAccounts(),
            getCategories(),
            getTransactions(),
            getCurrencies(),
          ])

        if (!cancelled) {
          setData({
            accounts,
            categories: sortCategoriesForWorkspace(categories),
            transactions,
            currencies,
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
