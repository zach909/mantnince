/**
 * What a browser tab can honestly see about the machine it's running on —
 * deliberately NOT a fake "live CPU usage" readout. A browser has no API for
 * host-wide CPU/RAM/disk usage (that's what the Electron desktop app's
 * System Health panel uses Node's os/fs modules for); this only surfaces the
 * few real, coarse signals a page is actually allowed to read.
 */
export interface BrowserVitals {
  cpuCores: number | null
  deviceMemoryGb: number | null
  connectionType: string | null
}

export function readBrowserVitals(): BrowserVitals {
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { effectiveType?: string } }
  return {
    cpuCores: typeof navigator.hardwareConcurrency === 'number' ? navigator.hardwareConcurrency : null,
    deviceMemoryGb: typeof nav.deviceMemory === 'number' ? nav.deviceMemory : null,
    connectionType: nav.connection?.effectiveType ?? null,
  }
}
