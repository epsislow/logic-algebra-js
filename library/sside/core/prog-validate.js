/**
 * Validare alg / form / ui / list la Salvează (F5a + F4l).
 */
(function (root) {
  'use strict';

  const ALG_OPS = new Set([
    'assign', 'cat', 'if', 'foreach', 'end',
    'kget', 'ksave', 'kdel', 'kadd', 'krm',
    'scheck', 'sgen',
    'jset', 'jget',
    'search',
    'ui',
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

  function validateBtns(btns, label) {
    if (btns == null) return null;
    if (!Array.isArray(btns)) return err(label + ' trebuie să fie array');
    for (let i = 0; i < btns.length; i++) {
      const b = btns[i];
      if (!b || typeof b !== 'object') return err(label + '[' + i + '] invalid');
      if (b.alg != null && b.alg !== '') {
        if (typeof b.alg !== 'string' || !/^alg:_[^:]+$/.test(b.alg)) {
          return err(label + '[' + i + '].alg invalid (ex: alg:_save)');
        }
      }
      if (b.place != null && b.place !== 'row' && b.place !== 'below') {
        return err(label + '[' + i + '].place trebuie row|below');
      }
    }
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
    const be = validateBtns(obj.btns, 'form.btns');
    if (be) return be;
    if (obj.fields != null) {
      const FormOpts =
        root.SsideFormOptions ||
        (typeof require !== 'undefined' ? require('./form-options.js') : null);
      if (FormOpts && typeof FormOpts.validateFieldsConfig === 'function') {
        const fe = FormOpts.validateFieldsConfig(obj.fields);
        if (fe) return err(fe);
      } else if (typeof obj.fields !== 'object' || Array.isArray(obj.fields)) {
        return err('form.fields trebuie să fie obiect');
      }
    }
    return ok();
  }

  function validateList(obj) {
    const e = checkV(obj);
    if (e) return e;
    if (!obj.source || typeof obj.source !== 'object') {
      return err('list.source lipsă');
    }
    if (!obj.source.from || typeof obj.source.from !== 'string') {
      return err('list.source.from lipsă');
    }
    if (!Array.isArray(obj.columns) || obj.columns.length === 0) {
      return err('list.columns trebuie array nevid');
    }
    for (let i = 0; i < obj.columns.length; i++) {
      const c = obj.columns[i];
      if (!c || typeof c !== 'object') return err('columns[' + i + '] invalid');
      if (c.path == null || c.path === '') return err('columns[' + i + '].path lipsă');
    }
    if (obj.row != null && obj.row !== 'object' && obj.row !== 'array') {
      return err('list.row trebuie object|array');
    }
    if (obj.pageSize != null && (!Number.isFinite(Number(obj.pageSize)) || Number(obj.pageSize) < 1)) {
      return err('list.pageSize invalid');
    }
    const b1 = validateBtns(obj.btns, 'list.btns');
    if (b1) return b1;
    const b2 = validateBtns(obj.rowBtns, 'list.rowBtns');
    if (b2) return b2;
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
            if (!s.schema.includes('.') && s.schema.charAt(0) !== '$' && !/^schema:/.test(s.schema)) {
              return err('steps[' + i + '].schema arată invalid');
            }
          }
        }
      }
      if (s.op === 'ui') {
        if (s.listid == null || s.listid === '') {
          return err('steps[' + i + ']: ui fără listid');
        }
        const d = s.do || 'refresh';
        if (d !== 'refresh' && d !== 'clear') {
          return err('steps[' + i + ']: ui.do trebuie refresh|clear');
        }
      }
    }
    return ok();
  }

  function validateBlock(b, path) {
    if (!b || typeof b !== 'object') return err(path + ' invalid');
    if (!b.id || typeof b.id !== 'string' || !String(b.id).trim()) {
      return err(path + '.id obligatoriu');
    }
    if (b.type === 'list') {
      if (!b.list || typeof b.list !== 'string' || !/^list:_[^:]+$/.test(b.list)) {
        return err(path + '.list invalid (ex: list:_stock)');
      }
    } else if (b.type === 'form') {
      if (!b.form || typeof b.form !== 'string' || !/^form:_[^:]+$/.test(b.form)) {
        return err(path + '.form invalid (ex: form:_item_edit)');
      }
    } else {
      return err(path + '.type trebuie list|form');
    }
    return null;
  }

  function validateUi(obj) {
    const e = checkV(obj);
    if (e) return e;
    if (obj.tabs != null) {
      if (!Array.isArray(obj.tabs)) return err('ui.tabs trebuie să fie array');
      const seenIds = new Set();
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
        if (t.blocks != null) {
          if (!Array.isArray(t.blocks)) return err('tabs[' + i + '].blocks trebuie array');
          for (let j = 0; j < t.blocks.length; j++) {
            const be = validateBlock(t.blocks[j], 'tabs[' + i + '].blocks[' + j + ']');
            if (be) return be;
            const id = String(t.blocks[j].id).trim();
            if (seenIds.has(id)) return err('tabs: id duplicat „' + id + '”');
            seenIds.add(id);
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
    if (kind === 'list') return validateList(obj);
    return err('kind necunoscut');
  }

  const api = {
    validateProg,
    validateForm,
    validateAlg,
    validateUi,
    validateList,
    ALG_OPS,
  };

  root.SsideProgValidate = api;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
