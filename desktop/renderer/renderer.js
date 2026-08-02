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
(async () => { session = await bridge.getSession(); $('api').value = session.apiUrl; $('demo').checked = session.demo; setMode(); if (session.demo || session.authenticated) load(); })();
