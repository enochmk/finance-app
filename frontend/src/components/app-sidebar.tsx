import { Link, useNavigate, useRouterState } from '@tanstack/react-router'
import {
  ChevronLeft,
  ChevronDown,
  ChevronsUpDown,
  DollarSign,
  FolderTree,
  Landmark,
  LayoutDashboard,
  LogOut,
  Menu,
  MoonStar,
  Settings,
  SunMedium,
} from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { Avatar, AvatarFallback } from '#/components/ui/avatar'
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
import { useSession } from '#/components/session-provider'
import { cn } from '#/lib/utils'
import { useSidebarState } from '#/components/sidebar-state'

const navigationItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/transactions', label: 'Transactions', icon: DollarSign },
] as const

const settingsItems = [
  { to: '/settings/accounts', label: 'Accounts', icon: Landmark },
  { to: '/settings/categories', label: 'Categories', icon: FolderTree },
] as const

function SidebarContent({ mobile = false }: { mobile?: boolean }) {
  const navigate = useNavigate()
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })
  const { isCollapsed, toggleSidebar } = useSidebarState()
  const { signOut, user } = useSession()
  const [settingsOpen, setSettingsOpen] = useState(true)
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'light'
    const stored = window.localStorage.getItem('theme')
    if (stored === 'light' || stored === 'dark') return stored
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light'
  })

  function toggleTheme() {
    const next: 'light' | 'dark' = themeMode === 'light' ? 'dark' : 'light'
    setThemeMode(next)
    document.documentElement.classList.remove('light', 'dark')
    document.documentElement.classList.add(next)
    document.documentElement.setAttribute('data-theme', next)
    document.documentElement.style.colorScheme = next
    window.localStorage.setItem('theme', next)
  }

  function handleLogout() {
    signOut()
    toast.success('Logged out', {
      description: 'Your session has been cleared.',
    })
    void navigate({ to: '/' })
  }

  const userInitials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U'

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

          <div className="pt-2">
            {isCollapsed && !mobile ? (
              <>
                <div className="mb-1 flex justify-center py-1" title="Settings">
                  <Settings className="h-3.5 w-3.5 text-[var(--sidebar-muted-foreground)]" />
                </div>
                {settingsItems.map((item) => {
                  const Icon = item.icon
                  const active = pathname === item.to
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={cn(
                        'flex items-center justify-center rounded-xl px-3 py-2.5 text-sm font-medium no-underline transition-colors',
                        active
                          ? 'sidebar-nav-active text-[var(--sidebar-primary-foreground)] shadow-sm'
                          : 'text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-accent)] hover:text-[var(--sidebar-accent-foreground)]'
                      )}
                      title={item.label}
                    >
                      <Icon className="h-4 w-4" />
                    </Link>
                  )
                })}
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setSettingsOpen((prev) => !prev)}
                  className="mb-1 flex w-full items-center gap-2 rounded-xl px-3 py-1.5 transition-colors hover:bg-[var(--sidebar-accent)]"
                >
                  <Settings className="h-3.5 w-3.5 text-[var(--sidebar-muted-foreground)]" />
                  <p className="flex-1 text-left text-xs font-semibold uppercase tracking-wider text-[var(--sidebar-muted-foreground)]">
                    Settings
                  </p>
                  <ChevronDown
                    className={cn(
                      'h-3.5 w-3.5 text-[var(--sidebar-muted-foreground)] transition-transform duration-200',
                      !settingsOpen && '-rotate-90'
                    )}
                  />
                </button>
                {settingsOpen &&
                  settingsItems.map((item) => {
                    const Icon = item.icon
                    const active = pathname === item.to
                    return (
                      <Link
                        key={item.to}
                        to={item.to}
                        className={cn(
                          'flex items-center gap-3 rounded-xl px-3 py-2.5 pl-7 text-sm font-medium no-underline transition-colors',
                          active
                            ? 'sidebar-nav-active text-[var(--sidebar-primary-foreground)] shadow-sm'
                            : 'text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-accent)] hover:text-[var(--sidebar-accent-foreground)]'
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </Link>
                    )
                  })}
              </>
            )}
          </div>
        </nav>
      </div>

      <div className="mt-auto space-y-3 px-2 pb-2">
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
                  <AvatarFallback>{userInitials}</AvatarFallback>
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
              className="w-64"
            >
              <DropdownMenuLabel className="py-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="text-xs">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[var(--foreground)]">
                      {user?.name ?? 'Workspace user'}
                    </p>
                    <p className="truncate text-xs font-normal text-[var(--muted-foreground)]">
                      {user?.email ?? ''}
                    </p>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={toggleTheme} className="gap-2">
                {themeMode === 'dark' ? (
                  <MoonStar className="h-4 w-4" />
                ) : (
                  <SunMedium className="h-4 w-4" />
                )}
                {themeMode === 'dark' ? 'Dark mode' : 'Light mode'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
                Sign out
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
          'sticky top-0 hidden h-screen shrink-0 overflow-y-auto border-r border-[var(--sidebar-border)] bg-[var(--sidebar)] px-4 py-4 transition-[width] duration-200 lg:block',
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
