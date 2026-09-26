import { createStore } from '../lib/createStore'
import { useActivityLog } from './activityLog'
import { BOSS_DEFEAT_RELIEF, BOSS_HP } from '../constants'

export interface BugSpec {
  id: string
  kind: 'grunt' | 'boss'
  hp: number
  maxHp: number
  zoneKey: string
  zoneLabel: string
}

interface CombatState {
  bugs: BugSpec[]
  wave: number
  corruption: number // 0 (pristine) .. 100 (crashed)
  crashed: boolean
  bossActive: boolean

  spawnGrunt: (id: string, zoneKey: string, zoneLabel: string) => void
  spawnBoss: (id: string) => void
  damageBug: (id: string, amount: number) => void
  infectZone: (id: string, zoneLabel: string, damage: number) => void
  addCorruption: (amount: number) => void
  nextWave: () => void
  reset: () => void
}

export const useBugStore = createStore<CombatState>((set, get) => ({
  bugs: [],
  wave: 1,
  corruption: 0,
  crashed: false,
  bossActive: false,

  spawnGrunt: (id, zoneKey, zoneLabel) => {
    set({ bugs: [...get().bugs, { id, kind: 'grunt', hp: 1, maxHp: 1, zoneKey, zoneLabel }] })
  },

  spawnBoss: (id) => {
    set({ bugs: [...get().bugs, { id, kind: 'boss', hp: BOSS_HP, maxHp: BOSS_HP, zoneKey: 'kernel', zoneLabel: 'Kernel Core' }], bossActive: true })
    useActivityLog.getState().log('⚠ Kernel Corruptor detected at Kernel Core!')
  },

  damageBug: (id, amount) => {
    const bug = get().bugs.find((b) => b.id === id)
    if (!bug) return
    const hp = bug.hp - amount
    if (hp <= 0) {
      set({ bugs: get().bugs.filter((b) => b.id !== id) })
      if (bug.kind === 'boss') {
        get().addCorruption(-BOSS_DEFEAT_RELIEF)
        set({ bossActive: false })
        useActivityLog.getState().log('✓ Kernel Corruptor defeated — system stabilized.')
      } else {
        useActivityLog.getState().log(`Bug cleared near ${bug.zoneLabel}.`)
      }
    } else {
      set({ bugs: get().bugs.map((b) => (b.id === id ? { ...b, hp } : b)) })
    }
  },

  infectZone: (id, zoneLabel, damage) => {
    set({ bugs: get().bugs.filter((b) => b.id !== id) })
    get().addCorruption(damage)
    useActivityLog.getState().log(`Bug reached ${zoneLabel} — integrity dropping.`)
  },

  addCorruption: (amount) => {
    const corruption = Math.max(0, Math.min(100, get().corruption + amount))
    set({ corruption, crashed: corruption >= 100 })
    if (corruption >= 100) useActivityLog.getState().log('✗ System crashed — rebooting required.')
  },

  nextWave: () => set({ wave: get().wave + 1 }),

  reset: () => {
    set({ bugs: [], wave: 1, corruption: 0, crashed: false, bossActive: false })
    useActivityLog.getState().log('System rebooted. Integrity restored.')
  },
}))
