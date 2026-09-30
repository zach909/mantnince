/**
 * Talks to the same stdlib HTTP server (server/) the desktop app and the
 * game use. Response shapes are copied verbatim from server/schemas.py —
 * see game/src/lib/backendClient.ts for the sibling copy (each sub-project
 * is independent, no shared package, per this repo's structure).
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

export interface Session {
  apiUrl: string
  token: string
  userId: string
}

const SESSION_KEY = 'backup_cloud_mobile_session_v1'

export function loadSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return parsed?.apiUrl && parsed?.token ? parsed : null
  } catch {
    return null
  }
}

export function saveSession(session: Session | null) {
  try {
    if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session))
    else localStorage.removeItem(SESSION_KEY)
  } catch {
    // localStorage unavailable — session just won't persist across launches
  }
}

function base(apiUrl: string) {
  return apiUrl.replace(/\/$/, '')
}

async function parseError(res: Response): Promise<string> {
  try {
    const body = await res.json()
    return body?.detail || `HTTP ${res.status}`
  } catch {
    return `HTTP ${res.status}`
  }
}

export async function register(apiUrl: string, username: string, email: string, password: string): Promise<void> {
  const res = await fetch(`${base(apiUrl)}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password }),
  })
  if (!res.ok) throw new Error(await parseError(res))
}

export async function login(apiUrl: string, username: string, password: string): Promise<Session> {
  const res = await fetch(`${base(apiUrl)}/api/auth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ username, password }),
  })
  if (!res.ok) throw new Error(await parseError(res))
  const data = await res.json()
  return { apiUrl, token: data.token, userId: data.user_id }
}

async function authedFetch<T>(session: Session, path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${base(session.apiUrl)}${path}`, {
    ...options,
    headers: { ...options.headers, Authorization: `Bearer ${session.token}` },
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json() as Promise<T>
}

export function getBackupStatus(session: Session) {
  return authedFetch<BackupStatus>(session, '/api/backup/status')
}
export function getCloudStatus(session: Session) {
  return authedFetch<CloudStatus>(session, '/api/cloud/status')
}
export async function getDevices(session: Session) {
  const res = await authedFetch<{ devices: DeviceOut[] }>(session, '/api/devices')
  return res.devices
}
export function getEarnings(session: Session) {
  return authedFetch<EarningsStatus>(session, '/api/ads/earnings')
}
export function connectCloud(session: Session, provider: string) {
  return authedFetch<{ connected: boolean; provider: string; note: string }>(session, '/api/cloud/connect', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ provider }),
  })
}
export function registerDevice(session: Session, deviceInfo: { name: string; type: string; platform: string; os_version: string }) {
  return authedFetch<{ device_id: string; message: string }>(session, '/api/devices/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ device_info: deviceInfo }),
  })
}

export interface DashboardData {
  backup: BackupStatus
  cloud: CloudStatus
  devices: DeviceOut[]
  earnings: EarningsStatus
}

export async function loadDashboard(session: Session): Promise<DashboardData> {
  const [backup, cloud, devices, earnings] = await Promise.all([
    getBackupStatus(session),
    getCloudStatus(session),
    getDevices(session),
    getEarnings(session),
  ])
  return { backup, cloud, devices, earnings }
}
