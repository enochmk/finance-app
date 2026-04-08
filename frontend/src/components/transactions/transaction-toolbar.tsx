import { Search } from 'lucide-react'

import { Input } from '#/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import type { Account, Category } from '#/lib/api'
import { TRANSACTION_TYPE_OPTIONS } from '#/lib/finance'

import type { TransactionSortField } from './types'

interface TransactionToolbarProps {
  search: string
  onSearchChange: (value: string) => void
  typeFilter: string
  onTypeFilterChange: (value: string) => void
  accountFilter: string
  onAccountFilterChange: (value: string) => void
  categoryFilter: string
  onCategoryFilterChange: (value: string) => void
  dateFilter: string
  onDateFilterChange: (value: string) => void
  sortField: TransactionSortField
  onSort: (field: TransactionSortField) => void
  pageSize: number
  onPageSizeChange: (size: number) => void
  accounts: Account[]
  categories: Category[]
  onOpenCustomDateModal: () => void
}

export function TransactionToolbar({
  search,
  onSearchChange,
  typeFilter,
  onTypeFilterChange,
  accountFilter,
  onAccountFilterChange,
  categoryFilter,
  onCategoryFilterChange,
  dateFilter,
  onDateFilterChange,
  sortField,
  onSort,
  pageSize,
  onPageSizeChange,
  accounts,
  categories,
  onOpenCustomDateModal,
}: TransactionToolbarProps) {
  return (
    <div className="grid gap-4 xl:grid-cols-[1.2fr_180px_180px_180px_180px_140px_140px_140px_140px]">
      <div className="flex flex-col gap-2">
        <label htmlFor="transaction-search" className="text-sm font-medium">
          Search transactions
        </label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="transaction-search"
            placeholder="Description, account, category"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label
          htmlFor="transaction-filter-type"
          className="text-sm font-medium"
        >
          Type
        </label>
        <Select value={typeFilter} onValueChange={onTypeFilterChange}>
          <SelectTrigger id="transaction-filter-type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All types</SelectItem>
            {TRANSACTION_TYPE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <label
          htmlFor="transaction-filter-account"
          className="text-sm font-medium"
        >
          Account
        </label>
        <Select value={accountFilter} onValueChange={onAccountFilterChange}>
          <SelectTrigger id="transaction-filter-account">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All wallets</SelectItem>
            {accounts.map((account) => (
              <SelectItem key={account.id} value={account.id}>
                {account.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <label
          htmlFor="transaction-filter-category"
          className="text-sm font-medium"
        >
          Category
        </label>
        <Select value={categoryFilter} onValueChange={onCategoryFilterChange}>
          <SelectTrigger id="transaction-filter-category">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <label
          htmlFor="transaction-filter-date"
          className="text-sm font-medium"
        >
          Date range
        </label>
        <Select
          value={dateFilter}
          onValueChange={(value) => {
            if (value === 'custom') {
              onOpenCustomDateModal()
            } else {
              onDateFilterChange(value)
            }
          }}
        >
          <SelectTrigger id="transaction-filter-date">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All dates</SelectItem>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="last24hours">Last 24 hours</SelectItem>
            <SelectItem value="last7days">Last 7 days</SelectItem>
            <SelectItem value="last30days">Last 30 days</SelectItem>
            <SelectItem value="last6months">Last 6 months</SelectItem>
            <SelectItem value="custom">Custom range</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="transaction-sort-field" className="text-sm font-medium">
          Sort by
        </label>
        <Select
          value={sortField}
          onValueChange={(value) => onSort(value as TransactionSortField)}
        >
          <SelectTrigger id="transaction-sort-field">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="transactionDate">Date</SelectItem>
            <SelectItem value="description">Description</SelectItem>
            <SelectItem value="type">Type</SelectItem>
            <SelectItem value="account">Account</SelectItem>
            <SelectItem value="amount">Amount</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="transaction-page-size" className="text-sm font-medium">
          Show
        </label>
        <Select
          value={String(pageSize)}
          onValueChange={(value) => onPageSizeChange(Number(value))}
        >
          <SelectTrigger id="transaction-page-size">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="5">5</SelectItem>
            <SelectItem value="10">10</SelectItem>
            <SelectItem value="25">25</SelectItem>
            <SelectItem value="50">50</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
