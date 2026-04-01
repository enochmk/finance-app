import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronRight,
  Search,
} from 'lucide-react'

import { cn } from '#/lib/utils'
import type { Category } from '#/lib/api'

interface CategoryPickerProps {
  value: string
  onValueChange: (value: string) => void
  categories: Category[]
  placeholder?: string
  disabled?: boolean
}

type View = 'parents' | 'children'

export function CategoryPicker({
  value,
  onValueChange,
  categories,
  placeholder = 'Select category',
  disabled = false,
}: CategoryPickerProps) {
  const [open, setOpen] = useState(false)
  const [view, setView] = useState<View>('parents')
  const [activeParent, setActiveParent] = useState<Category | null>(null)
  const [search, setSearch] = useState('')
  const triggerRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const [triggerRect, setTriggerRect] = useState<DOMRect | null>(null)

  const updateRect = useCallback(() => {
    if (triggerRef.current) {
      setTriggerRect(triggerRef.current.getBoundingClientRect())
    }
  }, [])

  useEffect(() => {
    if (open) {
      updateRect()
      requestAnimationFrame(() => searchRef.current?.focus())
    } else {
      setSearch('')
      setView('parents')
      setActiveParent(null)
    }
  }, [open, updateRect])

  // Close on outside pointer-down
  useEffect(() => {
    if (!open) return
    function handlePointerDown(e: PointerEvent) {
      if (
        triggerRef.current?.contains(e.target as Node) ||
        dropdownRef.current?.contains(e.target as Node)
      )
        return
      setOpen(false)
    }
    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [open])

  // Close on Escape; go back on Escape when in children view
  useEffect(() => {
    if (!open) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        if (view === 'children') {
          setView('parents')
          setActiveParent(null)
        } else {
          setOpen(false)
          triggerRef.current?.focus()
        }
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, view])

  const available = categories.filter((c) => !c.isArchived)
  const lowerSearch = search.toLowerCase().trim()

  // Build hierarchical maps
  const parents = available.filter((c) => !c.parentId)
  const childMap = new Map<string, Category[]>()
  available
    .filter((c) => c.parentId)
    .forEach((c) => {
      const arr = childMap.get(c.parentId!) ?? []
      arr.push(c)
      childMap.set(c.parentId!, arr)
    })

  // Flat filtered list for search mode — includes parent breadcrumb for children
  const flatFiltered = lowerSearch
    ? available.filter((c) => {
        const nameMatch = c.name.toLowerCase().includes(lowerSearch)
        const parentName = c.parentId
          ? (available.find((p) => p.id === c.parentId)?.name ?? '')
          : ''
        return nameMatch || parentName.toLowerCase().includes(lowerSearch)
      })
    : []

  // Resolve display label for the trigger button
  const selected = available.find((c) => c.id === value)
  const selectedLabel = (() => {
    if (!selected) return null
    const icon = selected.icon ? `${selected.icon} ` : ''
    if (selected.parentId) {
      const parentName =
        selected.parent?.name ??
        available.find((p) => p.id === selected.parentId)?.name ??
        ''
      return `${icon}${parentName} › ${selected.name}`
    }
    return `${icon}${selected.name}`
  })()

  function handleSelect(id: string) {
    onValueChange(id)
    setOpen(false)
  }

  function handleParentClick(parent: Category) {
    const children = childMap.get(parent.id) ?? []
    if (children.length === 0) {
      handleSelect(parent.id)
    } else {
      setActiveParent(parent)
      setView('children')
    }
  }

  function handleBack() {
    setView('parents')
    setActiveParent(null)
  }

  const dropdownStyle: React.CSSProperties = triggerRect
    ? {
        position: 'fixed',
        top: triggerRect.bottom + 4,
        left: triggerRect.left,
        width: Math.max(triggerRect.width, 240),
        zIndex: 9999,
      }
    : { position: 'fixed', top: 0, left: 0, width: 0, zIndex: 9999 }

  const isSearching = lowerSearch.length > 0

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'flex h-10 w-full items-center justify-between rounded-md border border-input bg-card px-3 py-2 text-sm shadow-sm outline-none focus:ring-2 focus:ring-ring',
          disabled && 'cursor-not-allowed opacity-50'
        )}
      >
        <span
          className={cn(
            'truncate text-left',
            !selectedLabel && 'text-muted-foreground'
          )}
        >
          {selectedLabel ?? placeholder}
        </span>
        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-60" />
      </button>

      {open &&
        triggerRect &&
        createPortal(
          <div
            ref={dropdownRef}
            role="listbox"
            style={dropdownStyle}
            className="overflow-hidden rounded-md border border-border bg-popover text-popover-foreground shadow-md"
          >
            {/* Search input — always visible */}
            <div className="flex items-center border-b border-border px-3 py-1.5">
              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search categories…"
                className="flex h-8 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>

            {/* Children view header */}
            {!isSearching && view === 'children' && activeParent && (
              <div className="flex items-center border-b border-border">
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                >
                  <ArrowLeft className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">
                    {activeParent.icon ? `${activeParent.icon} ` : ''}
                    {activeParent.name}
                  </span>
                </button>
              </div>
            )}

            {/* Category list */}
            <div className="max-h-56 overflow-y-auto p-1">
              {isSearching ? (
                /* ── Search results ── */
                flatFiltered.length > 0 ? (
                  flatFiltered.map((cat) => {
                    const parentName = cat.parentId
                      ? (available.find((p) => p.id === cat.parentId)?.name ??
                        '')
                      : null
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        role="option"
                        aria-selected={value === cat.id}
                        onClick={() => handleSelect(cat.id)}
                        className={cn(
                          'relative flex w-full items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground',
                          value === cat.id && 'bg-accent text-accent-foreground'
                        )}
                      >
                        <span className="flex-1 truncate text-left">
                          {parentName ? (
                            <>
                              <span className="text-muted-foreground">
                                {parentName} ›{' '}
                              </span>
                              {cat.icon ? `${cat.icon} ` : ''}
                              {cat.name}
                            </>
                          ) : (
                            <>
                              {cat.icon ? `${cat.icon} ` : ''}
                              {cat.name}
                            </>
                          )}
                        </span>
                        {value === cat.id && (
                          <Check className="ml-1 h-4 w-4 shrink-0" />
                        )}
                      </button>
                    )
                  })
                ) : (
                  <p className="py-5 text-center text-sm text-muted-foreground">
                    No results for &ldquo;{search}&rdquo;
                  </p>
                )
              ) : view === 'parents' ? (
                /* ── Parents view ── */
                parents.length > 0 ? (
                  parents.map((parent) => {
                    const children = childMap.get(parent.id) ?? []
                    const hasChildren = children.length > 0
                    return (
                      <button
                        key={parent.id}
                        type="button"
                        role="option"
                        aria-selected={value === parent.id}
                        onClick={() => handleParentClick(parent)}
                        className={cn(
                          'relative flex w-full items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground',
                          value === parent.id &&
                            'bg-accent text-accent-foreground'
                        )}
                      >
                        <span className="flex-1 truncate text-left">
                          {parent.icon ? `${parent.icon} ` : ''}
                          {parent.name}
                        </span>
                        {!hasChildren && value === parent.id && (
                          <Check className="ml-1 h-4 w-4 shrink-0" />
                        )}
                        {hasChildren && (
                          <ChevronRight className="ml-1 h-4 w-4 shrink-0 opacity-50" />
                        )}
                      </button>
                    )
                  })
                ) : (
                  <p className="py-5 text-center text-sm text-muted-foreground">
                    No categories available
                  </p>
                )
              ) : (
                /* ── Children view ── */
                activeParent && (
                  <>
                    {/* "Use parent directly" row */}
                    <button
                      type="button"
                      role="option"
                      aria-selected={value === activeParent.id}
                      onClick={() => handleSelect(activeParent.id)}
                      className={cn(
                        'relative flex w-full items-center rounded-sm px-2 py-1.5 text-sm italic text-muted-foreground outline-none hover:bg-accent hover:text-accent-foreground',
                        value === activeParent.id &&
                          'bg-accent text-accent-foreground'
                      )}
                    >
                      <span className="flex-1 truncate text-left">
                        Use &ldquo;{activeParent.name}&rdquo; directly
                      </span>
                      {value === activeParent.id && (
                        <Check className="ml-1 h-4 w-4 shrink-0" />
                      )}
                    </button>

                    {/* Children */}
                    {(childMap.get(activeParent.id) ?? []).map((child) => (
                      <button
                        key={child.id}
                        type="button"
                        role="option"
                        aria-selected={value === child.id}
                        onClick={() => handleSelect(child.id)}
                        className={cn(
                          'relative flex w-full items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground',
                          value === child.id &&
                            'bg-accent text-accent-foreground'
                        )}
                      >
                        <span className="flex-1 truncate text-left">
                          {child.icon ? `${child.icon} ` : ''}
                          {child.name}
                        </span>
                        {value === child.id && (
                          <Check className="ml-1 h-4 w-4 shrink-0" />
                        )}
                      </button>
                    ))}
                  </>
                )
              )}
            </div>
          </div>,
          document.body
        )}
    </>
  )
}
