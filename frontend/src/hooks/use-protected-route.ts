import { useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'

import { useSession } from '#/components/session-provider'

export function useProtectedRoute() {
  const navigate = useNavigate()
  const { isAuthenticated, isLoading } = useSession()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      void navigate({ to: '/sign-in' })
    }
  }, [isAuthenticated, isLoading, navigate])

  return {
    isAuthenticated,
    isLoading,
    isReady: isAuthenticated && !isLoading,
  }
}
