import { DollarSign, Play, TrendingUp, HardDrive } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { AdEarnings } from '@/types/backup'

interface EarningsPanelProps {
  earnings: AdEarnings | null
  onWatchAd: () => void
}

interface MetricRowProps {
  icon: React.ReactNode
  label: string
  value: string
}

function MetricRow({ icon, label, value }: MetricRowProps) {
  return (
    <div className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
      <span className="flex items-center gap-2 text-xs text-muted-foreground">
        {icon}
        {label}
      </span>
      <span className="text-xs font-medium text-foreground tabular-nums">{value}</span>
    </div>
  )
}

export function EarningsPanel({ earnings, onWatchAd }: EarningsPanelProps) {
  const hasEarnings = earnings !== null

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-2.5">
        <div className="flex size-9 items-center justify-center rounded-lg bg-chart-5/15 text-chart-5">
          <DollarSign className="size-4" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">Ad earnings</p>
          <p className="text-xs text-muted-foreground">
            {hasEarnings ? `${earnings.adsWatched} ads watched` : 'Start earning'}
          </p>
        </div>
      </div>

      {hasEarnings && (
        <div className="mt-4 divide-y divide-border/60">
          <MetricRow
            icon={<DollarSign className="size-3.5" />}
            label="Total earned"
            value={`$${earnings.totalEarned.toFixed(2)}`}
          />
          <MetricRow
            icon={<HardDrive className="size-3.5" />}
            label="Storage earned"
            value={`${earnings.storageEarnedGb.toFixed(1)} GB`}
          />
          <MetricRow
            icon={<TrendingUp className="size-3.5" />}
            label="Cash available"
            value={`$${earnings.cashAvailable.toFixed(2)}`}
          />
        </div>
      )}

      {!hasEarnings && (
        <p className="mt-4 text-xs text-muted-foreground/70 leading-relaxed">
          Watch short ads to earn free storage for your backups. No purchase required.
        </p>
      )}

      <Button
        variant="default"
        size="sm"
        onClick={onWatchAd}
        className="mt-4 w-full gap-2 text-xs font-medium"
      >
        <Play className="size-3.5" />
        Watch ad to earn storage
      </Button>
    </div>
  )
}
