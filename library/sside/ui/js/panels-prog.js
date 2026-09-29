/**
 * Panouri Edit / Live / Formular / Json pentru chei alg | form | ui | list (F2 + F4l).
 * Depinde de: SsideKeys, SsideMeta, JSONEditor (Formular), raw-json-editor în DOM.
 */
(function (root) {
  'use strict';

  const ALG_OPS = [
    'assign', 'cat', 'if', 'foreach', 'end',
    'kget', 'ksave', 'kdel', 'kadd', 'krm',
    'scheck', 'sgen',
    'jset', 'jget',
    'search',
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
          '<div class="prog-field"><label>id</label><input data-b="id" placeholder="ex: stockMain"></div>' +
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

  // ---------- Alg edit (F2-alg-A: câmpuri flat; if/foreach = raw JSON) ----------
  const ALG_RAW_OPS = new Set(['if', 'foreach']);
  const AS_OPTS = [
    { value: 'auto', label: 'auto' },
    { value: 'json', label: 'json' },
    { value: 'string', label: 'string' },
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
    if (op === 'if') return { op: 'if', when: ['eq', '', ''], then: [], else: [] };
    if (op === 'foreach') return { op: 'foreach', in: '', as: 'it', do: [] };
    if (op === 'end') return { op: 'end', msg: '' };
    if (op === 'kget') return { op: 'kget', key: '', to: '', as: 'auto' };
    if (op === 'ksave') return { op: 'ksave', key: '', val: 'form', as: 'auto' };
    if (op === 'kdel') return { op: 'kdel', key: '' };
    if (op === 'kadd' || op === 'krm') return { op: op, key: '', val: '' };
    if (op === 'scheck') return { op: 'scheck', schema: '', val: 'form' };
    if (op === 'sgen') return { op: 'sgen', schema: '', to: 'draft' };
    if (op === 'jset') return { op: 'jset', to: 'payload', path: '', from: 'form.' };
    if (op === 'jget') return { op: 'jget', from: 'payload', path: '', to: '' };
    if (op === 'search') return { op: 'search', query: '', to: 'hits' };
    if (op === 'ui') return { op: 'ui', do: 'refresh', listid: '' };
    if (op === 'tstart' || op === 'tdo' || op === 'tstop') return { op: op };
    if (op === 'redis') return { op: 'redis', do: 'TYPE', args: [''], to: '' };
    return { op: op };
  }

  /** 'raw' = textarea JSON; 'flat' = câmpuri per op (faza A). */
  function stepEditMode(step) {
    if (!step || typeof step !== 'object' || !step.op) return 'raw';
    if (ALG_RAW_OPS.has(step.op)) return 'raw';
    if (step.op === 'search' && step.query != null && typeof step.query === 'object') {
      return 'raw';
    }
    if (step.op === 'ui' && Array.isArray(step.listid)) return 'raw';
    return 'flat';
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

    if (op === 'assign') {
      row.appendChild(mkField('to', wire(mkInput('to', step.to))));
      const srcMode = Object.prototype.hasOwnProperty.call(step, 'val') ? 'val' : 'from';
      const srcSel = wire(mkSelect('_src', srcMode, [
        { value: 'from', label: 'from (ref)' },
        { value: 'val', label: 'val (literal)' },
      ]));
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

    if (op === 'end') {
      const mode = step.err != null && step.err !== '' ? 'err' : 'msg';
      const modeSel = wire(mkSelect('_end', mode, [
        { value: 'msg', label: 'msg (ok)' },
        { value: 'err', label: 'err (fail)' },
      ]));
      row.appendChild(mkField('tip', modeSel));
      const text = mode === 'err' ? step.err : step.msg;
      const textInp = wire(mkInput('text', text != null ? text : ''));
      row.appendChild(mkField('text', textInp));
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
      row.appendChild(mkField('val', wire(mkInput('val', step.val != null ? step.val : 'form'))));
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
      const f = mkField('schema', sel);
      row.appendChild(f);
      mountSelectWithOpen(sel, {
        getKey: () => sel.value,
        title: 'Deschide schema',
      });
      row.appendChild(mkField('val', wire(mkInput('val', step.val != null ? step.val : 'form'))));
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
      row.appendChild(mkField('to', wire(mkInput('to', step.to != null ? step.to : 'draft'))));
      return;
    }

    if (op === 'jset') {
      row.appendChild(mkField('to', wire(mkInput('to', step.to != null ? step.to : 'payload'))));
      row.appendChild(mkField('path', wire(mkInput('path', step.path != null ? step.path : ''))));
      const srcMode = Object.prototype.hasOwnProperty.call(step, 'val') ? 'val' : 'from';
      const srcSel = wire(mkSelect('_src', srcMode, [
        { value: 'from', label: 'from (ref)' },
        { value: 'val', label: 'val (literal)' },
      ]));
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
      row.appendChild(mkField('path', wire(mkInput('path', step.path != null ? step.path : ''))));
      row.appendChild(mkField('to', wire(mkInput('to', step.to))));
      return;
    }

    if (op === 'search') {
      row.appendChild(mkField('query', wire(mkInput('query', step.query != null ? step.query : ''))));
      row.appendChild(mkField('to', wire(mkInput('to', step.to != null ? step.to : 'hits'))));
      row.appendChild(
        mkField(
          'limit',
          wire(mkInput('limit', step.limit != null ? step.limit : ''))
        )
      );
      row.appendChild(
        mkField(
          'offset',
          wire(mkInput('offset', step.offset != null ? step.offset : ''))
        )
      );
      row.appendChild(
        mkField(
          'index',
          wire(mkInput('index', step.index != null ? step.index : ''))
        )
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

    // fallback
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

  function readFlatStep(el) {
    const opSel = el.querySelector('[data-s="op"]');
    const op = opSel ? opSel.value : 'assign';
    const step = { op: op };

    if (op === 'assign') {
      step.to = sf(el, 'to');
      if (sf(el, '_src') === 'val') step.val = parseMaybeLiteral(sf(el, 'val'));
      else step.from = sf(el, 'from');
      return step;
    }
    if (op === 'cat') {
      step.to = sf(el, 'to');
      const partsHost = el.querySelector('[data-sf="parts"]');
      step.parts = partsHost && partsHost._readParts ? partsHost._readParts() : [''];
      return step;
    }
    if (op === 'end') {
      const text = sf(el, 'text');
      if (sf(el, '_end') === 'err') step.err = text;
      else step.msg = text;
      return step;
    }
    if (op === 'kget') {
      step.key = sf(el, 'key');
      step.to = sf(el, 'to');
      step.as = sf(el, 'as') || 'auto';
      return step;
    }
    if (op === 'ksave') {
      step.key = sf(el, 'key');
      step.val = sf(el, 'val');
      step.as = sf(el, 'as') || 'auto';
      return step;
    }
    if (op === 'kdel') {
      step.key = sf(el, 'key');
      return step;
    }
    if (op === 'kadd' || op === 'krm') {
      step.key = sf(el, 'key');
      step.val = sf(el, 'val');
      return step;
    }
    if (op === 'scheck') {
      step.schema = sf(el, 'schema');
      step.val = sf(el, 'val') || 'form';
      return step;
    }
    if (op === 'sgen') {
      step.schema = sf(el, 'schema');
      step.to = sf(el, 'to') || 'draft';
      return step;
    }
    if (op === 'jset') {
      step.to = sf(el, 'to');
      step.path = sf(el, 'path');
      if (sf(el, '_src') === 'val') step.val = parseMaybeLiteral(sf(el, 'val'));
      else step.from = sf(el, 'from');
      return step;
    }
    if (op === 'jget') {
      step.from = sf(el, 'from');
      step.path = sf(el, 'path');
      step.to = sf(el, 'to');
      return step;
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
      return step;
    }
    if (op === 'ui') {
      step.do = sf(el, 'do') || 'refresh';
      step.listid = sf(el, 'listid');
      return step;
    }
    if (op === 'tstart' || op === 'tdo' || op === 'tstop') {
      return step;
    }
    if (op === 'redis') {
      step.do = sf(el, 'do') || 'TYPE';
      const argsHost = el.querySelector('[data-sf="args"]') || el.querySelector('[data-sf="parts"]');
      step.args = argsHost && argsHost._readParts ? argsHost._readParts() : [];
      const to = sf(el, 'to').trim();
      if (to) step.to = to;
      return step;
    }
    return step;
  }

  function readStepFromEl(el) {
    const ta = el.querySelector('textarea[data-s="json"]');
    if (ta) {
      const step = JSON.parse(ta.value);
      if (!step || typeof step !== 'object') throw new Error('step invalid');
      return step;
    }
    return readFlatStep(el);
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

    const stepsHost = document.createElement('div');
    stepsHost.className = 'prog-steps';
    card.appendChild(stepsHost);

    function renumber() {
      Array.from(stepsHost.children).forEach((ch, i) => {
        const sp = ch.querySelector('.prog-step-head [data-s="idx"]');
        if (sp) sp.textContent = '#' + (i + 1);
      });
    }

    function syncFromDom() {
      obj.name = row1.querySelector('[data-f="name"]').value;
      const v = parseInt(row1.querySelector('[data-f="v"]').value, 10);
      obj.v = Number.isFinite(v) ? v : 1;
      const next = [];
      stepsHost.querySelectorAll('.prog-step').forEach((el) => {
        const ta = el.querySelector('textarea[data-s="json"]');
        try {
          const step = readStepFromEl(el);
          if (ta) ta.classList.remove('json-invalid');
          next.push(step);
        } catch (e) {
          if (ta) ta.classList.add('json-invalid');
        }
      });
      obj.steps = next;
      scrieRaw(obj);
    }

    function fillBody(el, step) {
      const body = el.querySelector('.prog-step-body');
      if (!body) return;
      body.innerHTML = '';
      if (stepEditMode(step) === 'raw') {
        const hint = document.createElement('div');
        hint.className = 'prog-step-hint';
        hint.textContent =
          step.op === 'if' || step.op === 'foreach'
            ? 'Nested steps — JSON (faza B: editor nested). when/then/else/do.'
            : 'Formă complexă — editează JSON (sau tab Json).';
        body.appendChild(hint);
        const ta = document.createElement('textarea');
        ta.setAttribute('data-s', 'json');
        ta.value = JSON.stringify(step, null, 2);
        ta.addEventListener('input', () => {
          ta.classList.remove('json-invalid');
          try {
            JSON.parse(ta.value);
            syncFromDom();
          } catch (e) {
            ta.classList.add('json-invalid');
          }
        });
        body.appendChild(ta);
      } else {
        renderFlatFields(body, step, syncFromDom);
      }
    }

    function addStepRow(step, index) {
      step = step && typeof step === 'object' ? step : defaultStep('assign');
      const el = document.createElement('div');
      el.className = 'prog-step';

      const head = document.createElement('div');
      head.className = 'prog-step-head';
      const idx = document.createElement('span');
      idx.setAttribute('data-s', 'idx');
      idx.textContent = '#' + (index + 1);
      head.appendChild(idx);

      const opSel = document.createElement('select');
      opSel.setAttribute('data-s', 'op');
      opSel.className = 'prog-step-op';
      ALG_OPS.forEach((op) => {
        const o = document.createElement('option');
        o.value = op;
        o.textContent = ALG_RAW_OPS.has(op) ? op + ' (json)' : op;
        opSel.appendChild(o);
      });
      opSel.value = step.op && ALG_OPS.indexOf(step.op) !== -1 ? step.op : 'assign';
      opSel.addEventListener('change', () => {
        const next = defaultStep(opSel.value);
        fillBody(el, next);
        syncFromDom();
      });
      head.appendChild(opSel);

      const rm = document.createElement('button');
      rm.type = 'button';
      rm.className = 'btn-gri btn-inline btn-inline-danger';
      rm.textContent = 'Șterge';
      rm.onclick = () => {
        el.remove();
        renumber();
        syncFromDom();
      };
      head.appendChild(rm);
      el.appendChild(head);

      const body = document.createElement('div');
      body.className = 'prog-step-body';
      el.appendChild(body);
      fillBody(el, step);

      stepsHost.appendChild(el);
    }

    obj.steps.forEach((s, i) => addStepRow(s, i));

    const toolbar = document.createElement('div');
    toolbar.className = 'prog-toolbar';
    const sel = document.createElement('select');
    ALG_OPS.forEach((op) => {
      const o = document.createElement('option');
      o.value = op;
      o.textContent = ALG_RAW_OPS.has(op) ? op + ' (json)' : op;
      sel.appendChild(o);
    });
    const add = document.createElement('button');
    add.type = 'button';
    add.className = 'btn-albastru btn-inline';
    add.textContent = '+ Step';
    add.onclick = () => {
      const step = defaultStep(sel.value);
      obj.steps.push(step);
      addStepRow(step, obj.steps.length - 1);
      scrieRaw(obj);
    };
    toolbar.appendChild(sel);
    toolbar.appendChild(add);
    card.appendChild(toolbar);

    row1.querySelectorAll('input').forEach((inp) => inp.addEventListener('input', syncFromDom));
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
      '<div class="prog-field"><label>pageSize</label><input type="number" min="1" step="1" data-f="pageSize"></div>';
    card.appendChild(rowHead);
    rowHead.querySelector('[data-f="title"]').value = obj.title || '';
    rowHead.querySelector('[data-f="row"]').value = obj.row === 'array' ? 'array' : 'object';
    rowHead.querySelector('[data-f="pageSize"]').value = obj.pageSize;

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

      function readBtns(host) {
        const out = [];
        host.querySelectorAll('.prog-step[data-btn]').forEach((el) => {
          const kind = normalizeBtnKind(el.querySelector('[data-b="kind"]').value);
          const btn = {
            id: el.querySelector('[data-b="id"]').value.trim(),
            label: el.querySelector('[data-b="label"]').value.trim(),
            alg: el.querySelector('[data-b="alg"]').value.trim(),
          };
          if (kind) btn.kind = kind;
          out.push(btn);
        });
        return out;
      }
      obj.rowBtns = readBtns(rowBtnsHost);
      obj.btns = readBtns(btnsHost);
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

    function addListBtnRow(host, btn) {
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
    (obj.rowBtns || []).forEach((b) => addListBtnRow(rowBtnsHost, b));
    (obj.btns || []).forEach((b) => addListBtnRow(btnsHost, b));

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
      addListBtnRow(rowBtnsHost, {
        id: 'rb' + (rowBtnsHost.querySelectorAll('[data-btn]').length + 1),
        label: 'Actiune',
        alg: '',
      });
      syncFromDom();
    });
    toolBtn('+ btn', 'btn-albastru', () => {
      addListBtnRow(btnsHost, {
        id: 'b' + (btnsHost.querySelectorAll('[data-btn]').length + 1),
        label: 'Actiune',
        alg: '',
      });
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
      ALG_RAW_OPS,
      defaultStep,
      stepEditMode,
      parseMaybeLiteral,
      normalizeUiTabBlocks,
    };
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
