import { useCallback, useEffect, useState, type CSSProperties } from 'react'
import {
  loadDashboard, connectCloud, registerDevice,
  type DashboardData, type Session,
} from '../lib/backendClient'
import { getThisDeviceInfo } from '../lib/deviceInfo'

const PROVIDERS: { key: string; label: string }[] = [
  { key: 'google', label: 'Google Drive' },
  { key: 'microsoft', label: 'OneDrive' },
]

function formatAgo(iso: string | null): string {
  if (!iso) return 'never'
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return new Date(iso).toLocaleDateString()
}

export function Dashboard({ session, onSignOut }: { session: Session; onSignOut: () => void }) {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [registering, setRegistering] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setData(await loadDashboard(session))
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }, [session])

  useEffect(() => {
    refresh()
  }, [refresh])

  async function handleRegisterDevice() {
    setRegistering(true)
    setNotice(null)
    try {
      const info = await getThisDeviceInfo()
      const result = await registerDevice(session, info)
      setNotice(result.message || `Registered as "${info.name}"`)
      await refresh()
    } catch (err) {
      setNotice(err instanceof Error ? err.message : String(err))
    } finally {
      setRegistering(false)
    }
  }

  async function handleConnect(provider: string) {
    setNotice(null)
    try {
      const result = await connectCloud(session, provider)
      setNotice(result.note)
    } catch (err) {
      setNotice(err instanceof Error ? err.message : String(err))
    }
  }

  const dedupPct =
    data && data.backup.total_size_gb > 0
      ? Math.round((data.backup.storage_saved_gb / data.backup.total_size_gb) * 100)
      : 0

  return (
    <div style={styles.root}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Backup Cloud</h1>
          <p style={styles.subtitle}>{session.apiUrl}</p>
        </div>
        <button style={styles.ghostButton} onClick={onSignOut}>Sign out</button>
      </div>

      {loading && !data && <p style={styles.status}>Loading…</p>}
      {error && (
        <div style={styles.errorCard}>
          <p style={styles.error}>{error}</p>
          <button style={styles.retryButton} onClick={refresh}>Retry</button>
        </div>
      )}

      {data && (
        <>
          <div style={styles.statsRow}>
            <div style={styles.statCard}>
              <div style={styles.statLabel}>Backups</div>
              <div style={styles.statValue}>{data.backup.total_backups}</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statLabel}>Stored</div>
              <div style={styles.statValue}>{data.backup.total_size_gb.toFixed(1)} GB</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statLabel}>Deduped</div>
              <div style={styles.statValue}>{dedupPct}%</div>
            </div>
          </div>
          <p style={styles.lastBackup}>Last backup: {formatAgo(data.backup.last_backup)}</p>

          <Section title="Devices">
            {data.devices.length === 0 && <p style={styles.empty}>No devices registered yet.</p>}
            {data.devices.map((d) => (
              <div key={d.id} style={styles.row}>
                <span>{d.name}</span>
                <span style={{ ...styles.badge, ...(d.status === 'online' ? styles.badgeGood : {}) }}>{d.status}</span>
              </div>
            ))}
            <button style={styles.actionButton} onClick={handleRegisterDevice} disabled={registering}>
              {registering ? 'Registering…' : 'Register this device'}
            </button>
          </Section>

          <Section title="Cloud connections">
            {PROVIDERS.map((p) => {
              const status = data.cloud.providers[p.key]
              return (
                <div key={p.key} style={styles.row}>
                  <span>{p.label}</span>
                  {status?.connected ? (
                    <span style={{ ...styles.badge, ...styles.badgeGood }}>synced {formatAgo(status.last_sync)}</span>
                  ) : (
                    <button style={styles.smallButton} onClick={() => handleConnect(p.key)}>Connect</button>
                  )}
                </div>
              )
            })}
          </Section>

          <Section title="Earnings">
            <div style={styles.row}>
              <span>Mock balance</span>
              <span style={styles.badgeGood}>${data.earnings.total.toFixed(2)}</span>
            </div>
            <div style={styles.row}>
              <span>Ad breaks watched</span>
              <span>{data.earnings.ads_watched}</span>
            </div>
            <p style={styles.finePrint}>{data.earnings.note}</p>
          </Section>

          {notice && <p style={styles.notice}>{notice}</p>}
        </>
      )}

      <button style={styles.refreshButton} onClick={refresh} disabled={loading}>
        {loading ? 'Refreshing…' : 'Refresh'}
      </button>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={styles.section}>
      <h2 style={styles.sectionTitle}>{title}</h2>
      {children}
    </div>
  )
}

const styles: Record<string, CSSProperties> = {
  root: {
    height: '100%', overflowY: 'auto', background: '#0a0a0a', color: 'rgba(255,255,255,0.92)',
    fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif', padding: '48px 16px 32px',
  },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  title: { fontSize: 19, margin: 0 },
  subtitle: { margin: '2px 0 0', fontSize: 11, color: 'rgba(255,255,255,0.4)' },
  ghostButton: {
    background: 'rgba(255,255,255,0.06)', border: 'none', color: 'rgba(255,255,255,0.7)',
    fontSize: 12, padding: '7px 12px', borderRadius: 8, cursor: 'pointer',
  },
  status: { fontSize: 13, color: 'rgba(255,255,255,0.55)', textAlign: 'center', marginTop: 40 },
  errorCard: { background: '#241414', border: '1px solid rgba(240,80,80,0.3)', borderRadius: 12, padding: 14, marginBottom: 14 },
  error: { color: '#f0a2a2', fontSize: 13, margin: '0 0 10px' },
  retryButton: { background: '#4f8cff', border: 'none', color: '#fff', padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' },
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 6 },
  statCard: { background: '#14161a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '12px 10px' },
  statLabel: { fontSize: 10.5, color: 'rgba(255,255,255,0.5)' },
  statValue: { fontSize: 18, fontWeight: 700, marginTop: 3 },
  lastBackup: { fontSize: 11, color: 'rgba(255,255,255,0.4)', margin: '4px 2px 18px' },
  section: { background: '#14161a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 14, marginBottom: 14 },
  sectionTitle: { fontSize: 13, fontWeight: 700, margin: '0 0 10px' },
  row: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    fontSize: 13, padding: '8px 0', borderTop: '1px solid rgba(255,255,255,0.06)',
  },
  empty: { fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: '4px 0 8px' },
  badge: { fontSize: 11, color: 'rgba(255,255,255,0.55)', background: 'rgba(255,255,255,0.06)', padding: '3px 8px', borderRadius: 999 },
  badgeGood: { color: '#8fe3b0', background: 'rgba(34,160,107,0.15)' },
  smallButton: { background: '#4f8cff', border: 'none', color: '#fff', fontSize: 11.5, fontWeight: 600, padding: '5px 10px', borderRadius: 8, cursor: 'pointer' },
  actionButton: {
    width: '100%', marginTop: 10, background: 'rgba(79,140,255,0.14)', border: '1px solid rgba(79,140,255,0.4)',
    color: '#8eb4ff', fontSize: 12.5, fontWeight: 600, padding: '9px 0', borderRadius: 10, cursor: 'pointer',
  },
  finePrint: { fontSize: 10.5, color: 'rgba(255,255,255,0.4)', margin: '8px 0 0', lineHeight: 1.4 },
  notice: { fontSize: 12, color: '#ffd166', textAlign: 'center', margin: '4px 0 14px' },
  refreshButton: {
    width: '100%', marginTop: 6, background: 'transparent', border: '1px solid rgba(255,255,255,0.14)',
    color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: 600, padding: '11px 0', borderRadius: 12, cursor: 'pointer',
  },
}
