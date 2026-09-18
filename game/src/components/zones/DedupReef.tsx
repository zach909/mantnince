import type { BackupStatus } from '../../lib/backendClient'
import { Kiosk, Panel, Row } from './Kiosk'

function formatAgo(iso: string | null): string {
  if (!iso) return 'never'
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  return `${Math.floor(mins / 60)}h ago`
}

/** Represents the real content-hash dedup engine (server/services/dedup.py):
 * a little reef of "file crystals" where fused pairs stand in for bytes that
 * were only ever stored once. */
export function DedupReef({ backup, position }: { backup: BackupStatus; position: [number, number, number] }) {
  const savedPct = backup.total_size_gb > 0 ? Math.round((backup.storage_saved_gb / backup.total_size_gb) * 100) : 0
  const crystalCount = Math.min(10, Math.max(3, Math.round(backup.total_backups / 25)))

  return (
    <group position={position}>
      {Array.from({ length: crystalCount }).map((_, i) => {
        const angle = (i / crystalCount) * Math.PI * 2
        const r = 1.5 + (i % 3) * 0.25
        const fused = i % 3 === 0
        return (
          <group key={i} position={[Math.cos(angle) * r, 0, Math.sin(angle) * r]} rotation={[0, angle, 0]}>
            <mesh castShadow position={[fused ? -0.1 : 0, 0.35, 0]}>
              <octahedronGeometry args={[0.28, 0]} />
              <meshStandardMaterial color="#2fb6a3" emissive="#1c6e63" emissiveIntensity={0.4} roughness={0.3} />
            </mesh>
            {fused && (
              <mesh castShadow position={[0.15, 0.35, 0]}>
                <octahedronGeometry args={[0.28, 0]} />
                <meshStandardMaterial color="#2fb6a3" emissive="#1c6e63" emissiveIntensity={0.4} roughness={0.3} />
              </mesh>
            )}
          </group>
        )
      })}
      <Kiosk color="#1f8f7d">
        <Panel title="Dedup Reef">
          <Row label="Files backed up" value={String(backup.total_backups)} />
          <Row label="Total stored" value={`${backup.total_size_gb.toFixed(1)} GB`} />
          <Row label="Saved by dedup" value={`${backup.storage_saved_gb.toFixed(1)} GB (${savedPct}%)`} tone="good" />
          <Row label="Last backup" value={formatAgo(backup.last_backup)} tone="muted" />
        </Panel>
      </Kiosk>
    </group>
  )
}
