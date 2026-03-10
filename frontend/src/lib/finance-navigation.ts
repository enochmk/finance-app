import {
  FolderTree,
  Landmark,
  LayoutDashboard,
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
    description: 'Savings, wedding, bank, mobile money, and other money buckets.',
    icon: Landmark,
  },
  {
    to: '/manage/categories',
    label: 'Categories',
    description: 'Income and expense buckets for classification.',
    icon: FolderTree,
  },
  {
    to: '/manage/transactions',
    label: 'Transactions',
    description: 'One-off credits, debits, and transfers.',
    icon: ReceiptText,
  },
] as const

export const primaryWorkspaceLinks: WorkspaceLink[] = [
  {
    to: '/dashboard',
    label: 'Dashboard',
    description: 'Selected-account balance, activity, and cash flow summary.',
    icon: LayoutDashboard,
  },
] as const
