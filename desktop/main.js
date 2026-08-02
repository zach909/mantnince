const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('node:path');

const DEFAULT_API = process.env.BACKUP_API_URL || 'http://127.0.0.1:8000';
const state = { apiUrl: DEFAULT_API, token: process.env.BACKUP_API_TOKEN || '', demo: process.env.BACKUP_DEMO === '1' };

function createWindow() {
  const win = new BrowserWindow({
    width: 460, height: 700, minWidth: 400, minHeight: 560,
    backgroundColor: '#0f1115',
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: true }
  });
  win.loadFile(path.join(__dirname, 'renderer', 'index.html'));
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

function demoResponse(endpoint) {
  if (endpoint === '/api/devices') return { devices: [{ id: 'demo-device', name: 'This desktop', type: 'desktop', platform: process.platform, os_version: process.getSystemVersion(), status: 'online' }] };
  if (endpoint === '/api/backup/status') return { total_backups: 12, total_size_gb: 1.84, storage_saved_gb: 0.42, last_backup: new Date().toISOString() };
  return { device_id: 'demo-device', message: 'Demo mode: no server changes made' };
}

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
