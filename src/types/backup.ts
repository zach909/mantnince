export interface BackupCapture {
  id: string
  userId: string
  url: string
  filename: string
  fileHash: string | null
  fileSize: number
  referrer: string | null
  storageSaved: number
  duplicateOf: string | null
  createdAt: string
  updatedAt: string
}

export interface CloudConnection {
  id: string
  userId: string
  provider: 'google' | 'apple' | 'microsoft'
  connected: number
  lastSync: string | null
  filesCount: number
  totalSizeBytes: number
  createdAt: string
  updatedAt: string
}

export interface Device {
  id: string
  userId: string
  name: string
  type: 'iphone' | 'android' | 'windows_pc' | 'mac' | 'linux' | 'chrome_os'
  platform: 'iOS' | 'Android' | 'Windows' | 'macOS' | 'Linux' | 'ChromeOS'
  osVersion: string | null
  lastSeen: string | null
  status: string
  createdAt: string
  updatedAt: string
}

export interface AdEarnings {
  id: string
  userId: string
  adsWatched: number
  totalEarned: number
  storageEarnedGb: number
  cashAvailable: number
  createdAt: string
  updatedAt: string
}

export interface BackupStats {
  totalBackups: number
  totalSizeGb: number
  storageSavedGb: number
  dedupRate: number
  lastBackup: string | null
}

export interface CloudStatus {
  google: { connected: boolean; lastSync: string | null; filesCount: number }
  apple: { connected: boolean; lastSync: string | null; filesCount: number }
  microsoft: { connected: boolean; lastSync: string | null; filesCount: number }
}
