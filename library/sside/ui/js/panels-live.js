/**
 * Live rendering pentru form: / list: / ui: (F3 + F4k + F4l).
 */
(function (root) {
  'use strict';

  const FormOpts =
    root.SsideFormOptions ||
    (typeof require !== 'undefined' ? require('../core/form-options.js') : null);
  const ListLoad =
    root.SsideListLoad ||
    (typeof require !== 'undefined' ? require('../core/list-load.js') : null);

  let deps = {
    loadJsonKey: null,
    normalizeSchema: null,
    defaultFromSchema: null,
    onRunAlg: null,
    redis: null,
  };

  /** @type {Array<{ destroy: Function }>} */
  let liveInstances = [];
  /** @type {Map<string, { refresh: Function, clear: Function }>} */
  const listById = new Map();
  /** Ordinea listelor pe tabul / view-ul activ (pt. _1, _2, …). */
  let activeListOrder = [];
  /** @type {{ switchTo: (ref: string) => Promise<void> } | null} */
  let runtimeUiTabApi = null;

  function setDeps(partial) {
    deps = Object.assign({}, deps, partial || {});
  }

  function resetActiveListOrder() {
    activeListOrder = [];
  }

  function registerActiveList(listid) {
    const id = String(listid || '').trim();
    if (id && activeListOrder.indexOf(id) === -1) activeListOrder.push(id);
  }

  function makeUiContext(selfListId) {
    return {
      listIds: activeListOrder.slice(),
      selfListId: selfListId != null && selfListId !== '' ? String(selfListId) : null,
    };
  }

  function listPageSize(listDef, pageData) {
    if (ListLoad && typeof ListLoad.resolveListPageSize === 'function') {
      const raw =
        pageData && pageData.pageSize != null
          ? pageData.pageSize
          : listDef && listDef.pageSize != null
            ? listDef.pageSize
            : null;
      return ListLoad.resolveListPageSize(raw);
    }
    const n = Number(listDef && listDef.pageSize);
    return Number.isFinite(n) && n >= 1 ? n : 10;
  }

  /** Evită salt scroll când bannerul / tabelul își schimbă înălțimea la click pe buton. */
  function preserveViewportScroll(run) {
    const y = window.scrollY;
    const done = () => {
      requestAnimationFrame(() => {
        window.scrollTo(0, y);
      });
    };
    try {
      const out = run();
      if (out && typeof out.then === 'function') {
        return out.then(
          (v) => {
            done();
            return v;
          },
          (e) => {
            done();
            throw e;
          }
        );
      }
      done();
      return out;
    } catch (e) {
      done();
      throw e;
    }
  }

  function showBanner(el, result) {
    if (!el) return;
    el.style.display = '';
    el.classList.remove('is-ok', 'is-err', 'is-empty');
    if (result && result.err) {
      el.textContent = String(result.err);
      el.classList.add('is-err');
    } else if (result && result.msg) {
      el.textContent = String(result.msg);
      el.classList.add('is-ok');
    } else {
      el.textContent = '';
      el.classList.add('is-empty');
    }
  }

  function clearBanner(el) {
    if (!el) return;
    showBanner(el, null);
    el.style.display = 'none';
  }

  function destroyAll() {
    liveInstances.forEach((inst) => {
      try {
        if (inst && typeof inst.destroy === 'function') inst.destroy();
      } catch (e) { /* ignore */ }
    });
    liveInstances = [];
    listById.clear();
    resetActiveListOrder();
    runtimeUiTabApi = null;
  }

  async function applyUiCommands(ui) {
    if (!ui || typeof ui !== 'object') return;
    const opens = [].concat(ui.open || []);
    for (let i = 0; i < opens.length; i++) {
      const k = String(opens[i] || '').trim();
      if (!k) continue;
      if (deps.onUiRuntimeOpen && typeof deps.onUiRuntimeOpen === 'function') {
        await deps.onUiRuntimeOpen(k);
      }
    }
    const tabs = [].concat(ui.tab || []);
    for (let i = 0; i < tabs.length; i++) {
      const ref = String(tabs[i] || '').trim();
      if (!ref) continue;
      if (!runtimeUiTabApi || typeof runtimeUiTabApi.switchTo !== 'function') {
        throw new Error('ui tab: niciun UI Live cu taburi montat');
      }
      await runtimeUiTabApi.switchTo(ref);
    }
    const clears = [].concat(ui.clear || []);
    const refreshes = [].concat(ui.refresh || []);
    clears.forEach((id) => {
      const inst = listById.get(String(id));
      if (inst && inst.clear) inst.clear();
    });
    refreshes.forEach((id) => {
      const inst = listById.get(String(id));
      if (inst && inst.refresh) inst.refresh();
    });
  }

  function createEditor(holder, schema, startval) {
    if (typeof JSONEditor === 'undefined') {
      throw new Error('JSONEditor lipsă');
    }
    const SchemaOrder =
      root.SsideSchemaOrder ||
      (typeof require !== 'undefined' ? require('../core/schema-order.js') : null);
    const Meta =
      root.SsideSchemaMeta ||
      (typeof require !== 'undefined' ? require('../core/schema-meta.js') : null);
    let schemaForEditor = schema;
    if (Meta && typeof Meta.prepareSchemaForJsonEditor === 'function') {
      schemaForEditor = JSON.parse(JSON.stringify(schema));
      Meta.prepareSchemaForJsonEditor(schemaForEditor);
    }
    const schemaOrdered =
      SchemaOrder && SchemaOrder.withPropertyOrder
        ? SchemaOrder.withPropertyOrder(schemaForEditor)
        : schemaForEditor;
    const editor = new JSONEditor(holder, {
      theme: 'html',
      schema: schemaOrdered || { type: 'object' },
      startval: startval,
      no_additional_properties: false,
      disable_collapse: true,
      disable_edit_json: true,
      disable_properties: true,
      disable_array_reorder: true,
      show_errors: 'interaction',
    });
    const Grid = root.SsideSchemaFormGrid;
    if (Grid && typeof Grid.bindEditorReady === 'function') {
      Grid.bindEditorReady(editor, holder);
    }
    return editor;
  }

  function normalizeTabBlocks(tab) {
    if (Array.isArray(tab.blocks) && tab.blocks.length) return tab.blocks;
    if (Array.isArray(tab.forms)) {
      return tab.forms.map((f, i) => ({
        type: 'form',
        id: 'form' + (i + 1),
        form: f,
      }));
    }
    return [];
  }

  function btnClass(btn) {
    if (btn.kind === 'danger') return 'btn-kind-red';
    if (btn.kind) return 'btn-kind-' + String(btn.kind).toLowerCase();
    return 'btn-albastru';
  }

  function splitListBtns(listDef) {
    const row = [];
    const below = [];
    (listDef.rowBtns || []).forEach((b) => row.push(Object.assign({}, b, { place: 'row' })));
    (listDef.btns || []).forEach((b) => {
      const place = b.place === 'row' ? 'row' : 'below';
      if (place === 'row') row.push(b);
      else below.push(b);
    });
    return { row, below };
  }

  async function runAlgForActionsBtn(opts) {
    const { algKey, formValue, btn, bannerEl } = opts;
    if (typeof deps.onRunAlg !== 'function' || !algKey) {
      showBanner(bannerEl, { err: algKey ? 'Runner lipsă' : 'Buton fără alg' });
      return;
    }
    return preserveViewportScroll(async () => {
      try {
        const result = await deps.onRunAlg({
          algKey,
          form: formValue || {},
          list: {},
          btn,
          uiContext: makeUiContext(null),
        });
        showBanner(bannerEl, result || { msg: 'OK' });
        if (result && result.ui) await applyUiCommands(result.ui);
      } catch (e) {
        showBanner(bannerEl, { err: e.message || String(e) });
      }
    });
  }

  function actionsAlignClass(align) {
    const a = String(align || 'center').toLowerCase();
    if (a === 'left') return 'is-align-left';
    if (a === 'right') return 'is-align-right';
    return 'is-align-center';
  }

  function formPayloadFromActionsBtn(btn) {
    if (btn && btn.form != null && typeof btn.form === 'object' && !Array.isArray(btn.form)) {
      return JSON.parse(JSON.stringify(btn.form));
    }
    return {};
  }

  /**
   * Block UI actions (butoane + alg, fără listă). Cod duplicat din list below-btns.
   */
  async function mountActionsBlock(parent, blockDef, opts) {
    opts = opts || {};
    const blockId = String(opts.id || (blockDef && blockDef.id) || 'actions1');
    const align = (blockDef && blockDef.align) || 'center';
    const btns = Array.isArray(blockDef && blockDef.btns) ? blockDef.btns : [];

    const block = document.createElement('div');
    block.className = 'prog-live-block prog-live-ui-actions';
    block.setAttribute('data-blockid', blockId);
    block.innerHTML =
      '<div class="prog-live-banner is-empty"></div>' +
      '<div class="prog-ui-actions-btns prog-live-actions"></div>';
    parent.appendChild(block);

    const bannerEl = block.querySelector('.prog-live-banner');
    const actionsEl = block.querySelector('.prog-ui-actions-btns');
    actionsEl.classList.add(actionsAlignClass(align));

    btns.forEach((btn) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = btnClass(btn);
      b.textContent = btn.label || btn.id || 'Actiune';
      b.onclick = () => {
        runAlgForActionsBtn({
          algKey: btn.alg,
          formValue: formPayloadFromActionsBtn(btn),
          btn,
          bannerEl,
        });
      };
      actionsEl.appendChild(b);
    });

    const inst = {
      destroy() {
        block.remove();
      },
    };
    liveInstances.push(inst);
    return inst;
  }

  async function runAlgForList(opts) {
    const { algKey, formValue, btn, listDef, listid, rowKey, bannerEl, listContext } = opts;
    if (typeof deps.onRunAlg !== 'function' || !algKey) {
      showBanner(bannerEl, { err: algKey ? 'Runner lipsă' : 'Buton fără alg' });
      return;
    }
    return preserveViewportScroll(async () => {
      try {
        const result = await deps.onRunAlg({
          algKey,
          form: formValue || {},
          list: listContext || {},
          btn,
          formDef: listDef,
          listid,
          listDefKey: listDef && listDef._key,
          rowKey,
          uiContext: makeUiContext(listid),
        });
        showBanner(bannerEl, result || { msg: 'OK' });
        if (result && result.ui) await applyUiCommands(result.ui);
      } catch (e) {
        showBanner(bannerEl, { err: e.message || String(e) });
      }
    });
  }

  /**
   * @returns {{ destroy, refresh, clear }}
   */
  async function mountListBlock(parent, listDef, opts) {
    opts = opts || {};
    const listid = String(opts.listid || opts.id || 'list1');
    const listKey = opts.listKey || listDef._key || '';
    if (listDef) listDef._key = listKey;
    registerActiveList(listid);

    const title = (listDef && listDef.title) || listKey || listid;
    const block = document.createElement('div');
    block.className = 'prog-live-block prog-live-list';
    block.setAttribute('data-listid', listid);
    block.innerHTML =
      '<h3></h3>' +
      '<div class="prog-live-banner is-empty"></div>' +
      '<div class="prog-list-table-wrap"><table class="prog-list-table"><thead></thead><tbody></tbody></table></div>' +
      '<div class="prog-list-footer">' +
      '<div class="prog-list-pager"></div>' +
      '<div class="prog-live-actions prog-list-below-btns"></div>' +
      '</div>';
    block.querySelector('h3').textContent = title;
    parent.appendChild(block);

    const bannerEl = block.querySelector('.prog-live-banner');
    const thead = block.querySelector('thead');
    const tbody = block.querySelector('tbody');
    const pagerEl = block.querySelector('.prog-list-pager');
    const belowEl = block.querySelector('.prog-list-below-btns');

    const columns = Array.isArray(listDef && listDef.columns) ? listDef.columns : [];
    const { row: rowBtns, below: belowBtns } = splitListBtns(listDef || {});

    let page = 1;
    let selectedKey = null;
    let lastPageData = null;
    let dataEverLoaded = false;
    let destroyed = false;

    function listColumnCount() {
      return columns.length + (rowBtns.length ? 1 : 0);
    }

    function renderHead() {
      thead.innerHTML = '';
      const tr = document.createElement('tr');
      columns.forEach((c) => {
        const th = document.createElement('th');
        th.textContent = c.label || c.id || c.path || '';
        tr.appendChild(th);
      });
      if (rowBtns.length) {
        const th = document.createElement('th');
        th.textContent = '';
        tr.appendChild(th);
      }
      thead.appendChild(tr);
    }

    function formFromRow(row) {
      if (ListLoad && typeof ListLoad.formFromRow === 'function') {
        return ListLoad.formFromRow(row);
      }
      const v = row && row.value;
      const key = row && row.key != null ? String(row.key) : '';
      if (v && typeof v === 'object' && !Array.isArray(v)) {
        const form = JSON.parse(JSON.stringify(v));
        if (key && !Object.prototype.hasOwnProperty.call(form, '_key')) form._key = key;
        return form;
      }
      return { value: v, _key: key };
    }

    function currentListContext() {
      if (ListLoad && typeof ListLoad.buildListContext === 'function') {
        return ListLoad.buildListContext({
          pageData: lastPageData || { page: page, pageSize: listPageSize(listDef), rows: [] },
          listid: listid,
          listDefKey: listKey || (listDef && listDef._key) || '',
        });
      }
      return {
        page: page,
        pageMax: 1,
        pageSize: listPageSize(listDef),
        keys: [],
        rows: [],
        id: listid,
        def: '',
      };
    }

    function runListBtn(btn, row) {
      runAlgForList({
        algKey: btn.alg,
        formValue: row ? formFromRow(row) : {},
        btn,
        listDef,
        listid,
        rowKey: row ? row.key : null,
        bannerEl,
        listContext: currentListContext(),
      });
    }

    async function reload() {
      if (destroyed) return;
      if (!ListLoad || !deps.redis) {
        renderBody({ statusText: 'list-load / redis lipsă' });
        return;
      }
      block.classList.add('prog-list-is-loading');
      try {
        lastPageData = await ListLoad.loadListPage(listDef, deps.redis, page);
        page = lastPageData.page;
        dataEverLoaded = true;
        renderBody();
        renderPager();
      } catch (e) {
        dataEverLoaded = true;
        renderBody({
          statusText: e && e.message ? e.message : String(e),
        });
      } finally {
        block.classList.remove('prog-list-is-loading');
      }
    }

    function appendStatusRow(text) {
      const tr = document.createElement('tr');
      tr.className = 'prog-list-row-status';
      const td = document.createElement('td');
      td.colSpan = listColumnCount();
      td.textContent = text;
      tr.appendChild(td);
      tbody.appendChild(tr);
    }

    function appendPadRow() {
      const tr = document.createElement('tr');
      tr.className = 'prog-list-row-pad';
      tr.setAttribute('aria-hidden', 'true');
      for (let c = 0; c < columns.length; c++) {
        const td = document.createElement('td');
        td.className = 'prog-list-pad-cell';
        td.innerHTML = '\u00a0';
        tr.appendChild(td);
      }
      if (rowBtns.length) {
        const td = document.createElement('td');
        td.className = 'prog-list-row-btns';
        rowBtns.forEach((btn) => {
          const b = document.createElement('button');
          b.type = 'button';
          b.className = btnClass(btn) + ' btn-inline prog-list-pad-btn';
          b.disabled = true;
          b.tabIndex = -1;
          b.setAttribute('aria-hidden', 'true');
          b.textContent = btn.label || btn.id || '\u00a0';
          td.appendChild(b);
        });
        tr.appendChild(td);
      }
      tbody.appendChild(tr);
    }

    function appendDataRow(row, rowMode) {
      const tr = document.createElement('tr');
      if (row.key === selectedKey) tr.classList.add('is-selected');
      tr.onclick = (ev) => {
        if (ev.target && ev.target.closest && ev.target.closest('button')) return;
        selectedKey = row.key;
        Array.from(tbody.querySelectorAll('tr')).forEach((r) =>
          r.classList.remove('is-selected')
        );
        tr.classList.add('is-selected');
      };
      columns.forEach((c) => {
        const td = document.createElement('td');
        const meta = { key: row.key, type: row.type };
        let val;
        if (ListLoad && typeof ListLoad.cellValue === 'function') {
          val = ListLoad.cellValue(row.value, c, rowMode, meta);
        } else if (c && Object.prototype.hasOwnProperty.call(c, 'const')) {
          val = c.const;
        } else if (c && String(c.path || '').trim() === '_key') {
          val = row.key;
        } else if (c && String(c.path || '').trim() === '_type') {
          val = row.type;
        }
        let disp;
        if (ListLoad && typeof ListLoad.formatListCellDisplay === 'function') {
          disp = ListLoad.formatListCellDisplay(val);
        } else if (val === undefined) {
          disp = { kind: 'missing', text: 'nimic' };
        } else if (val === null) {
          disp = { kind: 'null', text: '(nul)' };
        } else {
          disp = { kind: 'value', text: String(val) };
        }
        if (disp.kind === 'missing') {
          td.className = 'prog-cell-missing';
          td.textContent = disp.text;
        } else if (disp.kind === 'null') {
          td.className = 'prog-cell-null';
          td.textContent = disp.text;
        } else {
          td.textContent = disp.text;
        }
        tr.appendChild(td);
      });
      if (rowBtns.length) {
        const td = document.createElement('td');
        td.className = 'prog-list-row-btns';
        rowBtns.forEach((btn) => {
          const b = document.createElement('button');
          b.type = 'button';
          b.className = btnClass(btn) + ' btn-inline';
          b.textContent = btn.label || btn.id || '…';
          b.onclick = (ev) => {
            ev.stopPropagation();
            selectedKey = row.key;
            runListBtn(btn, row);
          };
          td.appendChild(b);
        });
        tr.appendChild(td);
      }
      tbody.appendChild(tr);
    }

    /**
     * Întotdeauna `pageSize` rânduri vizibile: date, mesaj pe primul slot, restul padding gol.
     */
    function renderBody(options) {
      options = options || {};
      tbody.innerHTML = '';
      const pageRows = listPageSize(listDef, lastPageData);
      const dataRows = (lastPageData && lastPageData.rows) || [];
      const rowMode = (lastPageData && lastPageData.rowMode) || 'object';

      let statusText = options.statusText;
      if (statusText == null && !dataEverLoaded) {
        statusText = 'Neinițializat';
      } else if (statusText == null && dataRows.length === 0) {
        statusText = 'Niciun rând';
      }

      let dataIndex = 0;
      for (let slot = 0; slot < pageRows; slot++) {
        if (slot === 0 && statusText) {
          appendStatusRow(statusText);
          continue;
        }
        if (dataIndex < dataRows.length) {
          appendDataRow(dataRows[dataIndex], rowMode);
          dataIndex += 1;
        } else {
          appendPadRow();
        }
      }
    }

    function renderPager() {
      pagerEl.innerHTML = '';
      const info = document.createElement('span');
      const total = lastPageData && lastPageData.total;
      const hasMore = lastPageData && lastPageData.hasMore;
      info.textContent =
        'Pagina ' +
        page +
        (total != null
          ? ' / ' +
            Math.max(1, Math.ceil(total / listPageSize(listDef, lastPageData)))
          : '') +
        (total != null ? ' (' + total + ')' : hasMore ? '+' : '');
      const prev = document.createElement('button');
      prev.type = 'button';
      prev.className = 'btn-gri btn-inline';
      prev.textContent = '‹';
      prev.disabled = page <= 1;
      prev.onclick = () => {
        if (page > 1) {
          page -= 1;
          reload();
        }
      };
      const next = document.createElement('button');
      next.type = 'button';
      next.className = 'btn-gri btn-inline';
      next.textContent = '›';
      const canNext =
        lastPageData &&
        (lastPageData.hasMore ||
          (lastPageData.total != null &&
            page * lastPageData.pageSize < lastPageData.total));
      next.disabled = !canNext;
      next.onclick = () => {
        page += 1;
        reload();
      };
      pagerEl.appendChild(prev);
      pagerEl.appendChild(info);
      pagerEl.appendChild(next);
    }

    function renderBelow() {
      belowEl.innerHTML = '';
      belowBtns.forEach((btn) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = btnClass(btn);
        b.textContent = btn.label || btn.id || 'Actiune';
        const needsRow = btn.needsRow !== false;
        b.onclick = () => {
          if (!needsRow) {
            runListBtn(btn, null);
            return;
          }
          const row =
            lastPageData &&
            lastPageData.rows &&
            lastPageData.rows.find((r) => r.key === selectedKey);
          if (!row) {
            showBanner(bannerEl, { err: 'Selectează un rând' });
            return;
          }
          runListBtn(btn, row);
        };
        belowEl.appendChild(b);
      });
    }

    renderHead();
    renderBelow();
    const doAutoload =
      ListLoad && typeof ListLoad.shouldAutoload === 'function'
        ? ListLoad.shouldAutoload(listDef)
        : listDef.autoload !== false;
    if (doAutoload) {
      await reload();
    } else {
      lastPageData = {
        page: 1,
        pageSize: listPageSize(listDef),
        total: 0,
        hasMore: false,
        rows: [],
        rowMode: listDef.row === 'array' ? 'array' : 'object',
      };
      renderBody({ statusText: 'Neinițializat' });
      renderPager();
    }

    const api = {
      destroy() {
        destroyed = true;
        listById.delete(listid);
        block.remove();
      },
      refresh() {
        return reload();
      },
      clear() {
        lastPageData = {
          page,
          pageSize: listPageSize(listDef),
          total: 0,
          hasMore: false,
          rows: [],
          rowMode: listDef.row === 'array' ? 'array' : 'object',
        };
        selectedKey = null;
        renderBody();
        renderPager();
      },
      listid,
    };
    listById.set(listid, api);
    liveInstances.push(api);
    return api;
  }

  async function mountFormBlock(parent, formDef, opts) {
    opts = opts || {};
    const title = (formDef && formDef.title) || opts.formKey || 'Form';
    const schemaKey = (formDef && formDef.schema) || '';
    const btns = Array.isArray(formDef && formDef.btns) ? formDef.btns : [];

    const block = document.createElement('div');
    block.className = 'prog-live-block';
    if (opts.id) block.setAttribute('data-blockid', opts.id);
    block.innerHTML =
      '<h3></h3>' +
      '<div class="prog-live-banner is-empty"></div>' +
      '<div class="prog-live-fields"></div>' +
      '<div class="prog-live-actions"></div>';
    block.querySelector('h3').textContent = title;
    parent.appendChild(block);

    const bannerEl = block.querySelector('.prog-live-banner');
    const fieldsEl = block.querySelector('.prog-live-fields');
    const actionsEl = block.querySelector('.prog-live-actions');

    if (!schemaKey) {
      fieldsEl.innerHTML = '<p class="prog-live-stub">Lipsește <code>schema</code> pe form.</p>';
      const inst = {
        destroy() {
          block.remove();
        },
        getValue() {
          return {};
        },
        reset() {},
        bannerEl,
      };
      liveInstances.push(inst);
      return inst;
    }

    if (!deps.loadJsonKey || !deps.normalizeSchema) {
      fieldsEl.innerHTML = '<p class="prog-live-stub">Live deps neinițializate.</p>';
      const inst = {
        destroy() {
          block.remove();
        },
        getValue() {
          return {};
        },
        reset() {},
        bannerEl,
      };
      liveInstances.push(inst);
      return inst;
    }

    fieldsEl.innerHTML = '<p class="prog-live-stub">Se încarcă schema…</p>';
    let schemaObj = null;
    let startval = {};
    let editor = null;
    let optionsWarnings = [];

    try {
      const rawSchema = await deps.loadJsonKey(schemaKey);
      schemaObj = deps.normalizeSchema(rawSchema);
      if (!schemaObj) throw new Error('Schema invalidă: ' + schemaKey);

      if (
        FormOpts &&
        formDef.fields &&
        typeof formDef.fields === 'object' &&
        deps.redis &&
        typeof deps.redis.exec === 'function'
      ) {
        try {
          const built = await FormOpts.buildSchemaWithOptions(
            schemaObj,
            formDef.fields,
            deps.redis
          );
          schemaObj = built.schema;
          optionsWarnings = built.warnings || [];
        } catch (eOpt) {
          optionsWarnings = [eOpt && eOpt.message ? eOpt.message : String(eOpt)];
        }
      }

      startval =
        typeof deps.defaultFromSchema === 'function'
          ? deps.defaultFromSchema(schemaObj)
          : {};
      if (startval === undefined || startval === null) startval = {};
      // ordine stabilă + startval pe aceleași chei (după options overlay)
      if (
        root.SsideSchemaOrder &&
        typeof root.SsideSchemaOrder.withPropertyOrder === 'function'
      ) {
        schemaObj = root.SsideSchemaOrder.withPropertyOrder(schemaObj);
      }
      fieldsEl.classList.add('sside-form-grid');
      fieldsEl.innerHTML = '';
      editor = createEditor(fieldsEl, schemaObj, startval);
      if (optionsWarnings.length) {
        showBanner(bannerEl, { err: 'Options: ' + optionsWarnings.join('; ') });
      }
    } catch (e) {
      fieldsEl.innerHTML =
        '<p class="prog-live-stub">' + (e && e.message ? e.message : String(e)) + '</p>';
    }

    const baseline = JSON.parse(JSON.stringify(startval || {}));

    const btnReset = document.createElement('button');
    btnReset.type = 'button';
    btnReset.className = 'btn-reset';
    btnReset.textContent = 'Reset';
    btnReset.onclick = () => {
      clearBanner(bannerEl);
      if (!editor) return;
      try {
        editor.setValue(JSON.parse(JSON.stringify(baseline)));
      } catch (e) {
        showBanner(bannerEl, { err: e.message || String(e) });
      }
    };
    actionsEl.appendChild(btnReset);

    const algKeys = btns.map((btn) => btn.alg).filter(Boolean);
    if (deps.loadJsonKey && algKeys.length) {
      Promise.all(algKeys.map((k) => deps.loadJsonKey(k).catch(() => null))).catch(
        () => {}
      );
    }

    btns.forEach((btn) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = btn.label || btn.id || 'Actiune';
      b.className = btnClass(btn);
      b.onclick = async () => {
        const algKey = btn.alg || '';
        let formValue = {};
        try {
          formValue = editor ? editor.getValue() : {};
        } catch (e) {
          showBanner(bannerEl, { err: e.message || String(e) });
          return;
        }
        if (typeof deps.onRunAlg === 'function' && algKey) {
          await preserveViewportScroll(async () => {
            clearBanner(bannerEl);
            try {
              const result = await deps.onRunAlg({
                algKey,
                form: formValue,
                btn,
                formDef,
                uiContext: makeUiContext(null),
              });
              showBanner(bannerEl, result || { msg: 'OK' });
              if (result && result.ui) await applyUiCommands(result.ui);
            } catch (e) {
              showBanner(bannerEl, { err: e.message || String(e) });
            }
          });
        } else {
          showBanner(bannerEl, {
            err: algKey ? 'Runner lipsă — ' + algKey : 'Buton fără alg',
          });
        }
      };
      actionsEl.appendChild(b);
    });

    const inst = {
      destroy() {
        if (editor) {
          try {
            editor.destroy();
          } catch (e) { /* ignore */ }
          editor = null;
        }
        block.remove();
      },
      getValue() {
        return editor ? editor.getValue() : {};
      },
      reset() {
        btnReset.click();
      },
      bannerEl,
    };
    liveInstances.push(inst);
    return inst;
  }

  async function renderFormLive(rootEl, formDef) {
    destroyAll();
    rootEl.innerHTML = '';
    if (!formDef || typeof formDef !== 'object') {
      rootEl.innerHTML = '<p class="prog-live-stub">Definiție form invalidă.</p>';
      return;
    }
    await mountFormBlock(rootEl, formDef, {});
  }

  async function renderListLive(rootEl, listDef, listKey) {
    destroyAll();
    rootEl.innerHTML = '';
    if (!listDef || typeof listDef !== 'object') {
      rootEl.innerHTML = '<p class="prog-live-stub">Definiție list invalidă.</p>';
      return;
    }
    resetActiveListOrder();
    await mountListBlock(rootEl, listDef, { listid: 'main', listKey: listKey || '' });
  }

  async function renderUiLive(rootEl, uiDef) {
    destroyAll();
    rootEl.innerHTML = '';
    if (!uiDef || typeof uiDef !== 'object') {
      rootEl.innerHTML = '<p class="prog-live-stub">Definiție UI invalidă.</p>';
      return;
    }

    const title = document.createElement('h3');
    title.style.margin = '0 0 10px';
    title.textContent = uiDef.title || 'UI';
    rootEl.appendChild(title);

    const tabs = Array.isArray(uiDef.tabs) ? uiDef.tabs : [];
    if (tabs.length === 0) {
      rootEl.appendChild(
        Object.assign(document.createElement('p'), {
          className: 'prog-live-stub',
          textContent: 'Niciun tab în UI.',
        })
      );
      return;
    }

    const tabBar = document.createElement('div');
    tabBar.className = 'prog-live-ui-tabs';
    const stack = document.createElement('div');
    stack.className = 'prog-live-forms-stack';
    rootEl.appendChild(tabBar);
    rootEl.appendChild(stack);

    async function showTab(idx) {
      Array.from(tabBar.children).forEach((btn, i) => {
        btn.classList.toggle('active', i === idx);
      });
      destroyAll();
      resetActiveListOrder();
      stack.innerHTML = '';
      const tab = tabs[idx] || {};
      const blocks = normalizeTabBlocks(tab);
      if (blocks.length === 0) {
        stack.innerHTML = '<p class="prog-live-stub">Tab fără blocks/forms.</p>';
        return;
      }
      for (const bl of blocks) {
        if (bl.type === 'list') {
          let listDef = null;
          try {
            listDef = deps.loadJsonKey ? await deps.loadJsonKey(bl.list) : null;
          } catch (e) {
            const err = document.createElement('p');
            err.className = 'prog-live-stub';
            err.textContent = (e && e.message) || String(e);
            stack.appendChild(err);
            continue;
          }
          if (!listDef) {
            const err = document.createElement('p');
            err.className = 'prog-live-stub';
            err.textContent = 'Nu pot încărca ' + bl.list;
            stack.appendChild(err);
            continue;
          }
          await mountListBlock(stack, listDef, {
            listid: bl.id,
            listKey: bl.list,
          });
        } else if (bl.type === 'actions') {
          await mountActionsBlock(stack, bl, { id: bl.id });
        } else {
          let formDef = null;
          try {
            formDef = deps.loadJsonKey ? await deps.loadJsonKey(bl.form) : null;
          } catch (e) {
            const err = document.createElement('p');
            err.className = 'prog-live-stub';
            err.textContent = (e && e.message) || String(e);
            stack.appendChild(err);
            continue;
          }
          if (!formDef) {
            const err = document.createElement('p');
            err.className = 'prog-live-stub';
            err.textContent = 'Nu pot încărca ' + bl.form;
            stack.appendChild(err);
            continue;
          }
          await mountFormBlock(stack, formDef, {
            formKey: bl.form,
            id: bl.id,
          });
        }
      }
    }

    const tabIndexById = new Map();
    tabs.forEach((tab, i) => {
      if (tab && tab.id != null && String(tab.id).trim() !== '') {
        tabIndexById.set(String(tab.id).trim(), i);
      }
      tabIndexById.set(String(i), i);
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = tab.label || tab.id || 'Tab ' + (i + 1);
      b.onclick = () => {
        showTab(i);
      };
      tabBar.appendChild(b);
    });

    runtimeUiTabApi = {
      async switchTo(ref) {
        const r = String(ref || '').trim();
        if (!r) throw new Error('ui tab: referință goală');
        let idx = tabIndexById.has(r) ? tabIndexById.get(r) : undefined;
        if (idx == null && /^\d+$/.test(r)) {
          const n = parseInt(r, 10);
          if (n >= 0 && n < tabs.length) idx = n;
        }
        if (idx == null) {
          throw new Error('ui tab: id necunoscut „' + r + '”');
        }
        await showTab(idx);
      },
    };

    await showTab(0);
  }

  root.SsideProgLive = {
    setDeps,
    showBanner,
    clearBanner,
    destroyAll,
    applyUiCommands,
    renderFormLive,
    renderListLive,
    renderUiLive,
    mountFormBlock,
    mountListBlock,
    mountActionsBlock,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      showBanner,
      clearBanner,
      setDeps,
      destroyAll,
      applyUiCommands,
      normalizeTabBlocks,
    };
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
