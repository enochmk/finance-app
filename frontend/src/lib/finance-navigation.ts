import {
  CircleDollarSign,
  FolderTree,
  Landmark,
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
    to: '/settings/accounts',
    label: 'Accounts',
    description:
      'Savings, wedding, bank, mobile money, and other money buckets.',
    icon: Landmark,
  },
  {
    to: '/settings/categories',
    label: 'Categories',
    description: 'Income and expense buckets for classification.',
    icon: FolderTree,
  },
  {
    to: '/settings/currencies',
    label: 'Currencies',
    description: 'Manage available currencies with their shortcode and symbol.',
    icon: CircleDollarSign,
  },
] as const
