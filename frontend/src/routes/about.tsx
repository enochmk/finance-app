import { createFileRoute } from '@tanstack/react-router'
import { Layers3, PanelLeftDashed, ShieldEllipsis } from 'lucide-react'

import { Badge } from '#/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/components/ui/card'

export const Route = createFileRoute('/about')({
  component: About,
})

function About() {
  return (
    <main className="w-full px-4 py-8 lg:px-8 xl:px-10">
      <Card>
        <CardHeader>
          <Badge variant="secondary" className="mb-2 w-fit">Project</Badge>
          <CardTitle className="display-title text-4xl sm:text-5xl">
            A finance app growing into an admin-grade workspace.
          </CardTitle>
          <CardDescription className="max-w-3xl text-base leading-7">
            The backend now exposes authenticated finance resources, dashboard summaries,
            and monthly reports. The frontend is shifting from starter content to a shadcn-style control panel.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          {[
            {
              icon: ShieldEllipsis,
              title: 'Authenticated API',
              description: 'Accounts, budgets, categories, transactions, reports, and dashboard endpoints are already protected.',
            },
            {
              icon: PanelLeftDashed,
              title: 'Admin layout',
              description: 'The navigation now prefers a left-hand workspace instead of a marketing-style top bar.',
            },
            {
              icon: Layers3,
              title: 'Component system',
              description: 'The interface is moving to reusable shadcn-style primitives for cards, charts, badges, inputs, and shells.',
            },
          ].map((item) => {
            const Icon = item.icon

            return (
              <div key={item.title} className="rounded-2xl border border-[var(--border)] bg-[var(--secondary)]/35 p-5">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--primary-soft)] text-[var(--primary)]">
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="text-base font-semibold text-[var(--foreground)]">{item.title}</h2>
                <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">{item.description}</p>
              </div>
            )
          })}
        </CardContent>
      </Card>
    </main>
  )
}
