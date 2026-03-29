import { Button } from '#/components/ui/button'

type PaginationControlsProps = {
  currentPage: number
  totalPages: number
  totalItems: number
  pageSize: number
  itemLabel?: string
  onPageChange: (page: number) => void
}

export function PaginationControls({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  itemLabel = 'items',
  onPageChange,
}: PaginationControlsProps) {
  const start = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const end = Math.min(currentPage * pageSize, totalItems)
  const pages = Array.from(
    { length: totalPages },
    (_, index) => index + 1
  ).slice(Math.max(currentPage - 2, 0), Math.max(currentPage + 1, 3))

  return (
    <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <p className="text-sm text-[var(--muted-foreground)]">
        Showing {start}-{end} of {totalItems} {itemLabel}
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
          disabled={currentPage <= 1}
        >
          Previous
        </Button>
        {pages.map((page) => (
          <Button
            key={page}
            type="button"
            variant={page === currentPage ? 'default' : 'outline'}
            size="sm"
            onClick={() => onPageChange(page)}
          >
            {page}
          </Button>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
          disabled={currentPage >= totalPages}
        >
          Next
        </Button>
      </div>
    </div>
  )
}
