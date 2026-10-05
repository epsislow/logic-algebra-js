/**
 * Panouri Edit / Live / Formular / Json pentru chei alg | form | ui | list (F2 + F4l).
 * Depinde de: SsideKeys, SsideMeta, JSONEditor (Formular), raw-json-editor în DOM.
 */
(function (root) {
  'use strict';

  const ALG_OPS = [
    'assign', 'cat', 'cast', 'fdate', 
    'if', 'foreach', 'end', 'comment',
    'kget', 'ksave', 'kdel', 'kadd', 'krm',
    'scheck', 'sgen', 'calc', 'str', 'array',
    'jset', 'jget', 'obj', 'id', 'lock',
    'search', 'notify',
    'ui',
    'tstart', 'tdo', 'tstop',
    'redis',
  ];

  let modProg = 'edit';
  let progKind = null; // alg | form | ui | list
  let progObj = null;
  let progFormularEditor = null;
  let dirtyHook = null;
  let deps = {
    listKeys: null, // (kind: 'schema'|'alg'|'form'|'ui'|'list') => string[]
    onOpenRelatedKey: null, // (redisKey) => void — ↗ din Edit ui/form
  };

  function setDeps(partial) {
    deps = Object.assign({}, deps, partial || {});
  }

  function $(id) {
    return document.getElementById(id);
  }

  const BTN_KINDS = [
    { value: '', label: '— default (albastru) —' },
    { value: 'blue', label: 'albastru' },
    { value: 'red', label: 'roșu' },
    { value: 'green', label: 'verde' },
    { value: 'yellow', label: 'galben' },
    { value: 'white', label: 'alb' },
    { value: 'gray', label: 'gri' },
    { value: 'black', label: 'negru' },
  ];

  /** Normalizează kind vechi (danger → red). */
  function normalizeBtnKind(kind) {
    const k = (kind || '').trim().toLowerCase();
    if (!k || k === 'default') return '';
    if (k === 'danger') return 'red';
    if (BTN_KINDS.some((x) => x.value === k)) return k;
    return '';
  }

  function fillBtnKindSelect(sel, current) {
    if (!sel) return;
    const cur = normalizeBtnKind(current);
    sel.innerHTML = '';
    BTN_KINDS.forEach((opt) => {
      const o = document.createElement('option');
      o.value = opt.value;
      o.textContent = opt.label;
      sel.appendChild(o);
    });
    sel.value = cur;
  }

  /** Select pentru chei schema/alg/form (F5b) — fără input text. */
  function fillKeySelect(sel, kind, current) {
    if (!sel) return;
    const keys = deps.listKeys ? deps.listKeys(kind) || [] : [];
    const cur = (current || '').trim();
    sel.innerHTML = '';
    const empty = document.createElement('option');
    empty.value = '';
    empty.textContent = keys.length ? '— alege ' + kind + ': —' : '— nicio cheie ' + kind + ' în cache —';
    sel.appendChild(empty);
    const seen = new Set();
    keys.forEach((k) => {
      seen.add(k);
      const o = document.createElement('option');
      o.value = k;
      o.textContent = k;
      sel.appendChild(o);
    });
    if (cur && !seen.has(cur)) {
      const o = document.createElement('option');
      o.value = cur;
      o.textContent = cur + ' (curent)';
      sel.appendChild(o);
    }
    sel.value = cur || '';
  }

  function esteProgTip(tip) {
    return tip === 'alg' || tip === 'form' || tip === 'ui' || tip === 'list';
  }

  function parseObjDinRaw() {
    const raw = ($('raw-json-editor') || {}).value || '';
    try {
      const o = JSON.parse(raw || '{}');
      if (o && typeof o === 'object' && !Array.isArray(o)) return o;
    } catch (e) { /* ignore */ }
    return null;
  }

  function scrieRaw(obj) {
    const ta = $('raw-json-editor');
    if (!ta) return;
    ta.value = JSON.stringify(obj, null, 2);
    if (typeof dirtyHook === 'function') dirtyHook();
  }

  function distrugeFormularEditor() {
    if (progFormularEditor) {
      try { progFormularEditor.destroy(); } catch (e) { /* ignore */ }
      progFormularEditor = null;
    }
    const holder = $('prog-formular-holder');
    if (holder) holder.innerHTML = '';
  }

  function seedImplicit(kind) {
    if (root.SsideMeta && root.SsideMeta.seedPentruRol) {
      return root.SsideMeta.seedPentruRol(kind, '');
    }
    return { v: 1 };
  }

  function asigurObj(kind) {
    if (!progObj || typeof progObj !== 'object') {
      progObj = seedImplicit(kind);
    }
    if (progObj.v == null) progObj.v = 1;
    return progObj;
  }

  /** Select + buton ↗ pe același rând (deschide cheia legată). */
  function mountSelectWithOpen(sel, opts) {
    opts = opts || {};
    const wrap = document.createElement('div');
    wrap.className = 'prog-select-with-open';
    const parent = sel.parentNode;
    if (parent) parent.insertBefore(wrap, sel);
    wrap.appendChild(sel);

    const openBtn = document.createElement('button');
    openBtn.type = 'button';
    openBtn.className = 'btn-gri btn-inline btn-open-related';
    openBtn.textContent = '↗';
    wrap.appendChild(openBtn);

    function currentKey() {
      if (typeof opts.getKey === 'function') return String(opts.getKey() || '').trim();
      return String(sel.value || '').trim();
    }
    function syncOpenBtn() {
      const k = currentKey();
      openBtn.disabled = !k;
      openBtn.title = k ? 'Deschide ' + k : 'Alege o cheie';
    }
    openBtn.onclick = () => {
      const k = currentKey();
      if (!k) return;
      if (typeof opts.beforeOpen === 'function') opts.beforeOpen();
      if (typeof deps.onOpenRelatedKey === 'function') deps.onOpenRelatedKey(k);
    };
    sel.addEventListener('change', syncOpenBtn);
    syncOpenBtn();
    return { openBtn, syncOpenBtn, wrap };
  }

  // ---------- Form edit ----------
  function randeazaEditForm(host, obj) {
    if (!Array.isArray(obj.btns)) obj.btns = [];
    host.innerHTML = '';

    const card = document.createElement('div');
    card.className = 'prog-edit-card';
    card.innerHTML = '<h4>Form</h4>';

    const row1 = document.createElement('div');
    row1.className = 'prog-row';
    row1.innerHTML =
      '<div class="prog-field"><label>title</label><input type="text" data-f="title"></div>' +
      '<div class="prog-field"><label>schema</label><select data-f="schema"></select></div>';
    card.appendChild(row1);
    row1.querySelector('[data-f="title"]').value = obj.title || '';
    const schemaSel = row1.querySelector('[data-f="schema"]');
    fillKeySelect(schemaSel, 'schema', obj.schema || '');

    const btnsHost = document.createElement('div');
    btnsHost.className = 'prog-steps';
    card.appendChild(btnsHost);

    function syncFromDom() {
      obj.title = row1.querySelector('[data-f="title"]').value;
      obj.schema = schemaSel.value;
      obj.btns = [];
      btnsHost.querySelectorAll('.prog-step').forEach((el) => {
        const kind = normalizeBtnKind(el.querySelector('[data-b="kind"]').value);
        const btn = {
          id: el.querySelector('[data-b="id"]').value.trim(),
          label: el.querySelector('[data-b="label"]').value.trim(),
          alg: el.querySelector('[data-b="alg"]').value.trim(),
        };
        if (kind) btn.kind = kind;
        obj.btns.push(btn);
      });
      scrieRaw(obj);
    }

    mountSelectWithOpen(schemaSel, { beforeOpen: syncFromDom });

    function addBtnRow(btn) {
      btn = btn || { id: '', label: '', alg: '', kind: '' };
      const el = document.createElement('div');
      el.className = 'prog-step';
      el.innerHTML =
        '<div class="prog-row">' +
        '<div class="prog-field"><label>id</label><input data-b="id"></div>' +
        '<div class="prog-field"><label>label</label><input data-b="label"></div>' +
        '<div class="prog-field"><label>alg</label><select data-b="alg"></select></div>' +
        '<div class="prog-field"><label>culoare</label><select data-b="kind"></select></div>' +
        '</div>';
      const rm = document.createElement('button');
      rm.type = 'button';
      rm.className = 'btn-gri btn-inline btn-inline-danger';
      rm.textContent = 'Șterge btn';
      rm.onclick = () => {
        el.remove();
        syncFromDom();
      };
      el.appendChild(rm);
      el.querySelector('[data-b="id"]').value = btn.id || '';
      el.querySelector('[data-b="label"]').value = btn.label || '';
      const algSel = el.querySelector('[data-b="alg"]');
      fillKeySelect(algSel, 'alg', btn.alg || '');
      fillBtnKindSelect(el.querySelector('[data-b="kind"]'), btn.kind || '');
      mountSelectWithOpen(algSel, { beforeOpen: syncFromDom });
      el.querySelectorAll('input,select').forEach((inp) => {
        inp.addEventListener('input', syncFromDom);
        inp.addEventListener('change', syncFromDom);
      });
      btnsHost.appendChild(el);
    }

    (obj.btns.length ? obj.btns : []).forEach(addBtnRow);

    const toolbar = document.createElement('div');
    toolbar.className = 'prog-toolbar';
    const add = document.createElement('button');
    add.type = 'button';
    add.className = 'btn-albastru btn-inline';
    add.textContent = '+ Buton';
    add.onclick = () => {
      addBtnRow({ id: 'btn' + (obj.btns.length + 1), label: 'Actiune', alg: 'alg:_' });
      syncFromDom();
    };
    toolbar.appendChild(add);
    card.appendChild(toolbar);

    row1.querySelectorAll('input,select').forEach((inp) => {
      inp.addEventListener('input', syncFromDom);
      inp.addEventListener('change', syncFromDom);
    });
    host.appendChild(card);
  }

  // ---------- UI edit (tabs → blocks form|list) ----------
  function normalizeUiTabBlocks(tab) {
    if (Array.isArray(tab && tab.blocks) && tab.blocks.length) {
      return tab.blocks.map((b, i) => {
        const type = b && b.type === 'list' ? 'list' : 'form';
        const id = (b && b.id) || type + (i + 1);
        if (type === 'list') {
          return { type: 'list', id: String(id), list: (b && b.list) || '' };
        }
        return { type: 'form', id: String(id), form: (b && b.form) || '' };
      });
    }
    if (Array.isArray(tab && tab.forms)) {
      return tab.forms.filter(Boolean).map((f, i) => ({
        type: 'form',
        id: 'form' + (i + 1),
        form: f,
      }));
    }
    return [];
  }

  function randeazaEditUi(host, obj) {
    if (!Array.isArray(obj.tabs)) obj.tabs = [];
    host.innerHTML = '';
    const card = document.createElement('div');
    card.className = 'prog-edit-card';
    card.innerHTML = '<h4>UI</h4>';

    const row1 = document.createElement('div');
    row1.className = 'prog-row';
    row1.innerHTML = '<div class="prog-field"><label>title</label><input type="text" data-f="title"></div>';
    row1.querySelector('[data-f="title"]').value = obj.title || '';
    card.appendChild(row1);

    const tabsHost = document.createElement('div');
    tabsHost.className = 'prog-steps';
    card.appendChild(tabsHost);

    function syncFromDom() {
      obj.title = row1.querySelector('[data-f="title"]').value;
      obj.tabs = [];
      tabsHost.querySelectorAll('.prog-step[data-tab]').forEach((el) => {
        const blocks = [];
        el.querySelectorAll('.prog-block-edit').forEach((bEl) => {
          const type = bEl.querySelector('[data-b="type"]').value === 'list' ? 'list' : 'form';
          const id = (bEl.querySelector('[data-b="id"]').value || '').trim();
          const key = (bEl.querySelector('[data-b="key"]').value || '').trim();
          if (type === 'list') {
            blocks.push({ type: 'list', id: id || 'list', list: key });
          } else {
            blocks.push({ type: 'form', id: id || 'form', form: key });
          }
        });
        const tab = {
          id: el.querySelector('[data-t="id"]').value.trim(),
          label: el.querySelector('[data-t="label"]').value.trim(),
          blocks,
        };
        // nu mai scriem forms[] — blocks e sursa de adevăr
        obj.tabs.push(tab);
      });
      scrieRaw(obj);
    }

    function mountBlocksEditor(tabEl, initialBlocks) {
      const wrap = document.createElement('div');
      wrap.className = 'prog-blocks-picks';
      const label = document.createElement('label');
      label.textContent = 'blocks';
      label.style.display = 'block';
      label.style.marginBottom = '4px';
      wrap.appendChild(label);
      const stack = document.createElement('div');
      stack.className = 'prog-blocks-stack-edit';
      wrap.appendChild(stack);
      tabEl.appendChild(wrap);

      function addBlockRow(block) {
        block = block || { type: 'form', id: '', form: '' };
        const type = block.type === 'list' ? 'list' : 'form';
        const row = document.createElement('div');
        row.className = 'prog-block-edit';
        row.innerHTML =
          '<div class="prog-row">' +
          '<div class="prog-field"><label>type</label><select data-b="type">' +
          '<option value="form">form</option><option value="list">list</option></select></div>' +
          '<div class="prog-field"><label>id</label><input data-b="id" placeholder="ex: stockMain (fără _ la început)"></div>' +
          '<div class="prog-field"><label data-b="keylab">form</label><select data-b="key"></select></div>' +
          '</div>';
        const typeSel = row.querySelector('[data-b="type"]');
        const idInp = row.querySelector('[data-b="id"]');
        const keySel = row.querySelector('[data-b="key"]');
        const keyLab = row.querySelector('[data-b="keylab"]');
        typeSel.value = type;
        idInp.value = block.id || '';

        function refillKey(prefer) {
          const t = typeSel.value === 'list' ? 'list' : 'form';
          keyLab.textContent = t;
          let cur = prefer != null ? prefer : '';
          if (prefer == null) {
            cur =
              t === 'list'
                ? (block && block.list) || ''
                : (block && block.form) || '';
          }
          fillKeySelect(keySel, t, cur);
        }
        refillKey(
          type === 'list' ? block.list || '' : block.form || ''
        );

        const openCtl = mountSelectWithOpen(keySel, { beforeOpen: syncFromDom });

        typeSel.onchange = () => {
          refillKey('');
          syncFromDom();
          openCtl.syncOpenBtn();
        };
        keySel.onchange = () => {
          syncFromDom();
          openCtl.syncOpenBtn();
        };
        idInp.addEventListener('input', syncFromDom);

        const rm = document.createElement('button');
        rm.type = 'button';
        rm.className = 'btn-gri btn-inline btn-inline-danger';
        rm.textContent = 'Șterge block';
        rm.onclick = () => {
          row.remove();
          syncFromDom();
        };
        row.appendChild(rm);
        stack.appendChild(row);
      }

      (initialBlocks || []).forEach(addBlockRow);

      const addBtn = document.createElement('button');
      addBtn.type = 'button';
      addBtn.className = 'btn-albastru btn-inline';
      addBtn.textContent = '+ Block';
      addBtn.onclick = () => {
        const n = stack.querySelectorAll('.prog-block-edit').length + 1;
        addBlockRow({ type: 'form', id: 'block' + n, form: '' });
        syncFromDom();
      };
      wrap.appendChild(addBtn);
    }

    function addTabRow(tab) {
      tab = tab || { id: '', label: '', blocks: [] };
      const el = document.createElement('div');
      el.className = 'prog-step';
      el.setAttribute('data-tab', '1');
      el.innerHTML =
        '<div class="prog-row">' +
        '<div class="prog-field"><label>id</label><input data-t="id"></div>' +
        '<div class="prog-field"><label>label</label><input data-t="label"></div>' +
        '</div>';
      const rm = document.createElement('button');
      rm.type = 'button';
      rm.className = 'btn-gri btn-inline btn-inline-danger';
      rm.textContent = 'Șterge tab';
      rm.onclick = () => {
        el.remove();
        syncFromDom();
      };
      el.appendChild(rm);
      el.querySelector('[data-t="id"]').value = tab.id || '';
      el.querySelector('[data-t="label"]').value = tab.label || '';
      mountBlocksEditor(el, normalizeUiTabBlocks(tab));
      el.querySelectorAll('input[data-t]').forEach((inp) =>
        inp.addEventListener('input', syncFromDom)
      );
      tabsHost.appendChild(el);
    }

    obj.tabs.forEach(addTabRow);

    const toolbar = document.createElement('div');
    toolbar.className = 'prog-toolbar';
    const add = document.createElement('button');
    add.type = 'button';
    add.className = 'btn-albastru btn-inline';
    add.textContent = '+ Tab';
    add.onclick = () => {
      const n = tabsHost.querySelectorAll('.prog-step[data-tab]').length + 1;
      addTabRow({ id: 't' + n, label: 'Tab', blocks: [] });
      syncFromDom();
    };
    toolbar.appendChild(add);
    card.appendChild(toolbar);

    row1.querySelectorAll('input').forEach((inp) => inp.addEventListener('input', syncFromDom));
    host.appendChild(card);
  }

  // ---------- Alg edit (F2-alg-A flat + F2-alg-B bloc/drill-in) ----------
  const ALG_BLOCK_OPS = new Set(['if', 'foreach']);
  const AS_OPTS = [
    { value: 'auto', label: 'auto' },
    { value: 'json', label: 'json' },
    { value: 'string', label: 'string' },
  ];
  const CAST_AS_OPTS = [
    { value: 'auto', label: 'auto' },
    { value: 'json', label: 'json' },
    { value: 'string', label: 'string' },
    { value: 'date', label: 'date' },
    { value: 'integer', label: 'integer' },
    { value: 'number', label: 'number' },
    { value: 'boolean', label: 'boolean' },
    { value: 'null', label: 'null' },
  ];
  const UI_DO_OPTS = [
    { value: 'refresh', label: 'refresh' },
    { value: 'clear', label: 'clear' },
  ];
  const REDIS_DO_OPTS = [
    'TYPE', 'EXISTS', 'GET', 'SET', 'DEL', 'TTL',
    'JSON.GET', 'JSON.SET', 'JSON.DEL',
    'SMEMBERS', 'SADD', 'SREM',
    'HGETALL', 'HGET', 'HSET',
    'LRANGE', 'ZRANGE', 'INCR',
  ];

  function defaultStep(op) {
    op = op || 'assign';
    if (op === 'assign') return { op: 'assign', to: '', from: '' };
    if (op === 'cat') return { op: 'cat', to: '', parts: [''] };
    if (op === 'cast') return { op: 'cast', as: 'json',to: '' , from: ''};
    if (op === 'fdate') return { op: 'fdate', format: 'YYYY-MM-DD', to: '', from: '' };
    if (op === 'calc') return { op: 'calc', expr: '', to: '', precision: null };
    if (op === 'str') return { op: 'str', fn: 'lower', value: '', to: '' };
    if (op === 'obj') return { op: 'obj', fn: 'get', from: '', path: '', to: '' };
    if (op === 'lock') return { op: 'lock', fn: 'acq', keys: '', ttl: 5000, to: '' };
    if (op === 'id') return { op: 'id', type: 'nanoid', to: '' };
    if (op === 'notify') return { op: 'notify', kind: 'warning', value: '' };
    if (op === 'array') return { op: 'array', fn: 'length', from: '', to: '' };
    if (op === 'if') return { op: 'if', when: ['eq', '', ''], then: [] };
    if (op === 'foreach') return { op: 'foreach', in: '', as: 'it', do: [] };
    if (op === 'end') return { op: 'end', type: 'msg', value: '' };
    if (op === 'comment') return { op: 'comment', note: '' };
    if (op === 'kget') return { op: 'kget', key: '', to: '', as: 'auto' };
    if (op === 'ksave') return { op: 'ksave', key: '', val: 'form', as: 'auto' };
    if (op === 'kdel') return { op: 'kdel', key: '' };
    if (op === 'kadd' || op === 'krm') return { op: op, key: '', val: '' };
    if (op === 'scheck') return { op: 'scheck', schema: '', val: 'form' };
    if (op === 'sgen') return { op: 'sgen', schema: '', to: 'draft' };
    if (op === 'jset') return { op: 'jset', to: 'payload', path: '', from: 'form.' };
    if (op === 'jget') return { op: 'jget', from: 'payload', path: '', to: '' };
    if (op === 'search') return { op: 'search', query: '', to: 'hits' };
    if (op === 'ui') return { op: 'ui', do: 'refresh', listid: '_self' };
    if (op === 'tstart' || op === 'tdo' || op === 'tstop') return { op: op };
    if (op === 'redis') return { op: 'redis', do: 'TYPE', args: [''], to: '' };
    return { op: op };
  }

  /** 'block' = if/foreach card; 'raw' = textarea; 'flat' = câmpuri (F2-alg-A). */
  function stepEditMode(step) {
    if (!step || typeof step !== 'object' || !step.op) return 'raw';
    if (ALG_BLOCK_OPS.has(step.op)) return 'block';
    if (step.op === 'search' && step.query != null && typeof step.query === 'object') {
      return 'raw';
    }
    if (step.op === 'ui' && Array.isArray(step.listid)) return 'raw';
    return 'flat';
  }

  function isBlockOp(op) {
    return ALG_BLOCK_OPS.has(op);
  }

  /** Pași nested în then/else/do (recursiv), fără pasul blocului însuși. */
  function countNestedOps(step) {
    if (!step || typeof step !== 'object') return 0;
    let n = 0;
    function walk(s) {
      if (!s || typeof s !== 'object') return;
      if (s.op === 'if') {
        (Array.isArray(s.then) ? s.then : []).forEach((x) => {
          n += 1;
          walk(x);
        });
        (Array.isArray(s.else) ? s.else : []).forEach((x) => {
          n += 1;
          walk(x);
        });
      } else if (s.op === 'foreach') {
        (Array.isArray(s.do) ? s.do : []).forEach((x) => {
          n += 1;
          walk(x);
        });
      }
    }
    walk(step);
    return n;
  }

  function getWhenApi() {
    if (root.SsideWhen) return root.SsideWhen;
    if (typeof require !== 'undefined') {
      try {
        return require('../../core/when.js');
      } catch (e) {
        return null;
      }
    }
    return null;
  }

  function previewWhen(when, maxLen) {
    maxLen = maxLen == null ? 72 : maxLen;
    let s;
    const When = getWhenApi();
    try {
      if (When && typeof When.printWhenExpr === 'function') {
        s = When.printWhenExpr(when);
      } else {
        s = JSON.stringify(when);
      }
    } catch (e) {
      try {
        s = JSON.stringify(when);
      } catch (e2) {
        s = String(when);
      }
    }
    if (!s) return '—';
    if (s.length <= maxLen) return s;
    return s.slice(0, maxLen - 1) + '…';
  }

  function previewBlock(step) {
    if (!step || typeof step !== 'object') return '';
    if (step.op === 'if') {
      const tn = Array.isArray(step.then) ? step.then.length : 0;
      const hasElse = Array.isArray(step.else);
      const en = hasElse ? step.else.length : 0;
      return (
        previewWhen(step.when) +
        ' · then(' +
        tn +
        ')' +
        (step.thenOff ? '[off]' : '') +
        (hasElse
          ? ' else(' + en + ')' + (step.elseOff ? '[off]' : '')
          : '')
      );
    }
    if (step.op === 'foreach') {
      const dn = Array.isArray(step.do) ? step.do.length : 0;
      return (
        'in: ' +
        (step.in != null ? String(step.in) : '') +
        ' · as: ' +
        (step.as != null ? String(step.as) : '') +
        ' · do(' +
        dn +
        ')'
      );
    }
    return '';
  }

  /** Valoare în preview view — fără {} [] , inutile unde e posibil (D53). */
  function previewVal(v) {
    if (v === null) return 'null';
    if (v === undefined) return '';
    if (typeof v === 'string') return v;
    if (typeof v === 'boolean' || typeof v === 'number') return String(v);
    if (Array.isArray(v)) {
      return v
        .map((x) => previewVal(x))
        .filter((s) => s !== '')
        .join(' ');
    }
    if (typeof v === 'object') {
      try {
        return JSON.stringify(v);
      } catch (e) {
        return String(v);
      }
    }
    return String(v);
  }

  /**
   * Text bogat pentru rând view (F2-alg-D / D53): conținutul op-ului, mai citibil decât JSON.
   */
  function previewStep(step) {
    if (!step || typeof step !== 'object') return '—';
    const op = step.op != null ? String(step.op) : '?';

    // comment: view focus pe // note (rând separat); linia op goală
    if (op === 'comment') return '';

    if (op === 'if' || op === 'foreach') {
      const pb = previewBlock(step);
      return pb ? op + '  ' + pb : op;
    }

    if (op === 'assign') {
      const to = step.to != null ? String(step.to) : '';
      if (Object.prototype.hasOwnProperty.call(step, 'val')) {
        return 'assign  ' + to + ' ← ' + previewVal(step.val) + '  val';
      }
      return 'assign  ' + to + ' ← ' + (step.from != null ? String(step.from) : '');
    }

    if (op === 'cat') {
      const to = step.to != null ? String(step.to) : '';
      const parts = Array.isArray(step.parts)
        ? step.parts.map((p) => previewVal(p)).join(' + ')
        : '';
      return 'cat  ' + to + ' ← ' + parts;
    }

    if (op === 'cast') {
      const to = step.to != null ? String(step.to) : '';

      if (Object.prototype.hasOwnProperty.call(step, 'val')) {
        return (
          'cast  ' + to + ' ← ' +
          previewVal(step.val) + ' val' +
          '  as ' +
          previewVal(step.as)
        );
      }
      const from = (step.from != null ? String(step.from) : '');
      return (
        'cast  ' + to + ' ← ' +
        from + ' from' +
        '  as ' +
        previewVal(step.as)
      );
    }

    if (op === 'fdate') {
      const to = step.to != null ? String(step.to) : '';
      const format = step.format != null ? String(step.format) : 'YYYY-MM-DD';

      if (Object.prototype.hasOwnProperty.call(step, 'val')) {
        return (
          'fdate ' + to + ' ← ' +
          previewVal(step.val) + ' val' +
          '  fmt ' +
          previewVal(format)
        );
      }
      const from = (step.from != null ? String(step.from) : '');
      return (
        'fdate ' + to + ' ← ' +
        from + ' from' +
        '  fmt ' +
        previewVal(format)
      );
    }

    if (op === 'calc') {
      const to = step.to != null ? String(step.to) : '';
      const prec = step.precision != null ? ' [p:' + step.precision + ']' : '';
      return 'calc  ' + to + ' ← ' + (step.expr || '') + prec;
    }

    if (op === 'str') {
      const to = step.to != null ? String(step.to) : '';
      const fn = step.fn != null ? String(step.fn) : '';
      if (fn === 'concat') {
        return 'str  ' + to + ' ← concat(' + (Array.isArray(step.args) ? step.args.join(', ') : '') + ')';
      }
      return 'str  ' + to + ' ← ' + fn + '(' + (step.value != null ? String(step.value) : '') + ')';
    }

    if (op === 'obj') {
      const to = step.to != null ? String(step.to) : '';
      const fn = step.fn != null ? String(step.fn) : '';
      const path = step.path != null ? ' [' + step.path + ']' : '';
      let from = '';
      if (typeof step.from === 'object' && step.from !== null) {
        const json = JSON.stringify(step.from);
        from = json.length > 25 ? json.substring(0, 25) + '...' : json;
      } else if (step.from != null) {
        from = String(step.from);
      }
      return 'obj   ' + to + ' ← ' + fn + '(' + from + ')' + path;
    }

    if (op === 'lock') {
      const to = step.to != null ? String(step.to) : '';
      const fn = step.fn != null ? String(step.fn) : 'acq';
      const keys = Array.isArray(step.keys) ? JSON.stringify(step.keys) : (step.keys != null ? String(step.keys) : '');
      const ttl = fn === 'acq' && step.ttl ? ' [ttl:' + step.ttl + 'ms]' : '';
      return 'lock  ' + (to ? to + ' ← ' : '') + fn + '(' + keys + ')' + ttl;
    }

    if (op === 'id') {
      const to = step.to != null ? String(step.to) : '';
      const type = step.type != null ? String(step.type) : 'nanoid';
      const detail = type === 'autoinc' || type === 'dateinc' ? ' [key:' + (step.key || '') + ']' : (type === 'nanoid' && step.size ? ' [sz:' + step.size + ']' : '');
      return 'id    ' + to + ' ← ' + type + detail;
    }

    if (op === 'notify') {
      const kind = step.kind != null ? String(step.kind) : 'info';
      const srcMode = Object.prototype.hasOwnProperty.call(step, 'with') ? 'with' : 'value';
      const text = srcMode === 'with' ? step.with : (step.value || '');
      return 'notify ' + kind + ' ← ' + (srcMode === 'with' ? 'ref:' : 'val:') + previewVal(text);
    }

    if (op === 'array') {
      const to = step.to != null ? String(step.to) : '';
      const fn = step.fn != null ? String(step.fn) : '';
      let from = '';
      if (Array.isArray(step.from)) {
        const json = JSON.stringify(step.from);
        from = json.length > 25 ? json.substring(0, 25) + '...' : json;
      } else if (step.from != null) {
        from = String(step.from);
      }
      return 'array ' + to + ' ← ' + fn + '(' + from + ')';
    }



    if (op === 'end') {
      const type = step.type || (step.err != null ? 'err' : 'msg');
      const srcMode = Object.prototype.hasOwnProperty.call(step, 'with') ? 'with' : 'value';
      const text = srcMode === 'with' ? step.with : (step.value || step.msg || step.err || '');
      return 'end   ' + type + ' ← ' + (srcMode === 'with' ? 'ref:' : 'val:') + previewVal(text);
    }


    if (op === 'kget') {
      return (
        'kget  ' +
        previewVal(step.key) +
        ' → ' +
        previewVal(step.to) +
        (step.as ? '  as ' + previewVal(step.as) : '')
      );
    }

    if (op === 'ksave') {
      return (
        'ksave  ' +
        previewVal(step.key) +
        ' ← ' +
        previewVal(step.val) +
        (step.as ? '  as ' + previewVal(step.as) : '')
      );
    }

    if (op === 'kdel') {
      return 'kdel  ' + previewVal(step.key);
    }

    if (op === 'kadd' || op === 'krm') {
      return op + '  ' + previewVal(step.key) + '  ' + previewVal(step.val);
    }

    if (op === 'scheck') {
      return (
        'scheck  ' +
        previewVal(step.schema) +
        '  val ' +
        previewVal(step.val != null ? step.val : 'form')
      );
    }

    if (op === 'sgen') {
      return (
        'sgen  ' +
        previewVal(step.schema) +
        ' → ' +
        previewVal(step.to != null ? step.to : 'draft')
      );
    }

    if (op === 'jset') {
      const bits = ['jset', previewVal(step.to)];
      if (step.path != null && step.path !== '') bits.push('path ' + previewVal(step.path));
      if (Object.prototype.hasOwnProperty.call(step, 'val')) {
        bits.push('← ' + previewVal(step.val) + ' val');
      } else if (step.from != null) {
        bits.push('← ' + previewVal(step.from));
      }
      return bits.join('  ');
    }

    if (op === 'jget') {
      return (
        'jget  ' +
        previewVal(step.from) +
        (step.path != null && step.path !== '' ? '  path ' + previewVal(step.path) : '') +
        ' → ' +
        previewVal(step.to)
      );
    }

    if (op === 'search') {
      const q =
        step.query != null && typeof step.query === 'object'
          ? previewVal(step.query)
          : previewVal(step.query);
      return (
        'search  ' +
        q +
        (step.to != null ? ' → ' + previewVal(step.to) : '') +
        (step.index ? '  index ' + previewVal(step.index) : '')
      );
    }

    if (op === 'ui') {
      return (
        'ui  ' +
        previewVal(step.do) +
        (step.listid != null && step.listid !== ''
          ? '  listid ' + previewVal(step.listid)
          : '')
      );
    }

    if (op === 'tstart' || op === 'tdo' || op === 'tstop') {
      return op;
    }

    if (op === 'redis') {
      const args = Array.isArray(step.args)
        ? step.args.map((a) => previewVal(a)).join(' ')
        : previewVal(step.key);
      return (
        'redis  ' +
        previewVal(step.do) +
        (args ? '  ' + args : '') +
        (step.to != null && step.to !== '' ? ' → ' + previewVal(step.to) : '')
      );
    }

    // fallback: toate cheile utile, spațiate (nu JSON cu {} ,)
    const bits = [op];
    Object.keys(step).forEach((k) => {
      if (k === 'op') return;
      if (k === 'then' || k === 'else' || k === 'do') return;
      const v = step[k];
      if (v == null || v === '') return;
      bits.push(k + ' ' + previewVal(v));
    });
    return bits.join('  ');
  }

  /** Inserează înainte de index (D34). Returnează noul step. */
  function insertStepAt(steps, index, op) {
    if (!Array.isArray(steps)) throw new Error('insertStepAt: steps trebuie array');
    const step = defaultStep(op);
    const i = Math.max(0, Math.min(index, steps.length));
    steps.splice(i, 0, step);
    return step;
  }

  /** Append la final (toolbar + Step). Returnează noul step. */
  function appendStep(steps, op) {
    if (!Array.isArray(steps)) throw new Error('appendStep: steps trebuie array');
    const step = defaultStep(op);
    steps.push(step);
    return step;
  }

  /**
   * Mută pasul la index cu delta (-1 = ↑, +1 = ↓). Fără wrap.
   * @returns {boolean} true dacă s-a mutat
   */
  function moveStep(steps, index, delta) {
    if (!Array.isArray(steps)) throw new Error('moveStep: steps trebuie array');
    const d = delta === -1 || delta === 1 ? delta : 0;
    if (!d) return false;
    const i = index | 0;
    const j = i + d;
    if (i < 0 || i >= steps.length || j < 0 || j >= steps.length) return false;
    const tmp = steps[i];
    steps[i] = steps[j];
    steps[j] = tmp;
    return true;
  }

  /**
   * Înlocuiește conținutul array-ului (ca readStepsInto după flush).
   * După append/insert/move NU apela cu snapshot din DOM vechi — pierde mutația.
   */
  function replaceStepsContents(targetArr, nextList) {
    if (!Array.isArray(targetArr)) throw new Error('replaceStepsContents: target trebuie array');
    targetArr.length = 0;
    (Array.isArray(nextList) ? nextList : []).forEach((s) => targetArr.push(s));
  }

  function parseMaybeLiteral(s) {
    if (s == null) return '';
    const t = String(s).trim();
    if (t === '') return '';
    if (t === 'true') return true;
    if (t === 'false') return false;
    if (t === 'null') return null;
    if (/^-?\d+(\.\d+)?$/.test(t)) return Number(t);
    return String(s);
  }

  function literalToInput(v) {
    if (v == null) return '';
    if (typeof v === 'string') return v;
    if (typeof v === 'boolean' || typeof v === 'number') return String(v);
    try {
      return JSON.stringify(v);
    } catch (e) {
      return String(v);
    }
  }

  function mkField(label, ctrl) {
    const wrap = document.createElement('div');
    wrap.className = 'prog-field';
    const lab = document.createElement('label');
    lab.textContent = label;
    wrap.appendChild(lab);
    wrap.appendChild(ctrl);
    return wrap;
  }

  function mkInput(attr, value) {
    const inp = document.createElement('input');
    inp.type = 'text';
    inp.setAttribute('data-sf', attr);
    inp.value = value == null ? '' : String(value);
    return inp;
  }

  function mkSelect(attr, value, options) {
    const sel = document.createElement('select');
    sel.setAttribute('data-sf', attr);
    (options || []).forEach((opt) => {
      const o = document.createElement('option');
      o.value = typeof opt === 'string' ? opt : opt.value;
      o.textContent = typeof opt === 'string' ? opt : opt.label;
      sel.appendChild(o);
    });
    const cur = value == null ? '' : String(value);
    if (cur && !Array.from(sel.options).some((o) => o.value === cur)) {
      const o = document.createElement('option');
      o.value = cur;
      o.textContent = cur;
      sel.appendChild(o);
    }
    sel.value = cur;
    return sel;
  }

  function fillOpSelect(sel, current, opts) {
    opts = opts || {};
    sel.innerHTML = '';
    ALG_OPS.forEach((op) => {
      const o = document.createElement('option');
      o.value = op;
      o.textContent = isBlockOp(op) ? op + ' (bloc)' : op;
      sel.appendChild(o);
    });
    const cur = current && ALG_OPS.indexOf(current) !== -1 ? current : 'assign';
    sel.value = cur;
    if (opts.locked) {
      sel.disabled = true;
      sel.title = 'op bloc — nu se schimbă (F2-alg-B)';
    }
  }

  function mountPartsList(row, parts, onChange, label, dataSf) {
    const host = document.createElement('div');
    host.className = 'prog-parts';
    host.setAttribute('data-sf', dataSf || 'parts');

    function redraw(list) {
      host.innerHTML = '';
      list.forEach((p, i) => {
        const line = document.createElement('div');
        line.className = 'prog-parts-row';
        const inp = document.createElement('input');
        inp.type = 'text';
        inp.value = p == null ? '' : String(p);
        inp.setAttribute('data-part', String(i));
        inp.addEventListener('input', onChange);
        const rm = document.createElement('button');
        rm.type = 'button';
        rm.className = 'btn-gri btn-inline btn-inline-danger';
        rm.textContent = '×';
        rm.onclick = () => {
          const next = readParts();
          next.splice(i, 1);
          if (!next.length) next.push('');
          redraw(next);
          onChange();
        };
        line.appendChild(inp);
        line.appendChild(rm);
        host.appendChild(line);
      });
      const add = document.createElement('button');
      add.type = 'button';
      add.className = 'btn-gri btn-inline';
      add.textContent = '+ ' + (dataSf === 'args' ? 'arg' : 'part');
      add.onclick = () => {
        const next = readParts();
        next.push('');
        redraw(next);
        onChange();
      };
      host.appendChild(add);
    }

    function readParts() {
      return Array.from(host.querySelectorAll('input[data-part]')).map((inp) => inp.value);
    }

    host._readParts = readParts;
    redraw(Array.isArray(parts) && parts.length ? parts.slice() : ['']);
    row.appendChild(mkField(label || 'parts', host));
    return host;
  }

  function renderFlatFields(body, step, onChange) {
    body.innerHTML = '';
    const row = document.createElement('div');
    row.className = 'prog-row prog-step-fields';
    body.appendChild(row);
    const op = step.op;

    function wire(el) {
      el.addEventListener('input', onChange);
      el.addEventListener('change', onChange);
      return el;
    }

    if (op === 'comment') {
      // doar note (adăugat și de appendNoteField pe toate ops)
      return;
    }

    if (op === 'assign') {
      row.appendChild(mkField('to', wire(mkInput('to', step.to))));
      const srcMode = Object.prototype.hasOwnProperty.call(step, 'val') ? 'val' : 'from';
      const srcSel = wire(
        mkSelect('_src', srcMode, [
          { value: 'from', label: 'from (ref)' },
          { value: 'val', label: 'val (literal)' },
        ])
      );
      row.appendChild(mkField('sursă', srcSel));
      const fromInp = wire(mkInput('from', step.from != null ? step.from : ''));
      const valInp = wire(mkInput('val', literalToInput(step.val)));
      const fromF = mkField('from', fromInp);
      const valF = mkField('val', valInp);
      row.appendChild(fromF);
      row.appendChild(valF);
      function toggleSrc() {
        const m = srcSel.value;
        fromF.style.display = m === 'from' ? '' : 'none';
        valF.style.display = m === 'val' ? '' : 'none';
      }
      srcSel.addEventListener('change', toggleSrc);
      toggleSrc();
      return;
    }

    if (op === 'cat') {
      row.appendChild(mkField('to', wire(mkInput('to', step.to))));
      mountPartsList(row, step.parts, onChange, 'parts', 'parts');
      return;
    }

    if (op === 'cast') {
      row.appendChild(mkField('to', wire(mkInput('to', step.to))));
      row.appendChild(mkField('as', wire(mkSelect('as', step.as || 'json', CAST_AS_OPTS))));
      const srcMode = Object.prototype.hasOwnProperty.call(step, 'val') ? 'val' : 'from';
      const srcSel = wire(
        mkSelect('_src', srcMode, [
          { value: 'from', label: 'from (ref)' },
          { value: 'val', label: 'val (literal)' },
        ])
      );
      row.appendChild(mkField('sursă', srcSel));
      const fromInp = wire(mkInput('from', step.from != null ? step.from : ''));
      const valInp = wire(mkInput('val', literalToInput(step.val)));
      const fromF = mkField('from', fromInp);
      const valF = mkField('val', valInp);
      row.appendChild(fromF);
      row.appendChild(valF);
      function toggleSrc() {
        const m = srcSel.value;
        fromF.style.display = m === 'from' ? '' : 'none';
        valF.style.display = m === 'val' ? '' : 'none';
      }
      srcSel.addEventListener('change', toggleSrc);
      toggleSrc();
      return;
    }

    if (op === 'fdate') {
      row.appendChild(mkField('to', wire(mkInput('to', step.to))));
      row.appendChild(mkField('format', wire(mkInput('format', step.format != null ? step.format : 'YYYY-MM-DD'))));
      const srcMode = Object.prototype.hasOwnProperty.call(step, 'val') ? 'val' : 'from';
      const srcSel = wire(
        mkSelect('_src', srcMode, [
          { value: 'from', label: 'from (ref)' },
          { value: 'val', label: 'val (literal)' },
        ])
      );
      row.appendChild(mkField('sursă', srcSel));
      const fromInp = wire(mkInput('from', step.from != null ? step.from : ''));
      const valInp = wire(mkInput('val', literalToInput(step.val)));
      const fromF = mkField('from', fromInp);
      const valF = mkField('val', valInp);
      row.appendChild(fromF);
      row.appendChild(valF);
      function toggleSrc() {
        const m = srcSel.value;
        fromF.style.display = m === 'from' ? '' : 'none';
        valF.style.display = m === 'val' ? '' : 'none';
      }
      srcSel.addEventListener('change', toggleSrc);
      toggleSrc();
      return;
    }

    if (op === 'calc') {
      row.appendChild(mkField('to', wire(mkInput('to', step.to))));
      row.appendChild(mkField('expresie', wire(mkInput('expr', step.expr != null ? step.expr : ''))));
      row.appendChild(mkField('precizie', wire(mkInput('precision', step.precision != null ? step.precision : '', { type: 'number', placeholder: 'max' }))));
      return;
    }

    if (op === 'str') {
      row.appendChild(mkField('to', wire(mkInput('to', step.to))));
      const fnOpts = [
        { value: 'length', label: 'length' }, { value: 'lower', label: 'lower' }, { value: 'upper', label: 'upper' },
        { value: 'trim', label: 'trim' }, { value: 'ltrim', label: 'ltrim' }, { value: 'rtrim', label: 'rtrim' },
        { value: 'contains', label: 'contains' }, { value: 'startsWith', label: 'startsWith' }, { value: 'endsWith', label: 'endsWith' },
        { value: 'indexOf', label: 'indexOf' }, { value: 'lastIndexOf', label: 'lastIndexOf' }, { value: 'substr', label: 'substr' },
        { value: 'replace', label: 'replace' }, { value: 'replaceAll', label: 'replaceAll' }, { value: 'split', label: 'split' },
        { value: 'concat', label: 'concat' }, { value: 'padStart', label: 'padStart' }, { value: 'padEnd', label: 'padEnd' },
        { value: 'repeat', label: 'repeat' }, { value: 'matches', label: 'matches' }
      ];
      const fnSel = wire(mkSelect('fn', step.fn || 'lower', fnOpts));
      row.appendChild(mkField('funcție', fnSel));
      const valInp = wire(mkInput('value', step.value != null ? step.value : ''));
      const valF = mkField('valoare', valInp);
      row.appendChild(valF);
      const extraContainer = document.createElement('span');
      row.appendChild(extraContainer);
      function renderExtraFields() {
        extraContainer.innerHTML = '';
        const f = fnSel.value;
        if (f === 'concat') {
          valF.style.display = 'none';
          const argsInp = wire(mkInput('args', Array.isArray(step.args) ? step.args.join(', ') : ''));
          extraContainer.appendChild(mkField('argumente (ref, separate prin virgulă)', argsInp));
          return;
        }
        valF.style.display = '';
        if (f === 'contains' || f === 'startsWith' || f === 'endsWith' || f === 'indexOf' || f === 'lastIndexOf') {
          extraContainer.appendChild(mkField('search', wire(mkInput('search', step.search != null ? step.search : ''))));
        } else if (f === 'substr') {
          extraContainer.appendChild(mkField('start', wire(mkInput('start', step.start != null ? step.start : '0', { type: 'number' }))));
          extraContainer.appendChild(mkField('length', wire(mkInput('length', step.length != null ? step.length : '', { type: 'number', placeholder: 'tot' }))));
        } else if (f === 'replace' || f === 'replaceAll') {
          extraContainer.appendChild(mkField('search', wire(mkInput('search', step.search != null ? step.search : ''))));
          extraContainer.appendChild(mkField('replace', wire(mkInput('replace', step.replace != null ? step.replace : ''))));
        } else if (f === 'split') {
          extraContainer.appendChild(mkField('separator', wire(mkInput('separator', step.separator != null ? step.separator : ''))));
        } else if (f === 'padStart' || f === 'padEnd') {
          extraContainer.appendChild(mkField('length', wire(mkInput('length', step.length != null ? step.length : '0', { type: 'number' }))));
          extraContainer.appendChild(mkField('char', wire(mkInput('char', step.char != null ? step.char : ' '))));
        } else if (f === 'repeat') {
          extraContainer.appendChild(mkField('count', wire(mkInput('count', step.count != null ? step.count : '1', { type: 'number' }))));
        } else if (f === 'matches') {
          extraContainer.appendChild(mkField('pattern', wire(mkInput('pattern', step.pattern != null ? step.pattern : ''))));
        }
      }
      fnSel.addEventListener('change', renderExtraFields);
      renderExtraFields();
      return;
    }

    if (op === 'obj') {
      row.appendChild(mkField('to', wire(mkInput('to', step.to))));
      const fnOpts = [
        { value: 'get', label: 'get' }, { value: 'set', label: 'set' }, { value: 'delete', label: 'delete' },
        { value: 'has', label: 'has' }, { value: 'keys', label: 'keys' }, { value: 'values', label: 'values' },
        { value: 'entries', label: 'entries' }, { value: 'merge', label: 'merge' }, { value: 'pick', label: 'pick' },
        { value: 'omit', label: 'omit' }
      ];
      const fnSel = wire(mkSelect('fn', step.fn || 'get', fnOpts));
      row.appendChild(mkField('funcție', fnSel));
      const srcMode = (typeof step.from === 'object' && step.from !== null) ? 'val' : 'from';
      const srcSel = wire(mkSelect('_src', srcMode, [{ value: 'from', label: 'from (ref)' }, { value: 'val', label: 'from (literal)' }]));
      row.appendChild(mkField('sursă', srcSel));
      const fromInp = wire(mkInput('from', typeof step.from === 'string' ? step.from : ''));
      const valInp = wire(mkInput('val', typeof step.from === 'object' && step.from !== null ? JSON.stringify(step.from) : ''));
      const fromF = mkField('from', fromInp);
      const valF = mkField('val', valInp);
      row.appendChild(fromF);
      row.appendChild(valF);
      const extraContainer = document.createElement('span');
      row.appendChild(extraContainer);
      function toggleSrc() {
        const m = srcSel.value;
        fromF.style.display = m === 'from' ? '' : 'none';
        valF.style.display = m === 'val' ? '' : 'none';
      }
      function renderExtraFields() {
        extraContainer.innerHTML = '';
        const f = fnSel.value;
        if (f === 'get' || f === 'set' || f === 'delete' || f === 'has') {
          extraContainer.appendChild(mkField('path', wire(mkInput('path', step.path != null ? step.path : ''))));
        }
        if (f === 'set' || f === 'merge' || f === 'pick' || f === 'omit') {
          const valMode = Object.prototype.hasOwnProperty.call(step, 'with') ? 'with' : 'value';
          const valSel = wire(mkSelect('_vsrc', valMode, [{ value: 'value', label: 'value (literal)' }, { value: 'with', label: 'with (ref)' }]));
          extraContainer.appendChild(mkField('intrare', valSel));
          const vInp = wire(mkInput('value', !Object.prototype.hasOwnProperty.call(step, 'with') && step.value !== undefined ? (typeof step.value === 'object' ? JSON.stringify(step.value) : String(step.value)) : ''));
          const wInp = wire(mkInput('with', step.with != null ? step.with : ''));
          const vF = mkField('value', vInp);
          const wF = mkField('with', wInp);
          extraContainer.appendChild(vF);
          extraContainer.appendChild(wF);
          function toggleValSrc() {
            vF.style.display = valSel.value === 'value' ? '' : 'none';
            wF.style.display = valSel.value === 'with' ? '' : 'none';
          }
          valSel.addEventListener('change', toggleValSrc);
          toggleValSrc();
        }
      }
      srcSel.addEventListener('change', toggleSrc);
      fnSel.addEventListener('change', renderExtraFields);
      toggleSrc();
      renderExtraFields();
      return;
    }

    if (op === 'lock') {
      const toInp = wire(mkInput('to', step.to != null ? step.to : ''));
      const toF = mkField('to', toInp);
      row.appendChild(toF);
      const fnOpts = [{ value: 'acq', label: 'acq (acquire)' }, { value: 'rel', label: 'rel (release)' }];
      const fnSel = wire(mkSelect('fn', step.fn || 'acq', fnOpts));
      row.appendChild(mkField('funcție', fnSel));
      const srcMode = Array.isArray(step.keys) ? 'val' : 'from';
      const srcSel = wire(mkSelect('_src', srcMode, [{ value: 'from', label: 'keys (ref)' }, { value: 'val', label: 'keys (literal array)' }]));
      row.appendChild(mkField('sursă', srcSel));
      const fromInp = wire(mkInput('from', !Array.isArray(step.keys) && step.keys != null ? step.keys : ''));
      const valInp = wire(mkInput('val', Array.isArray(step.keys) ? JSON.stringify(step.keys) : ''));
      const fromF = mkField('from', fromInp);
      const valF = mkField('val', valInp);
      row.appendChild(fromF);
      row.appendChild(valF);
      const ttlInp = wire(mkInput('ttl', step.ttl != null ? step.ttl : '5000', { type: 'number', placeholder: '5000' }));
      const ttlF = mkField('ttl (ms)', ttlInp);
      row.appendChild(ttlF);
      function toggleFields() {
        const f = fnSel.value;
        const m = srcSel.value;
        toF.style.display = f === 'acq' ? '' : 'none';
        ttlF.style.display = f === 'acq' ? '' : 'none';
        fromF.style.display = m === 'from' ? '' : 'none';
        valF.style.display = m === 'val' ? '' : 'none';
      }
      srcSel.addEventListener('change', toggleFields);
      fnSel.addEventListener('change', toggleFields);
      toggleFields();
      return;
    }

    if (op === 'id') {
      row.appendChild(mkField('to', wire(mkInput('to', step.to))));
      const typeOpts = [
        { value: 'nanoid', label: 'nanoid (compact)' },
        { value: 'uuid', label: 'uuid (global v4)' },
        { value: 'autoinc', label: 'autoinc (secvențial)' },
        { value: 'dateinc', label: 'dateinc (facturi/zilnic)' },
        { value: 'ulid', label: 'ulid (sortabil cronologic)' }
      ];
      const typeSel = wire(mkSelect('type', step.type || 'nanoid', typeOpts));
      row.appendChild(mkField('tip id', typeSel));
      const keyInp = wire(mkInput('key', step.key != null ? step.key : ''));
      const keyF = mkField('cheie contor Redis', keyInp);
      row.appendChild(keyF);
      const sizeInp = wire(mkInput('size', step.size != null ? step.size : '21', { type: 'number', placeholder: '21' }));
      const sizeF = mkField('lungime', sizeInp);
      row.appendChild(sizeF);
      function renderFields() {
        const t = typeSel.value;
        keyF.style.display = (t === 'autoinc' || t === 'dateinc') ? '' : 'none';
        sizeF.style.display = t === 'nanoid' ? '' : 'none';
      }
      typeSel.addEventListener('change', renderFields);
      renderFields();
      return;
    }

    if (op === 'notify') {
      const kindOpts = [
        { value: 'info', label: 'info (albastru)' },
        { value: 'success', label: 'success (verde)' },
        { value: 'warning', label: 'warning (galben)' },
        { value: 'error', label: 'error (roșu)' }
      ];
      const kindSel = wire(mkSelect('kind', step.kind || 'info', kindOpts));
      row.appendChild(mkField('tip', kindSel));
      const srcMode = Object.prototype.hasOwnProperty.call(step, 'with') ? 'with' : 'value';
      const srcSel = wire(mkSelect('_src', srcMode, [{ value: 'value', label: 'value (literal)' }, { value: 'with', label: 'with (ref)' }]));
      row.appendChild(mkField('sursă', srcSel));
      const rawText = srcMode === 'with' ? step.with : (step.value || '');
      const textInp = wire(mkInput('text', rawText != null ? rawText : ''));
      row.appendChild(mkField('text/ref', textInp));
      return;
    }


    if (op === 'array') {
      row.appendChild(mkField('to', wire(mkInput('to', step.to))));
      const fnOpts = [
        { value: 'length', label: 'length' }, { value: 'isEmpty', label: 'isEmpty' }, { value: 'contains', label: 'contains' },
        { value: 'indexOf', label: 'indexOf' }, { value: 'lastIndexOf', label: 'lastIndexOf' }, { value: 'get', label: 'get' },
        { value: 'first', label: 'first' }, { value: 'last', label: 'last' }, { value: 'slice', label: 'slice' },
        { value: 'push', label: 'push' }, { value: 'unshift', label: 'unshift' }, { value: 'removeFirst', label: 'removeFirst' },
        { value: 'removeLast', label: 'removeLast' }, { value: 'reverse', label: 'reverse' }, { value: 'unique', label: 'unique' },
        { value: 'join', label: 'join' }, { value: 'sort', label: 'sort' }, { value: 'sum', label: 'sum' },
        { value: 'min', label: 'min' }, { value: 'max', label: 'max' }, { value: 'avg', label: 'avg' }
      ];
      const fnSel = wire(mkSelect('fn', step.fn || 'length', fnOpts));
      row.appendChild(mkField('funcție', fnSel));
      const srcMode = Array.isArray(step.from) ? 'val' : 'from';
      const srcSel = wire(mkSelect('_src', srcMode, [{ value: 'from', label: 'from (ref)' }, { value: 'val', label: 'from (literal)' }]));
      row.appendChild(mkField('sursă', srcSel));
      const fromInp = wire(mkInput('from', !Array.isArray(step.from) && step.from != null ? step.from : ''));
      const valInp = wire(mkInput('val', Array.isArray(step.from) ? JSON.stringify(step.from) : ''));
      const fromF = mkField('from', fromInp);
      const valF = mkField('val', valInp);
      row.appendChild(fromF);
      row.appendChild(valF);
      const extraContainer = document.createElement('span');
      row.appendChild(extraContainer);
      function toggleSrc() {
        const m = srcSel.value;
        fromF.style.display = m === 'from' ? '' : 'none';
        valF.style.display = m === 'val' ? '' : 'none';
      }
      function renderExtraFields() {
        extraContainer.innerHTML = '';
        const f = fnSel.value;
        if (f === 'contains' || f === 'indexOf' || f === 'lastIndexOf' || f === 'push' || f === 'unshift') {
          extraContainer.appendChild(mkField('values (ref sau JSON literal)', wire(mkInput('values', typeof step.values === 'string' ? step.values : (step.values != null ? JSON.stringify(step.values) : '')))));
        } else if (f === 'get') {
          extraContainer.appendChild(mkField('index', wire(mkInput('index', step.index != null ? step.index : '0', { type: 'number' }))));
        } else if (f === 'slice') {
          extraContainer.appendChild(mkField('start', wire(mkInput('start', step.start != null ? step.start : '0', { type: 'number' }))));
          extraContainer.appendChild(mkField('length', wire(mkInput('length', step.length != null ? step.length : '', { type: 'number', placeholder: 'tot' }))));
        } else if (f === 'sort') {
          extraContainer.appendChild(mkField('direction', wire(mkSelect('direction', step.direction || 'asc', [{ value: 'asc', label: 'asc' }, { value: 'desc', label: 'desc' }]))));
        } else if (f === 'join') {
          extraContainer.appendChild(mkField('separator', wire(mkInput('separator', step.separator != null ? step.separator : ','))));
        }
      }
      srcSel.addEventListener('change', toggleSrc);
      fnSel.addEventListener('change', renderExtraFields);
      toggleSrc();
      renderExtraFields();
      return;
    }


    if (op === 'end') {
      const currentType = step.type || (step.err != null ? 'err' : 'msg');
      const typeSel = wire(mkSelect('_type', currentType, [{ value: 'msg', label: 'msg (ok)' }, { value: 'err', label: 'err (fail)' }]));
      row.appendChild(mkField('tip', typeSel));
      const srcMode = Object.prototype.hasOwnProperty.call(step, 'with') ? 'with' : 'value';
      const srcSel = wire(mkSelect('_src', srcMode, [{ value: 'value', label: 'value (literal)' }, { value: 'with', label: 'with (ref)' }]));
      row.appendChild(mkField('sursă', srcSel));
      const rawText = srcMode === 'with' ? step.with : (step.value || step.msg || step.err || '');
      const textInp = wire(mkInput('text', rawText != null ? rawText : ''));
      row.appendChild(mkField('text/ref', textInp));
      return;
    }


    if (op === 'kget') {
      row.appendChild(mkField('key', wire(mkInput('key', step.key))));
      row.appendChild(mkField('to', wire(mkInput('to', step.to))));
      row.appendChild(mkField('as', wire(mkSelect('as', step.as || 'auto', AS_OPTS))));
      return;
    }

    if (op === 'ksave') {
      row.appendChild(mkField('key', wire(mkInput('key', step.key))));
      row.appendChild(
        mkField('val', wire(mkInput('val', step.val != null ? step.val : 'form')))
      );
      row.appendChild(mkField('as', wire(mkSelect('as', step.as || 'auto', AS_OPTS))));
      return;
    }

    if (op === 'kdel') {
      row.appendChild(mkField('key', wire(mkInput('key', step.key))));
      return;
    }

    if (op === 'kadd' || op === 'krm') {
      row.appendChild(mkField('key', wire(mkInput('key', step.key))));
      row.appendChild(mkField('val', wire(mkInput('val', step.val))));
      return;
    }

    if (op === 'scheck') {
      const sel = document.createElement('select');
      sel.setAttribute('data-sf', 'schema');
      fillKeySelect(sel, 'schema', step.schema || '');
      wire(sel);
      row.appendChild(mkField('schema', sel));
      mountSelectWithOpen(sel, {
        getKey: () => sel.value,
        title: 'Deschide schema',
      });
      row.appendChild(
        mkField('val', wire(mkInput('val', step.val != null ? step.val : 'form')))
      );
      return;
    }

    if (op === 'sgen') {
      const sel = document.createElement('select');
      sel.setAttribute('data-sf', 'schema');
      fillKeySelect(sel, 'schema', step.schema || '');
      wire(sel);
      row.appendChild(mkField('schema', sel));
      mountSelectWithOpen(sel, {
        getKey: () => sel.value,
        title: 'Deschide schema',
      });
      row.appendChild(
        mkField('to', wire(mkInput('to', step.to != null ? step.to : 'draft')))
      );
      return;
    }

    if (op === 'jset') {
      row.appendChild(
        mkField('to', wire(mkInput('to', step.to != null ? step.to : 'payload')))
      );
      row.appendChild(
        mkField('path', wire(mkInput('path', step.path != null ? step.path : '')))
      );
      const srcMode = Object.prototype.hasOwnProperty.call(step, 'val') ? 'val' : 'from';
      const srcSel = wire(
        mkSelect('_src', srcMode, [
          { value: 'from', label: 'from (ref)' },
          { value: 'val', label: 'val (literal)' },
        ])
      );
      row.appendChild(mkField('sursă', srcSel));
      const fromInp = wire(mkInput('from', step.from != null ? step.from : ''));
      const valInp = wire(mkInput('val', literalToInput(step.val)));
      const fromF = mkField('from', fromInp);
      const valF = mkField('val', valInp);
      row.appendChild(fromF);
      row.appendChild(valF);
      function toggleSrc() {
        const m = srcSel.value;
        fromF.style.display = m === 'from' ? '' : 'none';
        valF.style.display = m === 'val' ? '' : 'none';
      }
      srcSel.addEventListener('change', toggleSrc);
      toggleSrc();
      return;
    }

    if (op === 'jget') {
      row.appendChild(mkField('from', wire(mkInput('from', step.from))));
      row.appendChild(
        mkField('path', wire(mkInput('path', step.path != null ? step.path : '')))
      );
      row.appendChild(mkField('to', wire(mkInput('to', step.to))));
      return;
    }

    if (op === 'search') {
      row.appendChild(
        mkField('query', wire(mkInput('query', step.query != null ? step.query : '')))
      );
      row.appendChild(
        mkField('to', wire(mkInput('to', step.to != null ? step.to : 'hits')))
      );
      row.appendChild(
        mkField('limit', wire(mkInput('limit', step.limit != null ? step.limit : '')))
      );
      row.appendChild(
        mkField('offset', wire(mkInput('offset', step.offset != null ? step.offset : '')))
      );
      row.appendChild(
        mkField('index', wire(mkInput('index', step.index != null ? step.index : '')))
      );
      return;
    }

    if (op === 'ui') {
      row.appendChild(mkField('do', wire(mkSelect('do', step.do || 'refresh', UI_DO_OPTS))));
      row.appendChild(
        mkField('listid', wire(mkInput('listid', step.listid != null ? step.listid : '')))
      );
      return;
    }

    if (op === 'tstart' || op === 'tdo' || op === 'tstop') {
      const hint = document.createElement('div');
      hint.className = 'prog-step-hint';
      hint.textContent = 'Fără parametri.';
      body.appendChild(hint);
      return;
    }

    if (op === 'redis') {
      const doOpts = REDIS_DO_OPTS.map((c) => ({ value: c, label: c }));
      const doSel = wire(mkSelect('do', step.do || 'TYPE', doOpts));
      row.appendChild(mkField('do', doSel));
      const argsList = Array.isArray(step.args)
        ? step.args
        : step.key != null && step.key !== ''
          ? [step.key]
          : [''];
      mountPartsList(row, argsList, onChange, 'args', 'args');
      row.appendChild(mkField('to', wire(mkInput('to', step.to != null ? step.to : ''))));
      return;
    }

    const ta = document.createElement('textarea');
    ta.setAttribute('data-s', 'json');
    ta.value = JSON.stringify(step, null, 2);
    ta.addEventListener('input', onChange);
    body.appendChild(ta);
  }

  function sf(el, name) {
    const n = el.querySelector('[data-sf="' + name + '"]');
    return n ? n.value : '';
  }

  function withStepMeta(el, step) {
    const note = sf(el, 'note');
    if (note != null && String(note).trim() !== '') step.note = String(note);
    if (el._stepRef && el._stepRef.off === true) step.off = true;
    return step;
  }

  function readFlatStep(el) {
    const opSel = el.querySelector('[data-s="op"]');
    const op = opSel ? opSel.value : 'assign';
    const step = { op: op };

    if (op === 'comment') {
      return withStepMeta(el, step);
    }
    if (op === 'assign') {
      step.to = sf(el, 'to');
      if (sf(el, '_src') === 'val') step.val = parseMaybeLiteral(sf(el, 'val'));
      else step.from = sf(el, 'from');
      return withStepMeta(el, step);
    }
    if (op === 'cat') {
      step.to = sf(el, 'to');
      const partsHost = el.querySelector('[data-sf="parts"]');
      step.parts = partsHost && partsHost._readParts ? partsHost._readParts() : [''];
      return withStepMeta(el, step);
    }
    if (op === 'cast') {
      step.to = sf(el, 'to');
      step.as = sf(el, 'as') || 'json';
      if (sf(el, '_src') === 'val') step.val = parseMaybeLiteral(sf(el, 'val'));
      else step.from = sf(el, 'from');
      return withStepMeta(el, step);
    }
    if (op === 'fdate') {
      step.to = sf(el, 'to');
      step.format = sf(el, 'format') || 'YYYY-MM-DD';
      if (sf(el, '_src') === 'val') step.val = parseMaybeLiteral(sf(el, 'val'));
      else step.from = sf(el, 'from');
      return withStepMeta(el, step);
    }
    if (op === 'calc') {
      step.to = sf(el, 'to');
      step.expr = sf(el, 'expr');
      const p = sf(el, 'precision');
      step.precision = p !== '' ? parseInt(p, 10) : null;
      return withStepMeta(el, step);
    }
    if (op === 'str') {
      step.to = sf(el, 'to');
      step.fn = sf(el, 'fn') || 'lower';
      if (step.fn === 'concat') {
        const rawArgs = sf(el, 'args');
        step.args = rawArgs !== '' ? rawArgs.split(',').map(s => s.trim()) : [];
        delete step.value;
      } else {
        step.value = sf(el, 'value');
        delete step.args;
      }
      const searchVal = sf(el, 'search');
      if (searchVal !== '') step.search = searchVal;
      const replaceVal = sf(el, 'replace');
      if (replaceVal !== '') step.replace = replaceVal;
      const sepVal = sf(el, 'separator');
      if (sepVal !== '') step.separator = sepVal;
      const patVal = sf(el, 'pattern');
      if (patVal !== '') step.pattern = patVal;
      const charVal = sf(el, 'char');
      if (charVal !== '') step.char = charVal;
      const startVal = sf(el, 'start');
      if (startVal !== '') step.start = parseInt(startVal, 10);
      const lenVal = sf(el, 'length');
      if (lenVal !== '') step.length = parseInt(lenVal, 10);
      const countVal = sf(el, 'count');
      if (countVal !== '') step.count = parseInt(countVal, 10);
      return withStepMeta(el, step);
    }
    if (op === 'obj') {
      step.to = sf(el, 'to');
      step.fn = sf(el, 'fn') || 'get';
      if (sf(el, '_src') === 'val') {
        const rawVal = sf(el, 'val');
        try { step.from = JSON.parse(rawVal); } catch (e) { step.from = {}; }
      } else {
        step.from = sf(el, 'from');
      }
      const f = step.fn;
      if (f === 'get' || f === 'set' || f === 'delete' || f === 'has') {
        step.path = sf(el, 'path');
      } else {
        delete step.path;
      }
      if (f === 'set' || f === 'merge' || f === 'pick' || f === 'omit') {
        if (sf(el, '_vsrc') === 'with') {
          step.with = sf(el, 'with');
          delete step.value;
        } else {
          const rawV = sf(el, 'value');
          if (rawV.startsWith('[') || rawV.startsWith('{') || rawV === 'true' || rawV === 'false' || !Number.isNaN(Number(rawV))) {
            try { step.value = JSON.parse(rawV); } catch (e) { step.value = rawV; }
          } else {
            step.value = rawV;
          }
          delete step.with;
        }
      } else {
        delete step.value;
        delete step.with;
      }
      return withStepMeta(el, step);
    }
    if (op === 'lock') {
      step.fn = sf(el, 'fn') || 'acq';
      if (step.fn === 'acq') {
        step.to = sf(el, 'to');
        const ttlVal = sf(el, 'ttl');
        step.ttl = ttlVal !== '' ? parseInt(ttlVal, 10) : 5000;
      } else {
        delete step.to;
        delete step.ttl;
      }
      if (sf(el, '_src') === 'val') {
        const rawVal = sf(el, 'val');
        try { step.keys = JSON.parse(rawVal); } catch (e) { step.keys = []; }
      } else {
        step.keys = sf(el, 'from');
      }
      return withStepMeta(el, step);
    }
    if (op === 'id') {
      step.to = sf(el, 'to');
      step.type = sf(el, 'type') || 'nanoid';
      const t = step.type;
      if (t === 'autoinc' || t === 'dateinc') {
        step.key = sf(el, 'key');
        delete step.size;
      } else if (t === 'nanoid') {
        const sz = sf(el, 'size');
        step.size = sz !== '' ? parseInt(sz, 10) : 21;
        delete step.key;
      } else {
        delete step.key;
        delete step.size;
      }
      return withStepMeta(el, step);
    }

    if (op === 'notify') {
      step.kind = sf(el, 'kind') || 'info';
      const text = sf(el, 'text');
      if (sf(el, '_src') === 'with') {
        step.with = text;
        delete step.value;
      } else {
        step.value = text;
        delete step.with;
      }
      return withStepMeta(el, step);
    }


    if (op === 'array') {
      step.to = sf(el, 'to');
      step.fn = sf(el, 'fn') || 'length';
      if (sf(el, '_src') === 'val') {
        const rawVal = sf(el, 'val');
        try { step.from = JSON.parse(rawVal); } catch (e) { step.from = []; }
      } else {
        step.from = sf(el, 'from');
      }
      const f = step.fn;
      if (f === 'contains' || f === 'indexOf' || f === 'lastIndexOf' || f === 'push' || f === 'unshift') {
        const rawVals = sf(el, 'values');
        if (rawVals.startsWith('[') || rawVals.startsWith('{') || rawVals === 'true' || rawVals === 'false' || !Number.isNaN(Number(rawVals))) {
          try { step.values = JSON.parse(rawVals); } catch (e) { step.values = rawVals; }
        } else {
          step.values = rawVals;
        }
      } else if (f === 'get') {
        step.index = parseInt(sf(el, 'index'), 10) || 0;
      } else if (f === 'slice') {
        step.start = parseInt(sf(el, 'start'), 10) || 0;
        const lenVal = sf(el, 'length');
        if (lenVal !== '') step.length = parseInt(lenVal, 10);
      } else if (f === 'sort') {
        step.direction = sf(el, 'direction') || 'asc';
      } else if (f === 'join') {
        step.separator = sf(el, 'separator');
      }
      return withStepMeta(el, step);
    }


    if (op === 'end') {
      const type = sf(el, '_type');
      step.type = type;
      const text = sf(el, 'text');
      if (sf(el, '_src') === 'with') {
        step.with = text;
        delete step.value;
      } else {
        step.value = text;
        delete step.with;
      }
      delete step.msg;
      delete step.err;
      return withStepMeta(el, step);
    }

    if (op === 'kget') {
      step.key = sf(el, 'key');
      step.to = sf(el, 'to');
      step.as = sf(el, 'as') || 'auto';
      return withStepMeta(el, step);
    }
    if (op === 'ksave') {
      step.key = sf(el, 'key');
      step.val = sf(el, 'val');
      step.as = sf(el, 'as') || 'auto';
      return withStepMeta(el, step);
    }
    if (op === 'kdel') {
      step.key = sf(el, 'key');
      return withStepMeta(el, step);
    }
    if (op === 'kadd' || op === 'krm') {
      step.key = sf(el, 'key');
      step.val = sf(el, 'val');
      return withStepMeta(el, step);
    }
    if (op === 'scheck') {
      step.schema = sf(el, 'schema');
      step.val = sf(el, 'val') || 'form';
      return withStepMeta(el, step);
    }
    if (op === 'sgen') {
      step.schema = sf(el, 'schema');
      step.to = sf(el, 'to') || 'draft';
      return withStepMeta(el, step);
    }
    if (op === 'jset') {
      step.to = sf(el, 'to');
      step.path = sf(el, 'path');
      if (sf(el, '_src') === 'val') step.val = parseMaybeLiteral(sf(el, 'val'));
      else step.from = sf(el, 'from');
      return withStepMeta(el, step);
    }
    if (op === 'jget') {
      step.from = sf(el, 'from');
      step.path = sf(el, 'path');
      step.to = sf(el, 'to');
      return withStepMeta(el, step);
    }
    if (op === 'search') {
      step.query = sf(el, 'query');
      step.to = sf(el, 'to') || 'hits';
      const lim = sf(el, 'limit').trim();
      const off = sf(el, 'offset').trim();
      const idx = sf(el, 'index').trim();
      if (lim !== '') {
        const n = parseInt(lim, 10);
        if (Number.isFinite(n)) step.limit = n;
      }
      if (off !== '') {
        const n = parseInt(off, 10);
        if (Number.isFinite(n)) step.offset = n;
      }
      if (idx) step.index = idx;
      return withStepMeta(el, step);
    }
    if (op === 'ui') {
      step.do = sf(el, 'do') || 'refresh';
      step.listid = sf(el, 'listid');
      return withStepMeta(el, step);
    }
    if (op === 'tstart' || op === 'tdo' || op === 'tstop') {
      return withStepMeta(el, step);
    }
    if (op === 'redis') {
      step.do = sf(el, 'do') || 'TYPE';
      const argsHost =
        el.querySelector('[data-sf="args"]') || el.querySelector('[data-sf="parts"]');
      step.args = argsHost && argsHost._readParts ? argsHost._readParts() : [];
      const to = sf(el, 'to').trim();
      if (to) step.to = to;
      return withStepMeta(el, step);
    }
    return withStepMeta(el, step);
  }

  function appendNoteField(body, step, onChange) {
    const row = document.createElement('div');
    row.className = 'prog-row prog-step-note-edit';
    const inp = document.createElement('input');
    inp.type = 'text';
    inp.setAttribute('data-sf', 'note');
    inp.placeholder = 'note (opțional)';
    inp.value = step.note != null ? String(step.note) : '';
    inp.addEventListener('input', onChange);
    row.appendChild(mkField('note', inp));
    body.appendChild(row);
  }

  function appendNoteView(body, step) {
    if (step.note == null || String(step.note) === '') {
      if (step.op === 'comment') {
        const n = document.createElement('div');
        n.className = 'prog-step-note';
        n.textContent = '//';
        body.appendChild(n);
      }
      return;
    }
    const n = document.createElement('div');
    n.className = 'prog-step-note';
    n.textContent = '// ' + String(step.note);
    body.appendChild(n);
  }

  /**
   * Citește pașii dintr-un host (doar copii .prog-step) în array-ul țintă (in-place).
   * Blocurile păstrează referința (_stepRef).
   */
  function readStepsInto(stepsHost, targetArr) {
    const els = Array.from(stepsHost.children).filter(
      (ch) => ch.classList && ch.classList.contains('prog-step')
    );
    const next = [];
    els.forEach((el) => {
      const mode = el.getAttribute('data-mode') || 'flat';
      const editing = el.getAttribute('data-editing') === '1';
      if (mode === 'block' || !editing) {
        // view sau bloc: păstrează referința (F2-alg-D)
        if (el._stepRef && typeof el._stepRef === 'object') next.push(el._stepRef);
        return;
      }
      const ta = el.querySelector('textarea[data-s="json"]');
      try {
        if (mode === 'raw' || ta) {
          const step = JSON.parse(ta.value);
          if (step && typeof step === 'object') {
            if (ta) ta.classList.remove('json-invalid');
            next.push(step);
          }
        } else {
          next.push(readFlatStep(el));
        }
      } catch (e) {
        if (ta) ta.classList.add('json-invalid');
        if (el._stepRef) next.push(el._stepRef);
      }
    });
    targetArr.length = 0;
    next.forEach((s) => targetArr.push(s));
  }

  function randeazaEditAlg(host, obj) {
    if (!Array.isArray(obj.steps)) obj.steps = [];
    host.innerHTML = '';
    const card = document.createElement('div');
    card.className = 'prog-edit-card';
    card.innerHTML = '<h4>Algorithm</h4>';

    const row1 = document.createElement('div');
    row1.className = 'prog-row';
    row1.innerHTML =
      '<div class="prog-field"><label>name</label><input data-f="name"></div>' +
      '<div class="prog-field"><label>v</label><input data-f="v" type="number" min="1" step="1"></div>';
    row1.querySelector('[data-f="name"]').value = obj.name || '';
    row1.querySelector('[data-f="v"]').value = obj.v != null ? obj.v : 1;
    card.appendChild(row1);

    const navEl = document.createElement('div');
    navEl.className = 'prog-alg-nav';
    card.appendChild(navEl);

    const viewHost = document.createElement('div');
    viewHost.className = 'prog-alg-view';
    card.appendChild(viewHost);

    /** @type {{ kind:'steps'|'block', label:string, steps?:object[], step?:object }[]} */
    const navStack = [{ kind: 'steps', label: 'steps', steps: obj.steps }];

    function currentFrame() {
      return navStack[navStack.length - 1];
    }

    function persistMeta() {
      obj.name = row1.querySelector('[data-f="name"]').value;
      const v = parseInt(row1.querySelector('[data-f="v"]').value, 10);
      obj.v = Number.isFinite(v) ? v : 1;
    }

    function flushCurrentView() {
      const frame = currentFrame();
      const stepsHost = viewHost.querySelector('.prog-steps[data-alg-list]');
      if (frame.kind === 'steps' && stepsHost && Array.isArray(frame.steps)) {
        readStepsInto(stepsHost, frame.steps);
      }
      if (frame.kind === 'block' && frame.step) {
        const whenTa = viewHost.querySelector('textarea[data-block="when"]');
        if (whenTa) {
          const When = getWhenApi();
          const errEl = viewHost.querySelector('[data-block="when-err"]');
          const parsed =
            When && typeof When.tryParseWhenExpr === 'function'
              ? When.tryParseWhenExpr(whenTa.value)
              : null;
          if (parsed && parsed.ok) {
            frame.step.when = parsed.ast;
            whenTa.classList.remove('json-invalid');
            if (errEl) errEl.textContent = '';
          } else if (parsed) {
            whenTa.classList.add('json-invalid');
            if (errEl) {
              errEl.textContent =
                parsed.error +
                (typeof parsed.index === 'number'
                  ? ' (pos ' + parsed.index + ')'
                  : '');
            }
          } else {
            try {
              frame.step.when = JSON.parse(whenTa.value);
              whenTa.classList.remove('json-invalid');
              if (errEl) errEl.textContent = '';
            } catch (e) {
              whenTa.classList.add('json-invalid');
              if (errEl) errEl.textContent = e && e.message ? e.message : String(e);
            }
          }
        }
        const inInp = viewHost.querySelector('[data-block="in"]');
        const asInp = viewHost.querySelector('[data-block="as"]');
        if (inInp) frame.step.in = inInp.value;
        if (asInp) frame.step.as = asInp.value;
      }
    }

    function syncAll() {
      persistMeta();
      flushCurrentView();
      scrieRaw(obj);
    }

    function pushNav(frame) {
      flushCurrentView();
      navStack.push(frame);
      renderView();
      scrieRaw(obj);
    }

    function popNav() {
      if (navStack.length <= 1) return;
      flushCurrentView();
      navStack.pop();
      renderView();
      scrieRaw(obj);
    }

    function renderNav() {
      navEl.innerHTML = '';
      if (navStack.length <= 1) {
        navEl.style.display = 'none';
        return;
      }
      navEl.style.display = '';
      const back = document.createElement('button');
      back.type = 'button';
      back.className = 'btn-gri btn-inline';
      back.textContent = '← Înapoi';
      back.onclick = () => popNav();
      navEl.appendChild(back);
      const crumb = document.createElement('span');
      crumb.className = 'prog-alg-crumb';
      crumb.textContent = navStack.map((f) => f.label).join(' › ');
      navEl.appendChild(crumb);
    }

    function confirmDeleteBlock(step) {
      const nested = countNestedOps(step);
      const msg =
        nested > 0
          ? 'Ștergi blocul ' +
            step.op +
            ' și cei ' +
            nested +
            ' pași din interior?'
          : 'Ștergi blocul ' + step.op + ' (gol)?';
      return typeof window !== 'undefined' && window.confirm
        ? window.confirm(msg)
        : true;
    }

    function mountStepsList(parent, stepsArr) {
      const stepsHost = document.createElement('div');
      stepsHost.className = 'prog-steps';
      stepsHost.setAttribute('data-alg-list', '1');
      parent.appendChild(stepsHost);

      const frame = currentFrame();
      if (typeof frame.editIndex !== 'number') frame.editIndex = null;
      // clamp dacă lista s-a scurtat
      if (
        frame.editIndex != null &&
        (frame.editIndex < 0 || frame.editIndex >= stepsArr.length)
      ) {
        frame.editIndex = null;
      }

      function rebuild() {
        persistMeta();
        renderView();
        scrieRaw(obj);
      }

      function setEditIndex(nextIdx) {
        flushCurrentView();
        frame.editIndex = nextIdx;
        rebuild();
      }

      function addStepRow(step, index) {
        step = step && typeof step === 'object' ? step : defaultStep('assign');
        const mode = stepEditMode(step);
        const isBlock = mode === 'block';
        const isEditing = !isBlock && frame.editIndex === index;
        const el = document.createElement('div');
        el.className =
          'prog-step' +
          (isBlock ? ' prog-step-block' : '') +
          (!isBlock && !isEditing ? ' prog-step-view' : '') +
          (isEditing ? ' prog-step-editing' : '') +
          (step.off === true ? ' prog-step-off' : '');
        el.setAttribute('data-mode', mode);
        el.setAttribute('data-editing', isEditing ? '1' : '0');
        el._stepRef = step;

        const head = document.createElement('div');
        head.className = 'prog-step-head';

        const idx = document.createElement('span');
        idx.setAttribute('data-s', 'idx');
        idx.textContent = '#' + (index + 1);
        head.appendChild(idx);

        function mountMoveBtns(headEl, idxPos) {
          const wrap = document.createElement('span');
          wrap.className = 'prog-step-move';
          const up = document.createElement('button');
          up.type = 'button';
          up.className = 'btn-gri btn-inline';
          up.textContent = '↑';
          up.title = 'Mută în sus';
          up.disabled = idxPos <= 0;
          up.onclick = (ev) => {
            ev.stopPropagation();
            flushCurrentView();
            const i = Array.from(stepsHost.children).indexOf(el);
            const from = i >= 0 ? i : idxPos;
            if (moveStep(stepsArr, from, -1)) {
              if (frame.editIndex === from) frame.editIndex = from - 1;
              else if (frame.editIndex === from - 1) frame.editIndex = from;
              rebuild();
            }
          };
          const down = document.createElement('button');
          down.type = 'button';
          down.className = 'btn-gri btn-inline';
          down.textContent = '↓';
          down.title = 'Mută în jos';
          down.disabled = idxPos >= stepsArr.length - 1;
          down.onclick = (ev) => {
            ev.stopPropagation();
            flushCurrentView();
            const i = Array.from(stepsHost.children).indexOf(el);
            const from = i >= 0 ? i : idxPos;
            if (moveStep(stepsArr, from, 1)) {
              if (frame.editIndex === from) frame.editIndex = from + 1;
              else if (frame.editIndex === from + 1) frame.editIndex = from;
              rebuild();
            }
          };
          wrap.appendChild(up);
          wrap.appendChild(down);
          headEl.appendChild(wrap);
        }

        function mountDeleteBtn(headEl) {
          const rm = document.createElement('button');
          rm.type = 'button';
          rm.className = 'btn-gri btn-inline btn-inline-danger';
          rm.textContent = 'Șterge';
          rm.onclick = (ev) => {
            ev.stopPropagation();
            if (isBlock && !confirmDeleteBlock(step)) return;
            flushCurrentView();
            const i = stepsArr.indexOf(step);
            const delAt = i >= 0 ? i : index;
            stepsArr.splice(delAt, 1);
            if (frame.editIndex == null) {
              /* keep */
            } else if (frame.editIndex === delAt) {
              frame.editIndex = null;
            } else if (frame.editIndex > delAt) {
              frame.editIndex -= 1;
            }
            rebuild();
          };
          headEl.appendChild(rm);
        }

        if (isBlock) {
          const lab = document.createElement('code');
          lab.className = 'prog-block-op';
          lab.textContent = step.op;
          head.appendChild(lab);

          const openBtn = document.createElement('button');
          openBtn.type = 'button';
          openBtn.className = 'btn-albastru btn-inline';
          openBtn.textContent = 'Deschide';
          openBtn.onclick = (ev) => {
            ev.stopPropagation();
            flushCurrentView();
            frame.editIndex = null;
            pushNav({
              kind: 'block',
              label: step.op + '#' + (index + 1),
              step: step,
            });
          };
          head.appendChild(openBtn);
          mountDeleteBtn(head);
          mountMoveBtns(head, index);
        } else if (isEditing) {
          const opSel = document.createElement('select');
          opSel.setAttribute('data-s', 'op');
          opSel.className = 'prog-step-op';
          fillOpSelect(opSel, step.op);
          opSel.addEventListener('change', () => {
            const prev = step;
            const next = defaultStep(opSel.value);
            if (prev.note) next.note = prev.note;
            if (prev.off === true) next.off = true;
            const i = Array.from(stepsHost.children).indexOf(el);
            flushCurrentView();
            if (i >= 0) stepsArr[i] = next;
            frame.editIndex = i >= 0 ? i : index;
            rebuild();
          });
          head.appendChild(opSel);

          const viewBtn = document.createElement('button');
          viewBtn.type = 'button';
          viewBtn.className = 'btn-gri btn-inline prog-step-view-btn';
          viewBtn.textContent = '👁';
          viewBtn.title = 'Înapoi la view';
          viewBtn.setAttribute('aria-label', 'Înapoi la view');
          viewBtn.onclick = (ev) => {
            ev.stopPropagation();
            setEditIndex(null);
          };
          head.appendChild(viewBtn);

          const offBtn = document.createElement('button');
          offBtn.type = 'button';
          offBtn.className =
            'btn-gri btn-inline prog-step-off-btn' +
            (step.off === true ? ' is-off' : '');
          offBtn.textContent = '⊘';
          offBtn.title = step.off === true ? 'Pornește pasul (off→on)' : 'Oprește pasul (on→off)';
          offBtn.setAttribute('aria-label', offBtn.title);
          offBtn.onclick = (ev) => {
            ev.stopPropagation();
            flushCurrentView();
            const i = Array.from(stepsHost.children).indexOf(el);
            const cur = i >= 0 ? stepsArr[i] : step;
            if (cur.off === true) delete cur.off;
            else cur.off = true;
            if (i >= 0) stepsArr[i] = cur;
            frame.editIndex = i >= 0 ? i : index;
            rebuild();
          };
          head.appendChild(offBtn);

          mountDeleteBtn(head);
          mountMoveBtns(head, index);
        } else {
          // view: op ca text (D52)
          const lab = document.createElement('code');
          lab.className = 'prog-step-op-label';
          lab.textContent = step.op || '?';
          head.appendChild(lab);
          mountDeleteBtn(head);
          mountMoveBtns(head, index);
        }

        const insertWrap = document.createElement('div');
        insertWrap.className = 'prog-step-insert';
        const insSel = document.createElement('select');
        insSel.className = 'prog-step-op';
        fillOpSelect(insSel, 'assign');
        const insBtn = document.createElement('button');
        insBtn.type = 'button';
        insBtn.className = 'btn-gri btn-inline';
        insBtn.textContent = '+ step';
        insBtn.title = 'Inserează înainte de acest pas';
        insBtn.onclick = (ev) => {
          ev.stopPropagation();
          flushCurrentView();
          const i = Array.from(stepsHost.children).indexOf(el);
          const at = i >= 0 ? i : index;
          insertStepAt(stepsArr, at, insSel.value);
          frame.editIndex = at; // pas nou → edit (D)
          rebuild();
        };
        insertWrap.appendChild(insBtn);
        insertWrap.appendChild(insSel);
        head.appendChild(insertWrap);

        el.appendChild(head);

        const body = document.createElement('div');
        body.className = 'prog-step-body';
        el.appendChild(body);

        if (isBlock) {
          const prev = document.createElement('div');
          prev.className = 'prog-block-preview';
          prev.textContent = previewBlock(step);
          body.appendChild(prev);
          appendNoteView(body, step);
          el.addEventListener('click', (ev) => {
            if (ev.target && ev.target.closest && ev.target.closest('button, select')) {
              return;
            }
            flushCurrentView();
            frame.editIndex = null;
            pushNav({
              kind: 'block',
              label: step.op + '#' + (index + 1),
              step: step,
            });
          });
        } else if (!isEditing) {
          const main = previewStep(step);
          if (main) {
            const prev = document.createElement('div');
            prev.className = 'prog-step-preview';
            prev.textContent = main;
            body.appendChild(prev);
          }
          appendNoteView(body, step);
          el.addEventListener('click', (ev) => {
            if (
              ev.target &&
              ev.target.closest &&
              ev.target.closest('button, select')
            ) {
              return;
            }
            setEditIndex(index);
          });
        } else if (mode === 'raw') {
          const hint = document.createElement('div');
          hint.className = 'prog-step-hint';
          hint.textContent = 'Formă complexă — editează JSON (sau tab Json).';
          body.appendChild(hint);
          const ta = document.createElement('textarea');
          ta.setAttribute('data-s', 'json');
          ta.value = JSON.stringify(step, null, 2);
          ta.addEventListener('input', () => {
            ta.classList.remove('json-invalid');
            try {
              const parsed = JSON.parse(ta.value);
              if (parsed && typeof parsed === 'object') {
                el._stepRef = parsed;
                const i = Array.from(stepsHost.children).indexOf(el);
                if (i >= 0) stepsArr[i] = parsed;
              }
              syncAll();
            } catch (e) {
              ta.classList.add('json-invalid');
            }
          });
          body.appendChild(ta);
          appendNoteField(body, step, syncAll);
        } else {
          renderFlatFields(body, step, syncAll);
          appendNoteField(body, step, syncAll);
        }

        stepsHost.appendChild(el);
      }

      stepsArr.forEach((s, i) => addStepRow(s, i));

      const toolbar = document.createElement('div');
      toolbar.className = 'prog-toolbar';
      const sel = document.createElement('select');
      fillOpSelect(sel, 'assign');
      const add = document.createElement('button');
      add.type = 'button';
      add.className = 'btn-albastru btn-inline';
      add.textContent = '+ Step';
      add.onclick = () => {
        flushCurrentView();
        stepsArr.push(defaultStep(sel.value));
        frame.editIndex = stepsArr.length - 1;
        rebuild();
      };
      toolbar.appendChild(sel);
      toolbar.appendChild(add);
      parent.appendChild(toolbar);
    }

    function mountBranchCard(parent, label, count, onOpen, extraBtns) {
      const cardB = document.createElement('div');
      cardB.className = 'prog-step prog-step-block prog-branch-card';
      const head = document.createElement('div');
      head.className = 'prog-step-head';
      const lab = document.createElement('code');
      lab.className = 'prog-block-op';
      lab.textContent = label;
      head.appendChild(lab);
      const cnt = document.createElement('span');
      cnt.className = 'prog-branch-count';
      cnt.textContent = '(' + count + ')';
      head.appendChild(cnt);
      const open = document.createElement('button');
      open.type = 'button';
      open.className = 'btn-albastru btn-inline';
      open.textContent = 'Deschide';
      open.onclick = (ev) => {
        ev.stopPropagation();
        onOpen();
      };
      head.appendChild(open);
      (extraBtns || []).forEach((b) => head.appendChild(b));
      cardB.appendChild(head);
      cardB.addEventListener('click', (ev) => {
        if (ev.target && ev.target.closest && ev.target.closest('button')) return;
        onOpen();
      });
      parent.appendChild(cardB);
    }

    function mountBlockPanel(parent, step) {
      const wrap = document.createElement('div');
      wrap.className = 'prog-block-panel';
      parent.appendChild(wrap);

      // meta: note + off (⊘) pe bloc
      const metaRow = document.createElement('div');
      metaRow.className = 'prog-row';
      const noteInp = document.createElement('input');
      noteInp.type = 'text';
      noteInp.setAttribute('data-block', 'note');
      noteInp.placeholder = 'note (opțional)';
      noteInp.value = step.note != null ? String(step.note) : '';
      noteInp.addEventListener('input', () => {
        const v = noteInp.value.trim();
        if (v) step.note = v;
        else delete step.note;
        syncAll();
      });
      metaRow.appendChild(mkField('note', noteInp));
      const offBtn = document.createElement('button');
      offBtn.type = 'button';
      offBtn.className =
        'btn-gri btn-inline prog-step-off-btn' +
        (step.off === true ? ' is-off' : '');
      offBtn.textContent = '⊘';
      offBtn.title =
        step.off === true ? 'Pornește blocul (off→on)' : 'Oprește blocul (on→off)';
      offBtn.onclick = () => {
        if (step.off === true) delete step.off;
        else step.off = true;
        offBtn.classList.toggle('is-off', step.off === true);
        offBtn.title =
          step.off === true ? 'Pornește blocul (off→on)' : 'Oprește blocul (on→off)';
        syncAll();
      };
      const offWrap = document.createElement('div');
      offWrap.className = 'prog-field';
      offWrap.innerHTML = '<label>off</label>';
      offWrap.appendChild(offBtn);
      metaRow.appendChild(offWrap);
      wrap.appendChild(metaRow);

      if (step.op === 'if') {
        const whenLab = document.createElement('div');
        whenLab.className = 'prog-step-hint';
        whenLab.textContent =
          'when — text (ex: qty <= 0 or form.id == ""); Docs → when';
        wrap.appendChild(whenLab);
        const whenTa = document.createElement('textarea');
        whenTa.setAttribute('data-block', 'when');
        whenTa.className = 'prog-when-ta';
        const When = getWhenApi();
        try {
          const w = step.when != null ? step.when : ['eq', '', ''];
          whenTa.value =
            When && typeof When.printWhenExpr === 'function'
              ? When.printWhenExpr(w)
              : JSON.stringify(w);
        } catch (e) {
          whenTa.value = '"" == ""';
        }
        const whenErr = document.createElement('div');
        whenErr.className = 'prog-when-err';
        whenErr.setAttribute('data-block', 'when-err');
        whenTa.addEventListener('input', () => {
          const api = getWhenApi();
          const r =
            api && typeof api.tryParseWhenExpr === 'function'
              ? api.tryParseWhenExpr(whenTa.value)
              : null;
          if (r && r.ok) {
            step.when = r.ast;
            whenTa.classList.remove('json-invalid');
            whenErr.textContent = '';
            syncAll();
          } else if (r) {
            whenTa.classList.add('json-invalid');
            whenErr.textContent =
              r.error +
              (typeof r.index === 'number' ? ' (pos ' + r.index + ')' : '');
          } else {
            whenTa.classList.add('json-invalid');
            whenErr.textContent = 'parser when indisponibil';
          }
        });
        wrap.appendChild(whenTa);
        wrap.appendChild(whenErr);

        function mountBranchOffToggle(label, flagKey) {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className =
            'btn-gri btn-inline prog-step-off-btn' +
            (step[flagKey] === true ? ' is-off' : '');
          btn.textContent = '⊘';
          btn.title =
            step[flagKey] === true
              ? 'Pornește ' + label
              : 'Oprește ' + label + ' (thenOff/elseOff)';
          btn.setAttribute('data-block', flagKey);
          btn.onclick = (ev) => {
            ev.stopPropagation();
            if (step[flagKey] === true) delete step[flagKey];
            else step[flagKey] = true;
            btn.classList.toggle('is-off', step[flagKey] === true);
            syncAll();
            renderView();
          };
          return btn;
        }

        if (!Array.isArray(step.then)) step.then = [];
        mountBranchCard(
          wrap,
          'then' + (step.thenOff ? ' [off]' : ''),
          step.then.length,
          () => {
            flushCurrentView();
            pushNav({ kind: 'steps', label: 'then', steps: step.then });
          },
          [mountBranchOffToggle('then', 'thenOff')]
        );

        if (Array.isArray(step.else)) {
          const rmElse = document.createElement('button');
          rmElse.type = 'button';
          rmElse.className = 'btn-gri btn-inline btn-inline-danger';
          rmElse.textContent = 'Șterge else';
          rmElse.onclick = (ev) => {
            ev.stopPropagation();
            const n = step.else.length;
            const ok =
              typeof window !== 'undefined' && window.confirm
                ? window.confirm(
                    n
                      ? 'Ștergi ramura else și cei ' + n + ' pași?'
                      : 'Ștergi ramura else?'
                  )
                : true;
            if (!ok) return;
            flushCurrentView();
            delete step.else;
            delete step.elseOff;
            renderView();
            scrieRaw(obj);
          };
          mountBranchCard(
            wrap,
            'else' + (step.elseOff ? ' [off]' : ''),
            step.else.length,
            () => {
              flushCurrentView();
              pushNav({ kind: 'steps', label: 'else', steps: step.else });
            },
            [mountBranchOffToggle('else', 'elseOff'), rmElse]
          );
        } else {
          const addElse = document.createElement('button');
          addElse.type = 'button';
          addElse.className = 'btn-albastru btn-inline';
          addElse.textContent = 'Adaugă else';
          addElse.onclick = () => {
            flushCurrentView();
            step.else = [];
            renderView();
            scrieRaw(obj);
          };
          const row = document.createElement('div');
          row.className = 'prog-toolbar';
          row.appendChild(addElse);
          wrap.appendChild(row);
        }
        return;
      }

      if (step.op === 'foreach') {
        const row = document.createElement('div');
        row.className = 'prog-row';
        const inInp = mkInput('in', step.in != null ? step.in : '');
        inInp.setAttribute('data-block', 'in');
        inInp.removeAttribute('data-sf');
        inInp.addEventListener('input', syncAll);
        const asInp = mkInput('as', step.as != null ? step.as : 'it');
        asInp.setAttribute('data-block', 'as');
        asInp.removeAttribute('data-sf');
        asInp.addEventListener('input', syncAll);
        row.appendChild(mkField('in', inInp));
        row.appendChild(mkField('as', asInp));
        wrap.appendChild(row);
        if (!Array.isArray(step.do)) step.do = [];
        mountBranchCard(wrap, 'do', step.do.length, () => {
          flushCurrentView();
          pushNav({ kind: 'steps', label: 'do', steps: step.do });
        });
      }
    }

    function renderView() {
      persistMeta();
      renderNav();
      viewHost.innerHTML = '';
      const frame = currentFrame();
      if (frame.kind === 'block' && frame.step) {
        mountBlockPanel(viewHost, frame.step);
      } else if (frame.kind === 'steps' && Array.isArray(frame.steps)) {
        mountStepsList(viewHost, frame.steps);
      }
    }

    row1.querySelectorAll('input').forEach((inp) =>
      inp.addEventListener('input', () => {
        persistMeta();
        scrieRaw(obj);
      })
    );

    renderView();
    host.appendChild(card);
  }

  // ---------- List edit ----------
  const LIST_SOURCE_FROM = [
    { value: 'keys', label: 'keys (pattern)' },
    { value: 'search', label: 'search (query)' },
    { value: 'set', label: 'set' },
    { value: 'list', label: 'list (Redis LIST)' },
    { value: 'zset', label: 'zset' },
    { value: 'hash', label: 'hash' },
    { value: 'enum', label: 'enum' },
  ];

  function randeazaEditList(host, obj) {
    if (!obj.source || typeof obj.source !== 'object') {
      obj.source = { from: 'keys', pattern: '*' };
    }
    if (!Array.isArray(obj.columns)) obj.columns = [];
    if (!Array.isArray(obj.btns)) obj.btns = [];
    if (!Array.isArray(obj.rowBtns)) obj.rowBtns = [];
    if (obj.row !== 'array') obj.row = 'object';
    if (obj.pageSize == null || !Number.isFinite(Number(obj.pageSize))) obj.pageSize = 20;

    host.innerHTML = '';
    const card = document.createElement('div');
    card.className = 'prog-edit-card';
    card.innerHTML = '<h4>List</h4>';

    const rowHead = document.createElement('div');
    rowHead.className = 'prog-row';
    rowHead.innerHTML =
      '<div class="prog-field"><label>title</label><input type="text" data-f="title"></div>' +
      '<div class="prog-field"><label>row</label><select data-f="row">' +
      '<option value="object">object</option><option value="array">array</option></select></div>' +
      '<div class="prog-field"><label>pageSize</label><input type="number" min="1" step="1" data-f="pageSize"></div>' +
      '<div class="prog-field"><label>autoload</label><select data-f="autoload">' +
      '<option value="true">true</option>' +
      '<option value="false">false</option></select></div>';
    card.appendChild(rowHead);
    rowHead.querySelector('[data-f="title"]').value = obj.title || '';
    rowHead.querySelector('[data-f="row"]').value = obj.row === 'array' ? 'array' : 'object';
    rowHead.querySelector('[data-f="pageSize"]').value = obj.pageSize;
    rowHead.querySelector('[data-f="autoload"]').value =
      obj.autoload === false ? 'false' : 'true';

    const srcCard = document.createElement('div');
    srcCard.className = 'prog-step';
    srcCard.innerHTML = '<div class="prog-step-head"><span>source</span></div>';
    const srcRow = document.createElement('div');
    srcRow.className = 'prog-row';
    srcRow.innerHTML =
      '<div class="prog-field"><label>from</label><select data-s="from"></select></div>' +
      '<div class="prog-field" data-s-wrap="pattern"><label>pattern</label><input data-s="pattern" placeholder="data:_stock:*"></div>' +
      '<div class="prog-field" data-s-wrap="query" style="flex:2"><label>query</label><textarea data-s="query" rows="2" placeholder=\'{"s_prefix":"stock"} sau s_prefix:stock\'></textarea></div>' +
      '<div class="prog-field" data-s-wrap="key"><label>key</label><input data-s="key" placeholder="set:_ids"></div>' +
      '<div class="prog-field" data-s-wrap="values" style="flex:2"><label>values (enum, virgulă)</label><input data-s="values" placeholder="a,b,c"></div>';
    const fromSel = srcRow.querySelector('[data-s="from"]');
    LIST_SOURCE_FROM.forEach((o) => {
      const opt = document.createElement('option');
      opt.value = o.value;
      opt.textContent = o.label;
      fromSel.appendChild(opt);
    });
    srcCard.appendChild(srcRow);
    card.appendChild(srcCard);

    function fillSourceFields() {
      const src = obj.source || {};
      const from = src.from || 'keys';
      fromSel.value = from;
      srcRow.querySelector('[data-s="pattern"]').value = src.pattern != null ? String(src.pattern) : '*';
      const q = src.query;
      srcRow.querySelector('[data-s="query"]').value =
        q == null ? '' : typeof q === 'string' ? q : JSON.stringify(q, null, 2);
      srcRow.querySelector('[data-s="key"]').value = src.key != null ? String(src.key) : '';
      srcRow.querySelector('[data-s="values"]').value = Array.isArray(src.values)
        ? src.values.join(',')
        : '';
      syncSourceVisibility();
    }

    function syncSourceVisibility() {
      const from = fromSel.value;
      const show = {
        pattern: from === 'keys',
        query: from === 'search',
        key: from === 'set' || from === 'list' || from === 'zset' || from === 'hash',
        values: from === 'enum',
      };
      Object.keys(show).forEach((k) => {
        const el = srcRow.querySelector('[data-s-wrap="' + k + '"]');
        if (el) el.style.display = show[k] ? '' : 'none';
      });
    }

    const colsHost = document.createElement('div');
    colsHost.className = 'prog-steps';
    const colsLabel = document.createElement('div');
    colsLabel.className = 'prog-step-head';
    colsLabel.innerHTML = '<span>columns</span>';
    card.appendChild(colsLabel);
    card.appendChild(colsHost);

    const rowBtnsHost = document.createElement('div');
    rowBtnsHost.className = 'prog-steps';
    const rowBtnsLabel = document.createElement('div');
    rowBtnsLabel.className = 'prog-step-head';
    rowBtnsLabel.innerHTML = '<span>rowBtns</span>';
    card.appendChild(rowBtnsLabel);
    card.appendChild(rowBtnsHost);

    const btnsHost = document.createElement('div');
    btnsHost.className = 'prog-steps';
    const btnsLabel = document.createElement('div');
    btnsLabel.className = 'prog-step-head';
    btnsLabel.innerHTML = '<span>btns (below)</span>';
    card.appendChild(btnsLabel);
    card.appendChild(btnsHost);

    function readSourceFromDom() {
      const from = fromSel.value || 'keys';
      const source = { from };
      if (from === 'keys') {
        source.pattern = srcRow.querySelector('[data-s="pattern"]').value.trim() || '*';
      } else if (from === 'search') {
        const raw = srcRow.querySelector('[data-s="query"]').value.trim();
        if (!raw) source.query = { '*': '*' };
        else {
          try {
            source.query = JSON.parse(raw);
          } catch (e) {
            source.query = raw;
          }
        }
      } else if (from === 'enum') {
        source.values = srcRow
          .querySelector('[data-s="values"]')
          .value.split(',')
          .map((s) => s.trim())
          .filter(Boolean);
      } else {
        source.key = srcRow.querySelector('[data-s="key"]').value.trim();
      }
      return source;
    }

    function syncFromDom() {
      obj.title = rowHead.querySelector('[data-f="title"]').value;
      obj.row = rowHead.querySelector('[data-f="row"]').value === 'array' ? 'array' : 'object';
      const ps = parseInt(rowHead.querySelector('[data-f="pageSize"]').value, 10);
      obj.pageSize = Number.isFinite(ps) && ps >= 1 ? ps : 20;
      if (rowHead.querySelector('[data-f="autoload"]').value === 'false') {
        obj.autoload = false;
      } else {
        delete obj.autoload;
      }
      obj.source = readSourceFromDom();

      obj.columns = [];
      colsHost.querySelectorAll('.prog-step[data-col]').forEach((el) => {
        const col = {
          id: el.querySelector('[data-c="id"]').value.trim(),
          label: el.querySelector('[data-c="label"]').value.trim(),
        };
        const path = el.querySelector('[data-c="path"]').value.trim();
        const cnst = el.querySelector('[data-c="const"]').value;
        if (path) col.path = path;
        if (cnst !== '') {
          const t = cnst.trim();
          if (t === 'true') col.const = true;
          else if (t === 'false') col.const = false;
          else if (t !== '' && Number.isFinite(Number(t)) && String(Number(t)) === t) col.const = Number(t);
          else col.const = cnst;
        }
        obj.columns.push(col);
      });

      function readBtns(host, withNeedsRow) {
        const out = [];
        host.querySelectorAll('.prog-step[data-btn]').forEach((el) => {
          const kind = normalizeBtnKind(el.querySelector('[data-b="kind"]').value);
          const btn = {
            id: el.querySelector('[data-b="id"]').value.trim(),
            label: el.querySelector('[data-b="label"]').value.trim(),
            alg: el.querySelector('[data-b="alg"]').value.trim(),
          };
          if (kind) btn.kind = kind;
          if (withNeedsRow) {
            const nrEl = el.querySelector('[data-b="needsRow"]');
            if (nrEl && nrEl.value === 'false') btn.needsRow = false;
          }
          out.push(btn);
        });
        return out;
      }
      obj.rowBtns = readBtns(rowBtnsHost, false);
      obj.btns = readBtns(btnsHost, true);
      scrieRaw(obj);
    }

    function addColRow(col) {
      col = col || { id: '', label: '', path: '' };
      const el = document.createElement('div');
      el.className = 'prog-step';
      el.setAttribute('data-col', '1');
      el.innerHTML =
        '<div class="prog-row">' +
        '<div class="prog-field"><label>id</label><input data-c="id"></div>' +
        '<div class="prog-field"><label>label</label><input data-c="label"></div>' +
        '<div class="prog-field"><label>path</label><input data-c="path" placeholder="_key | qty | _json"></div>' +
        '<div class="prog-field"><label>const</label><input data-c="const" placeholder="opțional static"></div>' +
        '</div>';
      const rm = document.createElement('button');
      rm.type = 'button';
      rm.className = 'btn-gri btn-inline btn-inline-danger';
      rm.textContent = 'Șterge col';
      rm.onclick = () => {
        el.remove();
        syncFromDom();
      };
      el.appendChild(rm);
      el.querySelector('[data-c="id"]').value = col.id || '';
      el.querySelector('[data-c="label"]').value = col.label || '';
      el.querySelector('[data-c="path"]').value = col.path != null ? String(col.path) : '';
      el.querySelector('[data-c="const"]').value = Object.prototype.hasOwnProperty.call(col, 'const')
        ? String(col.const)
        : '';
      el.querySelectorAll('input').forEach((inp) => inp.addEventListener('input', syncFromDom));
      colsHost.appendChild(el);
    }

    function addListBtnRow(host, btn, withNeedsRow) {
      btn = btn || { id: '', label: '', alg: '', kind: '' };
      const el = document.createElement('div');
      el.className = 'prog-step';
      el.setAttribute('data-btn', '1');
      el.innerHTML =
        '<div class="prog-row">' +
        '<div class="prog-field"><label>id</label><input data-b="id"></div>' +
        '<div class="prog-field"><label>label</label><input data-b="label"></div>' +
        '<div class="prog-field"><label>alg</label><select data-b="alg"></select></div>' +
        '<div class="prog-field"><label>culoare</label><select data-b="kind"></select></div>' +
        (withNeedsRow
          ? '<div class="prog-field"><label>needsRow</label><select data-b="needsRow">' +
            '<option value="true">da (rând selectat)</option>' +
            '<option value="false">nu (fără selecție)</option>' +
            '</select></div>'
          : '') +
        '</div>';
      const rm = document.createElement('button');
      rm.type = 'button';
      rm.className = 'btn-gri btn-inline btn-inline-danger';
      rm.textContent = 'Șterge';
      rm.onclick = () => {
        el.remove();
        syncFromDom();
      };
      el.appendChild(rm);
      el.querySelector('[data-b="id"]').value = btn.id || '';
      el.querySelector('[data-b="label"]').value = btn.label || '';
      const algSel = el.querySelector('[data-b="alg"]');
      fillKeySelect(algSel, 'alg', btn.alg || '');
      fillBtnKindSelect(el.querySelector('[data-b="kind"]'), btn.kind || '');
      if (withNeedsRow) {
        const nr = el.querySelector('[data-b="needsRow"]');
        nr.value = btn.needsRow === false ? 'false' : 'true';
      }
      mountSelectWithOpen(algSel, { beforeOpen: syncFromDom });
      el.querySelectorAll('input,select').forEach((inp) => {
        inp.addEventListener('input', syncFromDom);
        inp.addEventListener('change', syncFromDom);
      });
      host.appendChild(el);
    }

    fillSourceFields();
    fromSel.addEventListener('change', () => {
      syncSourceVisibility();
      syncFromDom();
    });
    srcRow.querySelectorAll('input,textarea').forEach((inp) => {
      inp.addEventListener('input', syncFromDom);
    });

    (obj.columns.length ? obj.columns : [{ id: 'key', label: 'Cheie', path: '_key' }]).forEach(
      addColRow
    );
    (obj.rowBtns || []).forEach((b) => addListBtnRow(rowBtnsHost, b, false));
    (obj.btns || []).forEach((b) => addListBtnRow(btnsHost, b, true));

    const toolbar = document.createElement('div');
    toolbar.className = 'prog-toolbar';
    function toolBtn(label, cls, fn) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = (cls || 'btn-albastru') + ' btn-inline';
      b.textContent = label;
      b.onclick = fn;
      toolbar.appendChild(b);
    }
    toolBtn('+ Column', 'btn-albastru', () => {
      addColRow({ id: 'c' + (colsHost.children.length + 1), label: 'Col', path: '' });
      syncFromDom();
    });
    toolBtn('+ rowBtn', 'btn-albastru', () => {
      addListBtnRow(
        rowBtnsHost,
        {
          id: 'rb' + (rowBtnsHost.querySelectorAll('[data-btn]').length + 1),
          label: 'Actiune',
          alg: '',
        },
        false
      );
      syncFromDom();
    });
    toolBtn('+ btn', 'btn-albastru', () => {
      addListBtnRow(
        btnsHost,
        {
          id: 'b' + (btnsHost.querySelectorAll('[data-btn]').length + 1),
          label: 'Actiune',
          alg: '',
          needsRow: true,
        },
        true
      );
      syncFromDom();
    });
    card.appendChild(toolbar);

    rowHead.querySelectorAll('input,select').forEach((inp) => {
      inp.addEventListener('input', syncFromDom);
      inp.addEventListener('change', syncFromDom);
    });
    host.appendChild(card);
    syncFromDom();
  }

  function randeazaEdit(kind, obj) {
    const host = $('panel-prog-edit');
    if (!host) return;
    if (kind === 'form') randeazaEditForm(host, obj);
    else if (kind === 'ui') randeazaEditUi(host, obj);
    else if (kind === 'list') randeazaEditList(host, obj);
    else randeazaEditAlg(host, obj);
  }

  function randeazaLive(kind) {
    const rootEl = $('prog-live-root');
    if (!rootEl) return;
    if (kind === 'alg') {
      rootEl.innerHTML =
        '<p class="prog-live-stub">Live pentru alg — amânat (D8). Folosește Edit / Formular / Json.</p>';
      return;
    }
    rootEl.innerHTML = '<p class="prog-live-stub">Se încarcă Live…</p>';
    const Live = root.SsideProgLive;
    if (!Live) {
      rootEl.innerHTML = '<p class="prog-live-stub">panels-live.js lipsă.</p>';
      return;
    }
    Live.destroyAll();
    const obj = asigurObj(kind);
    let run;
    if (kind === 'ui') run = Live.renderUiLive(rootEl, obj);
    else if (kind === 'list') run = Live.renderListLive(rootEl, obj, '');
    else run = Live.renderFormLive(rootEl, obj);
    Promise.resolve(run).catch((e) => {
      rootEl.innerHTML =
        '<p class="prog-live-stub">' + (e && e.message ? e.message : String(e)) + '</p>';
    });
  }

  function randeazaFormular(kind, obj) {
    distrugeFormularEditor();
    const holder = $('prog-formular-holder');
    if (!holder || typeof JSONEditor === 'undefined') return;
    const meta =
      (root.SsideMeta && root.SsideMeta.metaPentruRol && root.SsideMeta.metaPentruRol(kind)) ||
      { type: 'object' };
    try {
      progFormularEditor = new JSONEditor(holder, {
        theme: 'html',
        schema: meta,
        startval: obj,
        no_additional_properties: false,
        disable_collapse: false,
        disable_edit_json: true,
        disable_properties: false,
        show_errors: 'interaction',
      });
      progFormularEditor.on('change', () => {
        try {
          progObj = progFormularEditor.getValue();
          scrieRaw(progObj);
        } catch (e) { /* ignore */ }
      });
    } catch (e) {
      holder.innerHTML = '<p class="prog-live-stub">JSONEditor meta: ' + (e.message || e) + '</p>';
    }
  }

  function sincronizeazaInRaw() {
    if (!progKind) return;
    // pe Json, textarea e sursa de adevăr — nu o rescriem din progObj
    if (modProg === 'json') {
      const parsed = parseObjDinRaw();
      if (parsed) progObj = parsed;
      return;
    }
    if (modProg === 'formular' && progFormularEditor) {
      try {
        progObj = progFormularEditor.getValue();
      } catch (e) { /* ignore */ }
    }
    // edit panels keep progObj via scrieRaw; ensure raw matches
    if (progObj) scrieRaw(progObj);
  }

  function seteazaMod(mod) {
    if (!progKind) return;
    if (mod === 'live' && progKind === 'alg') mod = 'edit'; // D8

    if (modProg === 'edit' || modProg === 'formular') {
      sincronizeazaInRaw();
    }
    if (modProg === 'json' || mod === 'json') {
      const parsed = parseObjDinRaw();
      if (parsed) progObj = parsed;
    }

    if (modProg === 'live' && mod !== 'live' && root.SsideProgLive) {
      root.SsideProgLive.destroyAll();
      const liveRoot = $('prog-live-root');
      if (liveRoot) liveRoot.innerHTML = '';
    }

    modProg = mod;
    $('tab-prog-edit').classList.toggle('active', mod === 'edit');
    $('tab-prog-live').classList.toggle('active', mod === 'live');
    $('tab-prog-formular').classList.toggle('active', mod === 'formular');
    $('tab-prog-json').classList.toggle('active', mod === 'json');

    $('panel-prog-edit').style.display = mod === 'edit' ? 'block' : 'none';
    $('panel-prog-live').style.display = mod === 'live' ? 'block' : 'none';
    $('panel-prog-formular').style.display = mod === 'formular' ? 'block' : 'none';
    $('panel-raw').style.display = mod === 'json' ? 'block' : 'none';
    $('panel-form').style.display = 'none';

    if (mod === 'edit') {
      asigurObj(progKind);
      randeazaEdit(progKind, progObj);
    } else if (mod === 'live') {
      randeazaLive(progKind);
    } else if (mod === 'formular') {
      asigurObj(progKind);
      randeazaFormular(progKind, progObj);
    } else if (mod === 'json') {
      distrugeFormularEditor();
      const ta = $('raw-json-editor');
      if (ta) {
        const valid = (() => {
          try {
            JSON.parse(ta.value);
            return true;
          } catch (e) {
            return false;
          }
        })();
        ta.classList.toggle('json-invalid', !valid);
        const dot = $('prog-json-status-dot');
        if (dot) dot.classList.toggle('is-visible', !valid);
      }
    }

    if (typeof dirtyHook === 'function') dirtyHook();
  }

  function ascunde() {
    const tabs = $('prog-mode-tabs');
    if (tabs) tabs.style.display = 'none';
    ['panel-prog-edit', 'panel-prog-live', 'panel-prog-formular'].forEach((id) => {
      const el = $(id);
      if (el) el.style.display = 'none';
    });
    distrugeFormularEditor();
    if (root.SsideProgLive) root.SsideProgLive.destroyAll();
    const liveRoot = $('prog-live-root');
    if (liveRoot) liveRoot.innerHTML = '';
    progKind = null;
    progObj = null;
    modProg = 'edit';
  }

  function activeaza(info, rawText, hooks) {
    hooks = hooks || {};
    dirtyHook = hooks.onDirty || null;
    progKind = info.tip;
    try {
      progObj = JSON.parse(rawText || '{}');
    } catch (e) {
      progObj = seedImplicit(progKind);
    }
    if (!progObj || typeof progObj !== 'object' || Array.isArray(progObj)) {
      progObj = seedImplicit(progKind);
    }
    asigurObj(progKind);
    scrieRaw(progObj);

    $('detail-mode-tabs').style.display = 'none';
    $('prog-mode-tabs').style.display = 'flex';
    $('panel-form').style.display = 'none';
    $('panel-set').style.display = 'none';
    $('panel-unsupported').style.display = 'none';
    $('btn-salveaza').style.display = 'inline-block';

    // Live ascuns pe alg (D8)
    const liveBtn = $('tab-prog-live');
    if (liveBtn) liveBtn.style.display = progKind === 'alg' ? 'none' : 'inline-block';

    const prefer = hooks.preferMod || 'edit';
    seteazaMod(prefer === 'live' || prefer === 'formular' || prefer === 'json' ? prefer : 'edit');
  }

  function getMod() {
    return modProg;
  }

  function getKind() {
    return progKind;
  }

  root.SsideProgPanels = {
    esteProgTip,
    activeaza,
    ascunde,
    seteazaMod,
    sincronizeazaInRaw,
    getMod,
    getKind,
    setDeps,
    ALG_OPS,
    normalizeUiTabBlocks,
  };

  root.seteazaModProg = function (mod) {
    root.SsideProgPanels.seteazaMod(mod);
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      esteProgTip,
      ALG_OPS,
      ALG_BLOCK_OPS,
      defaultStep,
      stepEditMode,
      isBlockOp,
      countNestedOps,
      previewWhen,
      previewBlock,
      previewStep,
      previewVal,
      insertStepAt,
      appendStep,
      moveStep,
      replaceStepsContents,
      parseMaybeLiteral,
      normalizeUiTabBlocks,
    };
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
