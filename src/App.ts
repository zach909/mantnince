import {
  hardDriveIcon,
  databaseIcon,
  shieldIcon,
  downloadIcon,
  refreshCwIcon,
  fileTextIcon,
  activityIcon,
  gamepad2Icon,
  alertTriangleIcon,
} from './lib/icons'
import { el, clear } from './lib/dom'
import { mountPlayroomWall } from './components/PlayroomWall'

interface Capture {
  id: string
  filename: string
  url: string
  size: number
  saved: number
  duplicate: boolean
  risky?: boolean
  date: string
}

interface Stats {
  totalBackups: number
  totalSizeGb: string
  savedGb: string
  dedupRate: number
  lastBackup: string | null
  recentCaptures: Capture[]
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0)} ${units[i]}`
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  const now = new Date()
  const diffMin = Math.floor((now.getTime() - d.getTime()) / 60000)
  if (diffMin < 1) return 'Just now'
  if (diffMin < 60) return `${diffMin}m ago`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `${diffH}h ago`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

type View = 'stats' | 'playroom'

function loadingView(): HTMLElement {
  return el(
    'div',
    { className: 'state-center' },
    el('div', { className: 'spinner' }),
    el('span', { className: 'subtitle' }, 'Loading backups...'),
  )
}

function errorView(message: string, onRetry: () => void): HTMLElement {
  return el(
    'div',
    { className: 'state-center' },
    alertTriangleIcon({ size: 32, className: 'icon-error' }),
    el('p', { className: 'text-error' }, 'Connection error'),
    el('p', { className: 'subtitle' }, message),
    el('button', { className: 'btn btn-primary', onclick: onRetry }, 'Retry'),
  )
}

function statCard(icon: SVGElement, label: string, value: string, hint: string): HTMLElement {
  return el(
    'div',
    { className: 'stat-card' },
    el('div', { className: 'stat-card__label' }, icon, label),
    el('div', { className: 'stat-card__value' }, value),
    el('div', { className: 'stat-card__hint' }, hint),
  )
}

function captureRow(c: Capture): HTMLElement {
  const name = el('span', {}, c.filename)
  const nameLine = c.risky
    ? el('p', { className: 'capture-name' }, alertTriangleIcon({ size: 12, className: 'icon-risk' }), name)
    : el('p', { className: 'capture-name' }, name)

  return el(
    'div',
    { className: 'capture-row' },
    el('div', { className: `capture-dot${c.duplicate ? ' is-dup' : ''}` }),
    el('div', { className: 'capture-main' }, nameLine, el('p', { className: 'capture-date' }, formatDate(c.date))),
    el(
      'div',
      { className: 'capture-meta' },
      el('p', { className: 'capture-size' }, formatBytes(c.size)),
      c.duplicate
        ? el('span', { className: 'capture-badge is-dup' }, 'Deduped')
        : el('span', { className: 'capture-badge is-new' }, 'New'),
    ),
  )
}

function statsView(stats: Stats | null, onRefresh: () => void): HTMLElement {
  const savedPercent =
    stats && stats.totalBackups > 0 ? Math.round((parseFloat(stats.savedGb) / parseFloat(stats.totalSizeGb)) * 100) : 0

  const header = el(
    'div',
    { className: 'row-between' },
    el(
      'div',
      {},
      el('h1', { className: 'title' }, 'Backup Cloud'),
      el('p', { className: 'subtitle' }, stats ? `${stats.totalBackups} captures` : 'No captures'),
    ),
    el('button', { className: 'btn btn-ghost', onclick: onRefresh }, refreshCwIcon({ size: 12 }), 'Refresh'),
  )

  const children: (HTMLElement | undefined)[] = [header]

  if (stats) {
    children.push(
      el(
        'div',
        { className: 'stats-grid' },
        statCard(hardDriveIcon({ size: 14 }), 'Total saved', `${stats.savedGb} GB`, `${savedPercent}% dedup`),
        statCard(databaseIcon({ size: 14 }), 'Total size', `${stats.totalSizeGb} GB`, `${stats.totalBackups} files`),
      ),
    )
  }

  if (stats && stats.recentCaptures.length > 0) {
    children.push(
      el(
        'div',
        {},
        el('h2', { className: 'section-title' }, fileTextIcon({ size: 12 }), 'Recent captures'),
        el('div', { className: 'capture-list' }, ...stats.recentCaptures.map(captureRow)),
      ),
    )
  }

  if (!stats || stats.totalBackups === 0) {
    children.push(
      el(
        'div',
        { className: 'empty-state' },
        shieldIcon({ size: 32, className: 'icon-muted' }),
        el('p', { className: 'subtitle' }, 'No backups captured yet'),
        el(
          'p',
          { className: 'empty-state__hint' },
          'Downloads will appear here automatically. The extension captures every download via URL-based deduplication.',
        ),
      ),
    )
  }

  children.push(
    el(
      'div',
      { className: 'footer-row' },
      el('span', {}, 'URL-based dedup active'),
      el('span', {}, downloadIcon({ size: 12 }), 'Monitoring downloads'),
    ),
  )

  return el('div', { className: 'stats-view' }, ...(children as HTMLElement[]))
}

function mountStatsView(container: HTMLElement): () => void {
  let stats: Stats | null = null
  let loading = true
  let error: string | null = null
  let disposed = false

  function render() {
    if (disposed) return
    clear(container)
    if (loading) {
      container.appendChild(loadingView())
    } else if (error) {
      container.appendChild(errorView(error, fetchStats))
    } else {
      container.appendChild(statsView(stats, fetchStats))
    }
  }

  function fetchStats() {
    loading = true
    error = null
    render()
    chrome.runtime.sendMessage({ type: 'GET_STATS' }, (res) => {
      if (disposed) return
      if (chrome.runtime.lastError) {
        error = chrome.runtime.lastError.message ?? 'Unknown error'
        loading = false
        render()
        return
      }
      if (res?.error) {
        error = res.error
        loading = false
        render()
        return
      }
      stats = res?.data || null
      loading = false
      render()
    })
  }

  fetchStats()
  return () => {
    disposed = true
  }
}

function tabButton(id: View, label: string, icon: SVGElement, active: boolean, onClick: () => void): HTMLElement {
  return el(
    'button',
    { className: `tabbar__btn${active ? ' is-active' : ''}`, onclick: onClick },
    icon,
    label,
  )
}

export function mountApp(root: HTMLElement): void {
  let view: View = 'stats'
  let disposeCurrent: (() => void) | null = null

  const tabBar = el('div', { className: 'tabbar' })
  const content = el('div', { className: 'view-content' })
  root.appendChild(el('div', { className: 'popup' }, tabBar, content))

  function setView(next: View) {
    if (view === next) return
    view = next
    render()
  }

  function render() {
    clear(tabBar)
    tabBar.appendChild(tabButton('stats', 'Stats', shieldIcon({ size: 14 }), view === 'stats', () => setView('stats')))
    tabBar.appendChild(
      tabButton('playroom', 'Playroom', gamepad2Icon({ size: 14 }), view === 'playroom', () => setView('playroom')),
    )

    disposeCurrent?.()
    clear(content)
    disposeCurrent = view === 'stats' ? mountStatsView(content) : mountPlayroomWall(content)
  }

  render()
}
