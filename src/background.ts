import { createClient } from '@blinkdotnew/sdk';
import { assessSiteRisk } from './lib/siteRisk';

const PROJECT_ID = import.meta.env.VITE_BLINK_PROJECT_ID;
const SECRET_KEY = import.meta.env.VITE_BLINK_SECRET_KEY;
const API = `https://core.blink.new/api`;
const headers: Record<string, string> = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SECRET_KEY}` };
const BLINK_MODULES = new Set(['ai', 'db', 'storage', 'data', 'realtime', 'notifications', 'analytics', 'connectors', 'rag']);

const blink = createClient({ projectId: PROJECT_ID, secretKey: SECRET_KEY });
console.log('BLINK_BG_READY', PROJECT_ID);

// ── Helpers ──────────────────────────────────────────────

function hashString(str: string): string {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h) + str.charCodeAt(i);
    h |= 0;
  }
  return `sha256-${Math.abs(h).toString(16)}`;
}

function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 11)}`;
}

function normalizeBlinkPath(rawPath: string, projectId: string): string {
  const [pathPart, queryPart] = String(rawPath || '').trim().split('?');
  let path = pathPart.replace(/^https?:\/\/[^/]+\/?/i, '').replace(/^\/+/, '').replace(/^api\//, '');
  const parts = path.split('/').filter(Boolean);
  if (!parts.length) throw new Error('Invalid API path');
  if (BLINK_MODULES.has(parts[0]) && parts[1] !== projectId) parts.splice(1, 0, projectId);
  const normalized = parts.join('/');
  return queryPart ? `${normalized}?${queryPart}` : normalized;
}

// ── Download capture ─────────────────────────────────────

chrome.downloads.onChanged.addListener(async (delta) => {
  if (delta.state?.current !== 'complete') return;

  try {
    const [download] = await chrome.downloads.search({ id: delta.id });
    if (!download?.url || !download?.filename) return;

    // Compute a simple hash from URL+filename
    const fileHash = hashString(`${download.url}|${download.filename}`);
    const parts = download.filename.split(/[\\/]/);
    const name = parts[parts.length - 1] || download.filename;

    // Check for duplicates
    const existing = await blink.db
      .table<{ id: string; url: string; fileHash: string }>('backup_captures')
      .list({ where: { fileHash } });

    const isDuplicate = existing.length > 0;
    const storageSaved = isDuplicate ? download.fileSize || 0 : 0;
    const siteRisk = assessSiteRisk(download.referrer || download.url);

    const capture = await blink.db
      .table<{
        id: string; userId: string; url: string; filename: string;
        fileHash: string; fileSize: number; referrer: string;
        storageSaved: number; duplicateOf: string | null;
        siteRisky: boolean; siteRiskReasons: string;
        createdAt: string; updatedAt: string;
      }>('backup_captures')
      .create({
        id: uid(),
        userId: 'system',
        url: download.url,
        filename: name,
        fileHash,
        fileSize: download.fileSize || 0,
        referrer: download.referrer || '',
        storageSaved: storageSaved,
        duplicateOf: isDuplicate ? existing[0].id : null,
        siteRisky: siteRisk.risky,
        siteRiskReasons: siteRisk.reasons.join('; '),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

    // Update badge
    const { captures = [] } = await chrome.storage.local.get(['captures']);
    captures.push({ id: capture.id, filename: name, saved: storageSaved, risky: siteRisk.risky });
    await chrome.storage.local.set({ captures, lastCapture: capture });

    const badgeText = isDuplicate ? 'DUP' : String(captures.length);
    chrome.action.setBadgeText({ text: badgeText });
    chrome.action.setBadgeBackgroundColor({ color: isDuplicate ? '#22a06b' : '#4f8cff' });

    console.log(`Captured: ${name}${isDuplicate ? ' (DUPLICATE — storage saved!)' : ''}`);
  } catch (err) {
    console.error('Capture failed:', err);
  }
});

// ── Background-initiated housekeeping ────────────────────

chrome.runtime.onInstalled.addListener(async () => {
  await chrome.storage.local.set({ captures: [] });
  chrome.action.setBadgeText({ text: '' });
});

// Every 30 min, sync capture count from DB to badge
chrome.alarms.create('sync-badge', { periodInMinutes: 30 });

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== 'sync-badge') return;
  try {
    const captures = await blink.db
      .table<{ id: string }>('backup_captures')
      .list({ limit: 100 });
    const count = captures.length;
    chrome.action.setBadgeText({ text: count > 0 ? String(count) : '' });
  } catch {
    // Silently skip — DB might not be reachable
  }
});

// ── API gateway for popup/content scripts ────────────────

