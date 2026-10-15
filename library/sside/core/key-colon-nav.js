/**
 * Reguli navigare prefix (:) — partajate Arbore + Dosare.
 * Chei care se termină cu ':' sunt atomice (fără split).
 */
(function (root) {
  'use strict';

  function cheieCuColonFinal(key) {
    const k = String(key == null ? '' : key);
    return k.length > 0 && k.endsWith(':');
  }

  function prefixFromSegments(pathSegments) {
    const segs = pathSegments || [];
    if (!segs.length) return '';
    return segs.join(':');
  }

  function prefixWithColon(pathSegments) {
    const p = prefixFromSegments(pathSegments);
    return p ? p + ':' : '';
  }

  /** Cheie face parte din dosarul path (inclusiv cheia exactă pe prefix). */
  function cheieInDosar(key, pathSegments) {
    const k = String(key == null ? '' : key);
    const p = prefixFromSegments(pathSegments);
    if (!p) return true;
    if (k === p) return true;
    const pc = p + ':';
    return k.startsWith(pc);
  }

  /** Rest după prefix; '' dacă key === prefix. null dacă nu aparține dosarului. */
  function restDupaPrefix(key, pathSegments) {
    const k = String(key == null ? '' : key);
    if (!cheieInDosar(k, pathSegments)) return null;
    const p = prefixFromSegments(pathSegments);
    if (!p) return k;
    if (k === p) return '';
    return k.slice(p.length + 1);
  }

  function esteCheieNavigabilaSplit(key) {
    const k = String(key == null ? '' : key);
    return k.includes(':') && !cheieCuColonFinal(k);
  }

  const api = {
    cheieCuColonFinal,
    prefixFromSegments,
    prefixWithColon,
    cheieInDosar,
    restDupaPrefix,
    esteCheieNavigabilaSplit,
  };

  root.SsideKeyColonNav = api;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
