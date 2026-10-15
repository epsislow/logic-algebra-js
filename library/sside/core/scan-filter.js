/**
 * Parser filtru SCAN (prefix >) — listă principală chei.
 */
(function (root) {
  'use strict';

  const DEFAULT_LIMIT = 50000;
  const DEFAULT_BATCH = 100;
  const MAX_LIMIT = 50000;

  let userDefaultLimit = DEFAULT_LIMIT;
  let userDefaultBatch = DEFAULT_BATCH;

  function effectiveDefaultLimit() {
    return userDefaultLimit;
  }

  function effectiveDefaultBatch() {
    return userDefaultBatch;
  }

  function setScanDefaults(opts) {
    if (!opts || typeof opts !== 'object') return;
    if (opts.limit != null) {
      const n = parseInt(opts.limit, 10);
      if (Number.isFinite(n) && n >= 0) userDefaultLimit = Math.min(n, MAX_LIMIT);
    }
    if (opts.batch != null) {
      const n = parseInt(opts.batch, 10);
      if (Number.isFinite(n) && n >= 1) userDefaultBatch = n;
    }
  }

  function resetScanDefaults() {
    userDefaultLimit = DEFAULT_LIMIT;
    userDefaultBatch = DEFAULT_BATCH;
  }
  const KNOWN_OPTS = new Set(['limit', 'batch', 'type', 'timeout']);

  function isScanFilter(filtru) {
    return String(filtru == null ? '' : filtru).trim().startsWith('>');
  }

  function parseScanFilter(filtru) {
    const raw = String(filtru == null ? '' : filtru).trim();
    if (!raw.startsWith('>')) return null;
    const body = raw.slice(1).trim();
    if (!body) {
      throw new Error('SCAN: lipsește pattern după >');
    }
    const parts = body.split(/\s+/);
    const pattern = parts.shift();
    if (!pattern) throw new Error('SCAN: lipsește pattern după >');

    const userSpecified = { limit: false, batch: false, type: false, timeout: false };
    let limit = null;
    let batch = null;
    let type = null;
    let timeout = null;

    for (const tok of parts) {
      const m = tok.match(/^([a-z]+):(.+)$/i);
      if (!m) throw new Error('SCAN: token invalid: ' + tok);
      const key = m[1].toLowerCase();
      const val = m[2];
      if (!KNOWN_OPTS.has(key)) throw new Error('SCAN: opțiune necunoscută: ' + key);
      if (key === 'limit') {
        userSpecified.limit = true;
        limit = parseInt(val, 10);
        if (!Number.isFinite(limit) || limit < 0) throw new Error('SCAN: limit invalid');
      } else if (key === 'batch') {
        userSpecified.batch = true;
        batch = parseInt(val, 10);
        if (!Number.isFinite(batch) || batch < 1) throw new Error('SCAN: batch invalid');
      } else if (key === 'type') {
        userSpecified.type = true;
        type = String(val).trim().toLowerCase();
        if (!type) throw new Error('SCAN: type gol');
      } else if (key === 'timeout') {
        userSpecified.timeout = true;
        timeout = parseInt(val, 10);
        if (!Number.isFinite(timeout) || timeout < 1) throw new Error('SCAN: timeout invalid');
      }
    }

    let limitEffective;
    if (userSpecified.limit) {
      limitEffective = limit === 0 ? 0 : Math.min(limit, MAX_LIMIT);
    } else {
      limitEffective = effectiveDefaultLimit();
    }

    const batchEffective = userSpecified.batch ? batch : effectiveDefaultBatch();

    return {
      pattern,
      limit,
      batch,
      type,
      timeout,
      userSpecified,
      limitEffective,
      batchEffective,
      defaultLimit: effectiveDefaultLimit(),
      defaultBatch: effectiveDefaultBatch(),
    };
  }

  function formatScanFilter(parsed) {
    if (!parsed || !parsed.pattern) throw new Error('formatScanFilter: pattern lipsă');
    const bits = ['>' + parsed.pattern];
    const lim =
      parsed.userSpecified && parsed.userSpecified.limit
        ? parsed.limit
        : parsed.limitEffective != null
          ? parsed.limitEffective
          : effectiveDefaultLimit();
    const bat =
      parsed.userSpecified && parsed.userSpecified.batch
        ? parsed.batch
        : parsed.batchEffective != null
          ? parsed.batchEffective
          : effectiveDefaultBatch();
    bits.push('limit:' + lim);
    bits.push('batch:' + bat);
    if (parsed.userSpecified && parsed.userSpecified.type && parsed.type) {
      bits.push('type:' + parsed.type);
    }
    if (parsed.userSpecified && parsed.userSpecified.timeout && parsed.timeout) {
      bits.push('timeout:' + parsed.timeout);
    }
    return bits.join(' ');
  }

  /** Pentru căutări salvate: limit+batch mereu; type/timeout doar dacă user le-a scris. */
  function normalizeScanFilterForSave(filtru) {
    const parsed = parseScanFilter(filtru);
    const out = {
      pattern: parsed.pattern,
      limit: parsed.userSpecified.limit ? parsed.limit : parsed.defaultLimit,
      batch: parsed.userSpecified.batch ? parsed.batch : parsed.defaultBatch,
      userSpecified: {
        limit: true,
        batch: true,
        type: parsed.userSpecified.type,
        timeout: parsed.userSpecified.timeout,
      },
      limitEffective: parsed.limitEffective,
      batchEffective: parsed.batchEffective,
      type: parsed.type,
      timeout: parsed.timeout,
      defaultLimit: parsed.defaultLimit,
      defaultBatch: parsed.defaultBatch,
    };
    if (!parsed.userSpecified.limit) {
      out.limit = parsed.defaultLimit;
      out.limitEffective = parsed.limit === 0 ? 0 : Math.min(parsed.defaultLimit, MAX_LIMIT);
    }
    return formatScanFilter(out);
  }

  function canonFilterForCompare(filtru) {
    const f = String(filtru == null ? '' : filtru).trim() || '*';
    if (isScanFilter(f)) return normalizeScanFilterForSave(f);
    return f;
  }

  const api = {
    DEFAULT_LIMIT,
    DEFAULT_BATCH,
    MAX_LIMIT,
    isScanFilter,
    parseScanFilter,
    formatScanFilter,
    normalizeScanFilterForSave,
    canonFilterForCompare,
    setScanDefaults,
    resetScanDefaults,
    getScanDefaults: () => ({
      limit: userDefaultLimit,
      batch: userDefaultBatch,
    }),
  };

  root.SsideScanFilter = api;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
