import { Link } from '@tanstack/react-router'
import { RefreshCw, SlidersHorizontal } from 'lucide-react'

import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Card, CardContent } from '#/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '#/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import {
  COMPARE_BY_OPTIONS,
  DASHBOARD_PRESET_OPTIONS,
  type DashboardCompareByOption,
  type DashboardPresetOption,
} from '#/lib/dashboard'
import { cn } from '#/lib/utils'

interface DashboardControlsProps {
  accounts: { id: string; name: string }[]
  selectedAccountId: string
  selectedPreset: DashboardPresetOption
  compareBy: DashboardCompareByOption
  isLoading: boolean
  isRefreshing: boolean
  activePeriodLabel: string
  previousPeriodLabel: string
  cadenceLabel: string
  onAccountChange: (value: string) => void
  onPresetChange: (value: string) => void
  onCompareByChange: (value: string) => void
  onRefresh: () => void
}

export function DashboardControls({
  accounts,
  selectedAccountId,
  selectedPreset,
  compareBy,
  isLoading,
  isRefreshing,
  activePeriodLabel,
  previousPeriodLabel,
  cadenceLabel,
  onAccountChange,
  onPresetChange,
  onCompareByChange,
  onRefresh,
}: DashboardControlsProps) {
  return (
    <Card className="w-full max-w-2xl">
      <CardContent className="space-y-4 p-6">
        <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Account</p>
            <Select
              value={selectedAccountId}
              onValueChange={onAccountChange}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose account" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-wrap gap-2 md:justify-end">
            <Button
              variant="outline"
              size="icon"
              onClick={onRefresh}
              disabled={isLoading || isRefreshing}
              title="Refresh dashboard"
            >
              <RefreshCw
                className={cn('h-4 w-4', isRefreshing && 'animate-spin')}
              />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <SlidersHorizontal className="h-4 w-4" />
                  Configure
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>Range preset</DropdownMenuLabel>
                <DropdownMenuRadioGroup
                  value={selectedPreset}
                  onValueChange={onPresetChange}
                >
                  {DASHBOARD_PRESET_OPTIONS.map((option) => (
                    <DropdownMenuRadioItem
                      key={option.value}
                      value={option.value}
                    >
                      {option.label}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Trend cadence</DropdownMenuLabel>
                <DropdownMenuRadioGroup
                  value={compareBy}
                  onValueChange={onCompareByChange}
                >
                  {COMPARE_BY_OPTIONS.map((option) => (
                    <DropdownMenuRadioItem
                      key={option.value}
                      value={option.value}
                    >
                      {option.label}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button asChild variant="outline">
              <Link to="/settings/accounts">Manage</Link>
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <Badge variant="outline">{activePeriodLabel}</Badge>
          <Badge variant="outline">{cadenceLabel} trend</Badge>
          <span>Compared with {previousPeriodLabel}</span>
        </div>
      </CardContent>
    </Card>
  )
}
