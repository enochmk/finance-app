export const API_BASE_URL = 'http://127.0.0.1:4000/api/v1'

export type DashboardSummary = {
  period: {
    month: number
    year: number
    start: string
    end: string
  }
  overview: {
    totalBalance: number
    totalIncome: number
    totalExpenses: number
    totalTransfers: number
    netCashFlow: number
    totalBudgeted: number
  }
  accounts: Array<{
    id: string
    name: string
    type: string
    currency: string
    currentBalance: number
    openingBalance: number
  }>
  budgets: Array<{
    id: string
    month: number
    year: number
    amount: number
    spent: number
    remaining: number
    utilizationRate: number
    category: {
      id: string
      name: string
      type: string
      color: string | null
      icon: string | null
    }
  }>
  recentTransactions: Array<{
    id: string
    type: string
    amount: string | number
    description: string
    transactionDate: string
    account: {
      id: string
      name: string
      currency: string
    }
    category: {
      id: string
      name: string
      type: string
    } | null
  }>
}

export type MonthlyReport = {
  period: {
    month: number
    year: number
    start: string
    end: string
  }
  totals: {
    income: number
    expenses: number
    transfers: number
    net: number
    transactionCount: number
  }
  topExpenseCategories: Array<{
    category: {
      id: string
      name: string
      type: string
      color: string | null
      icon: string | null
    } | null
    amount: number
  }>
  expenseCategoryBreakdown: Array<{
    category: {
      id: string
      name: string
      type: string
      color: string | null
      icon: string | null
    } | null
    amount: number
  }>
  incomeCategoryBreakdown: Array<{
    category: {
      id: string
      name: string
      type: string
      color: string | null
      icon: string | null
    } | null
    amount: number
  }>
  dailyCashFlow: Array<{
    date: string
    income: number
    expenses: number
    net: number
  }>
  accountActivity: Array<{
    accountId: string
    accountName: string
    type: string
    currency: string
    income: number
    expenses: number
    transfersIn: number
    transfersOut: number
    net: number
  }>
}

type LoginResponse = {
  token: string
  user: {
    id: string
    email: string
    name: string
    currency: string
  }
}

function getStoredToken() {
  if (typeof window === 'undefined') {
    return null
  }

  return window.localStorage.getItem('finance-token')
}

async function request<T>(path: string) {
  const token = getStoredToken()

  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`)
  }

  const json = (await response.json()) as { data: T }
  return json.data
}

export async function loginWithSeedUser() {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: 'dev@budget.local',
      password: 'dev-password-123',
    }),
  })

  if (!response.ok) {
    throw new Error(`Seed login failed with status ${response.status}`)
  }

  const json = (await response.json()) as { data: LoginResponse }

  if (typeof window !== 'undefined') {
    window.localStorage.setItem('finance-token', json.data.token)
  }

  return json.data
}

export async function getDashboardSummary(search = '') {
  return request<DashboardSummary>(`/dashboard/summary${search}`)
}

export async function getMonthlyReport(search = '') {
  return request<MonthlyReport>(`/reports/monthly${search}`)
}
