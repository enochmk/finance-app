import { createFileRoute } from '@tanstack/react-router'
import {
  AlertTriangle,
  FolderTree,
  Landmark,
  List,
  RotateCcw,
} from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { ConfirmActionDialog } from '#/components/confirm-action-dialog'
import { CrudPageShell } from '#/components/crud-page-shell'
import { useSession } from '#/components/session-provider'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#/components/ui/card'
import { useFinanceWorkspaceData } from '#/hooks/use-finance-workspace-data'
import { useProtectedRoute } from '#/hooks/use-protected-route'
import { resetWorkspace } from '#/lib/api'

export const Route = createFileRoute('/settings/reset')({
  component: ResetWorkspacePage,
})

const CONSEQUENCES = [
  {
    icon: List,
    label: 'All transactions deleted',
    detail:
      'Every income, expense, and transfer entry will be permanently removed.',
  },
  {
    icon: Landmark,
    label: 'All accounts deleted',
    detail:
      'Every bank account, wallet, and money bucket will be removed along with their balances.',
  },
  {
    icon: FolderTree,
    label: 'All categories deleted',
    detail:
      'Every custom income and expense category will be permanently erased.',
  },
]

function ResetWorkspacePage() {
  const { isAuthenticated } = useSession()
  const { isLoading: isSessionLoading } = useProtectedRoute()
  const { accounts, categories, transactions, refreshAll } =
    useFinanceWorkspaceData(isAuthenticated)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [isResetting, setIsResetting] = useState(false)

  if (!isAuthenticated && !isSessionLoading) {
    return null
  }

  const isEmpty =
    accounts.length === 0 &&
    categories.length === 0 &&
    transactions.length === 0

  async function handleConfirmReset() {
    setIsResetting(true)
    try {
      await resetWorkspace()
      setConfirmOpen(false)
      await refreshAll()
      toast.success('Workspace reset', {
        description:
          'All transactions, accounts, and categories have been cleared.',
      })
    } catch (err) {
      toast.error('Reset failed', {
        description: err instanceof Error ? err.message : 'Request failed',
      })
    } finally {
      setIsResetting(false)
    }
  }

  return (
    <CrudPageShell
      badge="Settings"
      title="Reset workspace"
      description="Permanently clear all your financial data. This action cannot be undone."
      icon={RotateCcw}
    >
      {/* Current data summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Current workspace data</CardTitle>
          <CardDescription>
            The following data will be permanently deleted on reset.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { label: 'Transactions', count: transactions.length },
              { label: 'Accounts', count: accounts.length },
              { label: 'Categories', count: categories.length },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3"
              >
                <span className="text-sm text-muted-foreground">
                  {item.label}
                </span>
                <Badge variant={item.count > 0 ? 'default' : 'secondary'}>
                  {item.count}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Consequence list */}
      <Card className="border-destructive/40">
        <CardHeader>
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            <CardTitle className="text-base text-destructive">
              What will be deleted
            </CardTitle>
          </div>
          <CardDescription>
            All of the following will be permanently and irreversibly removed
            from your workspace.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {CONSEQUENCES.map((item) => {
            const Icon = item.icon
            return (
              <div key={item.label} className="flex gap-3">
                <div className="mt-0.5 rounded-md bg-destructive/10 p-1.5 text-destructive">
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-sm text-muted-foreground">{item.detail}</p>
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Action */}
      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle className="text-base">Danger zone</CardTitle>
          <CardDescription>
            {isEmpty
              ? 'Your workspace is already empty. Nothing to reset.'
              : 'Once you reset, there is no going back. All your data will be lost forever.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="destructive"
            disabled={isEmpty || isResetting}
            onClick={() => setConfirmOpen(true)}
          >
            <RotateCcw className="h-4 w-4" />
            {isResetting ? 'Resetting…' : 'Reset workspace'}
          </Button>
        </CardContent>
      </Card>

      <ConfirmActionDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Reset your entire workspace?"
        description="This will permanently delete all transactions, accounts, and categories. This action cannot be undone. Are you absolutely sure?"
        confirmLabel={isResetting ? 'Resetting…' : 'Yes, reset everything'}
        confirmIcon={RotateCcw}
        icon={AlertTriangle}
        isLoading={isResetting}
        onConfirm={handleConfirmReset}
      />
    </CrudPageShell>
  )
}
