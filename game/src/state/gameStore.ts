import { create } from 'zustand'

interface GameState {
  collectedIds: Set<string>
  totalCollectibles: number
  toast: string | null
  gadgetReadyAt: number

  collectBot: (id: string, label: string) => void
  setToast: (message: string | null) => void
  useGadget: (cooldownMs: number) => void
  isGadgetReady: () => boolean
}

export const useGameStore = create<GameState>((set, get) => ({
  collectedIds: new Set(),
  totalCollectibles: 2,
  toast: null,
  gadgetReadyAt: 0,

  collectBot: (id, label) => {
    if (get().collectedIds.has(id)) return
    const next = new Set(get().collectedIds)
    next.add(id)
    set({ collectedIds: next, toast: `Rescued ${label}!` })
    window.setTimeout(() => {
      if (get().toast === `Rescued ${label}!`) set({ toast: null })
    }, 2200)
  },

  setToast: (message) => set({ toast: message }),

  useGadget: (cooldownMs) => set({ gadgetReadyAt: performance.now() + cooldownMs }),

  isGadgetReady: () => performance.now() >= get().gadgetReadyAt,
}))
