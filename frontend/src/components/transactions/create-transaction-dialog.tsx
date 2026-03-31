import {
  ArrowRightLeft,
  Building2,
  Calendar,
  FileText,
  Plus,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'
import type { UseFormReturn } from 'react-hook-form'
import { z } from 'zod'

import { Button } from '#/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '#/components/ui/form'
import { Input } from '#/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import type { Account, Category } from '#/lib/api'
import { formatCurrency, TRANSACTION_TYPE_OPTIONS } from '#/lib/finance'

import { getDarkColor, getAccountIcon } from './helpers'

export const transactionSchema = z.object({
  accountId: z.string().uuid('Select a valid account'),
  categoryId: z.string().optional(),
  transferAccountId: z.string().optional(),
  type: z.enum(['INCOME', 'EXPENSE', 'TRANSFER']),
  amount: z.coerce
    .number()
    .positive('Transaction amount must be greater than zero'),
  description: z.string().trim().min(1, 'Description is required').max(255),
  transactionDate: z.string().min(1, 'Transaction date is required'),
})

export type TransactionFormValues = z.infer<typeof transactionSchema>

interface BalanceProjection {
  projected: number
  color: string
}

interface CreateTransactionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  form: UseFormReturn<TransactionFormValues>
  onSubmit: (values: TransactionFormValues) => Promise<void>
  availableAccounts: Account[]
  categories: Category[]
  selectedAccount: Account | undefined
  balanceProjection: BalanceProjection | null
  watchedType: string
}

