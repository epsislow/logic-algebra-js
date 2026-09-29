/**
 * Ordine câmpuri JSON Schema pentru JSONEditor (propertyOrder).
 * JSONEditor sortează după propertyOrder (default 1000). RedisJSON poate întoarce
 * `properties` în ordine diferită la fiecare GET — de aceea:
 * 1) respectăm propertyOrder numeric (sau string numeric) deja pe câmp
 * 2) sau lista `propertyOrder: ["a","b"]` pe obiect (array = stabil în Redis)
 * 3) altfel ordinea Object.keys din GET
 * Apoi reconstruim `properties` în ordinea sortată (ca JE să înregistreze editorii corect).
 */
(function (root) {
  'use strict';

  function readOrderNum(node) {
    if (!node || typeof node !== 'object') return null;
    const v = node.propertyOrder;
    if (typeof v === 'number' && Number.isFinite(v)) return v;
    if (typeof v === 'string' && v.trim() !== '' && Number.isFinite(Number(v))) {
      return Number(v);
    }
    return null;
  }

  function rebuildPropertiesInOrder(node, names) {
    const prev = node.properties;
    const next = {};
    names.forEach((k) => {
      if (Object.prototype.hasOwnProperty.call(prev, k)) next[k] = prev[k];
    });
    // orice cheie rămasă (nu ar trebui)
    Object.keys(prev).forEach((k) => {
      if (!Object.prototype.hasOwnProperty.call(next, k)) next[k] = prev[k];
    });
    node.properties = next;
  }

  function applyPropertyOrder(node) {
    if (!node || typeof node !== 'object' || Array.isArray(node)) return;

    if (node.properties && typeof node.properties === 'object' && !Array.isArray(node.properties)) {
      const props = node.properties;
      let names;
      const listOrder = Array.isArray(node.propertyOrder) ? node.propertyOrder : null;

      if (listOrder) {
        names = [];
        const seen = new Set();
        listOrder.forEach((k) => {
          if (typeof k === 'string' && props[k] && !seen.has(k)) {
            names.push(k);
            seen.add(k);
          }
        });
        Object.keys(props).forEach((k) => {
          if (!seen.has(k)) names.push(k);
        });
        names.forEach((k, i) => {
          const p = props[k];
          if (p && typeof p === 'object' && !Array.isArray(p)) {
            p.propertyOrder = (i + 1) * 10;
          }
        });
        // array-ul pe obiect derutează JSONEditor (așteaptă number pe câmp)
        delete node.propertyOrder;
      } else {
        names = Object.keys(props);
        // dacă există deja propertyOrder pe câmpuri, sortează după el (stabil între GET-uri Redis)
        const hasAny = names.some((k) => readOrderNum(props[k]) != null);
        if (hasAny) {
          names = names.slice().sort((a, b) => {
            const oa = readOrderNum(props[a]);
            const ob = readOrderNum(props[b]);
            const na = oa == null ? 1000 : oa;
            const nb = ob == null ? 1000 : ob;
            if (na !== nb) return na - nb;
            return a < b ? -1 : a > b ? 1 : 0;
          });
        }
        names.forEach((k, i) => {
          const p = props[k];
          if (!p || typeof p !== 'object' || Array.isArray(p)) return;
          const existing = readOrderNum(p);
          p.propertyOrder = existing != null ? existing : (i + 1) * 10;
        });
      }

      rebuildPropertiesInOrder(node, names);

      Object.keys(node.properties).forEach((k) => {
        applyPropertyOrder(node.properties[k]);
      });
    }

    if (node.items) {
      if (Array.isArray(node.items)) node.items.forEach(applyPropertyOrder);
      else applyPropertyOrder(node.items);
    }
  }

  /**
   * Clone + aplică ordine. Nu mută schema din Redis/cache.
   */
  function withPropertyOrder(schema) {
    if (!schema || typeof schema !== 'object') return schema;
    let out;
    try {
      out = JSON.parse(JSON.stringify(schema));
    } catch (e) {
      return schema;
    }
    applyPropertyOrder(out);
    return out;
  }

  const api = { applyPropertyOrder, withPropertyOrder, readOrderNum };

  root.SsideSchemaOrder = api;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
