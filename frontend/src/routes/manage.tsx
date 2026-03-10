import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'

import { CrudPageShell } from '#/components/crud-page-shell'
import { FinanceSectionNav } from '#/components/finance-section-nav'
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
import { financeSectionLinks } from '#/lib/finance-navigation'

export const Route = createFileRoute('/manage')({
  component: ManageOverviewPage,
})

function ManageOverviewPage() {
  const { isAuthenticated } = useSession()
  const { isLoading: isSessionLoading } = useProtectedRoute()
  const {
    accounts,
    categories,
    transactions,
    error,
  } = useFinanceWorkspaceData(isAuthenticated)

  if (!isAuthenticated && !isSessionLoading) {
    return null
  }

  return (
    <CrudPageShell
      badge="Finance workspace"
      title="Management overview"
      description="Jump into the core MVP sections for accounts, categories, and transactions."
      navigation={<FinanceSectionNav />}
      actions={
        <Button asChild>
          <Link to="/manage/transactions">
            Open transactions
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      }
    >
      {error ? (
        <Card>
          <CardHeader>
            <CardTitle>Workspace unavailable</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: 'Accounts', value: accounts.length },
          { label: 'Categories', value: categories.length },
          { label: 'Transactions', value: transactions.length },
        ].map((item) => (
          <Card key={item.label}>
            <CardHeader className="pb-3">
              <CardDescription>{item.label}</CardDescription>
              <CardTitle className="text-3xl">{item.value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {financeSectionLinks.map((section) => {
          const Icon = section.icon

          return (
            <Card key={section.to} className="overflow-hidden">
              <CardHeader>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="rounded-2xl bg-[var(--primary-soft)] p-3 text-[var(--primary)]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <Badge variant="secondary">Section</Badge>
                </div>
                <CardTitle>{section.label}</CardTitle>
                <CardDescription>{section.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline">
                  <Link to={section.to}>
                    Open {section.label.toLowerCase()}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </CrudPageShell>
  )
}
