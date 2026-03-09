import { Link, useNavigate, useRouterState } from '@tanstack/react-router'
import {
  ChevronLeft,
  ChevronsUpDown,
  BarChart3,
  CreditCard,
  FolderTree,
  LayoutDashboard,
  LogOut,
  Menu,
  MoonStar,
  PiggyBank,
  Repeat2,
  ReceiptText,
  Settings,
  SquarePen,
} from 'lucide-react'
import { toast } from 'sonner'

import { Avatar, AvatarFallback } from '#/components/ui/avatar'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '#/components/ui/dropdown-menu'
import { Separator } from '#/components/ui/separator'
import { Sheet, SheetContent, SheetTrigger } from '#/components/ui/sheet'
import ThemeToggle from '#/components/ThemeToggle'
import { useSession } from '#/components/session-provider'
import { cn } from '#/lib/utils'
import { useSidebarState } from '#/components/sidebar-state'

const navigationItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
  { to: '/manage', label: 'Overview', icon: SquarePen },
  { to: '/manage/accounts', label: 'Accounts', icon: CreditCard },
  { to: '/manage/categories', label: 'Categories', icon: FolderTree },
  { to: '/manage/budgets', label: 'Budgets', icon: PiggyBank },
  { to: '/manage/transactions', label: 'Transactions', icon: ReceiptText },
  { to: '/manage/recurring', label: 'Recurring', icon: Repeat2 },
] as const

function SidebarContent({ mobile = false }: { mobile?: boolean }) {
  const navigate = useNavigate()
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })
  const { isCollapsed, toggleSidebar, setMode } = useSidebarState()
  const { signOut, user } = useSession()

  function handleLogout() {
    signOut()
    toast.success('Logged out', {
      description: 'Your session has been cleared.',
    })
    void navigate({ to: '/' })
  }

  function handleSettingsSoon() {
    toast.message('Settings coming soon', {
      description: 'This section is planned but not wired yet.',
    })
  }

  return (
    <div className="flex h-full flex-col">
      <div
        className={cn(
          'flex items-center px-2 py-3',
          isCollapsed && !mobile ? 'justify-center' : 'gap-3'
        )}
      >
        <Avatar className="h-10 w-10">
          <AvatarFallback>PF</AvatarFallback>
        </Avatar>
        {(!isCollapsed || mobile) && (
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-[var(--sidebar-foreground)]">
              Personal Finance
            </p>
            <p className="text-xs text-[var(--sidebar-muted-foreground)]">
              Workspace
            </p>
          </div>
        )}

        {!mobile && (
          <Button
            variant="ghost"
            size="icon"
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="text-[var(--sidebar-muted-foreground)] hover:bg-[var(--sidebar-accent)] hover:text-[var(--sidebar-accent-foreground)]"
            onClick={toggleSidebar}
          >
            <ChevronLeft
              className={cn(
                'h-4 w-4 transition-transform',
                isCollapsed && 'rotate-180'
              )}
            />
          </Button>
        )}
      </div>

      <Separator className="my-4 bg-[var(--sidebar-border)]" />

      <div className="px-2">
        {(!isCollapsed || mobile) && (
          <div className="mb-3 flex items-center justify-between px-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--sidebar-muted-foreground)]">
              Navigation
            </p>
            <Badge
              variant="secondary"
              className="bg-[var(--sidebar-accent)] text-[var(--sidebar-accent-foreground)]"
            >
              Beta
            </Badge>
          </div>
        )}

        <nav className="space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon
            const active = pathname === item.to

            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  'flex items-center rounded-xl px-3 py-2.5 text-sm font-medium no-underline transition-colors',
                  isCollapsed && !mobile ? 'justify-center' : 'gap-3',
                  active
                    ? 'sidebar-nav-active text-[var(--sidebar-primary-foreground)] shadow-sm'
                    : 'text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-accent)] hover:text-[var(--sidebar-accent-foreground)]'
                )}
                title={isCollapsed && !mobile ? item.label : undefined}
              >
                <Icon className="h-4 w-4" />
                {(!isCollapsed || mobile) && item.label}
              </Link>
            )
          })}
        </nav>
      </div>

      <div className="mt-auto space-y-4 px-2 pb-2">
        {(!isCollapsed || mobile) && (
          <div className="rounded-2xl border border-[var(--sidebar-border)] bg-[rgba(255,255,255,0.04)] p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--sidebar-foreground)]">
              <CreditCard className="h-4 w-4" />
              Admin layout
            </div>
            <p className="text-sm leading-6 text-[var(--sidebar-muted-foreground)]">
              Dedicated finance sections now split accounts, categories,
              budgets, transactions, and recurring items.
            </p>
          </div>
        )}

        <div
          className={cn(
            'rounded-2xl border border-[var(--sidebar-border)] px-3 py-3',
            isCollapsed && !mobile ? 'px-2' : ''
          )}
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={cn(
                  'flex w-full items-center rounded-xl text-left outline-none transition-colors hover:bg-[var(--sidebar-accent)]',
                  isCollapsed && !mobile
                    ? 'justify-center px-2 py-2.5'
                    : 'gap-3 px-2 py-2'
                )}
              >
                <Avatar className="h-9 w-9">
                  <AvatarFallback>EK</AvatarFallback>
                </Avatar>
                {(!isCollapsed || mobile) && (
                  <>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-[var(--sidebar-foreground)]">
                        {user?.name ?? 'Workspace user'}
                      </p>
                      <p className="truncate text-xs text-[var(--sidebar-muted-foreground)]">
                        {user?.email ?? 'Finance workspace'}
                      </p>
                    </div>
                    <ChevronsUpDown className="h-4 w-4 text-[var(--sidebar-muted-foreground)]" />
                  </>
                )}
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              side="top"
              align={isCollapsed && !mobile ? 'center' : 'start'}
              className="w-56"
            >
              <DropdownMenuLabel>Workspace actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="px-2 py-2">
                <div className="mb-2 flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
                  <MoonStar className="h-4 w-4" />
                  Theme
                </div>
                <ThemeToggle />
              </div>
              <DropdownMenuSeparator />
              {!mobile && (
                <DropdownMenuItem
                  onClick={() =>
                    setMode(isCollapsed ? 'expanded' : 'collapsed')
                  }
                >
                  <CreditCard className="h-4 w-4" />
                  {isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={handleSettingsSoon}>
                <Settings className="h-4 w-4" />
                Settings
                <span className="ml-auto text-xs text-[var(--muted-foreground)]">
                  Soon
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}

export function AppSidebar() {
  const { isCollapsed } = useSidebarState()

  return (
    <>
      <aside
        className={cn(
          'hidden shrink-0 border-r border-[var(--sidebar-border)] bg-[var(--sidebar)] px-4 py-4 transition-[width] duration-200 lg:block',
          isCollapsed ? 'w-24' : 'w-72'
        )}
      >
        <SidebarContent />
      </aside>

      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-[var(--border)] bg-[var(--background)]/88 px-4 py-3 backdrop-blur lg:hidden">
        <div>
          <p className="text-sm font-semibold text-[var(--foreground)]">
            Personal Finance
          </p>
          <p className="text-xs text-[var(--muted-foreground)]">Workspace</p>
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              aria-label="Open navigation menu"
            >
              <Menu className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SidebarContent mobile />
          </SheetContent>
        </Sheet>
      </div>
    </>
  )
}
