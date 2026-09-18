import { create } from 'zustand'
import { loadBackendData, saveConnectConfig, type BackendData, type ConnectConfig } from '../lib/backendClient'

interface BackendState {
  data: BackendData | null
  loading: boolean

  load: () => Promise<void>
  connect: (cfg: ConnectConfig) => Promise<void>
  useDemo: () => Promise<void>
}

export const useBackendStore = create<BackendState>((set) => ({
  data: null,
  loading: false,

  load: async () => {
    set({ loading: true })
    const data = await loadBackendData()
    set({ data, loading: false })
  },

  connect: async (cfg) => {
    saveConnectConfig(cfg)
    set({ loading: true })
    const data = await loadBackendData()
    set({ data, loading: false })
  },

  useDemo: async () => {
    saveConnectConfig(null)
    set({ loading: true })
    const data = await loadBackendData()
    set({ data, loading: false })
  },
}))
