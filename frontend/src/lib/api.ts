export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000/api/v1'

export type AuthUser = {
  id: string
  email: string
  name: string
  currency: string
}

export type AuthResponse = {
  token: string
  user: AuthUser
}

export type Account = {
  id: string
  name: string
  type: string
  currency: string
  color?: string | null
  icon?: string | null
  openingBalance: string | number
  currentBalance: string | number
  institutionName?: string | null
  accountNumberMasked?: string | null
  isArchived: boolean
  createdAt?: string
  updatedAt?: string
}

export type Category = {
  id: string
  name: string
  type: string
  color?: string | null
  icon?: string | null
  isSystem: boolean
  isArchived: boolean
}

export type Budget = {
  id: string
  amount: string | number
  month: number
  year: number
  notes?: string | null
  category: Category
}

export type Transaction = {
  id: string
  type: string
  amount: string | number
  description: string
  notes?: string | null
  transactionDate: string
  account: Account
  category: Category | null
  transferAccount?: Account | null
}

export type DashboardSummary = {
  period: {
    month: number
    year: number
    start: string
    end: string
  }
  selectedAccount: {
    id: string
    name: string
    type: string
    currency: string
    color?: string | null
    currentBalance: number
    openingBalance: number
  } | null
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
    color?: string | null
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
    transferAccount: {
      id: string
      name: string
      currency: string
    } | null
    category: {
      id: string
      name: string
      type: string
    } | null
  }>
  expensesByCategory: Array<{
    categoryId: string | null
    name: string
    amount: number
    color: string | null
    icon: string | null
  }>
  incomesByCategory: Array<{
    categoryId: string | null
    name: string
    amount: number
    color: string | null
    icon: string | null
  }>
  dailyCashFlow: Array<{
    date: string
    income: number
    expenses: number
    net: number
  }>
  balanceTrend: Array<{
    date: string
    balance: number
  }>
  previousPeriod: {
    month: number
    year: number
    totalIncome: number
    totalExpenses: number
    totalTransfers: number
    netCashFlow: number
  }
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

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE'

const TOKEN_STORAGE_KEY = 'finance-token'

function getStoredToken() {
  if (typeof window === 'undefined') {
    return null
  }

  return window.localStorage.getItem(TOKEN_STORAGE_KEY)
}

export function storeAuthToken(token: string) {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(TOKEN_STORAGE_KEY, token)
  }
}

export function logoutSeedUser() {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(TOKEN_STORAGE_KEY)
  }
}

