import { Suspense, useState, type CSSProperties } from 'react'
import { Canvas } from '@react-three/fiber'
import { RobotController } from './components/RobotController'
import { FollowCamera } from './components/FollowCamera'
import { Level } from './components/Level'
import { CollectibleBot } from './components/CollectibleBot'
import { Hud } from './components/Hud'
import { COLLECTIBLES } from './constants'

export default function App() {
  const [started, setStarted] = useState(false)

  if (!started) {
    return (
      <div style={titleStyles.root}>
        <h1 style={titleStyles.title}>Deben&rsquo;s Adventure</h1>
        <p style={titleStyles.subtitle}>a tiny robot, a big diorama — vertical-slice prototype</p>
        <button style={titleStyles.button} onClick={() => setStarted(true)}>
          Start
        </button>
        <p style={titleStyles.hint}>WASD / Arrows to move · Space to jump · Shift or E to boost</p>
      </div>
    )
  }

  return (
    <>
      <Canvas shadows camera={{ position: [0, 4.4, 13.5], fov: 50 }}>
        <Suspense fallback={null}>
          <Level />
          <RobotController />
          {COLLECTIBLES.map((c) => (
            <CollectibleBot key={c.id} def={c} />
          ))}
          <FollowCamera />
        </Suspense>
      </Canvas>
      <Hud />
    </>
  )
}

const titleStyles: Record<string, CSSProperties> = {
  root: {
    height: '100%', display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', gap: 14,
    background: 'radial-gradient(circle at 50% 30%, #1c2a44, #0a0a12)',
    color: '#fff', fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
  },
  title: { fontSize: 40, margin: 0, letterSpacing: '-0.02em' },
  subtitle: { margin: 0, color: 'rgba(255,255,255,0.6)', fontSize: 14 },
  button: {
    marginTop: 10, padding: '10px 28px', fontSize: 15, fontWeight: 700,
    borderRadius: 999, border: 'none', background: '#4f8cff', color: '#fff', cursor: 'pointer',
  },
  hint: { position: 'absolute', bottom: 24, fontSize: 12, color: 'rgba(255,255,255,0.4)' },
}
