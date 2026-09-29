/**
 * Ordine câmpuri JSON Schema pentru JSONEditor (propertyOrder).
 * JSONEditor sortează după propertyOrder (default 1000) — la egalitate ordinea e
 * nedeterminată; injectăm 10,20,30… după cheile din properties (sau după array
 * `propertyOrder` pe obiect, extensie sside).
 */
(function (root) {
  'use strict';

  function applyPropertyOrder(node) {
    if (!node || typeof node !== 'object' || Array.isArray(node)) return;

    if (node.properties && typeof node.properties === 'object' && !Array.isArray(node.properties)) {
      let names;
      if (Array.isArray(node.propertyOrder)) {
        names = [];
        const seen = new Set();
        node.propertyOrder.forEach((k) => {
          if (typeof k === 'string' && node.properties[k] && !seen.has(k)) {
            names.push(k);
            seen.add(k);
          }
        });
        Object.keys(node.properties).forEach((k) => {
          if (!seen.has(k)) names.push(k);
        });
      } else {
        names = Object.keys(node.properties);
      }

      names.forEach((k, i) => {
        const p = node.properties[k];
        if (!p || typeof p !== 'object' || Array.isArray(p)) return;
        // Nu rescriem propertyOrder numeric deja setat pe câmp (manual în schemă),
        // exceptând când există lista pe obiect (sursa de adevăr).
        if (Array.isArray(node.propertyOrder) || typeof p.propertyOrder !== 'number') {
          p.propertyOrder = (i + 1) * 10;
        }
        applyPropertyOrder(p);
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

  const api = { applyPropertyOrder, withPropertyOrder };

  root.SsideSchemaOrder = api;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
