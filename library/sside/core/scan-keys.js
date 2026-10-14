/**
 * Buclă SCAN — colectare chei cu dedupe, limit, timeout, cancel.
 */
(function (root) {
  'use strict';

  const ScanFilter =
    root.SsideScanFilter ||
    (typeof require !== 'undefined' ? require('./scan-filter.js') : null);

  function buildScanArgv(cursor, parsed) {
    const argv = ['SCAN', cursor == null ? '0' : String(cursor)];
    if (parsed.pattern != null && parsed.pattern !== '') {
      argv.push('MATCH', String(parsed.pattern));
    }
    argv.push('COUNT', String(parsed.batchEffective));
    if (parsed.type) argv.push('TYPE', String(parsed.type));
    return argv;
  }

  function unwrapScanResult(raw) {
    if (Array.isArray(raw)) return raw;
    if (raw && Array.isArray(raw.rezultat)) return raw.rezultat;
    if (raw && raw.rezultat != null && typeof raw.rezultat === 'object') {
      const r = raw.rezultat;
      if (Array.isArray(r)) return r;
    }
    throw new Error('SCAN: răspuns invalid');
  }

  /**
   * @param {function(Array): Promise<*>} exec — returnează [cursor, keys[]] sau { rezultat: … }
   * @param {object} parsed — din parseScanFilter (limitEffective, batchEffective, …)
   * @param {{ signal?: AbortSignal, onProgress?: function(number): void }} opts
   */
  async function collectKeysViaScan(exec, parsed, opts) {
    opts = opts || {};
    if (!parsed) throw new Error('collectKeysViaScan: parsed lipsă');
    if (parsed.limitEffective === 0) {
      return { keys: [], stopped: false, reason: 'limit0' };
    }

    const limit = parsed.limitEffective;
    const set = new Set();
    let cursor = '0';
    const start = Date.now();
    const timeoutMs = parsed.timeout;

    for (;;) {
      if (opts.signal && opts.signal.aborted) {
        return { keys: sortKeys(set), stopped: true, reason: 'abort' };
      }
      if (timeoutMs && Date.now() - start >= timeoutMs) {
        return { keys: sortKeys(set), stopped: true, reason: 'timeout' };
      }
      if (set.size >= limit) {
        return { keys: sortKeys(set), stopped: false, reason: 'limit' };
      }

      const raw = await exec(buildScanArgv(cursor, parsed));
      const pair = unwrapScanResult(raw);
      cursor = String(pair[0]);
      const batch = Array.isArray(pair[1]) ? pair[1] : [];

      for (let i = 0; i < batch.length; i++) {
        if (set.size >= limit) break;
        set.add(batch[i]);
      }

      if (typeof opts.onProgress === 'function') opts.onProgress(set.size);

      if (cursor === '0') {
        return { keys: sortKeys(set), stopped: false, reason: 'done' };
      }
    }
  }

  function sortKeys(set) {
    return Array.from(set).sort();
  }

  const api = { buildScanArgv, collectKeysViaScan, unwrapScanResult };

  root.SsideScanKeys = api;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
