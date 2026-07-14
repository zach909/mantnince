import {
  HardDrive,
  Database,
  Cloud,
  Smartphone,
  Globe,
  Apple,
  Monitor,
} from 'lucide-react'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { CloudCard } from '@/components/dashboard/CloudCard'
import { BackupTable } from '@/components/dashboard/BackupTable'
import { EarningsPanel } from '@/components/dashboard/EarningsPanel'
import {
  useBackupStats,
  useRecentBackups,
  useEarnings,
  useCloudStatus,
  useDeviceCount,
} from '@/hooks/useBackupData'

function formatGb(val: number) { return `${val.toFixed(1)} GB` }
function formatDedup(rate: number) { return `${rate.toFixed(0)}% dedup` }
function formatSyncDate(iso: string | null): string | null {
  if (!iso) return null
  const diffMin = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000)
  if (diffMin < 1) return 'Just now'
  if (diffMin < 60) return `${diffMin} min ago`
  const diffHrs = Math.floor(diffMin / 60)
  if (diffHrs < 24) return `${diffHrs} hr ago`
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function DashboardPage() {
  const { data: stats } = useBackupStats()
  const { data: backups } = useRecentBackups()
  const { data: earnings } = useEarnings()
  const { data: cloudStatus } = useCloudStatus()
  const { data: deviceCount } = useDeviceCount()

  const connectedClouds = cloudStatus
    ? [cloudStatus.google, cloudStatus.apple, cloudStatus.microsoft].filter((c) => c.connected).length
    : 0

  const handleConnect = (provider: string) => {
    // backendDeveloper: wire up cloud connection flow
    console.info(`Connect ${provider}`)
  }

  const handleWatchAd = () => {
    // backendDeveloper: wire up ad-watching flow
    console.info('Watch ad')
  }

  return (
    <div className="animate-fade-in space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Universal Backup Cloud
        </h1>
        <p className="text-sm text-muted-foreground">
          Dashboard
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard
          icon={<HardDrive className="size-4" />}
          label="Total backups"
          value={stats ? String(stats.totalBackups) : '—'}
          subtext={stats?.lastBackup ? `Last: ${formatSyncDate(stats.lastBackup)}` : undefined}
        />
        <StatsCard
          icon={<Database className="size-4" />}
          label="Storage saved"
          value={stats ? formatGb(stats.storageSavedGb) : '—'}
          subtext={stats ? formatDedup(stats.dedupRate) : undefined}
          trend="up"
        />
        <StatsCard
          icon={<Cloud className="size-4" />}
          label="Connected clouds"
          value={`${connectedClouds}/3`}
          subtext="Providers online"
        />
        <StatsCard
          icon={<Smartphone className="size-4" />}
          label="Devices online"
          value={deviceCount !== undefined ? String(deviceCount) : '—'}
          subtext="Active devices"
        />
      </div>

      {/* Cloud connection panel */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-foreground">
          Cloud connections
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <CloudCard
            provider="google"
            name="Google Drive"
            icon={<Globe className="size-5" />}
            connected={cloudStatus?.google.connected ?? false}
            filesCount={cloudStatus?.google.filesCount ?? 0}
            lastSync={cloudStatus ? formatSyncDate(cloudStatus.google.lastSync) : null}
            onConnect={() => handleConnect('google')}
          />
          <CloudCard
            provider="apple"
            name="iCloud"
            icon={<Apple className="size-5" />}
            connected={cloudStatus?.apple.connected ?? false}
            filesCount={cloudStatus?.apple.filesCount ?? 0}
            lastSync={cloudStatus ? formatSyncDate(cloudStatus.apple.lastSync) : null}
            onConnect={() => handleConnect('apple')}
          />
          <CloudCard
            provider="microsoft"
            name="OneDrive"
            icon={<Monitor className="size-5" />}
            connected={cloudStatus?.microsoft.connected ?? false}
            filesCount={cloudStatus?.microsoft.filesCount ?? 0}
            lastSync={cloudStatus ? formatSyncDate(cloudStatus.microsoft.lastSync) : null}
            onConnect={() => handleConnect('microsoft')}
          />
        </div>
      </div>

      {/* Backup activity + Earnings (side-by-side on wide screens) */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_320px]">
        <div>
          <h2 className="mb-3 text-sm font-semibold text-foreground">
            Recent backup captures
          </h2>
          <BackupTable backups={backups ?? []} />
        </div>
        <div>
          <h2 className="mb-3 text-sm font-semibold text-foreground">
            Earnings
          </h2>
          <EarningsPanel
            earnings={earnings ?? null}
            onWatchAd={handleWatchAd}
          />
        </div>
      </div>
    </div>
  )
}