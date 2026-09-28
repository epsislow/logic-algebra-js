/**
 * Panouri Edit / Live / Formular / Json pentru chei alg | form | ui (F2).
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
    'tstart', 'tdo', 'tstop',
    'redis',
  ];

  let modProg = 'edit';
  let progKind = null; // alg | form | ui
  let progObj = null;
  let progFormularEditor = null;
  let dirtyHook = null;
  let deps = {
    listKeys: null, // (kind: 'schema'|'alg'|'form'|'ui') => string[]
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
    return tip === 'alg' || tip === 'form' || tip === 'ui';
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
    fillKeySelect(row1.querySelector('[data-f="schema"]'), 'schema', obj.schema || '');

    const btnsHost = document.createElement('div');
    btnsHost.className = 'prog-steps';
    card.appendChild(btnsHost);

    function syncFromDom() {
      obj.title = row1.querySelector('[data-f="title"]').value;
      obj.schema = row1.querySelector('[data-f="schema"]').value;
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
      fillKeySelect(el.querySelector('[data-b="alg"]'), 'alg', btn.alg || '');
      fillBtnKindSelect(el.querySelector('[data-b="kind"]'), btn.kind || '');
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

  // ---------- UI edit ----------
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
      tabsHost.querySelectorAll('.prog-step').forEach((el) => {
        const forms = Array.from(el.querySelectorAll('.prog-forms-picks select'))
          .map((s) => s.value.trim())
          .filter(Boolean);
        obj.tabs.push({
          id: el.querySelector('[data-t="id"]').value.trim(),
          label: el.querySelector('[data-t="label"]').value.trim(),
          forms,
        });
      });
      scrieRaw(obj);
    }

    function mountFormsPicks(el, initialForms) {
      const wrap = document.createElement('div');
      wrap.className = 'prog-forms-picks';
      const label = document.createElement('label');
      label.textContent = 'forms';
      label.style.display = 'block';
      label.style.marginBottom = '4px';
      wrap.appendChild(label);
      const stack = document.createElement('div');
      stack.className = 'prog-forms-stack-edit';
      wrap.appendChild(stack);
      el.appendChild(wrap);

      function readForms() {
        return Array.from(stack.querySelectorAll('select'))
          .map((s) => s.value.trim())
          .filter(Boolean);
      }

      function rebuild(forms) {
        stack.innerHTML = '';
        const list = Array.isArray(forms) ? forms.filter(Boolean) : [];
        list.forEach((f) => addOne(f));
        addOne(''); // mereu un select gol la final
      }

      function addOne(value) {
        const row = document.createElement('div');
        row.className = 'prog-field';
        const n = stack.children.length + 1;
        const lab = document.createElement('label');
        lab.textContent = 'form ' + n;
        row.appendChild(lab);
        const sel = document.createElement('select');
        fillKeySelect(sel, 'form', value || '');
        sel.onchange = () => {
          rebuild(readForms());
          syncFromDom();
        };
        row.appendChild(sel);
        stack.appendChild(row);
      }

      rebuild(initialForms || []);
    }

    function addTabRow(tab) {
      tab = tab || { id: '', label: '', forms: [] };
      const el = document.createElement('div');
      el.className = 'prog-step';
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
      mountFormsPicks(el, tab.forms || []);
      el.querySelectorAll('input').forEach((inp) => inp.addEventListener('input', syncFromDom));
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
      addTabRow({ id: 't' + (obj.tabs.length + 1), label: 'Tab', forms: [] });
      syncFromDom();
    };
    toolbar.appendChild(add);
    card.appendChild(toolbar);

    row1.querySelectorAll('input').forEach((inp) => inp.addEventListener('input', syncFromDom));
    host.appendChild(card);
  }

  // ---------- Alg edit ----------
  function defaultStep(op) {
    op = op || 'assign';
    if (op === 'assign') return { op: 'assign', to: '', from: '' };
    if (op === 'cat') return { op: 'cat', to: '', parts: [''] };
    if (op === 'if') return { op: 'if', when: ['eq', '', ''], then: [], else: [] };
    if (op === 'foreach') return { op: 'foreach', in: '', as: 'it', do: [] };
    if (op === 'end') return { op: 'end', msg: '' };
    if (op === 'kget') return { op: 'kget', key: '', to: '' };
    if (op === 'ksave') return { op: 'ksave', key: '', val: 'form', as: 'auto' };
    if (op === 'kdel') return { op: 'kdel', key: '' };
    if (op === 'kadd' || op === 'krm') return { op: op, key: '', val: '' };
    if (op === 'scheck') return { op: 'scheck', schema: '', val: 'form' };
    if (op === 'sgen') return { op: 'sgen', schema: '', to: 'draft' };
    if (op === 'jset') return { op: 'jset', to: 'payload', path: '', from: 'form.' };
    if (op === 'jget') return { op: 'jget', from: 'payload', path: '', to: '' };
    if (op === 'search') return { op: 'search', query: '', to: 'hits' };
    if (op === 'tstart' || op === 'tdo' || op === 'tstop') return { op: op };
    if (op === 'redis') return { op: 'redis', do: 'get', key: '' };
    return { op: op };
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

    function syncFromDom() {
      obj.name = row1.querySelector('[data-f="name"]').value;
      const v = parseInt(row1.querySelector('[data-f="v"]').value, 10);
      obj.v = Number.isFinite(v) ? v : 1;
      const next = [];
      stepsHost.querySelectorAll('.prog-step').forEach((el) => {
        try {
          const raw = el.querySelector('[data-s="json"]').value;
          const step = JSON.parse(raw);
          if (step && typeof step === 'object') next.push(step);
        } catch (e) {
          el.querySelector('[data-s="json"]').classList.add('json-invalid');
        }
      });
      obj.steps = next;
      scrieRaw(obj);
    }

    function addStepRow(step, index) {
      step = step && typeof step === 'object' ? step : defaultStep('assign');
      const el = document.createElement('div');
      el.className = 'prog-step';
      const head = document.createElement('div');
      head.className = 'prog-step-head';
      head.innerHTML = '<span>#' + (index + 1) + '</span> <code>' + (step.op || '?') + '</code>';
      const rm = document.createElement('button');
      rm.type = 'button';
      rm.className = 'btn-gri btn-inline btn-inline-danger';
      rm.textContent = 'Șterge';
      rm.onclick = () => {
        el.remove();
        // re-number heads
        Array.from(stepsHost.children).forEach((ch, i) => {
          const sp = ch.querySelector('.prog-step-head span');
          if (sp) sp.textContent = '#' + (i + 1);
        });
        syncFromDom();
      };
      head.appendChild(rm);
      el.appendChild(head);
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
      el.appendChild(ta);
      stepsHost.appendChild(el);
    }

    obj.steps.forEach((s, i) => addStepRow(s, i));

    const toolbar = document.createElement('div');
    toolbar.className = 'prog-toolbar';
    const sel = document.createElement('select');
    ALG_OPS.forEach((op) => {
      const o = document.createElement('option');
      o.value = op;
      o.textContent = op;
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

  function randeazaEdit(kind, obj) {
    const host = $('panel-prog-edit');
    if (!host) return;
    if (kind === 'form') randeazaEditForm(host, obj);
    else if (kind === 'ui') randeazaEditUi(host, obj);
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
    const run = kind === 'ui' ? Live.renderUiLive(rootEl, obj) : Live.renderFormLive(rootEl, obj);
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

    seteazaMod('edit');
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
  };

  root.seteazaModProg = function (mod) {
    root.SsideProgPanels.seteazaMod(mod);
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      esteProgTip,
      ALG_OPS,
      defaultStep,
    };
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
