const $ = (id) => document.getElementById(id);
const bridge = window.backupDesktop;
let session;
function notify(message, error = false) { $('notice').textContent = message; $('notice').className = `notice ${error ? 'error' : ''}`; }
function setMode() { $('mode').textContent = session.demo ? 'Demo mode' : session.authenticated ? 'Connected' : 'Not connected'; $('mode').className = `badge ${session.demo || session.authenticated ? 'good' : ''}`; }
async function load() { try { const data = await bridge.loadData(); const b = data.backup; $('status').innerHTML = `<strong>${b.total_backups}</strong> backups · <strong>${b.total_size_gb} GB</strong> stored · ${b.storage_saved_gb} GB deduplicated<br><small>Last backup: ${b.last_backup ? new Date(b.last_backup).toLocaleString() : 'Never'}</small>`; $('devices').innerHTML = (data.devices.devices || []).map(d => `<div class="device"><span>${d.name}</span><small>${d.platform} · ${d.status}</small></div>`).join(''); notify('Status refreshed'); } catch (e) { notify(e.message, true); } }
$('connect').onclick = async () => { session = await bridge.configure({ apiUrl: $('api').value, token: $('token').value, demo: $('demo').checked }); setMode(); await load(); };
$('refresh').onclick = load;
$('health').onclick = async () => { try { const r = await bridge.healthCheck(); notify(r.message, !r.ok); } catch (e) { notify(e.message, true); } };
$('docs').onclick = () => bridge.openApiDocs();
$('register').onclick = async () => { try { const r = await bridge.registerDevice({ name: 'This desktop', type: 'desktop', platform: navigator.platform, os_version: 'Electron' }); notify(r.message || 'Device registered'); await load(); } catch (e) { notify(e.message, true); } };

// ── System health (real, read-only stats for this machine) ──────────
function bar(pct) { return `<div class="meter"><div class="meter-fill" style="width:${Math.min(100, Math.max(0, pct))}%"></div></div>`; }
async function loadHealth() {
  $('healthBody').textContent = 'Reading…';
  try {
    const h = await bridge.getSystemHealth();
    const disk = h.disk ? `${h.disk.usedGb} / ${h.disk.totalGb} GB (${h.disk.percent}%)` : 'Unavailable';
    $('healthBody').innerHTML = `
      <div class="metric"><span>CPU · ${h.cpu.cores} cores</span><strong>${h.cpu.percent}%</strong></div>${bar(h.cpu.percent)}
      <div class="metric"><span>Memory</span><strong>${h.ram.usedGb} / ${h.ram.totalGb} GB</strong></div>${bar(h.ram.percent)}
      <div class="metric"><span>Disk (home volume)</span><strong>${disk}</strong></div>${h.disk ? bar(h.disk.percent) : ''}
      <small>${h.platform} · ${h.osRelease} · up ${h.uptimeHours}h</small>`;
  } catch (e) {
    $('healthBody').textContent = `Could not read system health: ${e.message}`;
  }
}
$('healthRefresh').onclick = loadHealth;

// ── Software updates (read-only check — never auto-installs) ─────────
$('updatesRefresh').onclick = async () => {
  $('updatesBody').textContent = 'Checking…';
  try {
    const r = await bridge.checkForUpdates();
    if (!r.supported) {
      $('updatesBody').innerHTML = `${r.message}${r.deepLink ? ' <button class="ghost" id="openUpdateSettings">Open update settings</button>' : ''}`;
      document.getElementById('openUpdateSettings')?.addEventListener('click', () => bridge.openUpdateSettings());
      return;
    }
    if (!r.ok) { $('updatesBody').textContent = `Could not check: ${r.message}`; return; }
    $('updatesBody').innerHTML = r.upToDate
      ? 'Up to date.'
      : `<pre class="raw">${(r.raw || '').replace(/[<>]/g, '')}</pre>`;
  } catch (e) {
    $('updatesBody').textContent = `Could not check: ${e.message}`;
  }
};
$('restart').onclick = async () => {
  try {
    const r = await bridge.restartComputer();
    if (r.cancelled) return;
    notify(r.started ? 'Restart initiated.' : `Could not restart: ${r.error}`, !r.started);
  } catch (e) { notify(e.message, true); }
};

// ── Ad screensaver / mock earnings ────────────────────────────────────
async function loadEarnings() {
  try {
    const e = await bridge.getEarnings();
    $('earningsBody').innerHTML = `<strong>$${e.total.toFixed(2)}</strong> from ${e.ads_watched} ad break${e.ads_watched === 1 ? '' : 's'}<br><small>${e.note}</small>`;
  } catch (e) {
    $('earningsBody').textContent = `Could not load earnings: ${e.message}`;
  }
}
$('earningsRefresh').onclick = loadEarnings;
$('watchAd').onclick = () => bridge.openScreensaver();
bridge.onEarningsChanged(() => loadEarnings());

(async () => {
  session = await bridge.getSession();
  $('api').value = session.apiUrl;
  $('demo').checked = session.demo;
  setMode();
  if (session.demo || session.authenticated) { load(); loadEarnings(); }
  loadHealth();
})();
