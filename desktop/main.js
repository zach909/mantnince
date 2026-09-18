const { app, BrowserWindow, ipcMain, shell, dialog } = require('electron');
const path = require('node:path');
const os = require('node:os');
const fs = require('node:fs');
const { execFile } = require('node:child_process');

const DEFAULT_API = process.env.BACKUP_API_URL || 'http://127.0.0.1:8000';
const state = { apiUrl: DEFAULT_API, token: process.env.BACKUP_API_TOKEN || '', demo: process.env.BACKUP_DEMO === '1' };
const demoEarnings = { total: 0, count: 0 };

let mainWin = null;
let screensaverWin = null;

function createWindow() {
  mainWin = new BrowserWindow({
    width: 460, height: 700, minWidth: 400, minHeight: 560,
    backgroundColor: '#0f1115',
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: true }
  });
  mainWin.loadFile(path.join(__dirname, 'renderer', 'index.html'));
}

function createScreensaverWindow() {
  if (screensaverWin) { screensaverWin.focus(); return screensaverWin; }
  screensaverWin = new BrowserWindow({
    width: 480, height: 320, resizable: false,
    backgroundColor: '#0a0a0a',
    title: 'Ad break — earning storage credit',
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: true }
  });
  screensaverWin.setMenuBarVisibility(false);
  screensaverWin.loadFile(path.join(__dirname, 'renderer', 'screensaver.html'));
  screensaverWin.on('closed', () => {
    screensaverWin = null;
    mainWin?.webContents.send('earnings:changed');
  });
  return screensaverWin;
}

async function request(endpoint, options = {}) {
  if (state.demo) return demoResponse(endpoint, options);
  const response = await fetch(`${state.apiUrl.replace(/\/$/, '')}${endpoint}`, {
    ...options, headers: { Accept: 'application/json', ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...(state.token ? { Authorization: `Bearer ${state.token}` } : {}), ...(options.headers || {}) }
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.detail || `API request failed (${response.status})`);
  return body;
}

function demoResponse(endpoint, options = {}) {
  if (endpoint === '/api/devices') return { devices: [{ id: 'demo-device', name: 'This desktop', type: 'desktop', platform: process.platform, os_version: process.getSystemVersion(), status: 'online' }] };
  if (endpoint === '/api/backup/status') return { total_backups: 12, total_size_gb: 1.84, storage_saved_gb: 0.42, last_backup: new Date().toISOString() };
  if (endpoint === '/api/ads/record') {
    demoEarnings.total = Math.round((demoEarnings.total + 0.15) * 100) / 100;
    demoEarnings.count += 1;
    return { earnings: 0.15, total_earnings: demoEarnings.total };
  }
  if (endpoint === '/api/ads/earnings') {
    return { total: demoEarnings.total, ads_watched: demoEarnings.count, note: 'Demo mode — local mock, not synced to a server.' };
  }
  return { device_id: 'demo-device', message: 'Demo mode: no server changes made' };
}

// ── System health (real, read-only) ──────────────────────────────────
function round2(n) { return Math.round(n * 100) / 100; }

function cpuSnapshot() {
  return os.cpus().map((c) => {
    const total = Object.values(c.times).reduce((a, b) => a + b, 0);
    return { idle: c.times.idle, total };
  });
}

function cpuPercentFrom(before, after) {
  let idleDiff = 0, totalDiff = 0;
  for (let i = 0; i < before.length; i++) {
    idleDiff += after[i].idle - before[i].idle;
    totalDiff += after[i].total - before[i].total;
  }
  if (totalDiff <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((1 - idleDiff / totalDiff) * 100)));
}

function diskUsage() {
  try {
    const stats = fs.statfsSync(os.homedir());
    const total = stats.blocks * stats.bsize;
    const free = stats.bavail * stats.bsize;
    const used = total - free;
    return { totalGb: round2(total / 1024 ** 3), usedGb: round2(used / 1024 ** 3), percent: total ? Math.round((used / total) * 100) : 0 };
  } catch {
    return null;
  }
}

ipcMain.handle('system:health', async () => {
  const before = cpuSnapshot();
  await new Promise((r) => setTimeout(r, 250));
  const after = cpuSnapshot();

  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;

  return {
    platform: process.platform,
    osRelease: os.release(),
    uptimeHours: round2(os.uptime() / 3600),
    cpu: { percent: cpuPercentFrom(before, after), cores: os.cpus().length, model: os.cpus()[0]?.model || 'Unknown' },
    ram: { usedGb: round2(usedMem / 1024 ** 3), totalGb: round2(totalMem / 1024 ** 3), percent: Math.round((usedMem / totalMem) * 100) },
    disk: diskUsage(),
  };
});

