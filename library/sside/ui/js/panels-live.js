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

  function setDeps(partial) {
    deps = Object.assign({}, deps, partial || {});
  }

  function showBanner(el, result) {
    if (!el) return;
    el.classList.remove('is-ok', 'is-err');
    el.style.display = '';
    if (result && result.err) {
      el.textContent = String(result.err);
      el.classList.add('is-err');
    } else if (result && result.msg) {
      el.textContent = String(result.msg);
      el.classList.add('is-ok');
    } else {
      el.textContent = '';
      el.style.display = 'none';
    }
  }

  function clearBanner(el) {
    showBanner(el, null);
  }

  function destroyAll() {
    liveInstances.forEach((inst) => {
      try {
        if (inst && typeof inst.destroy === 'function') inst.destroy();
      } catch (e) { /* ignore */ }
    });
    liveInstances = [];
    listById.clear();
  }

  function applyUiCommands(ui) {
    if (!ui || typeof ui !== 'object') return;
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
    const schemaOrdered =
      SchemaOrder && SchemaOrder.withPropertyOrder
        ? SchemaOrder.withPropertyOrder(schema)
        : schema;
    return new JSONEditor(holder, {
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

  async function runAlgForList(opts) {
    const { algKey, formValue, btn, listDef, listid, rowKey, bannerEl } = opts;
    if (typeof deps.onRunAlg !== 'function' || !algKey) {
      showBanner(bannerEl, { err: algKey ? 'Runner lipsă' : 'Buton fără alg' });
      return;
    }
    try {
      const result = await deps.onRunAlg({
        algKey,
        form: formValue || {},
        btn,
        formDef: listDef,
        listid,
        list: listDef && listDef._key,
        rowKey,
      });
      showBanner(bannerEl, result || { msg: 'OK' });
      if (result && result.ui) applyUiCommands(result.ui);
    } catch (e) {
      showBanner(bannerEl, { err: e.message || String(e) });
    }
  }

  /**
   * @returns {{ destroy, refresh, clear }}
   */
  async function mountListBlock(parent, listDef, opts) {
    opts = opts || {};
    const listid = String(opts.listid || opts.id || 'list1');
    const listKey = opts.listKey || listDef._key || '';
    if (listDef) listDef._key = listKey;

    const title = (listDef && listDef.title) || listKey || listid;
    const block = document.createElement('div');
    block.className = 'prog-live-block prog-live-list';
    block.setAttribute('data-listid', listid);
    block.innerHTML =
      '<h3></h3>' +
      '<div class="prog-live-banner" style="display:none;"></div>' +
      '<div class="prog-list-table-wrap"><table class="prog-list-table"><thead></thead><tbody></tbody></table></div>' +
      '<div class="prog-list-pager"></div>' +
      '<div class="prog-live-actions prog-list-below-btns"></div>';
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
    let destroyed = false;

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
      const v = row && row.value;
      if (v && typeof v === 'object' && !Array.isArray(v)) {
        return JSON.parse(JSON.stringify(v));
      }
      return { value: v, _key: row && row.key };
    }

    async function reload() {
      if (destroyed) return;
      if (!ListLoad || !deps.redis) {
        tbody.innerHTML =
          '<tr><td colspan="99">list-load / redis lipsă</td></tr>';
        return;
      }
      tbody.innerHTML = '<tr><td colspan="99">Se încarcă…</td></tr>';
      try {
        lastPageData = await ListLoad.loadListPage(listDef, deps.redis, page);
        page = lastPageData.page;
        renderBody();
        renderPager();
      } catch (e) {
        tbody.innerHTML =
          '<tr><td colspan="99">' +
          (e && e.message ? e.message : String(e)) +
          '</td></tr>';
      }
    }

    function renderBody() {
      tbody.innerHTML = '';
      const rows = (lastPageData && lastPageData.rows) || [];
      const rowMode = (lastPageData && lastPageData.rowMode) || 'object';
      if (!rows.length) {
        tbody.innerHTML = '<tr><td colspan="99">Niciun rând</td></tr>';
        return;
      }
      rows.forEach((row) => {
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
          td.textContent = val == null ? '' : String(val);
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
              runAlgForList({
                algKey: btn.alg,
                formValue: formFromRow(row),
                btn,
                listDef,
                listid,
                rowKey: row.key,
                bannerEl,
              });
            };
            td.appendChild(b);
          });
          tr.appendChild(td);
        }
        tbody.appendChild(tr);
      });
    }

    function renderPager() {
      pagerEl.innerHTML = '';
      const info = document.createElement('span');
      const total = lastPageData && lastPageData.total;
      const hasMore = lastPageData && lastPageData.hasMore;
      info.textContent =
        'Pagina ' +
        page +
        (total != null ? ' / ' + Math.max(1, Math.ceil(total / (lastPageData.pageSize || 20))) : '') +
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
        b.onclick = () => {
          const row =
            lastPageData &&
            lastPageData.rows &&
            lastPageData.rows.find((r) => r.key === selectedKey);
          if (!row) {
            showBanner(bannerEl, { err: 'Selectează un rând' });
            return;
          }
          runAlgForList({
            algKey: btn.alg,
            formValue: formFromRow(row),
            btn,
            listDef,
            listid,
            rowKey: row.key,
            bannerEl,
          });
        };
        belowEl.appendChild(b);
      });
    }

    renderHead();
    renderBelow();
    await reload();

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
          pageSize: listDef.pageSize || 20,
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
      '<div class="prog-live-banner" style="display:none;"></div>' +
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
        clearBanner(bannerEl);
        const algKey = btn.alg || '';
        let formValue = {};
        try {
          formValue = editor ? editor.getValue() : {};
        } catch (e) {
          showBanner(bannerEl, { err: e.message || String(e) });
          return;
        }
        if (typeof deps.onRunAlg === 'function' && algKey) {
          try {
            const result = await deps.onRunAlg({
              algKey,
              form: formValue,
              btn,
              formDef,
            });
            showBanner(bannerEl, result || { msg: 'OK' });
            if (result && result.ui) applyUiCommands(result.ui);
          } catch (e) {
            showBanner(bannerEl, { err: e.message || String(e) });
          }
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

    tabs.forEach((tab, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = tab.label || tab.id || 'Tab ' + (i + 1);
      b.onclick = () => {
        showTab(i);
      };
      tabBar.appendChild(b);
    });

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
