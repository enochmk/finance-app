import { Eye, Pencil, Trash2 } from 'lucide-react'

import { RowActionsMenu } from '#/components/row-actions-menu'
import { SortableHead } from '#/components/sortable-head'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#/components/ui/table'
import type { Transaction } from '#/lib/api'
import {
  formatCurrency,
  formatDateTime,
  formatRelativeDate,
  getTransactionAmountColor,
  getTransactionTypeColor,
  getTransactionTypeLabel,
} from '#/lib/finance'

import type { SortDirection, TransactionSortField } from './types'

interface TransactionTableProps {
  transactions: Transaction[]
  currentPage: number
  pageSize: number
  sortField: TransactionSortField
  sortDirection: SortDirection
  selectedTransactionId?: string | null
  onSort: (field: TransactionSortField) => void
  onRowClick: (transaction: Transaction) => void
  onView: (transaction: Transaction) => void
  onEdit: (transaction: Transaction) => void
  onDelete: (transaction: Transaction) => void
}

export function TransactionTable({
  transactions,
  currentPage,
  pageSize,
  sortField,
  sortDirection,
  selectedTransactionId,
  onSort,
  onRowClick,
  onView,
  onEdit,
  onDelete,
}: TransactionTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-16 min-w-16">#</TableHead>
          <SortableHead
            label="Description"
            onClick={() => onSort('description')}
            isActive={sortField === 'description'}
            direction={sortDirection}
          />
          <SortableHead
            label="Type"
            onClick={() => onSort('type')}
            isActive={sortField === 'type'}
            direction={sortDirection}
          />
          <SortableHead
            label="Account"
            onClick={() => onSort('account')}
            isActive={sortField === 'account'}
            direction={sortDirection}
          />
          <SortableHead
            label="Date"
            onClick={() => onSort('transactionDate')}
            isActive={sortField === 'transactionDate'}
            direction={sortDirection}
          />
          <SortableHead
            label="Amount"
            onClick={() => onSort('amount')}
            isActive={sortField === 'amount'}
            direction={sortDirection}
            className="text-right"
          />
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {transactions.map((transaction, index) => (
          <TableRow
            key={transaction.id}
            className={`cursor-pointer hover:bg-accent ${
              selectedTransactionId === transaction.id
                ? 'ring-1 ring-inset ring-primary'
                : ''
            }`}
            onClick={() => onRowClick(transaction)}
          >
            <TableCell className="font-mono text-sm text-muted-foreground">
              {(currentPage - 1) * pageSize + index + 1}
            </TableCell>
            <TableCell>
              <div>
                <p className="font-medium text-foreground">
                  {transaction.description}
                </p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  {transaction.category?.icon && (
                    <span>{transaction.category.icon}</span>
                  )}
                  {transaction.category?.name ??
                    (transaction.type === 'TRANSFER'
                      ? 'Transfer'
                      : transaction.transferAccount
                        ? `Transfer to ${transaction.transferAccount.name}`
                        : 'Uncategorized')}
                </p>
              </div>
            </TableCell>
            <TableCell>
              <span className={getTransactionTypeColor(transaction.type)}>
                {getTransactionTypeLabel(transaction.type)}
              </span>
            </TableCell>
            <TableCell>{transaction.account.name}</TableCell>
            <TableCell>
              <div>
                <p className="font-medium text-foreground">
                  {formatDateTime(transaction.transactionDate)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatRelativeDate(transaction.transactionDate)}
                </p>
              </div>
            </TableCell>
            <TableCell className="text-right">
              <span className={getTransactionAmountColor(transaction.type)}>
                {formatCurrency(
                  transaction.amount,
                  transaction.account.currency
                )}
              </span>
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end">
                <RowActionsMenu
                  actions={[
                    {
                      label: 'View',
                      onSelect: () => onView(transaction),
                      icon: Eye,
                    },
                    {
                      label: 'Edit',
                      onSelect: () => onEdit(transaction),
                      icon: Pencil,
                    },
                    {
                      label: 'Delete',
                      onSelect: () => onDelete(transaction),
                      icon: Trash2,
                      destructive: true,
                    },
                  ]}
                />
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
