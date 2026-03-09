import { Toaster } from 'sonner'

export function AppToaster() {
  return (
    <Toaster
      richColors
      position="top-right"
      toastOptions={{
        style: {
          background: 'var(--popover)',
          color: 'var(--popover-foreground)',
          border: '1px solid var(--border)',
        },
      }}
    />
  )
}
