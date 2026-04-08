import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { useSession } from '#/components/session-provider'
import { Alert, AlertDescription, AlertTitle } from '#/components/ui/alert'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#/components/ui/card'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'

export const Route = createFileRoute('/sign-in')({
  component: SignInPage,
})

function SignInPage() {
  const navigate = useNavigate()
  const { isAuthenticated, isLoading, signIn, signUp } = useSession()
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [form, setForm] = useState({
    name: '',
    email: 'dev@budget.local',
    password: 'dev-password-123',
  })

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      void navigate({ to: '/dashboard' })
    }
  }, [isAuthenticated, isLoading, navigate])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      if (mode === 'sign-in') {
        await signIn({ email: form.email, password: form.password })
        toast.success('Signed in successfully')
      } else {
        await signUp({
          name: form.name,
          email: form.email,
          password: form.password,
        })
        toast.success('Account created successfully')
      }

      await navigate({ to: '/dashboard' })
    } catch (submitError) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : 'Unable to complete authentication.'

      setError(message)
      toast.error('Authentication failed', {
        description: message,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10 lg:px-8">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <Badge variant="secondary" className="mb-3 w-fit">
            Finance access
          </Badge>
          <CardTitle className="display-title text-4xl">
            {mode === 'sign-in'
              ? 'Sign in to your workspace'
              : 'Create a finance workspace'}
          </CardTitle>
          <CardDescription>
            Use the seeded dev account or create a new profile for your personal
            finance admin panel.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <Alert variant="destructive" className="mb-6">
              <AlertTitle>Authentication failed</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === 'sign-up' ? (
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  required
                />
              </div>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    email: event.target.value,
                  }))
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={form.password}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    password: event.target.value,
                  }))
                }
                required
              />
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button type="submit" className="flex-1" disabled={isSubmitting}>
                {isSubmitting
                  ? mode === 'sign-in'
                    ? 'Signing in...'
                    : 'Creating account...'
                  : mode === 'sign-in'
                    ? 'Sign in'
                    : 'Create account'}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setMode((current) =>
                    current === 'sign-in' ? 'sign-up' : 'sign-in'
                  )
                  setError(null)
                }}
              >
                {mode === 'sign-in' ? 'Need an account?' : 'Have an account?'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
