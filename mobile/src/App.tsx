import { useEffect, useState, type CSSProperties } from 'react'
import { loadSession, saveSession, login, register, type Session } from './lib/backendClient'
import { Dashboard } from './components/Dashboard'

const DEFAULT_API_URL = 'http://10.0.2.2:8000' // Android emulator's alias for the host machine's localhost

export default function App() {
  const [session, setSession] = useState<Session | null>(() => loadSession())
  const [apiUrl, setApiUrl] = useState(DEFAULT_API_URL)
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (session) saveSession(session)
  }, [session])

  function signOut() {
    setSession(null)
    saveSession(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      if (mode === 'register') {
        await register(apiUrl, username, email, password)
      }
      const s = await login(apiUrl, username, password)
      setSession(s)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  if (session) {
    return <Dashboard session={session} onSignOut={signOut} />
  }

  return (
    <div style={styles.root}>
      <div style={styles.header}>
        <div style={styles.logo}>☁</div>
        <h1 style={styles.title}>Backup Cloud</h1>
        <p style={styles.subtitle}>Universal Backup Cloud — mobile</p>
      </div>

      <form style={styles.form} onSubmit={handleSubmit}>
        <div style={styles.tabs}>
          <button
            type="button"
            style={{ ...styles.tab, ...(mode === 'login' ? styles.tabActive : {}) }}
            onClick={() => setMode('login')}
          >
            Log in
          </button>
          <button
            type="button"
            style={{ ...styles.tab, ...(mode === 'register' ? styles.tabActive : {}) }}
            onClick={() => setMode('register')}
          >
            Create account
          </button>
        </div>

        <label style={styles.label}>
          API endpoint
          <input
            style={styles.input}
            value={apiUrl}
            onChange={(e) => setApiUrl(e.target.value)}
            placeholder="http://10.0.2.2:8000"
            autoCapitalize="none"
          />
        </label>
        <p style={styles.hint}>
          Android emulator: leave as 10.0.2.2. A real phone needs your computer's LAN
          IP (e.g. http://192.168.1.20:8000) — same network, server started with
          --host 0.0.0.0.
        </p>

        <label style={styles.label}>
          Username
          <input style={styles.input} value={username} onChange={(e) => setUsername(e.target.value)} autoCapitalize="none" />
        </label>

        {mode === 'register' && (
          <label style={styles.label}>
            Email
            <input style={styles.input} type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoCapitalize="none" />
          </label>
        )}

        <label style={styles.label}>
          Password
          <input style={styles.input} type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>

        {error && <p style={styles.error}>{error}</p>}

        <button type="submit" style={styles.submit} disabled={loading || !apiUrl || !username || !password}>
          {loading ? 'Working…' : mode === 'login' ? 'Log in' : 'Create account & log in'}
        </button>
      </form>
    </div>
  )
}

const styles: Record<string, CSSProperties> = {
  root: {
    height: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column',
    background: '#0a0a0a', color: 'rgba(255,255,255,0.92)',
    fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
    padding: '48px 20px 24px',
  },
  header: { textAlign: 'center', marginBottom: 28 },
  logo: {
    width: 56, height: 56, borderRadius: 16, background: '#4f8cff', color: '#fff',
    fontSize: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px',
  },
  title: { fontSize: 22, margin: 0 },
  subtitle: { margin: '4px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.55)' },
  form: {
    background: '#14161a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16,
    padding: 18, display: 'flex', flexDirection: 'column', gap: 4,
  },
  tabs: { display: 'flex', gap: 6, marginBottom: 10, background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: 4 },
  tab: {
    flex: 1, padding: '8px 0', fontSize: 13, fontWeight: 600, borderRadius: 8, border: 'none',
    background: 'transparent', color: 'rgba(255,255,255,0.55)', cursor: 'pointer',
  },
  tabActive: { background: '#4f8cff', color: '#fff' },
  label: { fontSize: 12, color: 'rgba(255,255,255,0.6)', display: 'flex', flexDirection: 'column', gap: 5, marginTop: 12 },
  input: {
    background: '#101217', border: '1px solid #363d49', borderRadius: 10,
    color: '#fff', padding: '11px 12px', fontSize: 15, outline: 'none',
  },
  hint: { fontSize: 10.5, color: 'rgba(255,255,255,0.4)', margin: '4px 0 0', lineHeight: 1.4 },
  error: { color: '#f0a2a2', fontSize: 12.5, marginTop: 12 },
  submit: {
    marginTop: 18, padding: '13px 0', fontSize: 15, fontWeight: 700, borderRadius: 12,
    border: 'none', background: '#4f8cff', color: '#fff', cursor: 'pointer',
  },
}
