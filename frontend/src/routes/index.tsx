import { createFileRoute, Link } from '@tanstack/react-router'
import {
  ArrowRight,
  BarChart3,
  LayoutDashboard,
  ShieldCheck,
  Wallet,
} from 'lucide-react'

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

export const Route = createFileRoute('/')({ component: App })

function App() {
  const { isAuthenticated } = useSession()

  return (
    <main className="w-full px-4 py-8 lg:px-8 xl:px-10">
      <Card className="relative overflow-hidden border-none bg-[linear-gradient(135deg,rgba(23,107,108,0.95),rgba(10,32,39,0.94))] text-white shadow-[0_30px_70px_rgba(15,23,42,0.25)]">
        <div className="pointer-events-none absolute inset-y-0 right-0 w-[48%] bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_56%)]" />
        <CardContent className="relative grid gap-10 p-8 lg:grid-cols-[1.2fr_0.8fr] lg:p-10">
          <div>
            <Badge className="mb-4 bg-white/12 text-white hover:bg-white/12">
              shadcn-style workspace
            </Badge>
            <h1 className="display-title max-w-3xl text-4xl font-bold leading-[1.02] tracking-tight sm:text-6xl">
              A calmer admin surface for your monthly money decisions.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-white/78 sm:text-lg">
              The app now uses a left-hand admin layout and live backend-powered
              finance views for dashboard and reporting flows.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              {isAuthenticated ? (
                <>
                  <Button
                    asChild
                    size="lg"
                    className="bg-white text-[#0f2d34] hover:bg-white/92"
                  >
                    <Link to="/dashboard">
                      Open dashboard
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="border-white/20 bg-white/6 text-white hover:bg-white/12"
                  >
                    <Link to="/manage">Open workspace</Link>
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    asChild
                    size="lg"
                    className="bg-white text-[#0f2d34] hover:bg-white/92"
                  >
                    <Link to="/sign-in">
                      Sign in
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="border-white/20 bg-white/6 text-white hover:bg-white/12"
                  >
                    <Link to="/about">Explore the project</Link>
                  </Button>
                </>
              )}
            </div>
          </div>

          <div className="grid gap-4">
            {[
              {
                icon: Wallet,
                title: 'Live finance API',
                description:
                  'Dashboard and report screens now read directly from the backend endpoints.',
              },
              {
                icon: ShieldCheck,
                title: 'Protected insights',
                description:
                  'Seed-user login drives authenticated views while the app is still in local build mode.',
              },
              {
                icon: BarChart3,
                title: 'Reporting layer',
                description:
                  'Daily cash flow, category ranking, and account movement are ready for iteration.',
              },
            ].map((item) => {
              const Icon = item.icon

              return (
                <div
                  key={item.title}
                  className="rounded-2xl border border-white/10 bg-white/8 p-4 backdrop-blur-sm"
                >
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white/12">
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="text-sm font-semibold">{item.title}</p>
                  <p className="mt-1 text-sm leading-6 text-white/72">
                    {item.description}
                  </p>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Current development flow</CardTitle>
            <CardDescription>
              Fast local loop for your personal finance build.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            {[
              'Seed the backend with npm --prefix backend run seed:dev',
              'Run the API at http://127.0.0.1:4000 and the frontend at http://127.0.0.1:3000',
              'Use /sign-in, /manage, /manage/transactions, /dashboard, and /reports for the full finance flow',
            ].map((item, index) => (
              <div
                key={index}
                className="rounded-xl border border-[var(--border)] bg-[var(--secondary)]/40 p-4 text-sm text-[var(--muted-foreground)]"
              >
                {item}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Workspace sections</CardTitle>
            <CardDescription>
              Built around the left sidebar admin layout.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { icon: LayoutDashboard, label: 'Dashboard' },
              { icon: BarChart3, label: 'Reports' },
              { icon: Wallet, label: 'Finance sections' },
            ].map((item) => {
              const Icon = item.icon

              return (
                <div
                  key={item.label}
                  className="flex items-center gap-3 rounded-xl border border-[var(--border)] px-3 py-3"
                >
                  <div className="rounded-lg bg-[var(--primary-soft)] p-2 text-[var(--primary)]">
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="font-medium text-[var(--foreground)]">
                    {item.label}
                  </span>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
