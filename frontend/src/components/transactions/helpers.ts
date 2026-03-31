import {
  Building2,
  CreditCard,
  Heart,
  PiggyBank,
  Smartphone,
  Wallet,
} from 'lucide-react'

export function getAccountIcon(iconName?: string | null) {
  switch (iconName) {
    case 'Building2':
      return Building2
    case 'PiggyBank':
      return PiggyBank
    case 'Heart':
      return Heart
    case 'CreditCard':
      return CreditCard
    case 'Smartphone':
      return Smartphone
    case 'Wallet':
      return Wallet
    default:
      return Building2
  }
}

export function getDarkColor(hex: string): string {
  const clean = hex.replace('#', '')
  const r = parseInt(clean.slice(0, 2), 16)
  const g = parseInt(clean.slice(2, 4), 16)
  const b = parseInt(clean.slice(4, 6), 16)
  return `rgb(${Math.round(r * 0.3)}, ${Math.round(g * 0.3)}, ${Math.round(b * 0.3)})`
}
