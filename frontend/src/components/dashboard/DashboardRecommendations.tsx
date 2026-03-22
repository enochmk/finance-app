import { AlertTriangle, Lightbulb } from 'lucide-react'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#/components/ui/card'

interface DashboardRecommendationsProps {
  recommendations: string[]
  activePeriodLabel: string
}

export function DashboardRecommendations({
  recommendations,
  activePeriodLabel,
}: DashboardRecommendationsProps) {
  if (recommendations.length === 0) return null

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2 pb-3">
        <div className="rounded-full bg-primary-soft p-2 text-primary">
          <Lightbulb className="h-4 w-4" />
        </div>
        <div>
          <CardTitle>Recommendations</CardTitle>
          <CardDescription>
            Trend-driven insights for {activePeriodLabel}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {recommendations.map((rec, i) => (
            <li
              key={i}
              className="flex items-start gap-2 text-sm text-foreground"
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              {rec}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
