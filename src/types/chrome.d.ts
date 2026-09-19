/**
 * Minimal ambient types for the slice of the chrome.* extension API this
 * project actually uses — our own stand-in for @types/chrome rather than
 * depending on the DefinitelyTyped package for a surface this small.
 */

declare namespace chrome.runtime {
  interface LastError {
    message?: string
  }
  const lastError: LastError | undefined
  function sendMessage(message: any, callback?: (response: any) => void): void
  const onMessage: {
    addListener(
      callback: (message: any, sender: unknown, sendResponse: (response?: any) => void) => boolean | void,
    ): void
  }
  const onInstalled: {
    addListener(callback: () => void): void
  }
}

declare namespace chrome.storage {
  interface StorageArea {
    get(keys?: string | string[] | Record<string, unknown> | null): Promise<Record<string, any>>
    set(items: Record<string, unknown>): Promise<void>
    remove(keys: string | string[]): Promise<void>
    clear(): Promise<void>
  }
  const local: StorageArea
}

declare namespace chrome.action {
  function setBadgeText(details: { text: string }): void
  function setBadgeBackgroundColor(details: { color: string }): void
}

declare namespace chrome.downloads {
  interface DownloadItem {
    id: number
    url?: string
    filename?: string
    fileSize?: number
    referrer?: string
  }
  interface DownloadDelta {
    id: number
    state?: { current?: string }
  }
  function search(query: { id: number }): Promise<DownloadItem[]>
  const onChanged: {
    addListener(callback: (delta: DownloadDelta) => void): void
  }
}

declare namespace chrome.alarms {
  interface Alarm {
    name: string
  }
  function create(name: string, alarmInfo: { periodInMinutes?: number }): void
  const onAlarm: {
    addListener(callback: (alarm: Alarm) => void): void
  }
}
