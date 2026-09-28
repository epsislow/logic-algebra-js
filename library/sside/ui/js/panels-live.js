/**
 * Live rendering pentru form: / ui: (F3).
 * deps setate din app.js: loadJsonKey, normalizeSchema, defaultFromSchema, onRunAlg?
 */
(function (root) {
  'use strict';

  let deps = {
    loadJsonKey: null,
    normalizeSchema: null,
    defaultFromSchema: null,
    onRunAlg: null,
  };

  /** @type {Array<{ destroy: Function }>} */
  let liveInstances = [];

  function setDeps( partial ) {
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
  }

  function createEditor(holder, schema, startval) {
    if (typeof JSONEditor === 'undefined') {
      throw new Error('JSONEditor lipsă');
    }
    return new JSONEditor(holder, {
      theme: 'html',
      schema: schema || { type: 'object' },
      startval: startval,
      no_additional_properties: false,
      disable_collapse: true,
      disable_edit_json: true,
      disable_properties: true,
      disable_array_reorder: true,
      show_errors: 'interaction',
    });
  }

  /**
   * Randează un bloc Live pentru o definiție form (obiect JSON).
   * @returns {{ destroy, getValue, reset, bannerEl }}
   */
  async function mountFormBlock(parent, formDef, opts) {
    opts = opts || {};
    const title = (formDef && formDef.title) || opts.formKey || 'Form';
    const schemaKey = (formDef && formDef.schema) || '';
    const btns = Array.isArray(formDef && formDef.btns) ? formDef.btns : [];

    const block = document.createElement('div');
    block.className = 'prog-live-block';
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
      return {
        destroy() {
          block.remove();
        },
        getValue() {
          return {};
        },
        reset() {},
        bannerEl,
      };
    }

    if (!deps.loadJsonKey || !deps.normalizeSchema) {
      fieldsEl.innerHTML = '<p class="prog-live-stub">Live deps neinițializate.</p>';
      return {
        destroy() {
          block.remove();
        },
        getValue() {
          return {};
        },
        reset() {},
        bannerEl,
      };
    }

    fieldsEl.innerHTML = '<p class="prog-live-stub">Se încarcă schema…</p>';
    let schemaObj = null;
    let startval = {};
    let editor = null;

    try {
      const rawSchema = await deps.loadJsonKey(schemaKey);
      schemaObj = deps.normalizeSchema(rawSchema);
      if (!schemaObj) throw new Error('Schema invalidă: ' + schemaKey);
      startval =
        typeof deps.defaultFromSchema === 'function'
          ? deps.defaultFromSchema(schemaObj)
          : {};
      if (startval === undefined || startval === null) startval = {};
      fieldsEl.innerHTML = '';
      editor = createEditor(fieldsEl, schemaObj, startval);
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

    // Prefetch alg-uri pe butoane (1 GET acum, 0 la click)
    const algKeys = btns.map((btn) => btn.alg).filter(Boolean);
    if (deps.loadJsonKey && algKeys.length) {
      Promise.all(
        algKeys.map((k) =>
          deps.loadJsonKey(k).catch(() => null)
        )
      ).catch(() => {});
    }

    btns.forEach((btn) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = btn.label || btn.id || 'Actiune';
      if (btn.kind === 'danger') b.className = 'btn-kind-red';
      else if (btn.kind) b.className = 'btn-kind-' + String(btn.kind).toLowerCase();
      else b.className = 'btn-albastru';
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
          } catch (e) {
            showBanner(bannerEl, { err: e.message || String(e) });
          }
        } else {
          showBanner(bannerEl, {
            err: algKey
              ? 'Runner (F4) nu e activ încă — ' + algKey
              : 'Buton fără alg',
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

    let active = 0;

    async function showTab(idx) {
      active = idx;
      Array.from(tabBar.children).forEach((btn, i) => {
        btn.classList.toggle('active', i === idx);
      });
      destroyAll();
      stack.innerHTML = '';
      const tab = tabs[idx] || {};
      const formKeys = Array.isArray(tab.forms) ? tab.forms : [];
      if (formKeys.length === 0) {
        stack.innerHTML = '<p class="prog-live-stub">Tab fără forms[].</p>';
        return;
      }
      for (const fk of formKeys) {
        let formDef = null;
        try {
          formDef = deps.loadJsonKey ? await deps.loadJsonKey(fk) : null;
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
          err.textContent = 'Nu pot încărca ' + fk;
          stack.appendChild(err);
          continue;
        }
        await mountFormBlock(stack, formDef, { formKey: fk });
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
    renderFormLive,
    renderUiLive,
    mountFormBlock,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      showBanner,
      clearBanner,
      setDeps,
      destroyAll,
    };
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
