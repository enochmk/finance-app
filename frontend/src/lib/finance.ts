import {
  Building2,
  CreditCard,
  Heart,
  PiggyBank,
  Smartphone,
  Wallet,
} from 'lucide-react'

export const ACCOUNT_ICON_OPTIONS = [
  { value: 'Building2', label: 'Building' },
  { value: 'PiggyBank', label: 'Piggy Bank' },
  { value: 'Heart', label: 'Heart' },
  { value: 'CreditCard', label: 'Credit Card' },
  { value: 'Smartphone', label: 'Smartphone' },
  { value: 'Wallet', label: 'Wallet' },
] as const

export function getAccountIcon(iconName?: string | null) {
  switch (iconName) {
    case 'Building2':
      return Building2
    case 'PiggyBank':
      return PiggyBank
    case 'Heart':
      return Heart
    case 'CreditCard':
      return CreditCard
    case 'Smartphone':
      return Smartphone
    case 'Wallet':
      return Wallet
    default:
      return Building2
  }
}

export const ACCOUNT_TYPE_OPTIONS = [
  { value: 'CASH', label: 'Cash' },
  { value: 'CHECKING', label: 'Checking' },
  { value: 'SAVINGS', label: 'Savings' },
  { value: 'CREDIT_CARD', label: 'Credit card' },
  { value: 'INVESTMENT', label: 'Investment' },
  { value: 'LOAN', label: 'Loan' },
] as const

export const CATEGORY_TYPE_OPTIONS = [
  { value: 'INCOME', label: 'Income' },
  { value: 'EXPENSE', label: 'Expense' },
] as const

export const TRANSACTION_TYPE_OPTIONS = [
  { value: 'INCOME', label: 'Credit' },
  { value: 'EXPENSE', label: 'Debit' },
  { value: 'TRANSFER', label: 'Transfer' },
] as const

export const RECURRING_FREQUENCY_OPTIONS = [
  { value: 'WEEKLY', label: 'Weekly' },
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'QUARTERLY', label: 'Quarterly' },
  { value: 'YEARLY', label: 'Yearly' },
] as const

export const RECURRING_STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'PAUSED', label: 'Paused' },
  { value: 'COMPLETED', label: 'Completed' },
] as const

export function getCurrencySymbol(
  shortcode: string,
  currencies: { shortcode: string; symbol: string }[]
) {
  return currencies.find((c) => c.shortcode === shortcode)?.symbol ?? '₵'
}

export function formatCurrency(value: number | string, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(Number(value))
}

export function getTransactionTypeLabel(type: string) {
  if (type === 'INCOME') {
    return 'Credit'
  }

  if (type === 'EXPENSE') {
    return 'Debit'
  }

  return 'Transfer'
}

export function getTransactionTypeColor(type: string) {
  if (type === 'INCOME') {
    return 'text-green-600'
  }

  if (type === 'EXPENSE') {
    return 'text-red-600'
  }

  return 'text-yellow-600'
}

export function getTransactionAmountColor(type: string) {
  if (type === 'INCOME') {
    return 'text-green-600'
  }

  if (type === 'EXPENSE') {
    return 'text-red-600'
  }

  return 'text-yellow-600'
}

export function formatDateTime(value: string | Date) {
  const date = new Date(value)
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  const hours = date.getHours()
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const ampm = hours >= 12 ? 'PM' : 'AM'
  const displayHours = hours % 12 || 12

  return `${day}-${month}-${year} ${displayHours}:${minutes} ${ampm}`
}

export function formatRelativeDate(value: string | Date) {
  const date = new Date(value)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const targetDate = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  )

  const diffTime = today.getTime() - targetDate.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    return 'Today'
  } else if (diffDays === 1) {
    return 'Yesterday'
  } else if (diffDays === 2) {
    return '2 days ago'
  } else if (diffDays === 3) {
    return '3 days ago'
  } else if (diffDays === 4) {
    return '4 days ago'
  } else if (diffDays === 5) {
    return '5 days ago'
  } else if (diffDays === 6) {
    return '6 days ago'
  } else if (diffDays === 7) {
    return 'A week ago'
  } else if (diffDays <= 13) {
    return 'Over a week ago'
  } else if (diffDays <= 20) {
    return '2 weeks ago'
  } else if (diffDays <= 27) {
    return '3 weeks ago'
  } else if (diffDays <= 30) {
    return 'About a month ago'
  } else if (diffDays <= 60) {
    return '2 months ago'
  } else if (diffDays <= 90) {
    return '3 months ago'
  } else if (diffDays <= 120) {
    return '4 months ago'
  } else if (diffDays <= 150) {
    return '5 months ago'
  } else if (diffDays <= 180) {
    return '6 months ago'
  } else if (diffDays <= 365) {
    return 'Over 6 months ago'
  } else {
    const years = Math.floor(diffDays / 365)
    return `${years} year${years > 1 ? 's' : ''} ago`
  }
}

export function formatShortDate(value: string | Date) {
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function formatMonthYear(month: number, year: number) {
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

export function getDateRangeForFilter(
  filter: string
): { from: string; to: string } | null {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  switch (filter) {
    case 'today':
      return {
        from: today.toISOString().split('T')[0],
        to: today.toISOString().split('T')[0],
      }
    case 'last24hours':
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      return {
        from: yesterday.toISOString().split('T')[0],
        to: today.toISOString().split('T')[0],
      }
    case 'last7days':
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      return {
        from: weekAgo.toISOString().split('T')[0],
        to: today.toISOString().split('T')[0],
      }
    case 'last30days':
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      return {
        from: monthAgo.toISOString().split('T')[0],
        to: today.toISOString().split('T')[0],
      }
    case 'last6months':
      const sixMonthsAgo = new Date(now)
      sixMonthsAgo.setMonth(now.getMonth() - 6)
      return {
        from: sixMonthsAgo.toISOString().split('T')[0],
        to: today.toISOString().split('T')[0],
      }
    default:
      return null
  }
}

export function toDateTimeLocalValue(value?: string | Date | null) {
  if (!value) {
    return new Date().toISOString().slice(0, 16)
  }

  return new Date(value).toISOString().slice(0, 16)
}

export function paginateItems<T>(
  items: T[],
  currentPage: number,
  pageSize: number
) {
  const totalItems = items.length
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const safePage = Math.min(Math.max(currentPage, 1), totalPages)
  const startIndex = totalItems === 0 ? 0 : (safePage - 1) * pageSize + 1
  const endIndex = Math.min(safePage * pageSize, totalItems)
  const pageItems = items.slice(startIndex === 0 ? 0 : startIndex - 1, endIndex)

  return {
    currentPage: safePage,
    totalItems,
    totalPages,
    startIndex,
    endIndex,
    pageItems,
  }
}
