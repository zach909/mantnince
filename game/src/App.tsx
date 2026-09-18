import { Suspense, useEffect, useState, type CSSProperties } from 'react'
import { Canvas } from '@react-three/fiber'
import { RobotController } from './components/RobotController'
import { FollowCamera } from './components/FollowCamera'
import { Level } from './components/Level'
import { CollectibleBot } from './components/CollectibleBot'
import { Hud } from './components/Hud'
import { buildCollectibleDefs } from './constants'
import { useBackendStore } from './state/backendStore'
import { loadConnectConfig } from './lib/backendClient'

type Screen = 'title' | 'playing'

export default function App() {
  const [screen, setScreen] = useState<Screen>('title')
  const [showConnect, setShowConnect] = useState(false)
  const [apiUrl, setApiUrl] = useState('http://127.0.0.1:8000')
  const [token, setToken] = useState('')

  const { data, loading, load, connect, useDemo } = useBackendStore()

  useEffect(() => {
    load()
  }, [load])

  if (screen === 'title' || !data) {
    const existingCfg = loadConnectConfig()
    return (
      <div style={titleStyles.root}>
        <h1 style={titleStyles.title}>Deben&rsquo;s Adventure</h1>
        <p style={titleStyles.subtitle}>a playable tour of your Universal Backup Cloud</p>

        {loading && <p style={titleStyles.status}>Loading your backup data…</p>}
        {!loading && data && (
          <p style={titleStyles.status}>
            {data.source === 'live' ? '● Connected to your live Backup Cloud' : '○ Showing demo data'}
            {data.error && <span style={titleStyles.errorNote}> — {data.error}</span>}
          </p>
        )}

        <button style={titleStyles.button} disabled={loading || !data} onClick={() => setScreen('playing')}>
          Start
        </button>

        <button style={titleStyles.linkButton} onClick={() => setShowConnect((v) => !v)}>
          {showConnect ? 'Hide' : existingCfg ? 'Edit connection' : 'Connect to your live Backup Cloud'}
        </button>

        {showConnect && (
          <div style={titleStyles.connectPanel}>
            <label style={titleStyles.label}>
              API endpoint
              <input
                style={titleStyles.input}
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                placeholder="http://127.0.0.1:8000"
              />
            </label>
            <label style={titleStyles.label}>
              Bearer token
              <input
                style={titleStyles.input}
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="from POST /api/auth/token"
              />
            </label>
            <div style={titleStyles.connectRow}>
              <button
                style={titleStyles.smallButton}
                disabled={!apiUrl || !token || loading}
                onClick={() => connect({ apiUrl, token })}
              >
                Connect
              </button>
              <button style={titleStyles.smallGhostButton} onClick={() => useDemo()}>
                Use demo data
              </button>
            </div>
          </div>
        )}

        <p style={titleStyles.hint}>WASD / Arrows to move · Space to jump · Shift or E for the optimizer thruster</p>
      </div>
    )
  }

  const collectibles = buildCollectibleDefs(data.devices.map((d) => d.name))

  return (
    <>
      <Canvas shadows camera={{ position: [0, 4.4, 13.5], fov: 50 }}>
        <Suspense fallback={null}>
          <Level data={data} />
          <RobotController />
          {collectibles.map((c) => (
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
    alignItems: 'center', justifyContent: 'center', gap: 10,
    background: 'radial-gradient(circle at 50% 30%, #1c2a44, #0a0a12)',
    color: '#fff', fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
    padding: 24,
  },
  title: { fontSize: 40, margin: 0, letterSpacing: '-0.02em' },
  subtitle: { margin: 0, color: 'rgba(255,255,255,0.6)', fontSize: 14 },
  status: { margin: '4px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.65)' },
  errorNote: { color: '#f0a2a2' },
  button: {
    marginTop: 10, padding: '10px 28px', fontSize: 15, fontWeight: 700,
    borderRadius: 999, border: 'none', background: '#4f8cff', color: '#fff', cursor: 'pointer',
  },
  linkButton: {
    marginTop: 4, background: 'none', border: 'none', color: '#8eb4ff',
    fontSize: 12, cursor: 'pointer', textDecoration: 'underline',
  },
  connectPanel: {
    marginTop: 4, width: 280, background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: 14,
    display: 'flex', flexDirection: 'column', gap: 10,
  },
  label: { fontSize: 11, color: 'rgba(255,255,255,0.6)', display: 'flex', flexDirection: 'column', gap: 4 },
  input: {
    background: '#101217', border: '1px solid #363d49', borderRadius: 8,
    color: '#fff', padding: '8px 10px', fontSize: 12, outline: 'none',
  },
  connectRow: { display: 'flex', gap: 8 },
  smallButton: {
    flex: 1, padding: '8px 0', fontSize: 12, fontWeight: 700, borderRadius: 8,
    border: 'none', background: '#4f8cff', color: '#fff', cursor: 'pointer',
  },
  smallGhostButton: {
    flex: 1, padding: '8px 0', fontSize: 12, fontWeight: 600, borderRadius: 8,
    border: '1px solid rgba(255,255,255,0.16)', background: 'transparent', color: '#fff', cursor: 'pointer',
  },
  hint: { position: 'absolute', bottom: 24, fontSize: 12, color: 'rgba(255,255,255,0.4)' },
}
