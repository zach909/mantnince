import { useRef, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react'
import { setTouchMove, clearTouchMove, touchJump, touchJumpRelease, touchAttack, setTouchBoost } from '../state/inputState'

const JOYSTICK_RADIUS = 46

/**
 * On-screen controls — essential on a phone (no keyboard), and harmless on
 * desktop since these are ordinary Pointer Events (mouse works too). Writes
 * into the same inputState singleton useKeyboard.ts does, so RobotController
 * doesn't need to know or care which input source is active.
 */
export function TouchControls() {
  const padRef = useRef<HTMLDivElement>(null)
  const knobRef = useRef<HTMLDivElement>(null)
  const activePointerId = useRef<number | null>(null)
  const center = useRef({ x: 0, y: 0 })

  function onPadDown(e: ReactPointerEvent<HTMLDivElement>) {
    const pad = padRef.current
    if (!pad) return
    const rect = pad.getBoundingClientRect()
    center.current = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
    activePointerId.current = e.pointerId
    pad.setPointerCapture(e.pointerId)
    updateKnob(e.clientX, e.clientY)
  }
  function onPadMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (activePointerId.current !== e.pointerId) return
    updateKnob(e.clientX, e.clientY)
  }
  function onPadUp(e: ReactPointerEvent<HTMLDivElement>) {
    if (activePointerId.current !== e.pointerId) return
    activePointerId.current = null
    clearTouchMove()
    if (knobRef.current) knobRef.current.style.transform = 'translate(-50%, -50%)'
  }
  function updateKnob(clientX: number, clientY: number) {
    let dx = clientX - center.current.x
    let dy = clientY - center.current.y
    const dist = Math.hypot(dx, dy)
    if (dist > JOYSTICK_RADIUS) {
      dx = (dx / dist) * JOYSTICK_RADIUS
      dy = (dy / dist) * JOYSTICK_RADIUS
    }
    if (knobRef.current) {
      knobRef.current.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`
    }
    setTouchMove(dx / JOYSTICK_RADIUS, dy / JOYSTICK_RADIUS)
  }

  return (
    <div style={styles.root}>
      <div
        ref={padRef}
        style={styles.pad}
        onPointerDown={onPadDown}
        onPointerMove={onPadMove}
        onPointerUp={onPadUp}
        onPointerCancel={onPadUp}
      >
        <div ref={knobRef} style={styles.knob} />
      </div>

      <div style={styles.buttons}>
        <button
          style={{ ...styles.button, ...styles.boostButton }}
          onPointerDown={() => setTouchBoost(true)}
          onPointerUp={() => setTouchBoost(false)}
          onPointerLeave={() => setTouchBoost(false)}
          aria-label="Optimizer thruster"
        >
          ⚡
        </button>
        <button
          style={{ ...styles.button, ...styles.attackButton }}
          onPointerDown={() => touchAttack()}
          aria-label="Attack"
        >
          ⚔
        </button>
        <button
          style={{ ...styles.button, ...styles.jumpButton }}
          onPointerDown={() => touchJump()}
          onPointerUp={() => touchJumpRelease()}
          onPointerLeave={() => touchJumpRelease()}
          aria-label="Jump"
        >
          ⤒
        </button>
      </div>
    </div>
  )
}

const styles: Record<string, CSSProperties> = {
  root: { position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 40, touchAction: 'none' },
  pad: {
    position: 'absolute', left: 24, bottom: 28, width: 92, height: 92, borderRadius: '50%',
    background: 'rgba(20,20,30,0.28)', border: '1px solid rgba(255,255,255,0.3)',
    pointerEvents: 'auto', touchAction: 'none',
  },
  knob: {
    position: 'absolute', left: '50%', top: '50%', width: 42, height: 42, borderRadius: '50%',
    background: 'rgba(255,255,255,0.75)', transform: 'translate(-50%, -50%)', pointerEvents: 'none',
  },
  buttons: {
    position: 'absolute', right: 20, bottom: 24, display: 'grid',
    gridTemplateColumns: '56px 56px', gap: 10, pointerEvents: 'none',
  },
  button: {
    width: 56, height: 56, borderRadius: '50%', fontSize: 22,
    background: 'rgba(20,20,30,0.32)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff',
    pointerEvents: 'auto', touchAction: 'none', userSelect: 'none',
  },
  jumpButton: { gridColumn: '2', gridRow: '1' },
  attackButton: { gridColumn: '1', gridRow: '1' },
  boostButton: { gridColumn: '2', gridRow: '2' },
}
