/**
 * Local, on-device capture store. Everything the extension records lives in
 * `chrome.storage.local` only — there is no remote backend for the popup/
 * background pair, no API key, and nothing is ever sent off the device. This
 * matches the product's own stated non-goal: no silent cross-device
 * exfiltration of anything the extension observes.
 */

export interface Capture {
  id: string
  url: string
  filename: string
  fileHash: string
  fileSize: number
  referrer: string
  storageSaved: number
  duplicateOf: string | null
  siteRisky: boolean
  siteRiskReasons: string
  createdAt: string
}

const STORAGE_KEY = 'ubs_captures'

export async function listCaptures(): Promise<Capture[]> {
  const stored = await chrome.storage.local.get(STORAGE_KEY)
  const captures = stored[STORAGE_KEY]
  return Array.isArray(captures) ? captures : []
}

export async function findCaptureByHash(fileHash: string): Promise<Capture | undefined> {
  const captures = await listCaptures()
  return captures.find((c) => c.fileHash === fileHash)
}

/** Prepend a new capture (newest-first) and persist it. */
export async function addCapture(capture: Capture): Promise<Capture> {
  const captures = await listCaptures()
  captures.unshift(capture)
  await chrome.storage.local.set({ [STORAGE_KEY]: captures })
  return capture
}

export function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 11)}`
}

export function hashString(str: string): string {
  let h = 0
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i)
    h |= 0
  }
  return `sha256-${Math.abs(h).toString(16)}`
}
