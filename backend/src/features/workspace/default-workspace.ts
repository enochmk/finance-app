export const DEFAULT_CATEGORIES = [
  { name: 'Food & Drinks', type: 'EXPENSE' as const, color: '#b45309' },
  { name: 'Shopping', type: 'EXPENSE' as const, color: '#176b6c' },
  { name: 'Housing', type: 'EXPENSE' as const, color: '#9a3412' },
  { name: 'Transportation', type: 'EXPENSE' as const, color: '#f59e0b' },
  { name: 'Vehicle', type: 'EXPENSE' as const, color: '#475569' },
  { name: 'Life & Entertainment', type: 'EXPENSE' as const, color: '#be185d' },
  { name: 'Communications, PC', type: 'EXPENSE' as const, color: '#0f766e' },
  { name: 'Financial Expenses', type: 'EXPENSE' as const, color: '#7c3aed' },
  { name: 'Investments', type: 'EXPENSE' as const, color: '#1d4ed8' },
  { name: 'Income', type: 'INCOME' as const, color: '#15803d' },
] as const;

export const DEFAULT_ACCOUNTS = [
  {
    name: 'Bank',
    type: 'CHECKING' as const,
    color: '#1d4ed8',
    icon: 'Building2',
    openingBalance: 0,
  },
  {
    name: 'Savings',
    type: 'SAVINGS' as const,
    color: '#15803d',
    icon: 'PiggyBank',
    openingBalance: 0,
  },
  {
    name: 'Mobile Money',
    type: 'CHECKING' as const,
    color: '#f59e0b',
    icon: 'Smartphone',
    openingBalance: 0,
  },
  {
    name: 'Cash',
    type: 'CASH' as const,
    color: '#7c3aed',
    icon: 'Wallet',
    openingBalance: 0,
  },
] as const;

export const DEFAULT_ONBOARDING_ACCOUNTS = DEFAULT_ACCOUNTS.filter(
  (account) => account.name === 'Bank' || account.name === 'Cash'
);
