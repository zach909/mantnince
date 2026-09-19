import { gamepad2Icon, rotateCcwIcon } from '../lib/icons'
import { el } from '../lib/dom'

/**
 * A small Astro's Playroom-style "museum wall" mini-game: walk a little bot
 * left/right past a wall of PlayStation-era controller trophies and grab
 * each one to add it to your collection. Pure canvas + rAF, no deps.
 */

interface WallItem {
  id: string
  label: string
  x: number
  body: string
  grip: string
}

const ITEMS: WallItem[] = [
  { id: 'ps1', label: 'PS1', x: 140, body: '#9b9b93', grip: '#7c7c74' },
  { id: 'ps2', label: 'PS2', x: 340, body: '#2b2f3a', grip: '#1c1f27' },
  { id: 'ps3', label: 'PS3', x: 540, body: '#15161a', grip: '#050506' },
  { id: 'ps4', label: 'PS4', x: 740, body: '#1c1e24', grip: '#0d0e11' },
  { id: 'psp', label: 'PSP', x: 940, body: '#2a2a2e', grip: '#141416' },
  { id: 'ps5', label: 'PS5', x: 1140, body: '#eef0f2', grip: '#1a1c20' },
]

const WORLD_WIDTH = 1280
const VIEW_W = 348
const VIEW_H = 176
const GROUND_Y = 132
const PLAYER_SPEED = 3
const COLLECT_RANGE = 42
const STORAGE_KEY = 'playroom_wall_collected_v1'

function loadCollected(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return new Set()
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? new Set(parsed) : new Set()
  } catch {
    return new Set()
  }
}

function saveCollected(ids: Set<string>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]))
  } catch {
    // localStorage unavailable — collection just won't persist
  }
}

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  color: string
}

