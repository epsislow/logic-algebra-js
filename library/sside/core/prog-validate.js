/**
 * Validare alg / form / ui / list la Salvează (F5a + F4l).
 */
(function (root) {
  'use strict';

  const ALG_OPS = new Set([
    'assign', 'cat', 'cast',  'fdate',
    'if', 'foreach', 'end', 'comment',
    'kget', 'ksave', 'kdel', 'kttl', 'kadd', 'krm',
    'scheck', 'sgen', 'calc', 'str', 'array',
    'jset', 'jget', 'obj', 'id', 'lock',
    'search', 'notify', 'log',
    'ui',
    'tstart', 'tdo', 'tstop',
    'redis',
  ]);

  const UiListRef =
    root.SsideUiListRef || (typeof require !== 'undefined' ? require('./ui-list-ref.js') : null);

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

  function validateBtns(btns, label, opts) {
    opts = opts || {};
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
      if (opts.allowNeedsRow) {
        if (b.needsRow != null && typeof b.needsRow !== 'boolean') {
          return err(label + '[' + i + '].needsRow trebuie boolean');
        }
      }
      // pe rowBtns, needsRow e ignorat (nu e eroare)
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
      const hasConst = Object.prototype.hasOwnProperty.call(c, 'const');
      const hasPath = c.path != null && String(c.path).trim() !== '';
      if (!hasConst && !hasPath) {
        return err('columns[' + i + ']: path sau const obligatoriu');
      }
    }
    if (obj.row != null && obj.row !== 'object' && obj.row !== 'array') {
      return err('list.row trebuie object|array');
    }
    if (obj.pageSize != null && (!Number.isFinite(Number(obj.pageSize)) || Number(obj.pageSize) < 1)) {
      return err('list.pageSize invalid');
    }
    if (obj.autoload != null && typeof obj.autoload !== 'boolean') {
      return err('list.autoload trebuie boolean');
    }
    if (obj.exactCount != null && typeof obj.exactCount !== 'boolean') {
      return err('list.exactCount trebuie boolean');
    }
    if (obj.source && typeof obj.source === 'object' && obj.source.from === 'search') {
      if (obj.source.noContent != null && typeof obj.source.noContent !== 'boolean') {
        return err('list.source.noContent trebuie boolean');
      }
    }
    const b1 = validateBtns(obj.btns, 'list.btns', { allowNeedsRow: true });
    if (b1) return b1;
    const b2 = validateBtns(obj.rowBtns, 'list.rowBtns');
    if (b2) return b2;
    return ok();
  }

  function validateStepMeta(s, path) {
    if (s.note != null && typeof s.note !== 'string') {
      return err(path + '.note trebuie string');
    }
    if (s.off != null && typeof s.off !== 'boolean') {
      return err(path + '.off trebuie boolean');
    }
    if (s.thenOff != null && typeof s.thenOff !== 'boolean') {
      return err(path + '.thenOff trebuie boolean');
    }
    if (s.elseOff != null && typeof s.elseOff !== 'boolean') {
      return err(path + '.elseOff trebuie boolean');
    }
    if ((s.thenOff != null || s.elseOff != null) && s.op !== 'if') {
      return err(path + ': thenOff/elseOff doar pe if');
    }
    return null;
  }

  function validateAlgSteps(steps, path) {
    if (!Array.isArray(steps)) return err(path + ' trebuie array');
    for (let i = 0; i < steps.length; i++) {
      const s = steps[i];
      const p = path + '[' + i + ']';
      if (!s || typeof s !== 'object') return err(p + ' invalid');
      if (!s.op || typeof s.op !== 'string') return err(p + ' fără op');
      if (!ALG_OPS.has(s.op)) return err(p + ': op necunoscut „' + s.op + '”');
      const metaErr = validateStepMeta(s, p);
      if (metaErr) return metaErr;
      if (s.op === 'scheck' || s.op === 'sgen') {
        if (s.schema != null && s.schema !== '' && typeof s.schema === 'string') {
          if (!/^schema:_[^:]+$/.test(s.schema) && s.schema.indexOf('form.') !== 0 && s.schema.charAt(0) !== '$') {
            if (!s.schema.includes('.') && s.schema.charAt(0) !== '$' && !/^schema:/.test(s.schema)) {
              return err(p + '.schema arată invalid');
            }
          }
        }
      }
      if (s.op === 'kttl') {
        const fn = String(s.fn || '').toLowerCase();
        if (fn !== 'get' && fn !== 'set' && fn !== 'remove') {
          return err(p + '.fn trebuie get|set|remove');
        }
        if (s.key == null || typeof s.key !== 'string' || !String(s.key).trim()) {
          return err(p + '.key obligatoriu');
        }
        if (fn === 'get') {
          if (s.to == null || typeof s.to !== 'string' || !String(s.to).trim()) {
            return err(p + '.to obligatoriu la fn get');
          }
        }
        if (fn === 'set') {
          if (s.ttl === undefined || s.ttl === null || s.ttl === '') {
            return err(p + '.ttl obligatoriu la fn set');
          }
        }
        if (s.ms != null && typeof s.ms !== 'boolean') {
          return err(p + '.ms trebuie boolean');
        }
      }
      if (s.op === 'log') {
        if (s.name == null || typeof s.name !== 'string' || !String(s.name).trim()) {
          return err(p + '.name obligatoriu');
        }
        if (s.level == null || typeof s.level !== 'string' || !String(s.level).trim()) {
          return err(p + '.level obligatoriu');
        }
        const lv = String(s.level).toLowerCase();
        if (lv !== 'info' && lv !== 'warning' && lv !== 'error') {
          return err(p + '.level trebuie info|warning|error');
        }
        if (s.action == null || typeof s.action !== 'string' || !String(s.action).trim()) {
          return err(p + '.action obligatoriu');
        }
        if (s.context != null && s.contextWith != null) {
          return err(p + ': context și contextWith — alege unul');
        }
        if (s.data != null && s.dataWith != null) {
          return err(p + ': data și dataWith — alege unul');
        }
        if (s.tsformat != null && typeof s.tsformat !== 'string') {
          return err(p + '.tsformat trebuie string');
        }
        if (s.format != null && typeof s.format !== 'string') {
          return err(p + '.format trebuie string');
        }
      }
      if (s.op === 'ui') {
        if (s.listid == null || s.listid === '') {
          return err(p + ': ui fără listid');
        }
        const d = s.do || 'refresh';
        if (d !== 'refresh' && d !== 'clear') {
          return err(p + ': ui.do trebuie refresh|clear');
        }
        const toks = Array.isArray(s.listid) ? s.listid : [s.listid];
        for (let j = 0; j < toks.length; j++) {
          const tok = toks[j];
          if (typeof tok === 'number') {
            return err(p + '.listid[' + j + ']: folosește string „_1” nu număr');
          }
          if (typeof tok !== 'string') {
            return err(p + '.listid trebuie string|string[]');
          }
          const t = tok.trim();
          if (t.charAt(0) === '$' || t === 'form' || t.indexOf('form.') === 0) {
            continue;
          }
          if (UiListRef && typeof UiListRef.validateListIdToken === 'function') {
            const le = UiListRef.validateListIdToken(t);
            if (le) return err(p + '.listid: ' + le);
          }
        }
      }
      if (s.op === 'if') {
        if (Array.isArray(s.then)) {
          const e1 = validateAlgSteps(s.then, p + '.then');
          if (e1) return e1;
        }
        if (Array.isArray(s.else)) {
          const e2 = validateAlgSteps(s.else, p + '.else');
          if (e2) return e2;
        }
      }
      if (s.op === 'foreach' && Array.isArray(s.do)) {
        const e3 = validateAlgSteps(s.do, p + '.do');
        if (e3) return e3;
      }
    }
    return null;
  }

  function validateAlg(obj) {
    const e = checkV(obj);
    if (e) return e;
    if (!Array.isArray(obj.steps)) return err('alg.steps trebuie să fie array');
    const se = validateAlgSteps(obj.steps, 'steps');
    if (se) return se;
    return ok();
  }

  function validateBlock(b, path) {
    if (!b || typeof b !== 'object') return err(path + ' invalid');
    if (!b.id || typeof b.id !== 'string' || !String(b.id).trim()) {
      return err(path + '.id obligatoriu');
    }
    if (UiListRef && typeof UiListRef.validateBlockId === 'function') {
      const ide = UiListRef.validateBlockId(b.id);
      if (ide) return err(path + '.id: ' + ide);
    } else if (String(b.id).trim().charAt(0) === '_') {
      return err(path + '.id: nu poate începe cu _');
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
