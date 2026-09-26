import { createStore } from '../lib/createStore'

interface ActivityLogState {
  entries: string[]
  log: (message: string) => void
}

const MAX_ENTRIES = 24

/** A real log of real game events (rescues, bug defeats, infections, boss
 * fights) — not scripted flavor text. The Terminal zone just tails this. */
export const useActivityLog = createStore<ActivityLogState>((set, get) => ({
  entries: [],
  log: (message) => {
    const stamp = new Date().toLocaleTimeString([], { hour12: false })
    const entries = [...get().entries, `[${stamp}] ${message}`].slice(-MAX_ENTRIES)
    set({ entries })
  },
}))
