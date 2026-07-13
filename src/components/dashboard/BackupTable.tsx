import { FileText, ExternalLink, Shield } from 'lucide-react'
import type { BackupCapture } from '@/types/backup'

interface BackupTableProps {
  backups: BackupCapture[]
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  const val = bytes / Math.pow(1024, i)
  return `${val.toFixed(i > 0 ? 1 : 0)} ${units[i]}`
}

function truncateUrl(url: string, max = 38): string {
  return url.length > max ? `${url.slice(0, max)}...` : url
}

export function BackupTable({ backups }: BackupTableProps) {
  if (backups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card px-6 py-12">
        <FileText className="size-8 text-muted-foreground/40" />
        <p className="mt-3 text-sm font-medium text-muted-foreground">
          No backup captures yet
        </p>
        <p className="mt-1 text-xs text-muted-foreground/60">
          Captured files will appear here once backups start running.
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th className="px-5 py-3 text-xs font-medium text-muted-foreground">
                File
              </th>
              <th className="px-5 py-3 text-xs font-medium text-muted-foreground">
                Source URL
              </th>
              <th className="px-5 py-3 text-xs font-medium text-muted-foreground">
                Size
              </th>
              <th className="px-5 py-3 text-xs font-medium text-muted-foreground">
                Saved
              </th>
              <th className="px-5 py-3 text-xs font-medium text-muted-foreground">
                Date
              </th>
            </tr>
          </thead>
          <tbody>
            {backups.map((b) => (
              <tr
                key={b.id}
                className="border-b border-border/60 transition-colors hover:bg-muted/30 last:border-b-0"
              >
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    <FileText className="size-3.5 shrink-0 text-muted-foreground" />
                    <span className="font-medium text-foreground truncate max-w-[140px]">
                      {b.filename}
                    </span>
                  </div>
                </td>
                <td className="px-5 py-3.5">
                  <a
                    href={b.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {truncateUrl(b.url)}
                    <ExternalLink className="size-3 shrink-0" />
                  </a>
                </td>
                <td className="px-5 py-3.5 text-xs text-muted-foreground tabular-nums">
                  {formatBytes(b.fileSize)}
                </td>
                <td className="px-5 py-3.5">
                  {b.storageSaved > 0 ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-chart-4/15 px-2 py-0.5 text-xs font-medium text-chart-4">
                      <Shield className="size-3" />
                      {formatBytes(b.storageSaved)}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </td>
                <td className="px-5 py-3.5 text-xs text-muted-foreground tabular-nums whitespace-nowrap">
                  {new Date(b.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
