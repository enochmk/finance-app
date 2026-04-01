import { Pencil } from 'lucide-react'
import type { FormEvent } from 'react'

import { CrudDialogShell } from '#/components/crud-dialog-shell'
import { Button } from '#/components/ui/button'
import { DialogFooter } from '#/components/ui/dialog'
import { Input } from '#/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import type { Account, Category, Transaction } from '#/lib/api'
import {
  categoryTypeForTransaction,
  formatAmountInput,
  parseAmountInput,
  TRANSACTION_TYPE_OPTIONS,
} from '#/lib/finance'

import { CategoryPicker } from './category-picker'

export interface EditTransactionValues {
  accountId: string
  categoryId: string
  transferAccountId: string
  type: string
  amount: string
  description: string
  transactionDate: string
}

interface EditTransactionDialogProps {
  transaction: Transaction | null
  values: EditTransactionValues
  onChange: (values: EditTransactionValues) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>
  onClose: () => void
  accountOptions: Account[]
  transferAccountOptions: Account[]
  categories: Category[]
}

function buildHierarchy(
  categories: Category[],
  forType: string,
  currentId?: string
) {
  return categories.filter(
    (c) => c.type === forType && (!c.isArchived || c.id === currentId)
  )
}

export function EditTransactionDialog({
  transaction,
  values,
  onChange,
  onSubmit,
  onClose,
  accountOptions,
  transferAccountOptions,
  categories,
}: EditTransactionDialogProps) {
  const categoryType = categoryTypeForTransaction(values.type)
  const filteredCategories = categoryType
    ? buildHierarchy(categories, categoryType, values.categoryId)
    : []

  return (
    <CrudDialogShell
      open={Boolean(transaction)}
      onOpenChange={(open) => !open && onClose()}
      title="Edit transaction"
      description="Correct the transaction details or reclassify the activity."
      icon={Pencil}
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <Select
            value={values.accountId}
            onValueChange={(value) => onChange({ ...values, accountId: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Account" />
            </SelectTrigger>
            <SelectContent>
              {accountOptions.map((account) => (
                <SelectItem key={account.id} value={account.id}>
                  {account.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {values.type === 'TRANSFER' ? (
            <Select
              value={values.transferAccountId}
              onValueChange={(value) =>
                onChange({ ...values, transferAccountId: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Transfer account" />
              </SelectTrigger>
              <SelectContent>
                {transferAccountOptions.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <CategoryPicker
              value={values.categoryId || ''}
              onValueChange={(value) =>
                onChange({ ...values, categoryId: value })
              }
              categories={filteredCategories}
            />
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Select
            value={values.type}
            onValueChange={(value) =>
              onChange({
                ...values,
                type: value,
                categoryId: value === 'TRANSFER' ? '' : values.categoryId,
                transferAccountId:
                  value === 'TRANSFER' ? values.transferAccountId : '',
              })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TRANSACTION_TYPE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            type="text"
            inputMode="decimal"
            value={formatAmountInput(values.amount)}
            onChange={(e) => {
              const raw = parseAmountInput(e.target.value)
              if (raw === '' || /^\d*\.?\d*$/.test(raw)) {
                onChange({ ...values, amount: raw })
              }
            }}
          />
        </div>

        <Input
          value={values.description}
          onChange={(e) => onChange({ ...values, description: e.target.value })}
        />

        <Input
          type="datetime-local"
          value={values.transactionDate}
          onChange={(e) =>
            onChange({ ...values, transactionDate: e.target.value })
          }
        />

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Save changes</Button>
        </DialogFooter>
      </form>
    </CrudDialogShell>
  )
}
