import { useEffect, useRef } from 'react'

export interface KeyState {
  forward: boolean
  back: boolean
  left: boolean
  right: boolean
  jump: boolean
  jumpPressed: boolean
  boost: boolean
  boostPressed: boolean
}

const FORWARD = new Set(['KeyW', 'ArrowUp'])
const BACK = new Set(['KeyS', 'ArrowDown'])
const LEFT = new Set(['KeyA', 'ArrowLeft'])
const RIGHT = new Set(['KeyD', 'ArrowRight'])
const JUMP = new Set(['Space'])
const BOOST = new Set(['ShiftLeft', 'ShiftRight', 'KeyE'])

/** Tracks held keys in a ref (no re-renders) plus one-frame "just pressed" edges for jump/boost. */
export function useKeyboard() {
  const state = useRef<KeyState>({
    forward: false, back: false, left: false, right: false,
    jump: false, jumpPressed: false, boost: false, boostPressed: false,
  })

  useEffect(() => {
    function onDown(e: KeyboardEvent) {
      const s = state.current
      if (FORWARD.has(e.code)) s.forward = true
      if (BACK.has(e.code)) s.back = true
      if (LEFT.has(e.code)) s.left = true
      if (RIGHT.has(e.code)) s.right = true
      if (JUMP.has(e.code)) { if (!s.jump) s.jumpPressed = true; s.jump = true; e.preventDefault() }
      if (BOOST.has(e.code)) { if (!s.boost) s.boostPressed = true; s.boost = true }
    }
    function onUp(e: KeyboardEvent) {
      const s = state.current
      if (FORWARD.has(e.code)) s.forward = false
      if (BACK.has(e.code)) s.back = false
      if (LEFT.has(e.code)) s.left = false
      if (RIGHT.has(e.code)) s.right = false
      if (JUMP.has(e.code)) s.jump = false
      if (BOOST.has(e.code)) s.boost = false
    }
    window.addEventListener('keydown', onDown)
    window.addEventListener('keyup', onUp)
    return () => {
      window.removeEventListener('keydown', onDown)
      window.removeEventListener('keyup', onUp)
    }
  }, [])

  return state
}

/** Call once per frame after reading an edge flag, to consume it. */
export function consumeEdge(state: React.MutableRefObject<KeyState>, key: 'jumpPressed' | 'boostPressed') {
  const value = state.current[key]
  state.current[key] = false
  return value
}
