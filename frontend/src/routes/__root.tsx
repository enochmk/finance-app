import {
  HeadContent,
  Link,
  Scripts,
  createRootRoute,
  useNavigate,
  useRouterState,
} from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { useEffect } from 'react'

import { AppSidebar } from '#/components/app-sidebar'
import { CommandPalette } from '#/components/command-palette'
import { SessionProvider, useSession } from '#/components/session-provider'
import {
  SidebarStateProvider,
  useSidebarState,
} from '#/components/sidebar-state'
import ThemeToggle from '#/components/ThemeToggle'
import { Button } from '#/components/ui/button'
import { AppToaster } from '#/components/ui/sonner'

import appCss from '../styles.css?url'

const THEME_INIT_SCRIPT = `(function(){try{var stored=window.localStorage.getItem('theme');var mode=(stored==='light'||stored==='dark')?stored:(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');var root=document.documentElement;root.classList.remove('light','dark');root.classList.add(mode);root.setAttribute('data-theme',mode);root.style.colorScheme=mode;}catch(e){}})();`

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'Personal Finance Workspace',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <HeadContent />
      </head>
      <body className="font-sans antialiased [overflow-wrap:anywhere] selection:bg-[rgba(79,184,178,0.24)]">
        <SessionProvider>
          <SidebarStateProvider>
            <RootLayout>{children}</RootLayout>
          </SidebarStateProvider>
        </SessionProvider>
        <AppToaster />
        <TanStackDevtools
          config={{
            position: 'bottom-right',
          }}
          plugins={[
            {
              name: 'Tanstack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
          ]}
        />
        <Scripts />
      </body>
    </html>
  )
}

function RootLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })
  const { isCollapsed } = useSidebarState()
  const { isAuthenticated, isLoading } = useSession()

  const publicPaths = ['/', '/about']
  const authPaths = ['/sign-in']

  const isPublicRoute = publicPaths.includes(pathname)
  const isAuthRoute = authPaths.includes(pathname)
  const isProtectedRoute = !isPublicRoute && !isAuthRoute

  useEffect(() => {
    if (!isLoading && isProtectedRoute && !isAuthenticated) {
      void navigate({ to: '/sign-in' })
    }
  }, [isAuthenticated, isLoading, isProtectedRoute, navigate])

  if (isAuthRoute) {
    return (
      <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
        {children}
      </div>
    )
  }

  if (isPublicRoute) {
    return (
      <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
        <PublicHeader isAuthenticated={isAuthenticated} />
        {children}
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4 text-sm text-[var(--muted-foreground)]">
        Loading workspace...
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div
      className="bg-[var(--background)] text-[var(--foreground)] lg:grid"
      style={{ gridTemplateColumns: isCollapsed ? '6rem 1fr' : '18rem 1fr' }}
    >
      <AppSidebar />
      <div className="flex min-h-screen min-w-0 flex-col">
        {children}
        <AppFooter />
      </div>
      <CommandPalette />
    </div>
  )
}

function PublicHeader({ isAuthenticated }: { isAuthenticated: boolean }) {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--background)]/88 backdrop-blur">
      <div className="flex w-full items-center justify-between px-4 py-3 lg:px-8 xl:px-10">
        <Link to="/" className="no-underline">
          <div>
            <p className="text-sm font-semibold text-[var(--foreground)]">
              Personal Finance
            </p>
            <p className="text-xs text-[var(--muted-foreground)]">Workspace</p>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          {isAuthenticated ? (
            <Button asChild>
              <Link to="/dashboard">Open dashboard</Link>
            </Button>
          ) : (
            <Button asChild>
              <Link to="/sign-in">Sign in</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}

function AppFooter() {
  return (
    <footer className="mt-auto border-t border-[var(--border)] bg-[var(--background)] px-4 py-4 lg:px-8 xl:px-10">
      <div className="flex flex-col items-center justify-between gap-2 sm:flex-row">
        <p className="text-xs text-[var(--muted-foreground)]">
          Personal Finance Workspace
        </p>
        <p className="text-xs text-[var(--muted-foreground)]">
          &copy; {new Date().getFullYear()} All rights reserved.
        </p>
      </div>
    </footer>
  )
}
