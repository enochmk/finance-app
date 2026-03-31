import { CrudDialogShell } from '#/components/crud-dialog-shell'
import { Button } from '#/components/ui/button'
import { DialogFooter } from '#/components/ui/dialog'
import { Input } from '#/components/ui/input'

interface CustomDateRangeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  dateFrom: string
  dateTo: string
  onDateFromChange: (value: string) => void
  onDateToChange: (value: string) => void
  onApply: (from: string, to: string) => void
}

export function CustomDateRangeModal({
  open,
  onOpenChange,
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  onApply,
}: CustomDateRangeModalProps) {
  return (
    <CrudDialogShell
      open={open}
      onOpenChange={onOpenChange}
      title="Select Custom Date Range"
      description="Choose the date range for filtering transactions."
    >
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <label htmlFor="custom-date-from" className="text-sm font-medium">
              From Date
            </label>
            <Input
              id="custom-date-from"
              type="date"
              value={dateFrom}
              onChange={(e) => onDateFromChange(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="custom-date-to" className="text-sm font-medium">
              To Date
            </label>
            <Input
              id="custom-date-to"
              type="date"
              value={dateTo}
              onChange={(e) => onDateToChange(e.target.value)}
            />
          </div>
        </div>
      </div>
      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenChange(false)}
        >
          Cancel
        </Button>
        <Button type="button" onClick={() => onApply(dateFrom, dateTo)}>
          Apply Range
        </Button>
      </DialogFooter>
    </CrudDialogShell>
  )
}
