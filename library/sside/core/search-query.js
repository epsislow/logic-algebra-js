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
    if (raw && typeof raw === 'object' && !Array.isArray(raw) && raw.rezultat !== undefined) {
      raw = raw.rezultat;
    }
    if (!Array.isArray(raw)) return [];

    const cheiColectate = [];
    raw.forEach((item) => {
      if (Array.isArray(item) && item.length > 0) {
        if (typeof item[0] === 'string') {
          cheiColectate.push(item[0]);
        }
      } else if (typeof item === 'string' && (item.includes(':') || item.startsWith('data:'))) {
        if (cheiColectate.indexOf(item) === -1) {
          cheiColectate.push(item);
        }
      }
    });
    return cheiColectate;
  }

  function buildSearchArgv(index, queryObj, limit, offset) {
    return [
      'SEARCH.QUERY',
      String(index || 'idx_search_tags'),
      JSON.stringify(queryObj),
      'LIMIT',
      String(limit != null ? limit : 1000),
      'OFFSET',
      String(offset != null ? offset : 0),
      'NOCONTENT',
    ];
  }

  const api = {
    splitByOperator,
    parseQueryText,
    normalizeQuery,
    unwrapSearchKeys,
    buildSearchArgv,
  };

  root.SsideSearchQuery = api;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
