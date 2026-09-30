import { useEffect } from 'react'
import { inputState } from '../state/inputState'

const FORWARD = new Set(['KeyW', 'ArrowUp'])
const BACK = new Set(['KeyS', 'ArrowDown'])
const LEFT = new Set(['KeyA', 'ArrowLeft'])
const RIGHT = new Set(['KeyD', 'ArrowRight'])
const JUMP = new Set(['Space'])
const BOOST = new Set(['ShiftLeft', 'ShiftRight', 'KeyE'])
const ATTACK = new Set(['KeyF'])

/** Wires keyboard events into the shared inputState singleton (see
 * state/inputState.ts). Touch controls write into the same object, so
 * RobotController just reads inputState regardless of input source. */
export function useKeyboard() {
  useEffect(() => {
    function onDown(e: KeyboardEvent) {
      const s = inputState
      if (FORWARD.has(e.code)) s.forward = true
      if (BACK.has(e.code)) s.back = true
      if (LEFT.has(e.code)) s.left = true
      if (RIGHT.has(e.code)) s.right = true
      if (JUMP.has(e.code)) { if (!s.jump) s.jumpPressed = true; s.jump = true; e.preventDefault() }
      if (BOOST.has(e.code)) { if (!s.boost) s.boostPressed = true; s.boost = true }
      if (ATTACK.has(e.code) && !e.repeat) s.attackPressed = true
    }
    function onUp(e: KeyboardEvent) {
      const s = inputState
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
}
