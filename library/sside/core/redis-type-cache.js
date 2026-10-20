/**
 * Cache localStorage: cheie Redis → TYPE normalizat (per user).
 * Scriere doar când preferința typeKeyCache e activă; forget/clear actualizează mereu LS.
 */
(function (root) {
  'use strict';

  const STORAGE_VERSION = 1;
  const MAX_ENTRIES = 8000;
  const FLUSH_MS = 400;

  /** @type {Map<string, { entries: Object, order: string[] }>} */
  const pendingByUser = new Map();
  /** @type {Map<string, ReturnType<typeof setTimeout>>} */
  const flushTimerByUser = new Map();

  function normalizeRedisType(tip) {
    const t = String(tip == null ? 'none' : tip).toLowerCase();
    if (t === 'json' || t === 'rejson-rl' || t.indexOf('rejson') !== -1) return 'json';
    if (t === 'search index' || t.replace(/\s+/g, '') === 'searchindex') return 'searchindex';
    if (t === 'none' || t === 'unknown') return t;
    return t;
  }

  function safeUsername(username) {
    const u = String(username == null ? '' : username).trim();
    if (!u) return '';
    return u.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 64);
  }

  function storageKeyForUser(username) {
    const u = safeUsername(username);
    if (!u) return '';
    return 'sside-redis-type-cache:' + u;
  }

  function getStorage() {
    try {
      return root.localStorage || null;
    } catch (e) {
      return null;
    }
  }

  function readBlob(username, storage) {
    const ls = storage || getStorage();
    const key = storageKeyForUser(username);
    if (!ls || !key) return { entries: Object.create(null), order: [] };
    let raw;
    try {
      raw = ls.getItem(key);
    } catch (e) {
      return { entries: Object.create(null), order: [] };
    }
    if (!raw) return { entries: Object.create(null), order: [] };
    try {
      const data = JSON.parse(raw);
      if (!data || typeof data !== 'object' || data.v !== STORAGE_VERSION) {
        return { entries: Object.create(null), order: [] };
      }
      const entries =
        data.entries && typeof data.entries === 'object' && !Array.isArray(data.entries)
          ? data.entries
          : Object.create(null);
      const order = Array.isArray(data.order) ? data.order.filter((k) => entries[k]) : Object.keys(entries);
      return { entries, order };
    } catch (e) {
      return { entries: Object.create(null), order: [] };
    }
  }

  function writeBlob(username, state, storage) {
    const ls = storage || getStorage();
    const key = storageKeyForUser(username);
    if (!ls || !key) return false;
    const payload = {
      v: STORAGE_VERSION,
      entries: state.entries,
      order: state.order,
    };
    try {
      ls.setItem(key, JSON.stringify(payload));
      return true;
    } catch (e) {
      return false;
    }
  }

  function pruneState(state) {
    while (state.order.length > MAX_ENTRIES) {
      const old = state.order.shift();
      if (old) delete state.entries[old];
    }
  }

  function touchEntry(state, redisKey, typeNorm) {
    const k = String(redisKey || '');
    if (!k || typeNorm === 'unknown' || typeNorm === 'none') return;
    if (state.entries[k]) {
      const idx = state.order.indexOf(k);
      if (idx >= 0) state.order.splice(idx, 1);
    }
    state.entries[k] = typeNorm;
    state.order.push(k);
    pruneState(state);
  }

  function removeEntry(state, redisKey) {
    const k = String(redisKey || '');
    if (!k) return false;
    if (!Object.prototype.hasOwnProperty.call(state.entries, k)) return false;
    delete state.entries[k];
    const idx = state.order.indexOf(k);
    if (idx >= 0) state.order.splice(idx, 1);
    return true;
  }

  function getPending(username) {
    const u = safeUsername(username);
    if (!u) return null;
    if (!pendingByUser.has(u)) {
      pendingByUser.set(u, readBlob(u));
    }
    return pendingByUser.get(u);
  }

  function scheduleFlush(username, storage) {
    const u = safeUsername(username);
    if (!u) return;
    const prev = flushTimerByUser.get(u);
    if (prev) clearTimeout(prev);
    const t = setTimeout(function () {
      flushTimerByUser.delete(u);
      flushNow(u, storage);
    }, FLUSH_MS);
    flushTimerByUser.set(u, t);
  }

  function flushNow(username, storage) {
    const u = safeUsername(username);
    if (!u) return false;
    const state = pendingByUser.get(u);
    if (!state) return true;
    return writeBlob(u, state, storage);
  }

  function loadIntoMap(username, targetMap, storage) {
    const map = targetMap || Object.create(null);
    const state = readBlob(username, storage);
    const u = safeUsername(username);
    if (u) pendingByUser.set(u, state);
    state.order.forEach(function (key) {
      const t = state.entries[key];
      if (t && t !== 'unknown') {
        if (!map[key] || map[key] === 'unknown') map[key] = t;
      }
    });
    return map;
  }

  function noteType(username, redisKey, redisType, opts) {
    opts = opts || {};
    if (!opts.enabled) return false;
    const typeNorm = normalizeRedisType(redisType);
    if (typeNorm === 'unknown' || typeNorm === 'none') return false;
    const u = safeUsername(username);
    if (!u) return false;
    const state = getPending(u);
    touchEntry(state, redisKey, typeNorm);
    scheduleFlush(u, opts.storage);
    return true;
  }

  function forgetKey(username, redisKey, opts) {
    opts = opts || {};
    const u = safeUsername(username);
    if (!u) return false;
    const state = getPending(u);
    const changed = removeEntry(state, redisKey);
    if (changed) {
      flushNow(u, opts.storage);
    }
    return changed;
  }

  function clearAll(username, storage) {
    const u = safeUsername(username);
    if (!u) return 0;
    const state = getPending(u);
    const n = state.order.length;
    state.entries = Object.create(null);
    state.order = [];
    const ls = storage || getStorage();
    const key = storageKeyForUser(u);
    if (ls && key) {
      try {
        ls.removeItem(key);
      } catch (e) { /* ignore */ }
    }
    return n;
  }

  const api = {
    STORAGE_VERSION,
    MAX_ENTRIES,
    normalizeRedisType,
    storageKeyForUser,
    loadIntoMap,
    noteType,
    forgetKey,
    clearAll,
    flushNow,
    readBlob,
    pruneState,
    touchEntry,
  };

  root.SsideRedisTypeCache = api;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