chrome.runtime.onMessage.addListener((msg: any, sender, sendResponse) => {
  // BLINK_API — proxy for popup/content
  if (msg.type === 'BLINK_API') {
    if (!msg.path) { sendResponse({ error: 'No API path' }); return true; }
    const method = msg.method || 'GET';
    const reqHeaders = (method === 'POST' || method === 'PATCH')
      ? { ...headers, 'Content-Type': 'application/json', 'Prefer': 'return=representation' }
      : headers;
    const opts: RequestInit = { method, headers: reqHeaders };
    if (msg.body) opts.body = JSON.stringify(msg.body);
    let normalizedPath: string;
    try {
      normalizedPath = normalizeBlinkPath(msg.path, PROJECT_ID);
    } catch (error: any) {
      sendResponse({ error: error?.message || 'Invalid API path' });
      return true;
    }
    fetch(`${API}/${normalizedPath}`, opts)
      .then(async (r) => {
        if (!r.ok) { const e = await r.text(); sendResponse({ error: `API ${r.status}: ${e.slice(0,200)}` }); return; }
        sendResponse({ data: await r.json() });
      })
      .catch(e => { sendResponse({ error: e.message }); });
    return true;
  }

  // CONTENT_CAPTURE — content script captured a manual selection
  if (msg.type === 'CONTENT_CAPTURE') {
    (async () => {
      try {
        const { url, filename, hash: rawHash, siteRisk } = msg.data;
        const fileHash = rawHash || hashString(`${url}|${filename}`);
        const existing = await blink.db
          .table<{ id: string; url: string; fileHash: string }>('backup_captures')
          .list({ where: { fileHash } });
        const isDuplicate = existing.length > 0;
        const risk = siteRisk ?? assessSiteRisk(url);

        await blink.db
          .table<{
            id: string; userId: string; url: string; filename: string;
            fileHash: string; fileSize: number; referrer: string;
            storageSaved: number; duplicateOf: string | null;
            siteRisky: boolean; siteRiskReasons: string;
            createdAt: string; updatedAt: string;
          }>('backup_captures')
          .create({
            id: uid(),
            userId: 'system',
            url,
            filename,
            fileHash,
            fileSize: msg.data.fileSize || 0,
            referrer: '',
            storageSaved: isDuplicate ? (msg.data.fileSize || 0) : 0,
            duplicateOf: isDuplicate ? existing[0].id : null,
            siteRisky: risk.risky,
            siteRiskReasons: risk.reasons.join('; '),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });

        const { captures = [] } = await chrome.storage.local.get(['captures']);
        captures.push({ id: uid(), filename, saved: isDuplicate ? (msg.data.fileSize || 0) : 0, risky: risk.risky });
        await chrome.storage.local.set({ captures });

        chrome.action.setBadgeText({ text: String(captures.length) });
        chrome.action.setBadgeBackgroundColor({ color: isDuplicate ? '#22a06b' : '#4f8cff' });

        sendResponse({ ok: true, duplicate: isDuplicate });
      } catch (err: any) {
        sendResponse({ error: err.message });
      }
    })();
    return true;
  }

  // GET_STATS — popup requests latest stats
  if (msg.type === 'GET_STATS') {
    (async () => {
      try {
        const captures = await blink.db
          .table<{ id: string; fileSize: number; storageSaved: number; duplicateOf: string | null; siteRisky: boolean; createdAt: string }>('backup_captures')
          .list({ orderBy: { createdAt: 'desc' }, limit: 50 });

        const totalBackups = captures.length;
        const totalSize = captures.reduce((s, c) => s + (c.fileSize || 0), 0);
        const savedSize = captures.reduce((s, c) => s + (Number(c.storageSaved) || 0), 0);
        const dedupCount = captures.filter(c => c.duplicateOf).length;
        const dedupRate = totalBackups > 0 ? Math.round((dedupCount / totalBackups) * 100) : 0;
        const lastBackup = captures[0]?.createdAt || null;

        sendResponse({
          data: {
            totalBackups,
            totalSizeGb: (totalSize / (1024 ** 3)).toFixed(1),
            savedGb: (savedSize / (1024 ** 3)).toFixed(1),
            dedupRate,
            lastBackup,
            recentCaptures: captures.slice(0, 10).map(c => ({
              id: c.id,
              filename: (c as any).filename || 'unknown',
              url: (c as any).url || '',
              size: c.fileSize,
              saved: Number(c.storageSaved) || 0,
              duplicate: !!c.duplicateOf,
              risky: !!c.siteRisky,
              date: c.createdAt,
            })),
          }
        });
      } catch (err: any) {
        sendResponse({ error: err.message });
      }
    })();
    return true;
  }
});
