/**
 * Shared input state — outside React state, same rationale as
 * playerTransform.ts (this changes every frame and is read imperatively
 * from useFrame, not rendered). Keyboard (useKeyboard.ts) and on-screen
 * touch controls (TouchControls.tsx) both write into this ONE object, so
 * RobotController doesn't care which input source is active — essential on
 * a phone, which has no keyboard.
 */
export interface KeyState {
  forward: boolean
  back: boolean
  left: boolean
  right: boolean
  jump: boolean
  jumpPressed: boolean
  boost: boolean
  boostPressed: boolean
  attackPressed: boolean
}

export const inputState: KeyState = {
  forward: false, back: false, left: false, right: false,
  jump: false, jumpPressed: false, boost: false, boostPressed: false, attackPressed: false,
}

/** Call once per frame after reading an edge flag, to consume it. */
export function consumeEdge(key: 'jumpPressed' | 'boostPressed' | 'attackPressed') {
  const value = inputState[key]
  inputState[key] = false
  return value
}

// ── Touch input — mutate the same singleton keyboard writes into ──
export function setTouchMove(dx: number, dz: number) {
  // Digital-feel virtual pad: snap the touch vector to the same
  // forward/back/left/right booleans keyboard input produces, rather than
  // a true analog stick — keeps movement feel identical across inputs.
  const DEAD_ZONE = 0.25
  inputState.left = dx < -DEAD_ZONE
  inputState.right = dx > DEAD_ZONE
  inputState.forward = dz < -DEAD_ZONE
  inputState.back = dz > DEAD_ZONE
}

export function clearTouchMove() {
  inputState.forward = false
  inputState.back = false
  inputState.left = false
  inputState.right = false
}

export function touchJump() {
  if (!inputState.jump) inputState.jumpPressed = true
  inputState.jump = true
}
export function touchJumpRelease() {
  inputState.jump = false
}

export function touchAttack() {
  inputState.attackPressed = true
}

export function setTouchBoost(held: boolean) {
  if (held && !inputState.boost) inputState.boostPressed = true
  inputState.boost = held
}
