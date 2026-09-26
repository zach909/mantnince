import { useRef } from 'react'
import * as THREE from 'three'
import { useBugStore } from '../state/bugStore'
import { Bug, spawnEdgePosition } from './Bug'
import { ZONE_POSITIONS } from '../constants'

/** Renders every live bug from the store. Spawn position is computed once
 * per bug id and cached, not recomputed on every re-render. */
export function BugField() {
  const bugs = useBugStore((s) => s.bugs)
  const spawnPoints = useRef(new Map<string, THREE.Vector3>())

  for (const bug of bugs) {
    if (!spawnPoints.current.has(bug.id)) {
      if (bug.kind === 'boss') {
        const [x, y, z] = ZONE_POSITIONS.kernel
        spawnPoints.current.set(bug.id, new THREE.Vector3(x, y, z))
      } else {
        spawnPoints.current.set(bug.id, spawnEdgePosition())
      }
    }
  }

  return (
    <>
      {bugs.map((bug) => (
        <Bug key={bug.id} spec={bug} spawnAt={spawnPoints.current.get(bug.id)!} />
      ))}
    </>
  )
}
