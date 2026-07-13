import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { blink } from '@/blink/client'
import type {
  BackupCapture,
  CloudConnection,
  Device,
  AdEarnings,
  BackupStats,
  CloudStatus,
} from '@/types/backup'

// ── Query key constants (exported for manual invalidation) ──

export const backupKeys = {
  captures: ['backup-captures'] as const,
  connections: ['cloud-connections'] as const,
  devices: ['devices'] as const,
  earnings: ['ad-earnings'] as const,
  stats: ['backup-stats'] as const,
}

// ── Helpers ──────────────────────────────────────────────

const uid = () => crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

const GB = 1024 ** 3

// ── Queries ──────────────────────────────────────────────

/** List all backup captures, newest first. */
export function useBackupCaptures() {
  return useQuery({
    queryKey: backupKeys.captures,
    queryFn: () =>
      blink.db
        .table<BackupCapture>('backup_captures')
        .list({ orderBy: { createdAt: 'desc' } }),
  })
}

/** Alias: most recent backup captures for the dashboard. */
export function useRecentBackups() {
  return useQuery({
    queryKey: [...backupKeys.captures, 'recent'],
    queryFn: () =>
      blink.db
        .table<BackupCapture>('backup_captures')
        .list({ orderBy: { createdAt: 'desc' }, limit: 20 }),
  })
}

/** List all cloud connections. */
export function useCloudConnections() {
  return useQuery({
    queryKey: backupKeys.connections,
    queryFn: () => blink.db.table<CloudConnection>('cloud_connections').list(),
  })
}

/** Aggregate cloud status (google/apple/microsoft with connected flag + file count). */
export function useCloudStatus() {
  return useQuery({
    queryKey: [...backupKeys.connections, 'status'],
    queryFn: async (): Promise<CloudStatus> => {
      const rows = await blink.db.table<CloudConnection>('cloud_connections').list()
      const find = (p: string) => rows.find((r) => r.provider === p)
      return {
        google: {
          connected: Number(find('google')?.connected ?? 0) > 0,
          lastSync: find('google')?.lastSync ?? null,
          filesCount: find('google')?.filesCount ?? 0,
        },
        apple: {
          connected: Number(find('apple')?.connected ?? 0) > 0,
          lastSync: find('apple')?.lastSync ?? null,
          filesCount: find('apple')?.filesCount ?? 0,
        },
        microsoft: {
          connected: Number(find('microsoft')?.connected ?? 0) > 0,
          lastSync: find('microsoft')?.lastSync ?? null,
          filesCount: find('microsoft')?.filesCount ?? 0,
        },
      }
    },
  })
}

/** Count online devices. */
export function useDeviceCount() {
  return useQuery({
    queryKey: [...backupKeys.devices, 'count'],
    queryFn: async () => {
      const rows = await blink.db.table<Device>('devices').list()
      return rows.filter((d) => d.status === 'online').length
    },
  })
}

/** List all registered devices. */
export function useDevices() {
  return useQuery({
    queryKey: backupKeys.devices,
    queryFn: () => blink.db.table<Device>('devices').list(),
  })
}

/** Fetch the current user's ad-earnings row, or `null` if none exists. */
export function useAdEarnings() {
  return useQuery({
    queryKey: backupKeys.earnings,
    queryFn: async () => {
      const rows = await blink.db
        .table<AdEarnings>('ad_earnings')
        .list({ limit: 1 })
      return rows[0] ?? null
    },
  })
}

/** Alias for dashboard: ad earnings. */
export function useEarnings() {
  return useAdEarnings()
}

/** Compute aggregate stats from the backup_captures table. */
export function useBackupStats() {
  return useQuery({
    queryKey: backupKeys.stats,
    queryFn: async (): Promise<BackupStats> => {
      const captures = await blink.db
        .table<BackupCapture>('backup_captures')
        .list({ orderBy: { createdAt: 'desc' } })

      const totalBackups = captures.length
      const totalSizeGb =
        captures.reduce((sum, c) => sum + (c.fileSize || 0), 0) / GB
      const storageSavedGb =
        captures
          .filter((c) => Number(c.storageSaved))
          .reduce((sum, c) => sum + (c.fileSize || 0), 0) / GB
      const dedupCount = captures.filter((c) => c.duplicateOf).length
      const dedupRate = totalBackups > 0 ? dedupCount / totalBackups : 0
      const lastBackup = captures[0]?.createdAt ?? null

      return { totalBackups, totalSizeGb, storageSavedGb, dedupRate, lastBackup }
    },
  })
}

// ── Mutations ────────────────────────────────────────────

/** Create a new backup capture. Invalidates captures & stats on success. */
export function useAddCapture() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<BackupCapture>) =>
      blink.db.table<BackupCapture>('backup_captures').create({
        id: uid(),
        ...data,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: backupKeys.captures })
      qc.invalidateQueries({ queryKey: backupKeys.stats })
    },
  })
}

/**
 * Upsert a cloud connection (insert or update).
 * The caller should include `id` to update an existing row, or omit it to
 * create a new one.
 */
export function useConnectCloud() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<CloudConnection>) =>
      blink.db.table<CloudConnection>('cloud_connections').upsert(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: backupKeys.connections })
    },
  })
}

/** Register a new device. Invalidates the devices list on success. */
export function useAddDevice() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Device>) =>
      blink.db.table<Device>('devices').create({
        id: uid(),
        ...data,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: backupKeys.devices })
    },
  })
}

/**
 * Record an ad watch event.
 *
 * Pass the amounts to increment (`adsWatched` and/or `totalEarned`).
 * If no ad‑earnings row exists yet, one is created automatically.
 */
export function useRecordAdWatch() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (increment: {
      adsWatched?: number
      totalEarned?: number
    }) => {
      const rows = await blink.db
        .table<AdEarnings>('ad_earnings')
        .list({ limit: 1 })
      const current = rows[0]

      if (current) {
        return blink.db.table<AdEarnings>('ad_earnings').update(current.id, {
          adsWatched: current.adsWatched + (increment.adsWatched ?? 0),
          totalEarned: current.totalEarned + (increment.totalEarned ?? 0),
        })
      }

      return blink.db.table<AdEarnings>('ad_earnings').create({
        id: uid(),
        adsWatched: increment.adsWatched ?? 0,
        totalEarned: increment.totalEarned ?? 0,
        storageEarnedGb: 0,
        cashAvailable: 0,
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: backupKeys.earnings })
    },
  })
}
