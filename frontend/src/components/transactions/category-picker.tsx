import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Check, ChevronDown, Search } from 'lucide-react'

import { cn } from '#/lib/utils'
import type { Category } from '#/lib/api'

interface CategoryPickerProps {
  value: string
  onValueChange: (value: string) => void
  categories: Category[]
  placeholder?: string
  disabled?: boolean
}

export function CategoryPicker({
  value,
  onValueChange,
  categories,
  placeholder = 'Select category',
  disabled = false,
}: CategoryPickerProps) {
  const [open, setOpen] = useState(false)
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

  // Close on Escape
  useEffect(() => {
    if (!open) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false)
        triggerRef.current?.focus()
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open])

  const available = categories.filter((c) => !c.isArchived)
  const lowerSearch = search.toLowerCase().trim()

  // Hierarchical data
  const parents = available.filter((c) => !c.parentId)
  const childMap = new Map<string, Category[]>()
  available
    .filter((c) => c.parentId)
    .forEach((c) => {
      const arr = childMap.get(c.parentId!) ?? []
      arr.push(c)
      childMap.set(c.parentId!, arr)
    })

  // Flat filtered list for search mode
  const flatFiltered = lowerSearch
    ? available.filter((c) => c.name.toLowerCase().includes(lowerSearch))
    : []

  const selected = available.find((c) => c.id === value)
  const selectedLabel = selected
    ? `${selected.icon ? `${selected.icon} ` : ''}${selected.name}`
    : null

  function handleSelect(id: string) {
    onValueChange(id)
    setOpen(false)
  }

  const dropdownStyle: React.CSSProperties = triggerRect
    ? {
        position: 'fixed',
        top: triggerRect.bottom + 4,
        left: triggerRect.left,
        width: triggerRect.width,
        zIndex: 9999,
      }
    : { position: 'fixed', top: 0, left: 0, width: 0, zIndex: 9999 }

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
            {/* Search input */}
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

            {/* Category list */}
            <div className="max-h-52 overflow-y-auto p-1">
              {lowerSearch ? (
                flatFiltered.length > 0 ? (
                  flatFiltered.map((cat) => (
                    <CategoryOption
                      key={cat.id}
                      cat={cat}
                      isSelected={value === cat.id}
                      isChild={Boolean(cat.parentId)}
                      onSelect={handleSelect}
                    />
                  ))
                ) : (
                  <p className="py-5 text-center text-sm text-muted-foreground">
                    No results for &ldquo;{search}&rdquo;
                  </p>
                )
              ) : parents.length > 0 ? (
                parents.map((parent) => (
                  <div key={parent.id}>
                    <CategoryOption
                      cat={parent}
                      isSelected={value === parent.id}
                      isChild={false}
                      onSelect={handleSelect}
                    />
                    {(childMap.get(parent.id) ?? []).map((child) => (
                      <CategoryOption
                        key={child.id}
                        cat={child}
                        isSelected={value === child.id}
                        isChild={true}
                        onSelect={handleSelect}
                      />
                    ))}
                  </div>
                ))
              ) : (
                <p className="py-5 text-center text-sm text-muted-foreground">
                  No categories available
                </p>
              )}
            </div>
          </div>,
          document.body
        )}
    </>
  )
}

interface CategoryOptionProps {
  cat: Category
  isSelected: boolean
  isChild: boolean
  onSelect: (id: string) => void
}

function CategoryOption({
  cat,
  isSelected,
  isChild,
  onSelect,
}: CategoryOptionProps) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={isSelected}
      onClick={() => onSelect(cat.id)}
      className={cn(
        'relative flex w-full items-center rounded-sm py-1.5 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground',
        isChild ? 'pl-7' : 'pl-2',
        isSelected && 'bg-accent text-accent-foreground'
      )}
    >
      {isChild && (
        <span className="absolute left-2.5 text-xs text-muted-foreground">
          ↳
        </span>
      )}
      <span className="flex-1 truncate text-left">
        {cat.icon ? `${cat.icon} ` : ''}
        {cat.name}
      </span>
      {isSelected && <Check className="ml-1 h-4 w-4 shrink-0" />}
    </button>
  )
}
