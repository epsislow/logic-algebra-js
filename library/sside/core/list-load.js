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
   * path special: `_key` | `_type` | `$`/`_json`/`_raw`
   * col.const = valoare statică (fără citire Redis pe rând)
   * @param {*} rowVal
   * @param {string|object} pathOrCol path sau obiect column
   * @param {string} rowMode
   * @param {{ type?: string, key?: string }} [meta]
   */
  function cellValue(rowVal, pathOrCol, rowMode, meta) {
    meta = meta || {};
    let col = null;
    let p = '';
    if (pathOrCol && typeof pathOrCol === 'object' && !Array.isArray(pathOrCol)) {
      col = pathOrCol;
      if (Object.prototype.hasOwnProperty.call(col, 'const')) {
        return col.const;
      }
      p = col.path == null ? '' : String(col.path).trim();
    } else {
      p = pathOrCol == null ? '' : String(pathOrCol).trim();
    }

    if (p === '_key') {
      if (meta.key != null) return meta.key;
      if (rowVal && typeof rowVal === 'object' && rowVal._key != null) return rowVal._key;
      return undefined;
    }
    if (p === '_type') {
      if (meta.type != null && meta.type !== '') return meta.type;
      return undefined;
    }
    if (p === '$' || p === '_json' || p === '_raw') {
      if (rowVal == null) return '';
      if (typeof rowVal !== 'object') return String(rowVal);
      if (Array.isArray(rowVal)) return JSON.stringify(rowVal);
      const copy = Object.assign({}, rowVal);
      delete copy._key;
      delete copy._type;
      return JSON.stringify(copy);
    }
    if (rowMode === 'array') {
      const idx = parseInt(p, 10);
      if (!Array.isArray(rowVal)) return undefined;
      return Number.isFinite(idx) ? rowVal[idx] : undefined;
    }
    if (rowVal == null) return undefined;
    if (typeof rowVal !== 'object') {
      return p === 'value' || p === '0' ? rowVal : undefined;
    }
    return getPath(rowVal, p);
  }

  /**
   * Afișare celulă Live: lipsă vs null vs valoare.
   * @returns {{ kind: 'value'|'missing'|'null', text: string }}
   */
  function formatListCellDisplay(val) {
    if (val === undefined) return { kind: 'missing', text: 'nimic' };
    if (val === null) return { kind: 'null', text: '(nul)' };
    return { kind: 'value', text: String(val) };
  }

  /** Ce citiri Redis sunt necesare pentru columns. */
  function analyzeColumnNeeds(columns) {
    let needsValue = false;
    let needsType = false;
    (columns || []).forEach((c) => {
      if (!c || typeof c !== 'object') return;
      if (Object.prototype.hasOwnProperty.call(c, 'const')) return;
      const p = c.path == null ? '' : String(c.path).trim();
      if (!p || p === '_key') return;
      if (p === '_type') {
        needsType = true;
        return;
      }
      needsValue = true;
    });
    return { needsValue, needsType };
  }

  function isMatchAllSearchQuery(q) {
    if (q === '*' || q === '') return true;
    if (!q || typeof q !== 'object' || Array.isArray(q)) return false;
    const keys = Object.keys(q);
    return keys.length === 1 && keys[0] === '*' && (q['*'] === '*' || q['*'] === '');
  }

  /**
   * Text membru LIST/SET/… → valoare rând (Faza GB). Fără trim. `{`/`[` → JSON.parse; eșec → scalar.
   */
  function parseMemberRowText(text, rowMode) {
    const s = text == null ? '' : String(text);
    if (s.length > 0 && (s.charAt(0) === '{' || s.charAt(0) === '[')) {
      try {
        return JSON.parse(s);
      } catch (e) {
        /* scalar */
      }
    }
    if (rowMode === 'array') return [s];
    return { value: s };
  }

  function valueFromJsonRootElement(raw, rowMode) {
    if (raw !== null && typeof raw === 'object') return raw;
    if (rowMode === 'array') return [raw];
    return { value: raw };
  }

  function hashFieldToRow(field, raw, rowMode) {
    const inner = parseMemberRowText(raw, rowMode);
    if (inner !== null && typeof inner === 'object' && !Array.isArray(inner)) {
      return Object.assign({ field: field }, inner);
    }
    return { field: field, value: inner };
  }

  function jsonRootToEntries(root, rowMode) {
    if (root == null) return [];
    if (Array.isArray(root)) {
      return root.map(function (raw, i) {
        return {
          rowKey: String(i),
          value: valueFromJsonRootElement(raw, rowMode),
        };
      });
    }
    if (typeof root === 'object') {
      return [{ rowKey: '0', value: root }];
    }
    return [{ rowKey: '0', value: valueFromJsonRootElement(root, rowMode) }];
  }

  async function redisKeyType(redis, key) {
    if (redis.type) return String(await redis.type(key) || 'none');
    return String((await redis.exec(['TYPE', key])) || 'none');
  }

  function packKeySourcePage(entries, offset, pageSize, total, meta, rowMode, needsValue) {
    const slice = entries.slice(offset, offset + pageSize);
    const keys = [];
    const _preloadedRows = {};
    for (let i = 0; i < slice.length; i++) {
      const ent = slice[i];
      keys.push(ent.rowKey);
      if (needsValue) _preloadedRows[ent.rowKey] = ent.value;
      else _preloadedRows[ent.rowKey] = rowMode === 'array' ? [] : {};
    }
    return {
      keys: keys,
      total: total,
      hasMore: offset + slice.length < total,
      pagedAtSource: true,
      _preloadedRows: _preloadedRows,
      _fromKey: true,
      _containerType: meta.containerType,
      _sourceKey: meta.storageKey,
    };
  }

  /**
   * `source.from === 'key'` — rânduri din conținutul unei singure chei Redis.
   */
  async function resolveSourceKeyContent(source, redis, pageOpts) {
    pageOpts = pageOpts || {};
    const storageKey = String(source.key || '').trim();
    if (!storageKey) throw new Error('list.source.key lipsă');
    const rowMode = pageOpts.rowMode === 'array' ? 'array' : 'object';
    const pageSize = Math.max(1, Number(pageOpts.pageSize) || 20);
    const page = Math.max(1, Number(pageOpts.page) || 1);
    const offset = (page - 1) * pageSize;
    const needsValue = pageOpts.needsValue !== false;

    let tip = await redisKeyType(redis, storageKey);
    if (tip === 'ReJSON-RL') tip = 'json';
    const meta = { storageKey: storageKey, containerType: tip };

    if (tip === 'none') {
      return packKeySourcePage([], offset, pageSize, 0, meta, rowMode, needsValue);
    }

    if (tip === 'list') {
      const total = Number(await redis.exec(['LLEN', storageKey])) || 0;
      const end = offset + pageSize - 1;
      const members = await redis.exec(['LRANGE', storageKey, String(offset), String(end)]);
      const list = Array.isArray(members) ? members : [];
      const entries = list.map(function (m, i) {
        return {
          rowKey: String(offset + i),
          value: parseMemberRowText(m, rowMode),
        };
      });
      const keys = entries.map(function (e) {
        return e.rowKey;
      });
      const _preloadedRows = {};
      entries.forEach(function (e) {
        _preloadedRows[e.rowKey] = needsValue ? e.value : rowMode === 'array' ? [] : {};
      });
      return {
        keys: keys,
        total: total,
        hasMore: offset + entries.length < total,
        pagedAtSource: true,
        _preloadedRows: _preloadedRows,
        _fromKey: true,
        _containerType: 'list',
        _sourceKey: storageKey,
      };
    }

    if (tip === 'json') {
      const raw = await redis.exec(['JSON.GET', storageKey, '$']);
      const root = unwrapJsonGet(raw);
      const entries = jsonRootToEntries(root, rowMode);
      return packKeySourcePage(entries, offset, pageSize, entries.length, meta, rowMode, needsValue);
    }

    if (tip === 'string') {
      const s = await redis.exec(['GET', storageKey]);
      const text = s == null ? '' : String(s);
      const val = rowMode === 'array' ? [text] : { value: text };
      const entries = [{ rowKey: '0', value: val }];
      return packKeySourcePage(entries, offset, pageSize, 1, meta, rowMode, needsValue);
    }

    if (tip === 'set') {
      const members = await redis.exec(['SMEMBERS', storageKey]);
      const sorted = (Array.isArray(members) ? members : []).map(String).sort();
      const entries = sorted.map(function (m) {
        return { rowKey: m, value: parseMemberRowText(m, rowMode) };
      });
      return packKeySourcePage(entries, offset, pageSize, entries.length, meta, rowMode, needsValue);
    }

    if (tip === 'zset') {
      const total = Number(await redis.exec(['ZCARD', storageKey])) || 0;
      const end = offset + pageSize - 1;
      const members = await redis.exec(['ZRANGE', storageKey, String(offset), String(end)]);
      const list = Array.isArray(members) ? members : [];
      const entries = list.map(function (m) {
        return { rowKey: String(m), value: parseMemberRowText(m, rowMode) };
      });
      const keys = entries.map(function (e) {
        return e.rowKey;
      });
      const _preloadedRows = {};
      entries.forEach(function (e) {
        _preloadedRows[e.rowKey] = needsValue ? e.value : rowMode === 'array' ? [] : {};
      });
      return {
        keys: keys,
        total: total,
        hasMore: offset + entries.length < total,
        pagedAtSource: true,
        _preloadedRows: _preloadedRows,
        _fromKey: true,
        _containerType: 'zset',
        _sourceKey: storageKey,
      };
    }

    if (tip === 'hash') {
      const raw = await redis.exec(['HGETALL', storageKey]);
      let map = raw;
      if (Array.isArray(raw)) {
        map = {};
        for (let i = 0; i + 1 < raw.length; i += 2) {
          map[String(raw[i])] = String(raw[i + 1]);
        }
      }
      if (!map || typeof map !== 'object') map = {};
      const fields = Object.keys(map).sort();
      const entries = fields.map(function (f) {
        return { rowKey: f, value: hashFieldToRow(f, map[f], rowMode) };
      });
      return packKeySourcePage(entries, offset, pageSize, entries.length, meta, rowMode, needsValue);
    }

    throw new Error('list.source.key tip nesuportat: ' + tip);
  }

  async function resolveKeysPattern(redis, pattern, pageOpts) {
    pageOpts = pageOpts || {};
    const pat = pattern == null || pattern === '' ? '*' : String(pattern);
    const raw = await redis.exec(['KEYS', pat]);
    let keys = Array.isArray(raw) ? raw.map(String) : [];
    keys.sort();
    const maxScan = pageOpts.maxScan != null ? Number(pageOpts.maxScan) : 2000;
    if (keys.length > maxScan) keys = keys.slice(0, maxScan);
    return { keys, total: keys.length, hasMore: false, pagedAtSource: false };
  }

  async function resolveSourceKeys(source, redis, pageOpts) {
    pageOpts = pageOpts || {};
    if (!source || typeof source !== 'object') {
      throw new Error('list.source lipsă');
    }
    const from = source.from;
    if (from === 'key') {
      return resolveSourceKeyContent(source, redis, pageOpts);
    }
    if (from === 'keys') {
      return resolveKeysPattern(redis, source.pattern != null ? source.pattern : '*', {
        maxScan: source.maxScan != null ? source.maxScan : pageOpts.maxScan,
      });
    }
    if (from === 'search' && SearchQ) {
      if (isMatchAllSearchQuery(source.query)) {
        return resolveKeysPattern(redis, '*', {
          maxScan: source.maxScan != null ? source.maxScan : pageOpts.maxScan,
        });
      }
      const pageSize = pageOpts.pageSize || 20;
      const page = pageOpts.page || 1;
      const offset = (page - 1) * pageSize;
      const qObj = SearchQ.normalizeQuery(source.query);
      const searchNoContent =
        SearchQ.sourceWantsNoContent && SearchQ.sourceWantsNoContent(source);
      const searchSourceObj = Object.assign({}, source, {
        query: qObj,
        limit: pageSize,
        offset: offset,
      });
      const argv = SearchQ.buildSearchArgv(searchSourceObj);
      const exactCount = pageOpts.exactCount === true;
      let searchTotal;
      let raw;
      if (exactCount) {
        const countArgv = SearchQ.buildSearchCountArgv(searchSourceObj);
        const pair = await Promise.all([redis.exec(countArgv), redis.exec(argv)]);
        const countParsed = SearchQ.parseSearchCount(pair[0]);
        if (!countParsed.ok) {
          throw new Error(
            SearchQ.SEARCH_COUNT_ERROR ||
              'Interogare search invalidă sau index indisponibil.'
          );
        }
        searchTotal = countParsed.count;
        raw = pair[1];
      } else {
        raw = await redis.exec(argv);
      }
      const parsed = SearchQ.parseSearchHits
        ? SearchQ.parseSearchHits(raw)
        : { keys: SearchQ.unwrapSearchKeys(raw), preloadedRows: {} };
      const keys = parsed.keys;
      const preloadedRows = searchNoContent ? {} : parsed.preloadedRows || {};
      let total = typeof searchTotal !== 'undefined' ? searchTotal : null;
      let hasMore =
        total != null
          ? offset + keys.length < total
          : keys.length >= pageSize;
      return {
        keys,
        total,
        hasMore,
        pagedAtSource: true,
        _preloadedRows: preloadedRows,
        _searchNoContent: !!searchNoContent,
      };
    }
    if (!FormOpts) throw new Error('form-options lipsă');
    const one = await FormOpts.resolveOneOptions(source, redis);
    let keys = (one.enum || []).map(String);
    const maxScan = source.maxScan != null ? Number(source.maxScan) : 2000;
    if (keys.length > maxScan) keys = keys.slice(0, maxScan);
    return { keys, total: keys.length, hasMore: false, pagedAtSource: false };
  }




  /**
   * @param {string} [knownType] dacă e deja cunoscut, nu mai apelează TYPE
   */
  async function batchJsonMget(redis, keys) {
    const out = {};
    if (!redis || typeof redis.exec !== 'function' || !keys || !keys.length) return out;
    try {
      const argv = ['JSON.MGET'].concat(keys.map(String), '$');
      const raw = await redis.exec(argv);
      if (!Array.isArray(raw)) return out;
      for (let i = 0; i < keys.length; i++) {
        const val = unwrapJsonGet(raw[i]);
        if (val != null) out[String(keys[i])] = val;
      }
    } catch (e) {
      /* fallback batchLoadJsonForKeys */
    }
    return out;
  }

  /** MGET, apoi execTx / paralel JSON.GET — fără TYPE. */
  async function batchLoadJsonForKeys(redis, keys) {
    const out = await batchJsonMget(redis, keys);
    const missing = keys.filter((k) => !Object.prototype.hasOwnProperty.call(out, String(k)));
    if (!missing.length || !redis || typeof redis.exec !== 'function') return out;

    if (typeof redis.execTx === 'function') {
      try {
        const cmds = missing.map((k) => ['JSON.GET', String(k), '$']);
        const rawList = await redis.execTx(cmds);
        if (Array.isArray(rawList)) {
          for (let i = 0; i < missing.length; i++) {
            const val = unwrapJsonGet(rawList[i]);
            if (val != null) out[String(missing[i])] = val;
          }
          return out;
        }
      } catch (e) {
        /* fall through */
      }
    }

    await Promise.all(
      missing.map(async (k) => {
        try {
          const raw = await redis.exec(['JSON.GET', String(k), '$']);
          const val = unwrapJsonGet(raw);
          if (val != null) out[String(k)] = val;
        } catch (e) {
          /* skip key */
        }
      })
    );
    return out;
  }

  async function loadRowValue(key, redis, rowMode, knownType) {
    let tip = knownType;
    if (tip == null || tip === '') {
      tip = 'none';
      if (redis.type) tip = await redis.type(key);
    }
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
   * @returns {Promise<{ page, pageSize, total, hasMore, rows: {key, value, type}[], rowMode, fetch }>}
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
    const needs = analyzeColumnNeeds(listDef.columns);

    const exactCount = listDef.exactCount === true;
    const searchNoContent =
      listDef.source &&
      listDef.source.from === 'search' &&
      SearchQ &&
      SearchQ.sourceWantsNoContent(listDef.source);

    let src = await resolveSourceKeys(listDef.source, redis, {
      page: pageNum,
      pageSize,
      exactCount,
      rowMode,
      needsValue: needs.needsValue,
    });

    const fromKey = !!(listDef.source && listDef.source.from === 'key');

    let pageKeys;
    let total = src.total;
    let hasMore = !!src.hasMore;

    if (src.pagedAtSource) {
      pageKeys = src.keys;
      if (total != null && Number.isFinite(Number(total))) {
        total = Number(total);
        const maxPage = Math.max(1, Math.ceil(total / pageSize) || 1);
        if (pageNum > maxPage) {
          pageNum = maxPage;
          src = await resolveSourceKeys(listDef.source, redis, {
            page: pageNum,
            pageSize,
            exactCount,
          });
          pageKeys = src.keys;
          total = src.total != null ? Number(src.total) : total;
        }
        hasMore = pageNum * pageSize < total;
      } else if (pageKeys.length === 0 && pageNum > 1) {
        pageNum = 1;
        src = await resolveSourceKeys(listDef.source, redis, {
          page: 1,
          pageSize,
          exactCount,
        });
        pageKeys = src.keys;
        hasMore = !!src.hasMore;
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

    const fromSearch =
      listDef.source && listDef.source.from === 'search' && !!src.pagedAtSource;
    if (!fromKey && fromSearch && !searchNoContent && needs.needsValue && pageKeys.length) {
      if (!src._preloadedRows) src._preloadedRows = {};
      const missing = pageKeys.filter(
        (k) => !Object.prototype.hasOwnProperty.call(src._preloadedRows, k)
      );
      if (missing.length) {
        const batch = await batchLoadJsonForKeys(redis, missing);
        Object.assign(src._preloadedRows, batch);
      }
    }

    const rows = [];
    for (const key of pageKeys) {
      let tip = null;
      const isPreloaded =
        fromKey ||
        (!searchNoContent &&
          src &&
          src._preloadedRows &&
          Object.prototype.hasOwnProperty.call(src._preloadedRows, key));
      if (fromKey) {
        tip = src._containerType || 'key';
      } else if (searchNoContent && fromSearch) {
        tip = null;
      } else if (!isPreloaded && (needs.needsType || needs.needsValue)) {
        if (fromSearch && !searchNoContent && !needs.needsType) {
          tip = 'json';
        } else if (fromSearch && needs.needsValue && !needs.needsType) {
          tip = 'json';
        } else {
          tip = 'none';
          if (redis.type) {
            try {
              tip = await redis.type(key);
            } catch (e) {
              tip = 'none';
            }
          }
        }
      } else if (isPreloaded) {
        tip = 'json';
      }
      let value;
      if (searchNoContent && fromSearch) {
        value = rowMode === 'array' ? [] : {};
      } else if (isPreloaded) {
        value = src._preloadedRows[key];
      } else if (needs.needsValue) {
        try {
          value = await loadRowValue(key, redis, rowMode, tip);
        } catch (e) {
          value = rowMode === 'array' ? [key] : { value: key };
        }
      } else {
        value = rowMode === 'array' ? [] : {};
      }
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        value = Object.assign({ _key: key }, value);
        if (tip != null) value._type = tip;
      }
      rows.push({ key, value, type: tip });
    }





    return {
      page: pageNum,
      pageSize,
      total,
      hasMore,
      rows,
      rowMode,
      fetch: needs,
    };
  }

  /** Max pagini ca în UI „Pagina N / M”. */
  function computePageMax(pageData) {
    const page = Math.max(1, Number(pageData && pageData.page) || 1);
    const pageSize = Math.max(1, Number(pageData && pageData.pageSize) || 20);
    const total = pageData && pageData.total;
    if (total != null && Number.isFinite(Number(total))) {
      return Math.max(1, Math.ceil(Number(total) / pageSize));
    }
    return Math.max(1, page);
  }

  /**
   * form din rând listă: value + _key (id rând) dacă lipsește.
   */
  function formFromRow(row) {
    const key = row && row.key != null ? String(row.key) : '';
    const v = row && row.value;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      const form = JSON.parse(JSON.stringify(v));
      if (key && !Object.prototype.hasOwnProperty.call(form, '_key')) {
        form._key = key;
      }
      return form;
    }
    return { value: v, _key: key };
  }

  /**
   * Context `list` pentru alg (pagina curentă din Live).
   * @param {{ pageData, listid?, listDefKey? }} opts
   */
  function buildListContext(opts) {
    opts = opts || {};
    const pageData = opts.pageData || {};
    const rows = Array.isArray(pageData.rows) ? pageData.rows : [];
    const pageSize = Math.max(1, Number(pageData.pageSize) || 20);
    const page = Math.max(1, Number(pageData.page) || 1);
    const total =
      pageData.total != null && Number.isFinite(Number(pageData.total))
        ? Number(pageData.total)
        : null;
    return {
      page: page,
      pageMax: computePageMax(pageData),
      pageSize: pageSize,
      total: total,
      hasMore: !!pageData.hasMore,
      keys: rows.map((r) => (r && r.key != null ? String(r.key) : '')),
      rows: rows.map((r) => {
        const v = r && r.value;
        if (v == null) return null;
        try {
          return JSON.parse(JSON.stringify(v));
        } catch (e) {
          return v;
        }
      }),
      id: opts.listid != null ? String(opts.listid) : '',
      def: opts.listDefKey != null ? String(opts.listDefKey) : '',
    };
  }

  /**
   * Default true. `autoload: false` → Live nu apelează source la open (doar refresh).
   */
  function shouldAutoload(listDef) {
    return !(listDef && listDef.autoload === false);
  }

  const api = {
    cellValue,
    formatListCellDisplay,
    analyzeColumnNeeds,
    parseMemberRowText,
    loadRowValue,
    resolveSourceKeys,
    resolveSourceKeyContent,
    loadListPage,
    computePageMax,
    formFromRow,
    buildListContext,
    shouldAutoload,
  };

  root.SsideListLoad = api;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
