import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

type SidebarMode = 'expanded' | 'collapsed'

type SidebarStateContextValue = {
  mode: SidebarMode
  isCollapsed: boolean
  toggleSidebar: () => void
  setMode: (mode: SidebarMode) => void
}

const SidebarStateContext = createContext<SidebarStateContextValue | null>(null)

const STORAGE_KEY = 'finance-sidebar-mode'

export function SidebarStateProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<SidebarMode>('expanded')

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored === 'expanded' || stored === 'collapsed') {
      setModeState(stored)
    }
  }, [])

  const value = useMemo(
    () => ({
      mode,
      isCollapsed: mode === 'collapsed',
      toggleSidebar: () => {
        setModeState((current) => {
          const next = current === 'expanded' ? 'collapsed' : 'expanded'
          if (typeof window !== 'undefined') {
            window.localStorage.setItem(STORAGE_KEY, next)
          }
          return next
        })
      },
      setMode: (nextMode: SidebarMode) => {
        setModeState(nextMode)
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(STORAGE_KEY, nextMode)
        }
      },
    }),
    [mode]
  )

  return (
    <SidebarStateContext.Provider value={value}>
      {children}
    </SidebarStateContext.Provider>
  )
}

export function useSidebarState() {
  const context = useContext(SidebarStateContext)

  if (!context) {
    throw new Error('useSidebarState must be used within SidebarStateProvider')
  }

  return context
}
