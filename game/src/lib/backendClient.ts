/**
 * Talks to the same FastAPI backend (server/) the desktop app uses — this
 * lets the game show real backup/cloud/device/earnings data instead of
 * fabricated numbers. Falls back to representative demo data when no
 * connection is configured (or the real one fails), so the game is always
 * playable without requiring the Python server to be running.
 */

export interface BackupStatus {
  total_backups: number
  total_size_gb: number
  storage_saved_gb: number
  last_backup: string | null
}

export interface CloudProviderStatus {
  connected: boolean
  last_sync: string | null
}

export interface CloudStatus {
  providers: Record<string, CloudProviderStatus>
}

export interface DeviceOut {
  id: string
  name: string
  type: string
  status: string
}

export interface EarningsStatus {
  total: number
  ads_watched: number
  note: string
}

export interface BackendData {
  source: 'demo' | 'live'
  backup: BackupStatus
  cloud: CloudStatus
  devices: DeviceOut[]
  earnings: EarningsStatus
  error?: string
}

const CONFIG_KEY = 'backup_cloud_game_connect_v1'

export interface ConnectConfig {
  apiUrl: string
  token: string
}

export function loadConnectConfig(): ConnectConfig | null {
  try {
    const raw = localStorage.getItem(CONFIG_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return parsed?.apiUrl && parsed?.token ? parsed : null
  } catch {
    return null
  }
}

export function saveConnectConfig(cfg: ConnectConfig | null) {
  try {
    if (cfg) localStorage.setItem(CONFIG_KEY, JSON.stringify(cfg))
    else localStorage.removeItem(CONFIG_KEY)
  } catch {
    // localStorage unavailable — connection just won't persist across reloads
  }
}

function demoData(): Omit<BackendData, 'source' | 'error'> {
  const now = new Date()
  const hoursAgo = (h: number) => new Date(now.getTime() - h * 3600_000).toISOString()
  return {
    backup: {
      total_backups: 214,
      total_size_gb: 18.6,
      storage_saved_gb: 9.3,
      last_backup: hoursAgo(0.3),
    },
    cloud: {
      providers: {
        google: { connected: true, last_sync: hoursAgo(2) },
        microsoft: { connected: false, last_sync: null },
      },
    },
    devices: [
      { id: 'demo-desktop', name: 'This desktop', type: 'desktop', status: 'online' },
      { id: 'demo-phone', name: "Zach's Phone", type: 'iphone', status: 'online' },
      { id: 'demo-laptop', name: 'Kitchen Chromebook', type: 'chrome_os', status: 'offline' },
    ],
    earnings: {
      total: 4.35,
      ads_watched: 29,
      note: 'Demo mode — local mock, not redeemable for cash or storage.',
    },
  }
}

async function fetchJson<T>(url: string, token: string): Promise<T> {
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
  if (!res.ok) throw new Error(`${url.replace(/^https?:\/\/[^/]+/, '')} → HTTP ${res.status}`)
  return res.json() as Promise<T>
}

export async function loadBackendData(): Promise<BackendData> {
  const cfg = loadConnectConfig()
  if (!cfg) return { source: 'demo', ...demoData() }

  try {
    const base = cfg.apiUrl.replace(/\/$/, '')
    const [backup, cloud, devicesRes, earnings] = await Promise.all([
      fetchJson<BackupStatus>(`${base}/api/backup/status`, cfg.token),
      fetchJson<CloudStatus>(`${base}/api/cloud/status`, cfg.token),
      fetchJson<{ devices: DeviceOut[] }>(`${base}/api/devices`, cfg.token),
      fetchJson<EarningsStatus>(`${base}/api/ads/earnings`, cfg.token),
    ])
    return { source: 'live', backup, cloud, devices: devicesRes.devices, earnings }
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    return { source: 'demo', ...demoData(), error: `Couldn't reach your live Backup Cloud (${message}) — showing demo data instead.` }
  }
}
