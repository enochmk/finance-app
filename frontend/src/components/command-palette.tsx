import { useNavigate } from '@tanstack/react-router'
import {
  DollarSign,
  FolderTree,
  Landmark,
  LayoutDashboard,
  Plus,
  Settings,
  Search,
} from 'lucide-react'
import { useEffect, useState } from 'react'

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '#/components/ui/command'

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  function run(action: () => void) {
    setOpen(false)
    action()
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen} title="Command Palette">
      <CommandInput placeholder="Search pages or run a quick action..." />
      <CommandList>
        <CommandEmpty>
          <Search className="mx-auto mb-2 size-5 opacity-40" />
          No results found.
        </CommandEmpty>

        <CommandGroup heading="Quick Actions">
          <CommandItem
            onSelect={() =>
              run(
                () =>
                  void navigate({
                    to: '/transactions',
                    search: { create: true },
                  })
              )
            }
          >
            <Plus />
            <span>New Transaction</span>
          </CommandItem>
          <CommandItem
            onSelect={() =>
              run(
                () =>
                  void navigate({
                    to: '/settings/accounts',
                    search: { create: true },
                  })
              )
            }
          >
            <Plus />
            <span>New Account</span>
          </CommandItem>
          <CommandItem
            onSelect={() =>
              run(
                () =>
                  void navigate({
                    to: '/settings/categories',
                    search: { create: true },
                  })
              )
            }
          >
            <Plus />
            <span>New Category</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Navigation">
          <CommandItem
            onSelect={() => run(() => void navigate({ to: '/dashboard' }))}
          >
            <LayoutDashboard />
            <span>Dashboard</span>
            <CommandShortcut>⌘D</CommandShortcut>
          </CommandItem>
          <CommandItem
            onSelect={() => run(() => void navigate({ to: '/transactions' }))}
          >
            <DollarSign />
            <span>Transactions</span>
          </CommandItem>
          <CommandItem
            onSelect={() => run(() => void navigate({ to: '/settings' }))}
          >
            <Settings />
            <span>Settings</span>
          </CommandItem>
          <CommandItem
            onSelect={() =>
              run(() => void navigate({ to: '/settings/accounts' }))
            }
          >
            <Landmark />
            <span>Accounts</span>
          </CommandItem>
          <CommandItem
            onSelect={() =>
              run(() => void navigate({ to: '/settings/categories' }))
            }
          >
            <FolderTree />
            <span>Categories</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
