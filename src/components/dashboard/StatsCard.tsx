import type { ReactNode } from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatsCardProps {
  icon: ReactNode
  label: string
  value: string
  subtext?: string
  trend?: 'up' | 'down' | 'neutral'
}

export function StatsCard({ icon, label, value, subtext, trend }: StatsCardProps) {
  return (
    <div
      className={cn(
        'group rounded-xl border border-border bg-card p-4',
        'transition-all duration-200',
        'hover:-translate-y-0.5 hover:shadow-md hover:border-border/80',
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex size-9 items-center justify-center rounded-lg bg-muted/60 text-muted-foreground">
          {icon}
        </div>
        {trend && trend !== 'neutral' && (
          <div
            className={cn(
              'flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium',
              trend === 'up'
                ? 'bg-chart-2/15 text-chart-2'
                : 'bg-destructive/15 text-destructive',
            )}
          >
            {trend === 'up' ? (
              <TrendingUp className="size-3" />
            ) : (
              <TrendingDown className="size-3" />
            )}
          </div>
        )}
      </div>

      <div className="mt-3 space-y-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-xl font-semibold tracking-tight text-foreground">
          {value}
        </p>
        {subtext && (
          <p className="text-xs text-muted-foreground/80">{subtext}</p>
        )}
      </div>
    </div>
  )
}
