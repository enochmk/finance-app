import { Check, Plus, X } from 'lucide-react'
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
import { createCurrency } from '#/lib/api'

const currencySchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(80),
  shortcode: z
    .string()
    .trim()
    .min(1, 'Shortcode is required')
    .max(10)
    .transform((v) => v.toUpperCase()),
  symbol: z.string().trim().min(1, 'Symbol is required').max(10),
})

type CurrencyFormValues = z.infer<typeof currencySchema>

interface CreateCurrencyDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => Promise<void>
}

export function CreateCurrencyDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateCurrencyDialogProps) {
  const form = useForm<CurrencyFormValues>({
    resolver: zodResolver(currencySchema),
    defaultValues: { name: '', shortcode: '', symbol: '' },
  })

  async function handleSubmit(values: CurrencyFormValues) {
    try {
      await createCurrency(values)
      form.reset({ name: '', shortcode: '', symbol: '' })
      onOpenChange(false)
      await onSuccess()
      toast.success('Currency created')
    } catch (err) {
      toast.error('Unable to create currency', {
        description: err instanceof Error ? err.message : 'Request failed',
      })
    }
  }

  return (
    <CrudDialogShell
      open={open}
      onOpenChange={onOpenChange}
      title="Add currency"
      description="Define a new currency with a name, unique shortcode, and symbol."
      icon={Plus}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Ghana Cedis" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="shortcode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Shortcode</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. GHS"
                      maxLength={10}
                      {...field}
                      onChange={(e) =>
                        field.onChange(e.target.value.toUpperCase())
                      }
                    />
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
                    <Input placeholder="e.g. ₵" maxLength={10} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
              Cancel
            </Button>
            <Button type="submit">
              <Check className="h-4 w-4" />
              Add currency
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </CrudDialogShell>
  )
}
