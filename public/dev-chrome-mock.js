// Minimal chrome.* API mock so `npm run dev` can preview the popup in a
// plain browser tab (no chrome.runtime.id there). Only used outside a real
// extension context — the packaged extension never loads this.
(function () {
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id) return;

  var store = {};
  function storageArea(backing) {
    return {
      get: function (keys, cb) {
        var result = {};
        var wanted = typeof keys === 'string' ? [keys] : Array.isArray(keys) ? keys : Object.keys(keys || {});
        wanted.forEach(function (k) {
          if (backing[k] !== undefined) result[k] = JSON.parse(JSON.stringify(backing[k]));
        });
        if (cb) cb(result);
        return Promise.resolve(result);
      },
      set: function (items, cb) {
        Object.keys(items).forEach(function (k) { backing[k] = items[k]; });
        if (cb) cb();
        return Promise.resolve();
      },
      remove: function (keys, cb) {
        (typeof keys === 'string' ? [keys] : keys).forEach(function (k) { delete backing[k]; });
        if (cb) cb();
        return Promise.resolve();
      },
      clear: function (cb) {
        Object.keys(backing).forEach(function (k) { delete backing[k]; });
        if (cb) cb();
        return Promise.resolve();
      },
    };
  }

  var noop = function () {};
  var noopListener = { addListener: noop, removeListener: noop, hasListener: function () { return false; } };

  window.chrome = {
    runtime: {
      id: 'dev-preview',
      lastError: null,
      sendMessage: function (_msg, cb) {
        if (cb) setTimeout(function () { cb({ data: null }); }, 0);
        return Promise.resolve();
      },
      onMessage: noopListener,
      onInstalled: noopListener,
      getURL: function (p) { return p; },
    },
    storage: { local: storageArea(store), sync: storageArea({}), onChanged: noopListener },
    downloads: {
      search: function (_q, cb) { if (cb) cb([]); return Promise.resolve([]); },
      onChanged: noopListener,
    },
    tabs: {
      query: function (_q, cb) { if (cb) cb([]); return Promise.resolve([]); },
      sendMessage: function (_id, _m, cb) { if (cb) cb({}); return Promise.resolve({}); },
      create: function (o, cb) { var t = { id: 1 }; if (cb) cb(t); return Promise.resolve(t); },
    },
    alarms: {
      create: noop,
      get: function (_n, cb) { if (cb) cb(null); return Promise.resolve(null); },
      onAlarm: noopListener,
    },
    action: { setBadgeText: noop, setBadgeBackgroundColor: noop, setIcon: noop },
    scripting: { executeScript: function () { return Promise.resolve([]); } },
  };
})();