export function CreateTransactionDialog({
  open,
  onOpenChange,
  form,
  onSubmit,
  availableAccounts,
  categories,
  selectedAccount,
  balanceProjection,
  watchedType,
}: CreateTransactionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 overflow-hidden max-w-lg">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            {/* Colored header */}
            <div
              className="px-6 pt-6 pb-5"
              style={{
                background: selectedAccount?.color
                  ? getDarkColor(selectedAccount.color)
                  : 'var(--card)',
              }}
            >
              {/* Type toggle */}
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem className="mb-4">
                    <FormControl>
                      <div className="flex gap-2">
                        {TRANSACTION_TYPE_OPTIONS.map((option) => {
                          const isSelected = field.value === option.value
                          const Icon =
                            option.value === 'INCOME'
                              ? TrendingUp
                              : option.value === 'EXPENSE'
                                ? TrendingDown
                                : ArrowRightLeft
                          const selectedColor =
                            option.value === 'INCOME'
                              ? 'bg-green-500/30 text-green-200 border-green-400/40 hover:bg-green-500/40'
                              : option.value === 'EXPENSE'
                                ? 'bg-red-500/30 text-red-200 border-red-400/40 hover:bg-red-500/40'
                                : 'bg-blue-500/30 text-blue-200 border-blue-400/40 hover:bg-blue-500/40'
                          return (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => field.onChange(option.value)}
                              className={`flex flex-1 items-center justify-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${
                                isSelected
                                  ? selectedColor
                                  : 'border-white/10 text-white/40 hover:border-white/20 hover:text-white/60'
                              }`}
                            >
                              <Icon className="h-3.5 w-3.5" />
                              {option.label}
                            </button>
                          )
                        })}
                      </div>
                    </FormControl>
                  </FormItem>
                )}
              />

              <DialogHeader>
                <div className="flex items-center gap-2 mb-1">
                  {selectedAccount &&
                    (() => {
                      const Icon = getAccountIcon(selectedAccount.icon)
                      return (
                        <Icon
                          className="h-5 w-5"
                          style={{ color: selectedAccount.color ?? 'white' }}
                        />
                      )
                    })()}
                  <DialogTitle className="text-white text-lg font-semibold">
                    Add transaction
                  </DialogTitle>
                </div>
                <DialogDescription className="text-white/60 text-sm">
                  {selectedAccount
                    ? selectedAccount.name
                    : 'Record a credit, debit, or transfer'}
                </DialogDescription>
              </DialogHeader>

              {/* Hero amount input */}
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem className="mt-5">
                    <FormControl>
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-3xl font-bold text-white/50 select-none">
                          {selectedAccount?.currency
                            ? (new Intl.NumberFormat('en-US', {
                                style: 'currency',
                                currency: selectedAccount.currency,
                                maximumFractionDigits: 0,
                              })
                                .formatToParts(0)
                                .find((p) => p.type === 'currency')?.value ??
                              'GH₵')
                            : 'GH₵'}
                        </span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          autoFocus
                          value={String(field.value ?? 0)}
                          onChange={(e) => field.onChange(e.target.value)}
                          onFocus={(e) => e.target.select()}
                          className="w-full bg-transparent border-none shadow-none outline-none text-center text-5xl font-bold text-white placeholder-white/30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="text-center text-red-300" />
                  </FormItem>
                )}
              />

              {/* Balance projection */}
              {selectedAccount && (
                <div className="mt-4 flex items-center justify-between gap-4 rounded-lg bg-black/20 px-4 py-3">
                  <div>
                    <p className="text-xs text-white/60 mb-0.5 uppercase tracking-wide">
                      Current balance
                    </p>
                    <p
                      className={`text-base font-bold ${
                        Number(selectedAccount.currentBalance) >= 0
                          ? 'text-green-400'
                          : 'text-red-400'
                      }`}
                    >
                      {formatCurrency(
                        selectedAccount.currentBalance,
                        selectedAccount.currency
                      )}
                    </p>
                  </div>
                  <ArrowRightLeft className="h-4 w-4 text-white/40 shrink-0" />
                  <div className="text-right">
                    <p className="text-xs text-white/60 mb-0.5 uppercase tracking-wide">
                      After transaction
                    </p>
                    <p
                      className={`text-base font-bold ${
                        balanceProjection
                          ? balanceProjection.projected >= 0
                            ? 'text-green-400'
                            : 'text-red-400'
                          : 'text-white/40'
                      }`}
                    >
                      {balanceProjection
                        ? formatCurrency(
                            balanceProjection.projected,
                            selectedAccount.currency
                          )
                        : '—'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Form body */}
            <div className="px-6 pb-6 pt-5 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="accountId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        <Building2 className="inline mr-2 h-4 w-4" />
                        Account
                      </FormLabel>
                      <FormControl>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select account" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableAccounts.map((account) => (
                              <SelectItem key={account.id} value={account.id}>
                                {account.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {watchedType === 'TRANSFER' ? (
                  <FormField
                    control={form.control}
                    name="transferAccountId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          <ArrowRightLeft className="inline mr-2 h-4 w-4" />
                          Transfer account
                        </FormLabel>
                        <FormControl>
                          <Select
                            value={field.value || ''}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select destination account" />
                            </SelectTrigger>
                            <SelectContent>
                              {availableAccounts
                                .filter(
                                  (account) =>
                                    account.id !== selectedAccount?.id
                                )
                                .map((account) => (
                                  <SelectItem
                                    key={account.id}
                                    value={account.id}
                                  >
                                    {account.name}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : (
                  <FormField
                    control={form.control}
                    name="categoryId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          <FileText className="inline mr-2 h-4 w-4" />
                          Category
                        </FormLabel>
                        <FormControl>
                          <Select
                            value={field.value || ''}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                              {categories
                                .filter((category) => !category.isArchived)
                                .map((category) => (
                                  <SelectItem
                                    key={category.id}
                                    value={category.id}
                                  >
                                    {category.name}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              <FormField
                control={form.control}
                name="transactionDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <Calendar className="inline mr-2 h-4 w-4" />
                      Date
                    </FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <FileText className="inline mr-2 h-4 w-4" />
                      Description
                    </FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  <Plus className="mr-2 h-4 w-4" />
                  Add transaction
                </Button>
              </DialogFooter>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
