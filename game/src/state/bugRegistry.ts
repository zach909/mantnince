import { Vector3 } from 'three'

/**
 * Live bug positions, outside React state — same rationale as
 * playerTransform.ts. Each Bug registers/unregisters itself on mount/unmount
 * and updates its own entry every frame; the player's attack does a cheap
 * on-demand scan of this map rather than subscribing to per-frame position
 * changes through the store.
 */
export interface BugEntry {
  position: Vector3
  kind: 'grunt' | 'boss'
}

export const bugRegistry = new Map<string, BugEntry>()