export function mountPlayroomWall(container: HTMLElement): () => void {
  const collected = loadCollected()
  const playerX = { value: 20 }
  const facing = { value: 1 as 1 | -1 }
  const keys = { left: false, right: false }
  const particles: Particle[] = []
  let lastCollectFlash = 0
  let nearbyItem: WallItem | null = null
  let toastTimeout: number | undefined

  // ── Static shell ──────────────────────────────────────
  const countLabel = el('p', { className: 'subtitle' }, `${collected.size}/${ITEMS.length} collected`)
  const resetBtn = el('button', { className: 'btn btn-ghost btn-ghost--sm', onclick: resetWall }, rotateCcwIcon({ size: 12 }), 'Reset')
  const canvas = el('canvas', { className: 'game-canvas', width: String(VIEW_W), height: String(VIEW_H) }) as HTMLCanvasElement
  const toastEl = el('div', { className: 'game-toast', style: { display: 'none' } })
  const leftBtn = el('button', { className: 'dpad-btn', 'aria-label': 'Move left' }, '←')
  const rightBtn = el('button', { className: 'dpad-btn', 'aria-label': 'Move right' }, '→')
  const grabBtn = el('button', { className: 'grab-btn', onclick: () => collectNearby(), disabled: true }, 'Walk up to a trophy')

  container.appendChild(
    el(
      'div',
      { className: 'playroom' },
      el(
        'div',
        { className: 'row-between' },
        el('div', {}, el('h1', { className: 'title' }, gamepad2Icon({ size: 14 }), 'Playroom Wall'), countLabel),
        resetBtn,
      ),
      el('div', { className: 'game-frame' }, canvas, toastEl),
      el(
        'div',
        { className: 'game-controls' },
        el('div', { className: 'dpad' }, leftBtn, rightBtn),
        grabBtn,
      ),
      el('p', { className: 'game-hint' }, 'Arrow keys / A·D to walk, Space to grab — or use the buttons above.'),
    ),
  )

  const setDir = (dir: 'left' | 'right', pressed: boolean) => {
    keys[dir] = pressed
  }
  leftBtn.addEventListener('pointerdown', () => setDir('left', true))
  leftBtn.addEventListener('pointerup', () => setDir('left', false))
  leftBtn.addEventListener('pointerleave', () => setDir('left', false))
  rightBtn.addEventListener('pointerdown', () => setDir('right', true))
  rightBtn.addEventListener('pointerup', () => setDir('right', false))
  rightBtn.addEventListener('pointerleave', () => setDir('right', false))

  function showToast(msg: string) {
    toastEl.textContent = msg
    toastEl.style.display = ''
    window.clearTimeout(toastTimeout)
    toastTimeout = window.setTimeout(() => {
      toastEl.style.display = 'none'
    }, 1600)
  }

  function updateGrabButton() {
    grabBtn.disabled = !nearbyItem
    grabBtn.textContent = nearbyItem ? `Grab ${nearbyItem.label}` : 'Walk up to a trophy'
  }

  function collectNearby() {
    const item = ITEMS.find((i) => Math.abs(i.x - playerX.value) < COLLECT_RANGE && !collected.has(i.id))
    if (!item) return
    collected.add(item.id)
    saveCollected(collected)
    countLabel.textContent = `${collected.size}/${ITEMS.length} collected`
    lastCollectFlash = performance.now()

    for (let n = 0; n < 14; n++) {
      const angle = (Math.PI * 2 * n) / 14
      particles.push({
        x: item.x,
        y: GROUND_Y - 46,
        vx: Math.cos(angle) * (0.6 + Math.random() * 1.4),
        vy: Math.sin(angle) * (0.6 + Math.random() * 1.4) - 0.6,
        life: 1,
        color: item.body,
      })
    }

    showToast(collected.size === ITEMS.length ? 'Wall complete — every generation collected!' : `Added ${item.label} to the wall`)
  }

  function resetWall() {
    collected.clear()
    saveCollected(collected)
    countLabel.textContent = `${collected.size}/${ITEMS.length} collected`
    toastEl.style.display = 'none'
  }

  const ctx = canvas.getContext('2d')
  if (!ctx) return () => {}

  function onKeyDown(e: KeyboardEvent) {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') keys.left = true
    if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.right = true
    if ((e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') && !e.repeat) {
      e.preventDefault()
      collectNearby()
    }
  }
  function onKeyUp(e: KeyboardEvent) {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') keys.left = false
    if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.right = false
  }
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)

  function drawController(x: number, y: number, item: WallItem, unlocked: boolean, glow: number) {
    ctx!.save()
    ctx!.translate(x, y)
    ctx!.globalAlpha = unlocked ? 1 : 0.28
    if (unlocked && glow > 0) {
      ctx!.shadowColor = item.body
      ctx!.shadowBlur = 14 * glow
    }
    ctx!.fillStyle = unlocked ? item.grip : '#3a3d44'
    ctx!.beginPath()
    ctx!.ellipse(-16, 6, 9, 12, 0.4, 0, Math.PI * 2)
    ctx!.fill()
    ctx!.beginPath()
    ctx!.ellipse(16, 6, 9, 12, -0.4, 0, Math.PI * 2)
    ctx!.fill()
    ctx!.fillStyle = unlocked ? item.body : 'transparent'
    ctx!.strokeStyle = unlocked ? item.body : '#5a5d66'
    ctx!.lineWidth = 1.5
    ctx!.beginPath()
    ctx!.roundRect(-22, -10, 44, 20, 10)
    if (unlocked) ctx!.fill()
    ctx!.stroke()
    ctx!.fillStyle = unlocked ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.25)'
    ctx!.beginPath()
    ctx!.arc(12, -2, 2, 0, Math.PI * 2)
    ctx!.fill()
    ctx!.beginPath()
    ctx!.arc(-12, -2, 2, 0, Math.PI * 2)
    ctx!.fill()
    ctx!.restore()

    ctx!.fillStyle = 'rgba(255,255,255,0.08)'
    ctx!.fillRect(x - 26, y + 20, 52, 4)
    ctx!.font = '9px Inter, ui-sans-serif, sans-serif'
    ctx!.textAlign = 'center'
    ctx!.fillStyle = unlocked ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.35)'
    ctx!.fillText(item.label, x, y + 36)
  }

  function drawBot(x: number, y: number, dir: 1 | -1, bounce: number) {
    ctx!.save()
    ctx!.translate(x, y + bounce)
    ctx!.fillStyle = '#4f8cff'
    ctx!.beginPath()
    ctx!.roundRect(-9, -16, 18, 16, 6)
    ctx!.fill()
    ctx!.fillStyle = '#3d7df5'
    ctx!.fillRect(-6, -1, 4, 6)
    ctx!.fillRect(2, -1, 4, 6)
    ctx!.fillStyle = '#fff'
    ctx!.beginPath()
    ctx!.arc(dir * 3, -9, 3.2, 0, Math.PI * 2)
    ctx!.fill()
    ctx!.fillStyle = '#0a0a0a'
    ctx!.beginPath()
    ctx!.arc(dir * 3 + dir * 1, -9, 1.4, 0, Math.PI * 2)
    ctx!.fill()
    ctx!.restore()
  }

  let rafId = 0
  function frame(t: number) {
    const p = playerX.value
    if (keys.left) {
      playerX.value = Math.max(16, p - PLAYER_SPEED)
      facing.value = -1
    }
    if (keys.right) {
      playerX.value = Math.min(WORLD_WIDTH - 16, p + PLAYER_SPEED)
      facing.value = 1
    }
    const moving = keys.left || keys.right

    const nearby =
      ITEMS.find((i) => Math.abs(i.x - playerX.value) < COLLECT_RANGE && !collected.has(i.id)) ?? null
    if (nearby?.id !== nearbyItem?.id) {
      nearbyItem = nearby
      updateGrabButton()
    }

    const camera = Math.min(Math.max(0, playerX.value - VIEW_W / 2), WORLD_WIDTH - VIEW_W)

    ctx!.clearRect(0, 0, VIEW_W, VIEW_H)

    const bg = ctx!.createLinearGradient(0, 0, 0, VIEW_H)
    bg.addColorStop(0, '#14161a')
    bg.addColorStop(1, '#0a0a0a')
    ctx!.fillStyle = bg
    ctx!.fillRect(0, 0, VIEW_W, VIEW_H)

    ctx!.strokeStyle = 'rgba(255,255,255,0.04)'
    ctx!.lineWidth = 1
    const seamOffset = -(camera * 0.4) % 60
    for (let sx = seamOffset; sx < VIEW_W; sx += 60) {
      ctx!.beginPath()
      ctx!.moveTo(sx, 0)
      ctx!.lineTo(sx, GROUND_Y)
      ctx!.stroke()
    }

    ctx!.fillStyle = '#1a1d24'
    ctx!.fillRect(0, GROUND_Y + 24, VIEW_W, VIEW_H - GROUND_Y - 24)
    ctx!.strokeStyle = 'rgba(255,255,255,0.08)'
    ctx!.beginPath()
    ctx!.moveTo(0, GROUND_Y + 24)
    ctx!.lineTo(VIEW_W, GROUND_Y + 24)
    ctx!.stroke()

    const flashAge = t - lastCollectFlash
    const glow = flashAge < 500 ? 1 - flashAge / 500 : 0

    for (const item of ITEMS) {
      const sx = item.x - camera
      if (sx < -30 || sx > VIEW_W + 30) continue
      const unlocked = collected.has(item.id)
      drawController(sx, GROUND_Y - 12, item, unlocked, unlocked && glow > 0 ? glow : 0)
      if (!unlocked && nearby?.id === item.id) {
        ctx!.fillStyle = 'rgba(79,140,255,0.9)'
        ctx!.font = 'bold 8px Inter, ui-sans-serif, sans-serif'
        ctx!.textAlign = 'center'
        const bob = Math.sin(t / 200) * 2
        ctx!.fillText('SPACE', sx, GROUND_Y - 56 + bob)
      }
    }

    for (let i = particles.length - 1; i >= 0; i--) {
      const pt = particles[i]
      if (pt.life <= 0) {
        particles.splice(i, 1)
        continue
      }
      pt.x += pt.vx
      pt.y += pt.vy
      pt.vy += 0.03
      pt.life -= 0.02
      const sx = pt.x - camera
      ctx!.globalAlpha = Math.max(0, pt.life)
      ctx!.fillStyle = pt.color
      ctx!.beginPath()
      ctx!.arc(sx, pt.y, 2, 0, Math.PI * 2)
      ctx!.fill()
      ctx!.globalAlpha = 1
    }

    const bounce = moving ? Math.abs(Math.sin(t / 100)) * -3 : 0
    drawBot(playerX.value - camera, GROUND_Y, facing.value, bounce)

    rafId = requestAnimationFrame(frame)
  }

  rafId = requestAnimationFrame(frame)

  return () => {
    cancelAnimationFrame(rafId)
    window.removeEventListener('keydown', onKeyDown)
    window.removeEventListener('keyup', onKeyUp)
    window.clearTimeout(toastTimeout)
  }
}
