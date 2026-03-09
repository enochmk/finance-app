import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import { getMe, login, logoutSeedUser, register, storeAuthToken, type AuthUser } from '#/lib/api'

type SessionContextValue = {
  user: AuthUser | null
  isLoading: boolean
  isAuthenticated: boolean
  signIn: (payload: { email: string; password: string }) => Promise<AuthUser>
  signUp: (payload: {
    name: string
    email: string
    password: string
    currency?: string
  }) => Promise<AuthUser>
  signOut: () => void
  refreshSession: () => Promise<void>
}

const SessionContext = createContext<SessionContextValue | null>(null)

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refreshSession = useCallback(async () => {
    try {
      const me = await getMe()
      setUser(me)
    } catch {
      setUser(null)
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    async function initialize() {
      setIsLoading(true)
      try {
        const me = await getMe()
        if (!cancelled) {
          setUser(me)
        }
      } catch {
        if (!cancelled) {
          setUser(null)
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void initialize()

    return () => {
      cancelled = true
    }
  }, [])

  const value = useMemo<SessionContextValue>(
    () => ({
      user,
      isLoading,
      isAuthenticated: Boolean(user),
      signIn: async (payload) => {
        const auth = await login(payload)
        storeAuthToken(auth.token)
        setUser(auth.user)
        return auth.user
      },
      signUp: async (payload) => {
        const auth = await register(payload)
        storeAuthToken(auth.token)
        setUser(auth.user)
        return auth.user
      },
      signOut: () => {
        logoutSeedUser()
        setUser(null)
      },
      refreshSession: async () => {
        await refreshSession()
      },
    }),
    [user, isLoading, refreshSession]
  )

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function useSession() {
  const context = useContext(SessionContext)

  if (!context) {
    throw new Error('useSession must be used within SessionProvider')
  }

  return context
}
