import { useState, useEffect, useCallback } from 'react'
import { HardDrive, Database, Shield, Download, RefreshCw, FileText, Activity, Gamepad2, AlertTriangle } from 'lucide-react'
import { PlayroomWall } from './components/PlayroomWall'

interface Capture {
  id: string
  filename: string
  url: string
  size: number
  saved: number
  duplicate: boolean
  risky?: boolean
  date: string
}

interface Stats {
  totalBackups: number
  totalSizeGb: string
  savedGb: string
  dedupRate: number
  lastBackup: string | null
  recentCaptures: Capture[]
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0)} ${units[i]}`
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  const now = new Date()
  const diffMin = Math.floor((now.getTime() - d.getTime()) / 60000)
  if (diffMin < 1) return 'Just now'
  if (diffMin < 60) return `${diffMin}m ago`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `${diffH}h ago`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function StatRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 first:pt-0 last:pb-0">
      <span className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
        {icon}
        {label}
      </span>
      <span className="text-xs font-medium text-[var(--color-text)] tabular-nums">{value}</span>
    </div>
  )
}

type View = 'stats' | 'playroom'

function TabBar({ view, onChange }: { view: View; onChange: (v: View) => void }) {
  const tabs: { id: View; label: string; icon: React.ReactNode }[] = [
    { id: 'stats', label: 'Stats', icon: <Shield className="w-3.5 h-3.5" /> },
    { id: 'playroom', label: 'Playroom', icon: <Gamepad2 className="w-3.5 h-3.5" /> },
  ]
  return (
    <div className="flex gap-1 p-1 rounded-[var(--radius-md)] bg-white/5">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs font-medium rounded-[var(--radius-sm)] transition-colors ${
            view === tab.id
              ? 'bg-[var(--color-accent)] text-white'
              : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
          }`}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  )
}

function StatsView() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = useCallback(() => {
    setLoading(true)
    setError(null)
    chrome.runtime.sendMessage({ type: 'GET_STATS' }, (res) => {
      if (chrome.runtime.lastError) {
        setError(chrome.runtime.lastError.message ?? 'Unknown error')
        setLoading(false)
        return
      }
      if (res?.error) {
        setError(res.error)
        setLoading(false)
        return
      }
      setStats(res?.data || null)
      setLoading(false)
    })
  }, [])

  useEffect(() => { fetchStats() }, [fetchStats])

  const savedPercent = stats && stats.totalBackups > 0
    ? Math.round((parseFloat(stats.savedGb) / parseFloat(stats.totalSizeGb)) * 100)
    : 0

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="flex flex-col items-center gap-2">
          <div className="w-7 h-7 rounded-full border-2 border-white/10 border-t-[var(--color-accent)] animate-spin" />
          <span className="text-xs text-[var(--color-text-muted)]">Loading backups...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-48 gap-3 text-center">
        <Activity className="w-8 h-8 text-[var(--color-red)] opacity-60" />
        <p className="text-sm text-[var(--color-red)]">Connection error</p>
        <p className="text-xs text-[var(--color-text-muted)]">{error}</p>
        <button
          onClick={fetchStats}
          className="mt-2 px-4 py-1.5 text-xs font-medium rounded-[var(--radius-md)] bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] transition-colors"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-sm font-semibold text-[var(--color-text)]">Backup Cloud</h1>
          <p className="text-xs text-[var(--color-text-muted)]">
            {stats ? `${stats.totalBackups} captures` : 'No captures'}
          </p>
        </div>
        <button
          onClick={fetchStats}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-[var(--radius-sm)] bg-white/5 text-[var(--color-text-muted)] hover:bg-white/10 hover:text-[var(--color-text)] transition-colors"
        >
          <RefreshCw className="w-3 h-3" />
          Refresh
        </button>
      </div>

      {/* Stats cards */}
      {stats && (
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-[var(--radius-md)] bg-[var(--color-surface)] border border-[var(--color-border)] p-3">
            <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)] mb-1">
              <HardDrive className="w-3.5 h-3.5" />
              Total saved
            </div>
            <div className="text-lg font-semibold tabular-nums">{stats.savedGb} GB</div>
            <div className="text-xs text-[var(--color-text-muted)] mt-0.5">{savedPercent}% dedup</div>
          </div>
          <div className="rounded-[var(--radius-md)] bg-[var(--color-surface)] border border-[var(--color-border)] p-3">
            <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)] mb-1">
              <Database className="w-3.5 h-3.5" />
              Total size
            </div>
            <div className="text-lg font-semibold tabular-nums">{stats.totalSizeGb} GB</div>
            <div className="text-xs text-[var(--color-text-muted)] mt-0.5">{stats.totalBackups} files</div>
          </div>
        </div>
      )}

      {/* Recent captures */}
      {stats && stats.recentCaptures && stats.recentCaptures.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold text-[var(--color-text)] mb-2 flex items-center gap-1.5">
            <FileText className="w-3 h-3 text-[var(--color-text-muted)]" />
            Recent captures
          </h2>
          <div className="rounded-[var(--radius-md)] bg-[var(--color-surface)] border border-[var(--color-border)] divide-y divide-[var(--color-border)] overflow-hidden">
            {stats.recentCaptures.map((c) => (
              <div key={c.id} className="flex items-center gap-2 px-3 py-2.5 hover:bg-white/[0.03] transition-colors">
                <div className={`flex-shrink-0 w-1.5 h-1.5 rounded-full ${c.duplicate ? 'bg-[var(--color-green)]' : 'bg-[var(--color-accent)]'}`} />
                <div className="flex-1 min-w-0">
                  <p className="flex items-center gap-1 text-xs text-[var(--color-text)] truncate">
                    {c.risky && (
                      <AlertTriangle
                        className="w-3 h-3 shrink-0 text-[var(--color-yellow)]"
                        aria-label="Captured from a page flagged by the local risk heuristic"
                      />
                    )}
                    <span className="truncate">{c.filename}</span>
                  </p>
                  <p className="text-[10px] text-[var(--color-text-muted)]">{formatDate(c.date)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs tabular-nums text-[var(--color-text)]">{formatBytes(c.size)}</p>
                  {c.duplicate ? (
                    <span className="text-[10px] text-[var(--color-green)] font-medium">Deduped</span>
                  ) : (
                    <span className="text-[10px] text-[var(--color-text-muted)]">New</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {(!stats || stats.totalBackups === 0) && (
        <div className="flex flex-col items-center justify-center py-8 gap-2">
          <Shield className="w-8 h-8 text-[var(--color-text-muted)] opacity-30" />
          <p className="text-xs text-[var(--color-text-muted)]">No backups captured yet</p>
          <p className="text-[10px] text-[var(--color-text-muted)] opacity-70 text-center max-w-[240px]">
            Downloads will appear here automatically. The extension captures every download via URL-based deduplication.
          </p>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-[10px] text-[var(--color-text-muted)]">
        <span>URL-based dedup active</span>
        <span className="flex items-center gap-1">
          <Download className="w-3 h-3" />
          Monitoring downloads
        </span>
      </div>
    </div>
  )
}

export default function App() {
  const [view, setView] = useState<View>('stats')

  return (
    <div className="p-4 space-y-3">
      <TabBar view={view} onChange={setView} />
      {view === 'stats' ? <StatsView /> : <PlayroomWall />}
    </div>
  )
}