async function request<T>(
  path: string,
  options?: {
    method?: HttpMethod
    body?: unknown
  }
) {
  const token = getStoredToken()

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options?.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(options?.body !== undefined
      ? { body: JSON.stringify(options.body) }
      : {}),
  })

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`

    const contentType = response.headers.get('content-type')

    if (contentType?.includes('application/json')) {
      const errorBody = (await response.json()) as { message?: string }

      if (errorBody.message) {
        message = errorBody.message
      }
    }

    throw new Error(message)
  }

  const json = (await response.json()) as { data: T }
  return json.data
}

export async function login(credentials: { email: string; password: string }) {
  return request<AuthResponse>('/auth/login', {
    method: 'POST',
    body: credentials,
  })
}

export async function register(payload: {
  name: string
  email: string
  password: string
  currency?: string
}) {
  return request<AuthResponse>('/auth/register', {
    method: 'POST',
    body: payload,
  })
}

export async function getMe() {
  return request<AuthUser>('/auth/me')
}

export async function getAccounts() {
  return request<Account[]>('/accounts')
}

export async function createAccount(payload: {
  name: string
  type: string
  currency?: string
  color?: string
  icon?: string
  openingBalance?: number
  currentBalance?: number
  institutionName?: string
  accountNumberMasked?: string
}) {
  return request<Account>('/accounts', {
    method: 'POST',
    body: payload,
  })
}

export async function updateAccount(
  id: string,
  payload: {
    name?: string
    type?: string
    currency?: string
    color?: string
    icon?: string
    openingBalance?: number
    currentBalance?: number
    institutionName?: string
    accountNumberMasked?: string
    isArchived?: boolean
  }
) {
  return request<Account>(`/accounts/${id}`, {
    method: 'PATCH',
    body: payload,
  })
}

export async function deleteAccount(id: string) {
  return request<Account>(`/accounts/${id}`, {
    method: 'DELETE',
  })
}

export async function getCategories() {
  return request<Category[]>('/categories')
}

export async function createCategory(payload: {
  name: string
  type: string
  color?: string
  icon?: string
  isArchived?: boolean
}) {
  return request<Category>('/categories', {
    method: 'POST',
    body: payload,
  })
}

export async function updateCategory(
  id: string,
  payload: {
    name?: string
    type?: string
    color?: string
    icon?: string
    isArchived?: boolean
  }
) {
  return request<Category>(`/categories/${id}`, {
    method: 'PATCH',
    body: payload,
  })
}

export async function seedDefaultCategories() {
  return request<Category[]>('/categories/seed-defaults', {
    method: 'POST',
  })
}

export async function deleteCategory(id: string) {
  return request<Category>(`/categories/${id}`, {
    method: 'DELETE',
  })
}

export async function getBudgets() {
  return request<Budget[]>('/budgets')
}

export async function createBudget(payload: {
  categoryId: string
  amount: number
  month: number
  year: number
  notes?: string
}) {
  return request<Budget>('/budgets', {
    method: 'POST',
    body: payload,
  })
}

export async function updateBudget(
  id: string,
  payload: {
    categoryId?: string
    amount?: number
    month?: number
    year?: number
    notes?: string
  }
) {
  return request<Budget>(`/budgets/${id}`, {
    method: 'PATCH',
    body: payload,
  })
}

export async function deleteBudget(id: string) {
  return request<Budget>(`/budgets/${id}`, {
    method: 'DELETE',
  })
}

export async function getTransactions() {
  return request<Transaction[]>('/transactions')
}

export async function createTransaction(payload: {
  accountId: string
  categoryId?: string
  transferAccountId?: string
  type: string
  amount: number
  description: string
  notes?: string
  transactionDate: string
  externalReference?: string
}) {
  return request<Transaction>('/transactions', {
    method: 'POST',
    body: payload,
  })
}

export async function updateTransaction(
  id: string,
  payload: {
    accountId?: string
    categoryId?: string
    transferAccountId?: string
    type?: string
    amount?: number
    description?: string
    notes?: string
    transactionDate?: string
    externalReference?: string
  }
) {
  return request<Transaction>(`/transactions/${id}`, {
    method: 'PATCH',
    body: payload,
  })
}

export async function deleteTransaction(id: string) {
  return request<Transaction>(`/transactions/${id}`, {
    method: 'DELETE',
  })
}

export async function loginWithSeedUser() {
  const auth = await login({
    email: 'dev@budget.local',
    password: 'dev-password-123',
  })

  storeAuthToken(auth.token)
  return auth
}

export async function getDashboardSummary(params?: {
  accountId?: string
  month?: number
  year?: number
  recentLimit?: number
}) {
  const searchParams = new URLSearchParams()
  if (params?.accountId) searchParams.set('accountId', params.accountId)
  if (params?.month) searchParams.set('month', String(params.month))
  if (params?.year) searchParams.set('year', String(params.year))
  if (params?.recentLimit)
    searchParams.set('recentLimit', String(params.recentLimit))
  const qs = searchParams.toString()
  return request<DashboardSummary>(`/dashboard/summary${qs ? `?${qs}` : ''}`)
}

export async function getMonthlyReport(search = '') {
  return request<MonthlyReport>(`/reports/monthly${search}`)
}

export async function resetWorkspace() {
  return request<{ reset: boolean }>('/workspace/reset', {
    method: 'POST',
    body: {},
  })
}
