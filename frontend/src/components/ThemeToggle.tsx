import { MoonStar, SunMedium } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Button } from '#/components/ui/button'

type ThemeMode = 'light' | 'dark'

function getInitialMode(): ThemeMode {
  if (typeof window === 'undefined') {
    return 'light'
  }

  const stored = window.localStorage.getItem('theme')
  if (stored === 'light' || stored === 'dark') {
    return stored
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

function applyThemeMode(mode: ThemeMode) {
  document.documentElement.classList.remove('light', 'dark')
  document.documentElement.classList.add(mode)
  document.documentElement.setAttribute('data-theme', mode)

  document.documentElement.style.colorScheme = mode
}

export default function ThemeToggle() {
  const [mode, setMode] = useState<ThemeMode>('light')

  useEffect(() => {
    const initialMode = getInitialMode()
    setMode(initialMode)
    applyThemeMode(initialMode)
  }, [])

  function toggleMode() {
    const nextMode: ThemeMode = mode === 'light' ? 'dark' : 'light'
    setMode(nextMode)
    applyThemeMode(nextMode)
    window.localStorage.setItem('theme', nextMode)
  }

  const label = `Theme mode: ${mode}. Click to switch to ${mode === 'light' ? 'dark' : 'light'} mode.`

  return (
    <Button
      type="button"
      onClick={toggleMode}
      aria-label={label}
      title={label}
      variant="outline"
      size="sm"
      className="gap-2 rounded-full"
    >
      {mode === 'dark' ? (
        <MoonStar className="h-4 w-4" />
      ) : (
        <SunMedium className="h-4 w-4" />
      )}
      {mode === 'dark' ? 'Dark' : 'Light'}
    </Button>
  )
}
