/**
 * Parse răspunsuri Upstash SEARCH.LISTINDEXES / SEARCH.DESCRIBE (doar citire UI).
 */
(function (root) {
  'use strict';

  const PRIMARY_SSIDE_INDEX = 'idx_search_tags';

  function unwrapRedisResult(raw) {
    if (raw == null) return raw;
    if (typeof raw === 'object' && !Array.isArray(raw) && raw.rezultat != null) {
      return raw.rezultat;
    }
    return raw;
  }

  /**
   * @param {*} raw
   * @returns {{ name: string, type: string }[]}
   */
  function parseListIndexes(raw) {
    const data = unwrapRedisResult(raw);
    if (!data) return [];
    if (!Array.isArray(data)) return [];

    const out = [];
    for (let i = 0; i < data.length; i++) {
      const item = data[i];
      if (Array.isArray(item)) {
        const rec = {};
        for (let j = 0; j < item.length; j += 2) {
          const k = item[j];
          const v = item[j + 1];
          if (k != null && v != null) rec[String(k)] = v;
        }
        if (rec.name) {
          out.push({ name: String(rec.name), type: String(rec.type || '') });
        }
        continue;
      }
      if (item && typeof item === 'object' && item.name) {
        out.push({ name: String(item.name), type: String(item.type || '') });
      }
    }
    return out.sort((a, b) => a.name.localeCompare(b.name));
  }

  function describeToDisplayObject(raw) {
    const data = unwrapRedisResult(raw);
    if (data == null) return null;
    if (typeof data === 'string') {
      try {
        return JSON.parse(data);
      } catch (e) {
        return { raw: data };
      }
    }
    if (typeof data === 'object') return data;
    return { value: data };
  }

  function formatJsonPretty(obj) {
    if (obj == null) return '(null — index inexistent sau SEARCH.DESCRIBE eșuat)';
    try {
      return JSON.stringify(obj, null, 2);
    } catch (e) {
      return String(obj);
    }
  }

  function isPrimarySsideIndex(name) {
    return String(name || '') === PRIMARY_SSIDE_INDEX;
  }

  const api = {
    PRIMARY_SSIDE_INDEX,
    unwrapRedisResult,
    parseListIndexes,
    describeToDisplayObject,
    formatJsonPretty,
    isPrimarySsideIndex,
  };

  root.SsideSearchIndexInspect = api;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
