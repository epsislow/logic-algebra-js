/**
 * Parser query Upstash Search (=… din listă) + unwrap rezultate SEARCH.QUERY.
 * Partajat UI + ALG op `search` (F4j).
 */
(function (root) {
  'use strict';

  function splitByOperator(text, operator) {
    const rezultate = [];
    let parantezeDeschise = 0;
    let acumulat = '';
    const token = ' ' + operator + ' ';

    for (let i = 0; i < text.length; i++) {
      if (text[i] === '(') parantezeDeschise++;
      if (text[i] === ')') parantezeDeschise--;

      acumulat += text[i];

      if (parantezeDeschise === 0 && acumulat.endsWith(token)) {
        rezultate.push(acumulat.substring(0, acumulat.length - token.length));
        acumulat = '';
      }
    }
    rezultate.push(acumulat);
    return rezultate.filter((r) => r.trim() !== '');
  }

  function parseQueryText(text) {
    text = String(text == null ? '' : text).trim();
    if (text.startsWith('=')) text = text.substring(1).trim();

    if (text.startsWith('(') && text.endsWith(')')) {
      text = text.substring(1, text.length - 1).trim();
    }

    const partiOr = splitByOperator(text, 'OR');
    if (partiOr.length > 1) {
      return { $or: partiOr.map((p) => parseQueryText(p)) };
    }

    const partiAnd = splitByOperator(text, 'AND');
    if (partiAnd.length > 1) {
      return { $and: partiAnd.map((p) => parseQueryText(p)) };
    }

    if (text.startsWith('-')) {
      return { $not: parseQueryText(text.substring(1)) };
    }

    if (text.includes(':')) {
      const pozitieDouaPuncte = text.indexOf(':');
      const camp = text.substring(0, pozitieDouaPuncte).trim();
      let valoare = text.substring(pozitieDouaPuncte + 1).trim();

      if (
        (valoare.startsWith('"') && valoare.endsWith('"')) ||
        (valoare.startsWith("'") && valoare.endsWith("'"))
      ) {
        valoare = valoare.substring(1, valoare.length - 1);
      }

      const nodCriteriu = {};
      if (valoare.toLowerCase() === 'true') {
        nodCriteriu[camp] = true;
      } else if (valoare.toLowerCase() === 'false') {
        nodCriteriu[camp] = false;
      } else if (!isNaN(valoare) && valoare !== '') {
        nodCriteriu[camp] = Number(valoare);
      } else {
        nodCriteriu[camp] = valoare;
      }
      return nodCriteriu;
    }

    return { '*': text };
  }

  /**
   * String (=… / AND…) sau obiect flat / Upstash ($and/$or/$not).
   */
  function normalizeQuery(q) {
    if (typeof q === 'string') {
      return parseQueryText(q);
    }
    if (q && typeof q === 'object' && !Array.isArray(q)) {
      if (
        Object.prototype.hasOwnProperty.call(q, '$and') ||
        Object.prototype.hasOwnProperty.call(q, '$or') ||
        Object.prototype.hasOwnProperty.call(q, '$not') ||
        Object.prototype.hasOwnProperty.call(q, '*')
      ) {
        return q;
      }
      const keys = Object.keys(q);
      if (keys.length === 0) return { '*': '*' };
      if (keys.length === 1) return q;
      return { $and: keys.map((k) => ({ [k]: q[k] })) };
    }
    throw new Error('search: query invalid (string|object)');
  }

  /**
   * @param {*} raw rezultat SEARCH.QUERY (array) sau { rezultat }
   * @returns {string[]}
   */
  function unwrapSearchKeys(raw) {
    return parseSearchHits(raw).keys;
  }

  /** Payload gol la NOCONTENT (mock + Upstash). */
  function isEmptySearchContent(payload) {
    if (payload == null) return true;
    if (Array.isArray(payload) && payload.length === 0) return true;
    return false;
  }

  function normalizeRedisJsonDoc(parsed) {
    if (parsed == null) return null;
    if (Array.isArray(parsed) && parsed.length === 1) return parsed[0];
    return parsed;
  }

  function parseHitContent(payload) {
    if (isEmptySearchContent(payload)) return null;
    if (typeof payload === 'object' && !Array.isArray(payload)) return payload;
    if (typeof payload === 'string') {
      const s = payload.trim();
      if (!s || s === '[]' || s === '{}') return null;
      try {
        return JSON.parse(s);
      } catch (e) {
        return null;
      }
    }
    return null;
  }

  /** Conținut hit Upstash: direct JSON, sau `[["$","{…}"], …]`. */
  function parseSearchDocumentContent(payload) {
    const direct = parseHitContent(payload);
    if (direct != null) return normalizeRedisJsonDoc(direct);
    if (!Array.isArray(payload) || payload.length === 0) return null;

    if (payload.length > 0 && Array.isArray(payload[0])) {
      let jsonPayload = null;
      const hashObj = {};
      for (let j = 0; j < payload.length; j++) {
        const pair = payload[j];
        if (!Array.isArray(pair) || pair.length < 2) continue;
        const field = String(pair[0]);
        if (field === '$' || field === '$.' || field === 'json' || field === 'payload') {
          jsonPayload = pair[1];
        } else {
          hashObj[field] = pair[1];
        }
      }
      if (jsonPayload != null) {
        const doc = parseHitContent(jsonPayload);
        if (doc != null) return normalizeRedisJsonDoc(doc);
      }
      return Object.keys(hashObj).length ? hashObj : null;
    }

    if (payload.length >= 2 && typeof payload[0] === 'string') {
      const doc = parseHitContent(payload[1]);
      if (doc != null) return normalizeRedisJsonDoc(doc);
    }
    return null;
  }

  function looksLikeRedisDocKey(s) {
    return typeof s === 'string' && s !== '' && s.indexOf(':') !== -1;
  }

  function isSearchFieldsBlob(item) {
    if (!Array.isArray(item) || item.length === 0) return false;
    if (Array.isArray(item[0])) return true;
    if (typeof item[0] === 'string' && (item[0] === '$' || item[0] === '$.')) return true;
    return false;
  }

  function parseSearchHitsFlat(raw) {
    const keys = [];
    const preloadedRows = {};
    let i = 0;
    if (raw.length > 0 && typeof raw[0] === 'number') i = 1;
    if (i >= raw.length || typeof raw[i] !== 'string' || !looksLikeRedisDocKey(raw[i])) {
      return null;
    }
    while (i < raw.length) {
      if (typeof raw[i] !== 'string') return null;
      const kName = raw[i++];
      keys.push(kName);
      if (i < raw.length && isSearchFieldsBlob(raw[i])) {
        const doc = parseSearchDocumentContent(raw[i++]);
        if (doc != null) preloadedRows[kName] = doc;
      }
    }
    return { keys, preloadedRows };
  }

  /**
   * @param {*} raw rezultat SEARCH.QUERY
   * @returns {{ keys: string[], preloadedRows: Record<string, *> }}
   */
  function parseSearchHits(raw) {
    if (raw && typeof raw === 'object' && !Array.isArray(raw) && raw.rezultat !== undefined) {
      raw = raw.rezultat;
    }
    const keys = [];
    const preloadedRows = {};
    if (raw == null) return { keys, preloadedRows };
    if (!Array.isArray(raw)) return { keys, preloadedRows };

    const flat = parseSearchHitsFlat(raw);
    if (flat) return flat;

    let start = 0;
    if (raw.length > 0 && typeof raw[0] === 'number') start = 1;

    for (let i = start; i < raw.length; i++) {
      const item = raw[i];
      if (Array.isArray(item) && item.length >= 1 && typeof item[0] === 'string') {
        const kName = item[0];
        keys.push(kName);
        const content = item.length >= 3 ? parseSearchDocumentContent(item[2]) : null;
        if (content != null) preloadedRows[kName] = content;
      } else if (typeof item === 'string' && item !== '') {
        keys.push(item);
      } else if (item && typeof item === 'object' && !Array.isArray(item)) {
        const kName = String(item.key || item.id || '');
        if (kName) {
          keys.push(kName);
          const content = item.data != null ? item.data : item.value != null ? item.value : item;
          if (content != null && typeof content === 'object' && !Array.isArray(content)) {
            preloadedRows[kName] = content;
          }
        }
      }
    }
    return { keys, preloadedRows };
  }

  /**
   * Obiect `{ query, index, limit, offset, nocontent }` sau legacy `(index, qObj, limit, offset)`.
   * Implicit NOCONTENT (doar chei). Pentru listă: `nocontent: false`.
   */
  function buildSearchArgv(indexOrSource, qObj, limit, offset) {
    let source;
    if (
      indexOrSource &&
      typeof indexOrSource === 'object' &&
      !Array.isArray(indexOrSource) &&
      (Object.prototype.hasOwnProperty.call(indexOrSource, 'query') ||
        Object.prototype.hasOwnProperty.call(indexOrSource, 'from') ||
        Object.prototype.hasOwnProperty.call(indexOrSource, 'index') ||
        Object.prototype.hasOwnProperty.call(indexOrSource, 'nocontent') ||
        Object.prototype.hasOwnProperty.call(indexOrSource, 'content'))
    ) {
      source = indexOrSource;
    } else {
      source = {
        index: indexOrSource,
        query: qObj,
        limit,
        offset,
      };
    }

    const idx = source.index || 'idx_search_tags';
    const qNorm = normalizeQuery(source.query == null ? { '*': '*' } : source.query);
    const argv = ['SEARCH.QUERY', idx, JSON.stringify(qNorm)];
    if (source.limit != null && source.limit !== '') {
      argv.push('LIMIT', String(source.limit));
    }
    if (source.offset != null && source.offset !== '' && Number(source.offset) > 0) {
      argv.push('OFFSET', String(source.offset));
    }
    const wantContent = source.content === true || source.nocontent === false;
    if (!wantContent) argv.push('NOCONTENT');
    return argv;
  }


  const api = {
    splitByOperator,
    parseQueryText,
    normalizeQuery,
    unwrapSearchKeys,
    parseSearchHits,
    parseHitContent,
    parseSearchDocumentContent,
    isEmptySearchContent,
    buildSearchArgv,
  };

  root.SsideSearchQuery = api;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
