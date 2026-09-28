/**
 * Încărcare pagină listă (F4l): source → chei → JSON pe pagină.
 */
(function (root) {
  'use strict';

  const FormOpts =
    root.SsideFormOptions ||
    (typeof require !== 'undefined' ? require('./form-options.js') : null);
  const SearchQ =
    root.SsideSearchQuery ||
    (typeof require !== 'undefined' ? require('./search-query.js') : null);
  const Ops =
    root.SsideAlgOps || (typeof require !== 'undefined' ? require('./alg-ops.js') : null);

  function getPath(obj, path) {
    if (Ops && Ops.getPath) return Ops.getPath(obj, path);
    if (path === '' || path == null) return obj;
    const parts = String(path).split('.');
    let cur = obj;
    for (const p of parts) {
      if (cur == null || typeof cur !== 'object') return undefined;
      cur = cur[p];
    }
    return cur;
  }

  function unwrapJsonGet(raw) {
    if (Ops && Ops.unwrapJsonGet) return Ops.unwrapJsonGet(raw);
    if (raw == null) return null;
    if (typeof raw === 'string') {
      try {
        const p = JSON.parse(raw);
        if (Array.isArray(p) && p.length === 1) return p[0];
        return p;
      } catch (e) {
        return raw;
      }
    }
    if (Array.isArray(raw) && raw.length === 1) return raw[0];
    return raw;
  }

  /**
   * Celulă din rând (object | array).
   */
  function cellValue(rowVal, path, rowMode) {
    if (path === '_key' && rowVal && typeof rowVal === 'object' && rowVal._key != null) {
      return rowVal._key;
    }
    if (rowMode === 'array') {
      const idx = parseInt(path, 10);
      if (!Array.isArray(rowVal)) return undefined;
      return Number.isFinite(idx) ? rowVal[idx] : undefined;
    }
    if (rowVal == null) return undefined;
    if (typeof rowVal !== 'object') {
      return path === 'value' || path === '0' ? rowVal : undefined;
    }
    return getPath(rowVal, path);
  }

  async function resolveSourceKeys(source, redis, pageOpts) {
    pageOpts = pageOpts || {};
    if (!source || typeof source !== 'object') {
      throw new Error('list.source lipsă');
    }
    const from = source.from;
    if (from === 'search' && SearchQ) {
      const pageSize = pageOpts.pageSize || 20;
      const page = pageOpts.page || 1;
      const offset = (page - 1) * pageSize;
      const qObj = SearchQ.normalizeQuery(source.query);
      const argv = SearchQ.buildSearchArgv(
        source.index || 'idx_search_tags',
        qObj,
        pageSize,
        offset
      );
      const raw = await redis.exec(argv);
      const keys = SearchQ.unwrapSearchKeys(raw);
      return {
        keys,
        total: null,
        hasMore: keys.length >= pageSize,
        pagedAtSource: true,
      };
    }
    if (!FormOpts) throw new Error('form-options lipsă');
    const one = await FormOpts.resolveOneOptions(source, redis);
    let keys = (one.enum || []).map(String);
    const maxScan = source.maxScan != null ? Number(source.maxScan) : 2000;
    if (keys.length > maxScan) keys = keys.slice(0, maxScan);
    return { keys, total: keys.length, hasMore: false, pagedAtSource: false };
  }

  async function loadRowValue(key, redis, rowMode) {
    let tip = 'none';
    if (redis.type) tip = await redis.type(key);
    if (tip === 'json' || tip === 'ReJSON-RL') {
      const raw = await redis.exec(['JSON.GET', key, '$']);
      return unwrapJsonGet(raw);
    }
    if (tip === 'string') {
      const s = await redis.exec(['GET', key]);
      if (typeof s === 'string') {
        try {
          return JSON.parse(s);
        } catch (e) {
          return s;
        }
      }
      return s;
    }
    // membru care nu e cheie Redis → scalar
    if (rowMode === 'array') return [key];
    return { value: key };
  }

  /**
   * @returns {Promise<{ page, pageSize, total, hasMore, rows: {key, value}[] }>}
   */
  async function loadListPage(listDef, redis, page) {
    if (!listDef || typeof listDef !== 'object') {
      throw new Error('listDef invalid');
    }
    if (!redis || typeof redis.exec !== 'function') {
      throw new Error('redis lipsă');
    }
    const pageSize = Math.max(1, Number(listDef.pageSize) || 20);
    let pageNum = Math.max(1, Number(page) || 1);
    const rowMode = listDef.row === 'array' ? 'array' : 'object';

    const src = await resolveSourceKeys(listDef.source, redis, {
      page: pageNum,
      pageSize,
    });

    let pageKeys;
    let total = src.total;
    let hasMore = !!src.hasMore;

    if (src.pagedAtSource) {
      pageKeys = src.keys;
      if (pageKeys.length === 0 && pageNum > 1) {
        pageNum = 1;
        const again = await resolveSourceKeys(listDef.source, redis, {
          page: 1,
          pageSize,
        });
        pageKeys = again.keys;
        hasMore = !!again.hasMore;
      }
    } else {
      const all = src.keys;
      total = all.length;
      const maxPage = Math.max(1, Math.ceil(total / pageSize) || 1);
      if (pageNum > maxPage) pageNum = maxPage;
      const start = (pageNum - 1) * pageSize;
      pageKeys = all.slice(start, start + pageSize);
      hasMore = start + pageSize < total;
    }

    const rows = [];
    for (const key of pageKeys) {
      let value;
      try {
        value = await loadRowValue(key, redis, rowMode);
      } catch (e) {
        value = rowMode === 'array' ? [key] : { value: key };
      }
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        value = Object.assign({ _key: key }, value);
      }
      rows.push({ key, value });
    }

    return {
      page: pageNum,
      pageSize,
      total,
      hasMore,
      rows,
      rowMode,
    };
  }

  const api = {
    cellValue,
    loadRowValue,
    resolveSourceKeys,
    loadListPage,
  };

  root.SsideListLoad = api;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
