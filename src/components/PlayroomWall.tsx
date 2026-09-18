import { useCallback, useEffect, useRef, useState } from 'react'
import { Gamepad2, RotateCcw } from 'lucide-react'

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

interface Particle { x: number; y: number; vx: number; vy: number; life: number; color: string }

export function PlayroomWall() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number>(0)
  const playerXRef = useRef(20)
  const facingRef = useRef<1 | -1>(1)
  const keysRef = useRef({ left: false, right: false })
  const collectedRef = useRef<Set<string>>(loadCollected())
  const particlesRef = useRef<Particle[]>([])
  const lastCollectFlashRef = useRef(0)

  const [collectedCount, setCollectedCount] = useState(() => collectedRef.current.size)
  const [nearbyItem, setNearbyItem] = useState<WallItem | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const collectNearby = useCallback(() => {
    const item = ITEMS.find(
      (i) => Math.abs(i.x - playerXRef.current) < COLLECT_RANGE && !collectedRef.current.has(i.id)
    )
    if (!item) return
    collectedRef.current.add(item.id)
    saveCollected(collectedRef.current)
    setCollectedCount(collectedRef.current.size)
    lastCollectFlashRef.current = performance.now()

    for (let n = 0; n < 14; n++) {
      const angle = (Math.PI * 2 * n) / 14
      particlesRef.current.push({
        x: item.x,
        y: GROUND_Y - 46,
        vx: Math.cos(angle) * (0.6 + Math.random() * 1.4),
        vy: Math.sin(angle) * (0.6 + Math.random() * 1.4) - 0.6,
        life: 1,
        color: item.body,
      })
    }

    if (collectedRef.current.size === ITEMS.length) {
      setToast('Wall complete — every generation collected!')
    } else {
      setToast(`Added ${item.label} to the wall`)
    }
    window.setTimeout(() => setToast(null), 1600)
  }, [])

  const resetWall = useCallback(() => {
    collectedRef.current = new Set()
    saveCollected(collectedRef.current)
    setCollectedCount(0)
    setToast(null)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    function onKeyDown(e: KeyboardEvent) {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') keysRef.current.left = true
      if (e.code === 'ArrowRight' || e.code === 'KeyD') keysRef.current.right = true
      if ((e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') && !e.repeat) {
        e.preventDefault()
        collectNearby()
      }
    }
    function onKeyUp(e: KeyboardEvent) {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') keysRef.current.left = false
      if (e.code === 'ArrowRight' || e.code === 'KeyD') keysRef.current.right = false
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
      // grips
      ctx!.fillStyle = unlocked ? item.grip : '#3a3d44'
      ctx!.beginPath()
      ctx!.ellipse(-16, 6, 9, 12, 0.4, 0, Math.PI * 2)
      ctx!.fill()
      ctx!.beginPath()
      ctx!.ellipse(16, 6, 9, 12, -0.4, 0, Math.PI * 2)
      ctx!.fill()
      // body
      ctx!.fillStyle = unlocked ? item.body : 'transparent'
      ctx!.strokeStyle = unlocked ? item.body : '#5a5d66'
      ctx!.lineWidth = 1.5
      ctx!.beginPath()
      ctx!.roundRect(-22, -10, 44, 20, 10)
      if (unlocked) ctx!.fill()
      ctx!.stroke()
      // buttons
      ctx!.fillStyle = unlocked ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.25)'
      ctx!.beginPath()
      ctx!.arc(12, -2, 2, 0, Math.PI * 2)
      ctx!.fill()
      ctx!.beginPath()
      ctx!.arc(-12, -2, 2, 0, Math.PI * 2)
      ctx!.fill()
      ctx!.restore()

      // pedestal + label
      ctx!.fillStyle = 'rgba(255,255,255,0.08)'
      ctx!.fillRect(x - 26, y + 20, 52, 4)
      ctx!.font = '9px Inter, ui-sans-serif, sans-serif'
      ctx!.textAlign = 'center'
      ctx!.fillStyle = unlocked ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.35)'
      ctx!.fillText(item.label, x, y + 36)
    }

    function drawBot(x: number, y: number, facing: 1 | -1, bounce: number) {
      ctx!.save()
      ctx!.translate(x, y + bounce)
      ctx!.fillStyle = '#4f8cff'
      ctx!.beginPath()
      ctx!.roundRect(-9, -16, 18, 16, 6)
      ctx!.fill()
      // legs
      ctx!.fillStyle = '#3d7df5'
      ctx!.fillRect(-6, -1, 4, 6)
      ctx!.fillRect(2, -1, 4, 6)
      // eyes
      ctx!.fillStyle = '#fff'
      ctx!.beginPath()
      ctx!.arc(facing * 3, -9, 3.2, 0, Math.PI * 2)
      ctx!.fill()
      ctx!.fillStyle = '#0a0a0a'
      ctx!.beginPath()
      ctx!.arc(facing * 3 + facing * 1, -9, 1.4, 0, Math.PI * 2)
      ctx!.fill()
      ctx!.restore()
    }

    function frame(t: number) {
      const p = playerXRef.current
      if (keysRef.current.left) {
        playerXRef.current = Math.max(16, p - PLAYER_SPEED)
        facingRef.current = -1
      }
      if (keysRef.current.right) {
        playerXRef.current = Math.min(WORLD_WIDTH - 16, p + PLAYER_SPEED)
        facingRef.current = 1
      }
      const moving = keysRef.current.left || keysRef.current.right

      const nearby =
        ITEMS.find(
          (i) => Math.abs(i.x - playerXRef.current) < COLLECT_RANGE && !collectedRef.current.has(i.id)
        ) ?? null
      setNearbyItem((prev) => (prev?.id === nearby?.id ? prev : nearby))

      const camera = Math.min(
        Math.max(0, playerXRef.current - VIEW_W / 2),
        WORLD_WIDTH - VIEW_W
      )

      ctx!.clearRect(0, 0, VIEW_W, VIEW_H)

      const bg = ctx!.createLinearGradient(0, 0, 0, VIEW_H)
      bg.addColorStop(0, '#14161a')
      bg.addColorStop(1, '#0a0a0a')
      ctx!.fillStyle = bg
      ctx!.fillRect(0, 0, VIEW_W, VIEW_H)

      // wall paneling seams (slow parallax)
      ctx!.strokeStyle = 'rgba(255,255,255,0.04)'
      ctx!.lineWidth = 1
      const seamOffset = -(camera * 0.4) % 60
      for (let sx = seamOffset; sx < VIEW_W; sx += 60) {
        ctx!.beginPath()
        ctx!.moveTo(sx, 0)
        ctx!.lineTo(sx, GROUND_Y)
        ctx!.stroke()
      }

      // ground
      ctx!.fillStyle = '#1a1d24'
      ctx!.fillRect(0, GROUND_Y + 24, VIEW_W, VIEW_H - GROUND_Y - 24)
      ctx!.strokeStyle = 'rgba(255,255,255,0.08)'
      ctx!.beginPath()
      ctx!.moveTo(0, GROUND_Y + 24)
      ctx!.lineTo(VIEW_W, GROUND_Y + 24)
      ctx!.stroke()

      const flashAge = t - lastCollectFlashRef.current
      const glow = flashAge < 500 ? 1 - flashAge / 500 : 0

      for (const item of ITEMS) {
        const sx = item.x - camera
        if (sx < -30 || sx > VIEW_W + 30) continue
        const unlocked = collectedRef.current.has(item.id)
        drawController(sx, GROUND_Y - 12, item, unlocked, unlocked && glow > 0 ? glow : 0)
        if (!unlocked && nearby?.id === item.id) {
          ctx!.fillStyle = 'rgba(79,140,255,0.9)'
          ctx!.font = 'bold 8px Inter, ui-sans-serif, sans-serif'
          ctx!.textAlign = 'center'
          const bob = Math.sin(t / 200) * 2
          ctx!.fillText('SPACE', sx, GROUND_Y - 56 + bob)
        }
      }

      // particles
      particlesRef.current = particlesRef.current.filter((pt) => pt.life > 0)
      for (const pt of particlesRef.current) {
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
      drawBot(playerXRef.current - camera, GROUND_Y, facingRef.current, bounce)

      rafRef.current = requestAnimationFrame(frame)
    }

    rafRef.current = requestAnimationFrame(frame)
    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [collectNearby])

  const setDir = (dir: 'left' | 'right', pressed: boolean) => {
    keysRef.current[dir] = pressed
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-1.5 text-sm font-semibold text-[var(--color-text)]">
            <Gamepad2 className="w-3.5 h-3.5 text-[var(--color-accent)]" />
            Playroom Wall
          </h1>
          <p className="text-xs text-[var(--color-text-muted)]">
            {collectedCount}/{ITEMS.length} collected
          </p>
        </div>
        <button
          onClick={resetWall}
          className="flex items-center gap-1 px-2 py-1 text-[10px] rounded-[var(--radius-sm)] bg-white/5 text-[var(--color-text-muted)] hover:bg-white/10 hover:text-[var(--color-text)] transition-colors"
        >
          <RotateCcw className="w-3 h-3" />
          Reset
        </button>
      </div>

      <div className="relative rounded-[var(--radius-md)] overflow-hidden border border-[var(--color-border)]">
        <canvas
          ref={canvasRef}
          width={VIEW_W}
          height={VIEW_H}
          className="block w-full"
          style={{ imageRendering: 'pixelated' }}
        />
        {toast && (
          <div className="absolute top-1.5 left-1/2 -translate-x-1/2 px-2 py-1 rounded-[var(--radius-sm)] bg-black/70 text-[10px] text-white whitespace-nowrap">
            {toast}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-1.5">
          <button
            onPointerDown={() => setDir('left', true)}
            onPointerUp={() => setDir('left', false)}
            onPointerLeave={() => setDir('left', false)}
            className="w-9 h-9 flex items-center justify-center rounded-[var(--radius-sm)] bg-white/5 text-[var(--color-text)] hover:bg-white/10 active:bg-white/15 select-none"
            aria-label="Move left"
          >
            ←
          </button>
          <button
            onPointerDown={() => setDir('right', true)}
            onPointerUp={() => setDir('right', false)}
            onPointerLeave={() => setDir('right', false)}
            className="w-9 h-9 flex items-center justify-center rounded-[var(--radius-sm)] bg-white/5 text-[var(--color-text)] hover:bg-white/10 active:bg-white/15 select-none"
            aria-label="Move right"
          >
            →
          </button>
        </div>
        <button
          onClick={collectNearby}
          disabled={!nearbyItem}
          className="flex-1 px-3 py-2 text-xs font-medium rounded-[var(--radius-sm)] bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          {nearbyItem ? `Grab ${nearbyItem.label}` : 'Walk up to a trophy'}
        </button>
      </div>

      <p className="text-[10px] text-[var(--color-text-muted)] text-center">
        Arrow keys / A·D to walk, Space to grab — or use the buttons above.
      </p>
    </div>
  )
}
