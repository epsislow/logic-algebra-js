/**
 * Validare alg / form / ui la Salvează (F5a).
 */
(function (root) {
  'use strict';

  const ALG_OPS = new Set([
    'assign', 'cat', 'if', 'foreach', 'end',
    'kget', 'ksave', 'kdel', 'kadd', 'krm',
    'scheck', 'sgen',
    'jset', 'jget',
    'tstart', 'tdo', 'tstop',
    'redis',
  ]);

  function err(msg) {
    return { ok: false, err: msg };
  }

  function ok() {
    return { ok: true };
  }

  function checkV(obj) {
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
      return err('Conținutul trebuie să fie un obiect JSON');
    }
    if (obj.v == null) return err('Lipsește v (trebuie v: 1)');
    if (obj.v !== 1) return err('Doar v: 1 e acceptat (ai v: ' + obj.v + ')');
    return null;
  }

  function validateForm(obj) {
    const e = checkV(obj);
    if (e) return e;
    if (obj.schema != null && obj.schema !== '') {
      if (typeof obj.schema !== 'string' || !/^schema:_[^:]+$/.test(obj.schema)) {
        return err('form.schema invalid (ex: schema:_item)');
      }
    }
    if (obj.btns != null) {
      if (!Array.isArray(obj.btns)) return err('form.btns trebuie să fie array');
      for (let i = 0; i < obj.btns.length; i++) {
        const b = obj.btns[i];
        if (!b || typeof b !== 'object') return err('btns[' + i + '] invalid');
        if (b.alg != null && b.alg !== '') {
          if (typeof b.alg !== 'string' || !/^alg:_[^:]+$/.test(b.alg)) {
            return err('btns[' + i + '].alg invalid (ex: alg:_save)');
          }
        }
      }
    }
    return ok();
  }

  function validateAlg(obj) {
    const e = checkV(obj);
    if (e) return e;
    if (!Array.isArray(obj.steps)) return err('alg.steps trebuie să fie array');
    for (let i = 0; i < obj.steps.length; i++) {
      const s = obj.steps[i];
      if (!s || typeof s !== 'object') return err('steps[' + i + '] invalid');
      if (!s.op || typeof s.op !== 'string') return err('steps[' + i + '] fără op');
      if (!ALG_OPS.has(s.op)) return err('steps[' + i + ']: op necunoscut „' + s.op + '”');
      if (s.op === 'scheck' || s.op === 'sgen') {
        if (s.schema != null && s.schema !== '' && typeof s.schema === 'string') {
          if (!/^schema:_[^:]+$/.test(s.schema) && s.schema.indexOf('form.') !== 0 && s.schema.charAt(0) !== '$') {
            // permite ref; dacă e literal cheie, cere format
            if (!s.schema.includes('.') && s.schema.charAt(0) !== '$' && !/^schema:/.test(s.schema)) {
              return err('steps[' + i + '].schema arată invalid');
            }
          }
        }
      }
    }
    return ok();
  }

  function validateUi(obj) {
    const e = checkV(obj);
    if (e) return e;
    if (obj.tabs != null) {
      if (!Array.isArray(obj.tabs)) return err('ui.tabs trebuie să fie array');
      for (let i = 0; i < obj.tabs.length; i++) {
        const t = obj.tabs[i];
        if (!t || typeof t !== 'object') return err('tabs[' + i + '] invalid');
        if (t.forms != null) {
          if (!Array.isArray(t.forms)) return err('tabs[' + i + '].forms trebuie array');
          for (let j = 0; j < t.forms.length; j++) {
            const f = t.forms[j];
            if (typeof f !== 'string' || !/^form:_[^:]+$/.test(f)) {
              return err('tabs[' + i + '].forms[' + j + '] invalid (ex: form:_item_edit)');
            }
          }
        }
      }
    }
    return ok();
  }

  function validateProg(kind, obj) {
    if (kind === 'form') return validateForm(obj);
    if (kind === 'alg') return validateAlg(obj);
    if (kind === 'ui') return validateUi(obj);
    return err('kind necunoscut');
  }

  const api = { validateProg, validateForm, validateAlg, validateUi, ALG_OPS };

  root.SsideProgValidate = api;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
