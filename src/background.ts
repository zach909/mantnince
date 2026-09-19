// Background service worker — captures downloads, deduplicates them by
// content hash, and answers stats/capture requests from the popup and
// content script. Everything is stored locally via chrome.storage.local;
// no network requests are made.

import { assessSiteRisk } from './lib/siteRisk';
import { addCapture, findCaptureByHash, hashString, listCaptures, uid, type Capture } from './lib/localStore';

async function refreshBadge() {
  const captures = await listCaptures();
  chrome.action.setBadgeText({ text: captures.length > 0 ? String(captures.length) : '' });
}

async function recordCapture(input: {
  url: string;
  filename: string;
  fileSize: number;
  referrer?: string;
  fileHash?: string | null;
  siteRisk?: { risky: boolean; reasons: string[] };
}): Promise<{ capture: Capture; isDuplicate: boolean }> {
  const fileHash = input.fileHash || hashString(`${input.url}|${input.filename}`);
  const existing = await findCaptureByHash(fileHash);
  const isDuplicate = !!existing;
  const risk = input.siteRisk ?? assessSiteRisk(input.referrer || input.url);

  const capture: Capture = {
    id: uid(),
    url: input.url,
    filename: input.filename,
    fileHash,
    fileSize: input.fileSize || 0,
    referrer: input.referrer || '',
    storageSaved: isDuplicate ? input.fileSize || 0 : 0,
    duplicateOf: isDuplicate ? existing!.id : null,
    siteRisky: risk.risky,
    siteRiskReasons: risk.reasons.join('; '),
    createdAt: new Date().toISOString(),
  };

  await addCapture(capture);
  chrome.action.setBadgeBackgroundColor({ color: isDuplicate ? '#22a06b' : '#4f8cff' });
  await refreshBadge();

  return { capture, isDuplicate };
}

// ── Download capture ─────────────────────────────────────

chrome.downloads.onChanged.addListener(async (delta) => {
  if (delta.state?.current !== 'complete') return;

  try {
    const [download] = await chrome.downloads.search({ id: delta.id });
    if (!download?.url || !download?.filename) return;

    const parts = download.filename.split(/[\\/]/);
    const name = parts[parts.length - 1] || download.filename;

    console.log(`Captured: ${name}`);
    await recordCapture({
      url: download.url,
      filename: name,
      fileSize: download.fileSize || 0,
      referrer: download.referrer,
    });
  } catch (err) {
    console.error('Capture failed:', err);
  }
});

// ── Background-initiated housekeeping ────────────────────

chrome.runtime.onInstalled.addListener(async () => {
  chrome.action.setBadgeText({ text: '' });
});

// Every 30 min, resync the badge from stored captures.
chrome.alarms.create('sync-badge', { periodInMinutes: 30 });

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name !== 'sync-badge') return;
  refreshBadge().catch(() => {
    // Storage is always local — nothing to silently skip, but keep the
    // alarm handler resilient regardless.
  });
});

// ── Message handlers for popup/content scripts ───────────

chrome.runtime.onMessage.addListener((msg: any, _sender, sendResponse) => {
  if (msg.type === 'CONTENT_CAPTURE') {
    (async () => {
      try {
        const { url, filename, hash, fileSize, siteRisk } = msg.data;
        const { isDuplicate } = await recordCapture({
          url,
          filename,
          fileSize: fileSize || 0,
          fileHash: hash,
          siteRisk,
        });
        sendResponse({ ok: true, duplicate: isDuplicate });
      } catch (err: any) {
        sendResponse({ error: err.message });
      }
    })();
    return true;
  }

  if (msg.type === 'GET_STATS') {
    (async () => {
      try {
        const captures = (await listCaptures()).slice(0, 50);

        const totalBackups = captures.length;
        const totalSize = captures.reduce((s, c) => s + (c.fileSize || 0), 0);
        const savedSize = captures.reduce((s, c) => s + (c.storageSaved || 0), 0);
        const dedupCount = captures.filter((c) => c.duplicateOf).length;
        const dedupRate = totalBackups > 0 ? Math.round((dedupCount / totalBackups) * 100) : 0;
        const lastBackup = captures[0]?.createdAt || null;

        sendResponse({
          data: {
            totalBackups,
            totalSizeGb: (totalSize / 1024 ** 3).toFixed(1),
            savedGb: (savedSize / 1024 ** 3).toFixed(1),
            dedupRate,
            lastBackup,
            recentCaptures: captures.slice(0, 10).map((c) => ({
              id: c.id,
              filename: c.filename,
              url: c.url,
              size: c.fileSize,
              saved: c.storageSaved,
              duplicate: !!c.duplicateOf,
              risky: !!c.siteRisky,
              date: c.createdAt,
            })),
          },
        });
      } catch (err: any) {
        sendResponse({ error: err.message });
      }
    })();
    return true;
  }
});
