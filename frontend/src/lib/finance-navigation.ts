import {
  BarChart3,
  FolderTree,
  Landmark,
  LayoutDashboard,
  PiggyBank,
  Repeat2,
  ReceiptText,
  Wallet,
  type LucideIcon,
} from 'lucide-react'

export type WorkspaceLink = {
  to: string
  label: string
  description: string
  icon: LucideIcon
}

export const financeSectionLinks: WorkspaceLink[] = [
  {
    to: '/manage',
    label: 'Overview',
    description: 'Scan all finance resources and jump into a section.',
    icon: Wallet,
  },
  {
    to: '/manage/accounts',
    label: 'Accounts',
    description: 'Bank accounts, wallets, cards, loans, and balances.',
    icon: Landmark,
  },
  {
    to: '/manage/categories',
    label: 'Categories',
    description: 'Income and expense buckets for classification.',
    icon: FolderTree,
  },
  {
    to: '/manage/budgets',
    label: 'Budgets',
    description: 'Monthly spending plans grouped by expense category.',
    icon: PiggyBank,
  },
  {
    to: '/manage/transactions',
    label: 'Transactions',
    description: 'One-off income, expenses, and transfers.',
    icon: ReceiptText,
  },
  {
    to: '/manage/recurring',
    label: 'Recurring',
    description: 'Scheduled cash flow with pause and run-now controls.',
    icon: Repeat2,
  },
] as const

export const primaryWorkspaceLinks: WorkspaceLink[] = [
  {
    to: '/dashboard',
    label: 'Dashboard',
    description: 'Monthly balance, budget, and cash flow summary.',
    icon: LayoutDashboard,
  },
  {
    to: '/reports',
    label: 'Reports',
    description: 'Category, account, and daily cash flow reporting.',
    icon: BarChart3,
  },
] as const
