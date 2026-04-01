import { Check, Pencil, X } from 'lucide-react'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'

import { CrudDialogShell } from '#/components/crud-dialog-shell'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '#/components/ui/form'
import { Button } from '#/components/ui/button'
import { DialogFooter } from '#/components/ui/dialog'
import { Input } from '#/components/ui/input'
import { updateCurrency, type Currency } from '#/lib/api'

const editCurrencySchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(80),
  symbol: z.string().trim().min(1, 'Symbol is required').max(10),
})

type EditCurrencyFormValues = z.infer<typeof editCurrencySchema>

interface EditCurrencyDialogProps {
  currency: Currency | null
  onClose: () => void
  onSuccess: () => Promise<void>
}

export function EditCurrencyDialog({
  currency,
  onClose,
  onSuccess,
}: EditCurrencyDialogProps) {
  const form = useForm<EditCurrencyFormValues>({
    resolver: zodResolver(editCurrencySchema),
    defaultValues: { name: '', symbol: '' },
  })

  useEffect(() => {
    if (currency) {
      form.reset({ name: currency.name, symbol: currency.symbol })
    }
  }, [currency, form])

  async function handleSubmit(values: EditCurrencyFormValues) {
    if (!currency) return
    try {
      await updateCurrency(currency.id, values)
      onClose()
      await onSuccess()
      toast.success('Currency updated')
    } catch (err) {
      toast.error('Unable to update currency', {
        description: err instanceof Error ? err.message : 'Request failed',
      })
    }
  }

  return (
    <CrudDialogShell
      open={Boolean(currency)}
      onOpenChange={(open) => !open && onClose()}
      title="Edit currency"
      description="Update the display name or symbol. The shortcode cannot be changed."
      icon={Pencil}
    >
      {currency && (
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--secondary)]/40 px-4 py-3 text-sm text-[var(--muted-foreground)]">
              Shortcode:{' '}
              <span className="font-mono font-semibold text-[var(--foreground)]">
                {currency.shortcode}
              </span>
            </div>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="symbol"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Symbol</FormLabel>
                  <FormControl>
                    <Input maxLength={10} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                <X className="h-4 w-4" />
                Cancel
              </Button>
              <Button type="submit">
                <Check className="h-4 w-4" />
                Save changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      )}
    </CrudDialogShell>
  )
}
