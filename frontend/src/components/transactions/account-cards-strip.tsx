import { GripVertical } from 'lucide-react'

import type { Account } from '#/lib/api'
import { formatCurrency } from '#/lib/finance'

import { getAccountIcon } from './helpers'

interface AccountCardsStripProps {
  accounts: Account[]
  selectedAccountId: string
  onSelect: (id: string) => void
  onDragStart: (e: React.DragEvent<HTMLButtonElement>, id: string) => void
  onDragOver: (e: React.DragEvent<HTMLButtonElement>, id: string) => void
  onDrop: (e: React.DragEvent<HTMLButtonElement>, id: string) => void
}

export function AccountCardsStrip({
  accounts,
  selectedAccountId,
  onSelect,
  onDragStart,
  onDragOver,
  onDrop,
}: AccountCardsStripProps) {
  if (accounts.length === 0) return null

  return (
    <div className="mb-6">
      <div className="flex gap-3 overflow-x-auto pb-2">
        {accounts.map((account) => {
          const AccountIcon = getAccountIcon(account.icon)
          const isSelected = selectedAccountId === account.id
          const accentColor = account.color ?? '#176b6c'
          return (
            <button
              key={account.id}
              type="button"
              draggable
              onDragStart={(e) => onDragStart(e, account.id)}
              onDragOver={(e) => onDragOver(e, account.id)}
              onDrop={(e) => onDrop(e, account.id)}
              onClick={() => onSelect(account.id)}
              className="shrink-0 w-44 rounded-xl border cursor-pointer transition-all text-left p-4 select-none"
              style={
                isSelected
                  ? {
                      borderColor: accentColor,
                      boxShadow: `0 0 0 2px ${accentColor}55, 0 4px 16px ${accentColor}33`,
                      background: `${accentColor}12`,
                    }
                  : {
                      borderColor: 'var(--border)',
                      background: 'var(--card)',
                      borderLeftColor: accentColor,
                      borderLeftWidth: 3,
                    }
              }
            >
              <div className="flex items-center justify-between mb-3">
                <AccountIcon
                  className="h-5 w-5"
                  style={{ color: accentColor }}
                />
                <GripVertical className="h-4 w-4 text-muted-foreground opacity-40" />
              </div>
              <p className="text-sm font-semibold text-foreground truncate mb-1">
                {account.name}
              </p>
              <p
                className={`text-lg font-bold ${
                  Number(account.currentBalance) >= 0
                    ? 'text-green-600'
                    : 'text-red-600'
                }`}
              >
                {formatCurrency(account.currentBalance, account.currency)}
              </p>
            </button>
          )
        })}
      </div>
    </div>
  )
}
