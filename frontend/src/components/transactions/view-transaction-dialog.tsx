import { Eye } from 'lucide-react'

import { CrudDialogShell } from '#/components/crud-dialog-shell'
import { Button } from '#/components/ui/button'
import { DialogFooter } from '#/components/ui/dialog'
import type { Transaction } from '#/lib/api'
import {
  formatCurrency,
  formatDateTime,
  getTransactionAmountColor,
  getTransactionTypeColor,
  getTransactionTypeLabel,
} from '#/lib/finance'

interface ViewTransactionDialogProps {
  transaction: Transaction | null
  onClose: () => void
  onEdit: (transaction: Transaction) => void
}

export function ViewTransactionDialog({
  transaction,
  onClose,
  onEdit,
}: ViewTransactionDialogProps) {
  return (
    <CrudDialogShell
      open={Boolean(transaction)}
      onOpenChange={(open) => !open && onClose()}
      title="Transaction details"
      description="View the complete transaction information."
      icon={Eye}
    >
      {transaction && (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium">Description</label>
              <p className="text-sm text-muted-foreground">
                {transaction.description}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium">Type</label>
              <p
                className={`text-sm ${getTransactionTypeColor(transaction.type)}`}
              >
                {getTransactionTypeLabel(transaction.type)}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium">Account</label>
              <p className="text-sm text-muted-foreground">
                {transaction.account.name}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium">Amount</label>
              <p
                className={`text-sm ${getTransactionAmountColor(transaction.type)}`}
              >
                {formatCurrency(
                  transaction.amount,
                  transaction.account.currency
                )}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium">Date</label>
              <p className="text-sm text-muted-foreground">
                {formatDateTime(transaction.transactionDate)}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium">Category</label>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
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
          </div>
          {transaction.notes && (
            <div>
              <label className="text-sm font-medium">Notes</label>
              <p className="text-sm text-muted-foreground">
                {transaction.notes}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button
              type="button"
              onClick={() => {
                onClose()
                onEdit(transaction)
              }}
            >
              Edit
            </Button>
          </DialogFooter>
        </div>
      )}
    </CrudDialogShell>
  )
}