// ── OS update check (read-only — never auto-installs anything) ───────
function execWithTimeout(cmd, args, timeoutMs = 8000) {
  return new Promise((resolve) => {
    execFile(cmd, args, { timeout: timeoutMs, maxBuffer: 1024 * 1024 }, (err, stdout, stderr) => {
      if (err) resolve({ ok: false, error: err.killed ? 'Timed out' : (stderr || err.message) });
      else resolve({ ok: true, output: stdout });
    });
  });
}

ipcMain.handle('system:check-updates', async () => {
  const platform = process.platform;

  if (platform === 'darwin') {
    const r = await execWithTimeout('softwareupdate', ['-l']);
    if (!r.ok) return { supported: true, ok: false, message: r.error };
    return { supported: true, ok: true, upToDate: /No new software available/i.test(r.output), raw: r.output.trim().slice(0, 4000) };
  }

  if (platform === 'linux') {
    const r = await execWithTimeout('bash', ['-c', 'command -v apt >/dev/null 2>&1 && apt list --upgradable 2>/dev/null || echo __UNSUPPORTED__']);
    if (!r.ok) return { supported: false, message: 'Could not check for updates on this Linux distribution.' };
    if (r.output.includes('__UNSUPPORTED__')) return { supported: false, message: 'Update checking currently only supports apt-based distributions.' };
    const lines = r.output.split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('Listing...'));
    return { supported: true, ok: true, upToDate: lines.length === 0, raw: lines.slice(0, 40).join('\n') };
  }

  if (platform === 'win32') {
    return { supported: false, deepLink: 'ms-settings:windowsupdate', message: "Windows doesn't expose a safe built-in command to list updates — use \"Open update settings\" to check natively." };
  }

  return { supported: false, message: `Update checking isn't available on platform "${platform}".` };
});

ipcMain.handle('system:open-update-settings', () => {
  const map = { win32: 'ms-settings:windowsupdate', darwin: 'x-apple.systempreferences:com.apple.preferences.softwareupdate' };
  const target = map[process.platform];
  return target ? shell.openExternal(target) : Promise.resolve();
});

// ── Restart — manual, confirmation-gated, never automatic ────────────
ipcMain.handle('system:restart', async () => {
  const { response } = await dialog.showMessageBox(mainWin, {
    type: 'warning',
    buttons: ['Cancel', 'Restart now'],
    defaultId: 0,
    cancelId: 0,
    title: 'Restart this computer?',
    message: 'This will restart your computer immediately and close all open applications.',
    detail: 'Save any unsaved work before continuing.',
  });
  if (response !== 1) return { started: false, cancelled: true };

  const [cmd, args] = platformRestartCommand();
  return new Promise((resolve) => {
    execFile(cmd, args, (err) => resolve({ started: !err, error: err ? err.message : undefined }));
  });
});

function platformRestartCommand() {
  if (process.platform === 'win32') return ['shutdown', ['/r', '/t', '5']];
  if (process.platform === 'darwin') return ['osascript', ['-e', 'tell app "System Events" to restart']];
  return ['systemctl', ['reboot']];
}

// ── Ad screensaver (mock — no real ad network, funds the mock ledger) ─
ipcMain.handle('screensaver:open', () => { createScreensaverWindow(); return { opened: true }; });
ipcMain.handle('screensaver:close', () => { screensaverWin?.close(); return { closed: true }; });
ipcMain.handle('ads:record', (_event, payload) => request('/api/ads/record', { method: 'POST', body: JSON.stringify(payload) }));
ipcMain.handle('ads:earnings', () => request('/api/ads/earnings'));

// ── Existing session / data handlers ──────────────────────────────────
ipcMain.handle('session:get', () => ({ apiUrl: state.apiUrl, demo: state.demo, authenticated: Boolean(state.token) }));
ipcMain.handle('session:configure', (_event, input = {}) => {
  if (typeof input.apiUrl === 'string' && /^https?:\/\//.test(input.apiUrl)) state.apiUrl = input.apiUrl;
  if (typeof input.token === 'string') state.token = input.token.trim();
  state.demo = Boolean(input.demo);
  return { apiUrl: state.apiUrl, demo: state.demo, authenticated: Boolean(state.token) };
});
ipcMain.handle('data:load', async () => ({ devices: await request('/api/devices'), backup: await request('/api/backup/status') }));
ipcMain.handle('device:register', async (_event, info) => request('/api/devices/register', { method: 'POST', body: JSON.stringify({ device_info: info }) }));
ipcMain.handle('maintenance:health', async () => {
  if (state.demo) return { ok: true, message: 'Demo mode is ready' };
  const response = await fetch(`${state.apiUrl.replace(/\/$/, '')}/health`);
  return { ok: response.ok, message: response.ok ? 'API is reachable' : `API returned ${response.status}` };
});
ipcMain.handle('maintenance:open-api', () => shell.openExternal(`${state.apiUrl.replace(/\/$/, '')}/docs`));

app.whenReady().then(() => { createWindow(); app.on('activate', () => { if (!BrowserWindow.getAllWindows().length) createWindow(); }); });
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
