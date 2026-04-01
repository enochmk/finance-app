import type { EntryType } from '../../libs/entry-type';

type CategoryChild = { name: string; color: string };
type CategoryParent = {
  name: string;
  type: EntryType;
  color: string;
  children: CategoryChild[];
};

export const DEFAULT_CATEGORIES_TREE: CategoryParent[] = [
  {
    name: 'Food & Drinks',
    type: 'EXPENSE',
    color: '#b45309',
    children: [
      { name: 'Bar', color: '#b45309' },
      { name: 'Cafe', color: '#b45309' },
      { name: 'Groceries', color: '#b45309' },
      { name: 'Supermarket', color: '#b45309' },
      { name: 'Restaurants', color: '#b45309' },
      { name: 'Fast Food', color: '#b45309' },
    ],
  },
  {
    name: 'Shopping',
    type: 'EXPENSE',
    color: '#176b6c',
    children: [
      { name: 'Clothing', color: '#176b6c' },
      { name: 'Shoes', color: '#176b6c' },
      { name: 'Drug-store & Pharmacy', color: '#176b6c' },
      { name: 'Electronics & Gadgets', color: '#176b6c' },
      { name: 'Free Time', color: '#176b6c' },
      { name: 'Home & Garden', color: '#176b6c' },
      { name: 'Gifts & Joy', color: '#176b6c' },
      { name: 'Jewels & Accessories', color: '#176b6c' },
      { name: 'Kids', color: '#176b6c' },
      { name: 'Pets & Animals', color: '#176b6c' },
      { name: 'Stationery & Tools', color: '#176b6c' },
    ],
  },
  {
    name: 'Housing',
    type: 'EXPENSE',
    color: '#9a3412',
    children: [
      { name: 'Rent & Mortgage', color: '#9a3412' },
      { name: 'Energy, Utilities & Bills', color: '#9a3412' },
      { name: 'Maintenance & Repairs', color: '#9a3412' },
      { name: 'Property Insurance', color: '#9a3412' },
      { name: 'Services', color: '#9a3412' },
    ],
  },
  {
    name: 'Transportation',
    type: 'EXPENSE',
    color: '#f59e0b',
    children: [
      { name: 'Public Transport', color: '#f59e0b' },
      { name: 'Taxi & Ride-sharing', color: '#f59e0b' },
      { name: 'Business Trips', color: '#f59e0b' },
      { name: 'Long Distance', color: '#f59e0b' },
    ],
  },
  {
    name: 'Vehicles',
    type: 'EXPENSE',
    color: '#475569',
    children: [
      { name: 'Fuel', color: '#475569' },
      { name: 'Vehicle Maintenance', color: '#475569' },
      { name: 'Vehicle Repairs', color: '#475569' },
      { name: 'Vehicle Insurance', color: '#475569' },
      { name: 'Parking & Tolls', color: '#475569' },
      { name: 'Car Wash & Accessories', color: '#475569' },
    ],
  },
  {
    name: 'Life & Entertainment',
    type: 'EXPENSE',
    color: '#be185d',
    children: [
      { name: 'Hobbies & Leisure', color: '#be185d' },
      { name: 'Active Sport & Fitness', color: '#be185d' },
      { name: 'Charity & Gifts', color: '#be185d' },
      { name: 'Alcohol & Tobacco', color: '#be185d' },
      { name: 'Subscriptions & Memberships', color: '#be185d' },
      { name: 'TV & Streaming', color: '#be185d' },
      { name: 'Wellness & Personal Care', color: '#be185d' },
    ],
  },
  {
    name: 'Communication & PC',
    type: 'EXPENSE',
    color: '#0f766e',
    children: [
      { name: 'Internet', color: '#0f766e' },
      { name: 'Phone & Cell Phone', color: '#0f766e' },
      { name: 'Postal Services', color: '#0f766e' },
      { name: 'Software, Apps & Games', color: '#0f766e' },
    ],
  },
  {
    name: 'Financial Expenses',
    type: 'EXPENSE',
    color: '#7c3aed',
    children: [
      { name: 'Bank Fees', color: '#7c3aed' },
      { name: 'Advisor & Lawyer', color: '#7c3aed' },
      { name: 'Charges & Fees', color: '#7c3aed' },
      { name: 'Fines', color: '#7c3aed' },
      { name: 'Financial Insurance', color: '#7c3aed' },
      { name: 'Loan Interest', color: '#7c3aed' },
      { name: 'Taxes', color: '#7c3aed' },
    ],
  },
  {
    name: 'Investments',
    type: 'EXPENSE',
    color: '#1d4ed8',
    children: [
      { name: 'Stocks & Bonds', color: '#1d4ed8' },
      { name: 'Savings', color: '#1d4ed8' },
      { name: 'Realty', color: '#1d4ed8' },
      { name: 'Collections', color: '#1d4ed8' },
      { name: 'Financial Investments', color: '#1d4ed8' },
    ],
  },
  {
    name: 'Income',
    type: 'INCOME',
    color: '#15803d',
    children: [
      { name: 'Salary', color: '#15803d' },
      { name: 'Child Support', color: '#15803d' },
      { name: 'Gifts', color: '#15803d' },
      { name: 'Interest & Dividends', color: '#15803d' },
      { name: 'Pensions & Social Security', color: '#15803d' },
      { name: 'Checks & Coupons', color: '#15803d' },
      { name: 'Lending & Renting', color: '#15803d' },
      { name: 'Refunds & Reimbursements', color: '#15803d' },
      { name: 'Sale', color: '#15803d' },
      { name: 'Wages & Freelance', color: '#15803d' },
    ],
  },
];

export const DEFAULT_ACCOUNTS = [
  {
    name: 'Bank',
    color: '#1d4ed8',
    icon: 'Building2',
    openingBalance: 0,
  },
  {
    name: 'Savings',
    color: '#15803d',
    icon: 'PiggyBank',
    openingBalance: 0,
  },
  {
    name: 'Mobile Money',
    color: '#f59e0b',
    icon: 'Smartphone',
    openingBalance: 0,
  },
  {
    name: 'Cash',
    color: '#7c3aed',
    icon: 'Wallet',
    openingBalance: 0,
  },
] as const;

export const DEFAULT_ONBOARDING_ACCOUNTS = DEFAULT_ACCOUNTS.filter(
  (account) => account.name === 'Bank' || account.name === 'Cash'
);
