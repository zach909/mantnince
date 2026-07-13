import type { ReactNode } from 'react'
import { RefreshCw, Shield, Plus, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface CloudCardProps {
  provider: 'google' | 'apple' | 'microsoft'
  name: string
  icon: ReactNode
  connected: boolean
  filesCount: number
  lastSync: string | null
  onConnect: () => void
}

export function CloudCard({
  name,
  icon,
  connected,
  filesCount,
  lastSync,
  onConnect,
}: CloudCardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-border bg-card p-5',
        'transition-all duration-200',
        'hover:-translate-y-0.5 hover:shadow-md hover:border-border/80',
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            'flex size-10 items-center justify-center rounded-lg',
            connected ? 'bg-chart-4/15 text-chart-4' : 'bg-muted/60 text-muted-foreground',
          )}
        >
          {icon}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{name}</p>
          <p
            className={cn(
              'text-xs font-medium',
              connected ? 'text-chart-4' : 'text-muted-foreground',
            )}
          >
            {connected ? 'Connected' : 'Not connected'}
          </p>
        </div>

        <div
          className={cn(
            'size-2.5 rounded-full',
            connected ? 'bg-chart-4 shadow-[0_0_6px_var(--color-chart-4)]' : 'bg-muted-foreground/30',
          )}
        />
      </div>

      {connected && (
        <div className="mt-4 space-y-2 border-t border-border pt-4">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <Shield className="size-3" />
              Files synced
            </span>
            <span className="font-medium text-foreground tabular-nums">
              {filesCount.toLocaleString()}
            </span>
          </div>

          {lastSync && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <RefreshCw className="size-3" />
                Last sync
              </span>
              <span className="font-medium text-foreground">{lastSync}</span>
            </div>
          )}

          <Button
            variant="ghost"
            size="sm"
            className="mt-2 w-full justify-start gap-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <ExternalLink className="size-3" />
            Browse files
          </Button>
        </div>
      )}

      {!connected && (
        <Button
          variant="outline"
          size="sm"
          onClick={onConnect}
          className="mt-4 w-full gap-2 text-xs"
        >
          <Plus className="size-3" />
          Connect {name}
        </Button>
      )}
    </div>
  )
}
