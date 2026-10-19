/**
 * Referințe listid pentru op ui refresh/clear (F4l-ui-ref).
 * Tot string: "_self" | "_1" | "_2" | … | id block literal.
 */
(function (root) {
  'use strict';

  const SELF = '_self';

  function isSelfRef(s) {
    return String(s) === SELF;
  }

  /** "_1" … "_N" (N >= 1) */
  function parseIndexRef(s) {
    const m = /^_([1-9]\d*)$/.exec(String(s));
    if (!m) return null;
    return parseInt(m[1], 10);
  }

  function isListIdRef(s) {
    const t = String(s);
    return isSelfRef(t) || parseIndexRef(t) != null;
  }

  /**
   * Id de block UI: non-gol, fără prefix `_` (rezervat refs).
   * @returns {string|null} mesaj eroare sau null dacă ok
   */
  function validateBlockId(id) {
    if (id == null || typeof id !== 'string' || !String(id).trim()) {
      return 'id obligatoriu';
    }
    const t = String(id).trim();
    if (t.charAt(0) === '_') {
      return 'id nu poate începe cu _ (rezervat: _self, _1, _2, …)';
    }
    return null;
  }

  /**
   * Token în alg ui.listid (literal, ref sau $var / form.* — validate ușor).
   * @returns {string|null} eroare sau null
   */
  function validateListIdToken(tok) {
    if (tok == null || typeof tok !== 'string') {
      return 'listid trebuie string';
    }
    const t = tok.trim();
    if (!t) return 'listid gol';
    if (isSelfRef(t)) return null;
    if (parseIndexRef(t) != null) return null;
    if (t.charAt(0) === '_') {
      return 'ref listid necunoscut „' + t + '” (folosește _self sau _1, _2, …)';
    }
    return null;
  }

  /**
   * @param {string} token — după resolveRef ($var etc.), valoarea string
   * @param {{ selfListId?: string|null, listIds?: string[] }} uiCtx
   * @returns {string} id block rezolvat
   */
  function resolveListId(token, uiCtx) {
    uiCtx = uiCtx || {};
    const t = token == null ? '' : String(token).trim();
    if (!t) throw new Error('ui: listid gol');

    if (isSelfRef(t)) {
      const self = uiCtx.selfListId != null ? String(uiCtx.selfListId).trim() : '';
      if (!self) {
        throw new Error('ui: _self fără listă în context (buton pe form / fără listă)');
      }
      return self;
    }

    const idx = parseIndexRef(t);
    if (idx != null) {
      const ids = Array.isArray(uiCtx.listIds) ? uiCtx.listIds : [];
      if (idx < 1 || idx > ids.length) {
        throw new Error(
          'ui: ' + t + ' — nu există lista #' + idx + ' pe tabul activ (sunt ' + ids.length + ')'
        );
      }
      const id = String(ids[idx - 1] || '').trim();
      if (!id) throw new Error('ui: ' + t + ' — listă goală la index');
      return id;
    }

    if (t.charAt(0) === '_') {
      throw new Error('ui: ref listid necunoscut „' + t + '”');
    }
    return t;
  }

  const api = {
    SELF,
    isSelfRef,
    isListIdRef,
    parseIndexRef,
    validateBlockId,
    validateListIdToken,
    resolveListId,
  };

  root.SsideUiListRef = api;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
