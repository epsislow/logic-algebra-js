/**
 * Setări utilizator — shell ca Docs (TOC + panou).
 */
(function (root) {
  'use strict';

  const Prefs = () => root.SsideUserPrefs;

  const SECTIONS = [
    { id: 'cont', label: 'Cont' },
    { id: 'aspect', label: 'Aspect' },
    { id: 'ui', label: 'Interfață generală' },
    { id: 'list', label: 'Listă chei' },
    { id: 'scan', label: 'SCAN' },
    { id: 'docs', label: 'Documentație' },
    { id: 'footer', label: 'Footer API' },
    { id: 'despre', label: 'Despre' },
  ];

  let settingsReturnToRuntime = false;
  let currentSectionId = 'cont';

  function hideOtherScreens() {
    ['ecran-lista', 'ecran-detaliu', 'ecran-cautari-salvate', 'ecran-ui-runtime', 'ecran-docs'].forEach(
      function (id) {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
      }
    );
    document.body.classList.remove('sside-docs-open');
    const docsPanel = document.getElementById('ecran-docs');
    if (docsPanel) docsPanel.style.display = 'none';
  }

  function fontSegHtml(name, selected) {
    const scales = [
      { v: 's', l: 'Mic' },
      { v: 'm', l: 'Mediu' },
      { v: 'l', l: 'Mare' },
    ];
    let h =
      '<div class="settings-seg" role="group" aria-label="' +
      name +
      '"><span class="settings-field-label">' +
      name +
      '</span><div class="list-view-mode-seg">';
    scales.forEach(function (s) {
      h +=
        '<button type="button" class="list-view-mode-btn settings-font-btn' +
        (selected === s.v ? ' is-active' : '') +
        '" data-font-scale="' +
        s.v +
        '">' +
        s.l +
        '</button>';
    });
    h += '</div></div>';
    return h;
  }

  function themeSegHtml(theme) {
    const opts = [
      { v: 'light', l: 'Light' },
      { v: 'dark', l: 'Dark' },
    ];
    let h =
      '<div class="settings-seg" role="group" aria-label="Temă"><span class="settings-field-label">Temă</span><div class="list-view-mode-seg">';
    opts.forEach(function (o) {
      h +=
        '<button type="button" class="list-view-mode-btn settings-theme-btn' +
        (theme === o.v ? ' is-active' : '') +
        '" data-theme-val="' +
        o.v +
        '">' +
        o.l +
        '</button>';
    });
    h += '</div></div>';
    return h;
  }

  function listViewSegHtml(view) {
    const opts = [
      { v: 'list', l: 'Listă' },
      { v: 'tiles', l: 'Plăci' },
      { v: 'tree', l: 'Arbore' },
      { v: 'folders', l: 'Dosare' },
    ];
    let h =
      '<div class="settings-seg"><span class="settings-field-label">Mod implicit</span><div class="list-view-mode-seg">';
    opts.forEach(function (o) {
      h +=
        '<button type="button" class="list-view-mode-btn settings-list-view-btn' +
        (view === o.v ? ' is-active' : '') +
        '" data-list-view="' +
        o.v +
        '">' +
        o.l +
        '</button>';
    });
    h += '</div></div>';
    return h;
  }

  function getUsernameLabel() {
    const el = document.getElementById('nume-utilizator-afisat');
    return el ? String(el.textContent || '').trim() : '—';
  }

  function redisPrefsKeyHint() {
    const P = Prefs();
    if (!P || !P.settingsKeyForUsername) return '—';
    return P.settingsKeyForUsername(getUsernameLabel()) || '—';
  }

  function despreRedisBlockHtml() {
    return (
      '<div class="settings-redis-block">' +
      '<p class="settings-hint">Copie în Redis (manual, contul curent). Cheie: <code id="settings-redis-key">' +
      escapeHtml(redisPrefsKeyHint()) +
      '</code></p>' +
      '<p class="settings-redis-actions">' +
      '<button type="button" class="btn-albastru btn-inline" id="settings-btn-save-redis">Save</button> ' +
      '<button type="button" class="btn-gri btn-inline" id="settings-btn-load-redis" disabled>Load</button> ' +
      '<button type="button" class="btn-rosu btn-inline" id="settings-btn-delete-redis" disabled>Șterge</button>' +
      '</p>' +
      '<p id="settings-redis-msg" class="settings-redis-msg" role="status" aria-live="polite"></p>' +
      '</div>'
    );
  }

  function cssCacheHint() {
    const link = document.querySelector('link[href*="app.css"]');
    if (!link || !link.getAttribute('href')) return '—';
    return link.getAttribute('href');
  }

  function renderSectionContent(id, prefs) {
    const p = prefs || (Prefs() && Prefs().loadFromLocalStorage()) || {};
    switch (id) {
      case 'cont':
        return (
          '<h2>Cont</h2>' +
          '<p class="settings-kv"><strong>Utilizator:</strong> <span id="settings-username">' +
          escapeHtml(getUsernameLabel()) +
          '</span></p>' +
          '<p><button type="button" class="btn-rosu btn-inline" id="settings-btn-logout">Deconectare</button></p>'
        );
      case 'aspect':
        return '<h2>Aspect</h2>' + themeSegHtml(p.theme);
      case 'ui':
        return '<h2>Interfață generală</h2><p class="settings-hint">Bara de căutare, toolbar, căutări salvate.</p>' + fontSegHtml('Mărime text', p.uiFont);
      case 'list':
        return (
          '<h2>Listă chei</h2>' +
          listViewSegHtml(p.listKeysView) +
          '<label class="settings-check"><input type="checkbox" id="settings-chk-type"' +
          (p.listareType ? ' checked' : '') +
          '> Type la listare (implicit)</label>' +
          '<label class="settings-check"><input type="checkbox" id="settings-chk-dosare-tint"' +
          (p.dosareTintConventie ? ' checked' : '') +
          '> Dosare — tentă convenție pe foldere (schema, data, admin…)</label>' +
          fontSegHtml('Mărime text (Listă / Plăci / Arbore / Dosare)', p.listFont)
        );
      case 'scan':
        return (
          '<h2>SCAN — valori implicite</h2>' +
          '<p class="settings-hint">Când filtrul <code>&gt;pattern</code> nu include <code>limit:</code> / <code>batch:</code>.</p>' +
          '<label class="settings-kv">Limit (0–50000)<input type="number" id="settings-scan-limit" min="0" max="50000" step="1" value="' +
          p.scanLimit +
          '"></label>' +
          '<label class="settings-kv">Batch (≥1)<input type="number" id="settings-scan-batch" min="1" max="10000" step="1" value="' +
          p.scanBatch +
          '"></label>'
        );
      case 'docs':
        return '<h2>Documentație</h2>' + fontSegHtml('Mărime text Docs', p.docsFont);
      case 'footer':
        return '<h2>Footer API</h2>' + fontSegHtml('Mărime text footer', p.footerFont);
      case 'despre':
        return (
          '<h2>Despre</h2>' +
          '<p class="settings-hint">Preferințele se salvează în <code>localStorage</code> pe acest browser.</p>' +
          despreRedisBlockHtml() +
          '<p><strong>CSS:</strong> <code>' +
          escapeHtml(cssCacheHint()) +
          '</code></p>' +
          '<p><button type="button" class="btn-gri btn-inline" id="settings-open-docs">Deschide Docs</button></p>' +
          '<pre class="settings-prefs-dump">' +
          escapeHtml(JSON.stringify(p, null, 2)) +
          '</pre>'
        );
      default:
        return '<p>Secțiune necunoscută.</p>';
    }
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function persistAndApply(partial) {
    const P = Prefs();
    if (!P) return null;
    const cur = P.loadFromLocalStorage();
    const next = Object.assign({}, cur, partial);
    P.saveToLocalStorage(next);
    P.applyAll(next);
    if (root.SsideSettings && root.SsideSettings.syncUiFromPrefs) {
      root.SsideSettings.syncUiFromPrefs(next);
    }
    return next;
  }

  function wireSectionHandlers(content, sectionId) {
    if (sectionId === 'cont') {
      const btn = content.querySelector('#settings-btn-logout');
      if (btn && typeof root.executaLogout === 'function') {
        btn.onclick = function () {
          root.executaLogout();
        };
      }
      return;
    }
    if (sectionId === 'aspect') {
      content.querySelectorAll('.settings-theme-btn').forEach(function (b) {
        b.onclick = function () {
          const v = b.getAttribute('data-theme-val');
          persistAndApply({ theme: v });
          showSection('aspect');
        };
      });
      return;
    }
    if (sectionId === 'ui') {
      wireFontButtons(content, function (scale) {
        persistAndApply({ uiFont: scale });
        showSection('ui');
      });
      return;
    }
    if (sectionId === 'list') {
      content.querySelectorAll('.settings-list-view-btn').forEach(function (b) {
        b.onclick = function () {
          const v = b.getAttribute('data-list-view');
          persistAndApply({ listKeysView: v });
          showSection('list');
        };
      });
      const chk = content.querySelector('#settings-chk-type');
      if (chk) {
        chk.onchange = function () {
          persistAndApply({ listareType: chk.checked });
        };
      }
      const chkDosare = content.querySelector('#settings-chk-dosare-tint');
      if (chkDosare) {
        chkDosare.onchange = function () {
          persistAndApply({ dosareTintConventie: chkDosare.checked });
        };
      }
      wireFontButtons(content, function (scale) {
        persistAndApply({ listFont: scale });
        showSection('list');
      });
      return;
    }
    if (sectionId === 'scan') {
      const lim = content.querySelector('#settings-scan-limit');
      const bat = content.querySelector('#settings-scan-batch');
      const onNum = function () {
        const P = Prefs();
        if (!P) return;
        persistAndApply({
          scanLimit: P.parseScanLimit(lim && lim.value, P.BUILTIN_SCAN_LIMIT),
          scanBatch: P.parseScanBatch(bat && bat.value, P.BUILTIN_SCAN_BATCH),
        });
      };
      if (lim) lim.addEventListener('change', onNum);
      if (bat) bat.addEventListener('change', onNum);
      return;
    }
    if (sectionId === 'docs') {
      wireFontButtons(content, function (scale) {
        persistAndApply({ docsFont: scale });
        showSection('docs');
      });
      return;
    }
    if (sectionId === 'footer') {
      wireFontButtons(content, function (scale) {
        persistAndApply({ footerFont: scale });
        showSection('footer');
      });
      return;
    }
    if (sectionId === 'despre') {
      const openDocs = content.querySelector('#settings-open-docs');
      if (openDocs && typeof root.deschideDocs === 'function') {
        openDocs.onclick = function () {
          ascunde();
          root.deschideDocs();
        };
      }
      const msgEl = content.querySelector('#settings-redis-msg');
      const setMsg = function (text, isErr) {
        if (!msgEl) return;
        msgEl.textContent = text || '';
        msgEl.classList.toggle('is-err', !!isErr);
      };
      function applySettingsRedisKeyUi(exists) {
        const btnLoad = content.querySelector('#settings-btn-load-redis');
        const btnDel = content.querySelector('#settings-btn-delete-redis');
        if (btnLoad) {
          btnLoad.disabled = !exists;
          btnLoad.classList.toggle('settings-btn-load-ready', !!exists);
        }
        if (btnDel) btnDel.disabled = !exists;
      }
      async function refreshSettingsRedisKeyState() {
        applySettingsRedisKeyUi(false);
        if (!root.SsideSettings || !root.SsideSettings.settingsPrefsKeyExists) return;
        try {
          const exists = await root.SsideSettings.settingsPrefsKeyExists();
          applySettingsRedisKeyUi(exists);
        } catch (e) {
          applySettingsRedisKeyUi(false);
        }
      }
      refreshSettingsRedisKeyState();
      const btnSave = content.querySelector('#settings-btn-save-redis');
      const btnLoad = content.querySelector('#settings-btn-load-redis');
      const btnDel = content.querySelector('#settings-btn-delete-redis');
      if (btnSave && root.SsideSettings && root.SsideSettings.savePrefsToRedis) {
        btnSave.onclick = async function () {
          setMsg('');
          btnSave.disabled = true;
          try {
            const key = await root.SsideSettings.savePrefsToRedis();
            setMsg('Salvat în ' + key + '.', false);
            await refreshSettingsRedisKeyState();
            showSection('despre');
          } catch (e) {
            setMsg(e.message || String(e), true);
          } finally {
            btnSave.disabled = false;
          }
        };
      }
      if (btnLoad && root.SsideSettings && root.SsideSettings.loadPrefsFromRedis) {
        btnLoad.onclick = async function () {
          if (btnLoad.disabled) return;
          setMsg('');
          btnLoad.disabled = true;
          try {
            const res = await root.SsideSettings.loadPrefsFromRedis();
            if (!res || !res.ok) {
              const P = Prefs();
              setMsg(
                (res && res.message) ||
                  (P && P.MSG_INVALID_REDIS_PREFS) ||
                  'Format invalid! salveaza pentru corectare!',
                true
              );
              await refreshSettingsRedisKeyState();
              return;
            }
            setMsg('Încărcat din ' + (res.key || redisPrefsKeyHint()) + '.', false);
            showSection('despre');
          } catch (e) {
            setMsg(e.message || String(e), true);
            await refreshSettingsRedisKeyState();
          }
        };
      }
      if (btnDel && root.SsideSettings && root.SsideSettings.deletePrefsFromRedis) {
        btnDel.onclick = async function () {
          if (btnDel.disabled) return;
          if (!confirm('Ștergi copia Redis a setărilor (' + redisPrefsKeyHint() + ')?')) return;
          setMsg('');
          btnDel.disabled = true;
          try {
            const res = await root.SsideSettings.deletePrefsFromRedis();
            if (!res || !res.ok) {
              setMsg((res && res.message) || 'Ștergere eșuată.', true);
              await refreshSettingsRedisKeyState();
              return;
            }
            setMsg('Șters: ' + (res.key || redisPrefsKeyHint()) + '.', false);
            await refreshSettingsRedisKeyState();
          } catch (e) {
            setMsg(e.message || String(e), true);
            await refreshSettingsRedisKeyState();
          }
        };
      }
    }
  }

  function wireFontButtons(content, onPick) {
    content.querySelectorAll('.settings-font-btn').forEach(function (b) {
      b.onclick = function () {
        onPick(b.getAttribute('data-font-scale'));
      };
    });
  }

  function ensurePanel() {
    let panel = document.getElementById('ecran-setari');
    if (panel) return panel;
    panel = document.createElement('div');
    panel.id = 'ecran-setari';
    panel.style.display = 'none';
    panel.innerHTML =
      '<div class="box docs-box">' +
      '<div class="docs-toolbar">' +
      '<button type="button" class="btn-gri btn-inline" id="btn-settings-inapoi">← Înapoi</button>' +
      '<h3 style="margin:0 0 0 12px;flex:1;">Setări</h3>' +
      '</div>' +
      '<div class="docs-layout">' +
      '<nav class="docs-toc" id="settings-toc"></nav>' +
      '<article class="docs-content settings-content" id="settings-content"></article>' +
      '</div>' +
      '</div>';
    const app = document.getElementById('panou-aplicatie');
    if (app) app.appendChild(panel);
    else document.body.appendChild(panel);
    panel.querySelector('#btn-settings-inapoi').onclick = function () {
      ascunde();
    };
    return panel;
  }

  function randeazaToc() {
    const toc = document.getElementById('settings-toc');
    if (!toc) return;
    toc.innerHTML = '';
    SECTIONS.forEach(function (sec) {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = sec.label;
      b.setAttribute('data-id', sec.id);
      b.onclick = function () {
        showSection(sec.id);
      };
      toc.appendChild(b);
    });
  }

  function showSection(id) {
    currentSectionId = id || 'cont';
    const toc = document.getElementById('settings-toc');
    const content = document.getElementById('settings-content');
    if (!content) return;
    if (toc) {
      toc.querySelectorAll('button').forEach(function (b) {
        b.classList.toggle('active', b.getAttribute('data-id') === currentSectionId);
      });
    }
    const prefs = Prefs() && Prefs().loadFromLocalStorage();
    content.innerHTML = renderSectionContent(currentSectionId, prefs);
    wireSectionHandlers(content, currentSectionId);
    content.scrollTop = 0;
  }

  function arata(sectionId) {
    ensurePanel();
    const runtimeEl = document.getElementById('ecran-ui-runtime');
    settingsReturnToRuntime =
      document.body.classList.contains('sside-runtime-active') &&
      !!(runtimeEl && runtimeEl.style.display !== 'none');
    hideOtherScreens();
    document.body.classList.add('sside-settings-open');
    const panel = document.getElementById('ecran-setari');
    panel.style.display = 'block';
    randeazaToc();
    showSection(sectionId || 'cont');
  }

  function ascunde() {
    const wasOpen =
      document.body.classList.contains('sside-settings-open') || esteDeschis();
    document.body.classList.remove('sside-settings-open');
    const panel = document.getElementById('ecran-setari');
    if (panel) panel.style.display = 'none';
    if (!wasOpen) return;
    if (settingsReturnToRuntime) {
      const runtimeEl = document.getElementById('ecran-ui-runtime');
      if (runtimeEl) runtimeEl.style.display = 'block';
      settingsReturnToRuntime = false;
      return;
    }
    const lista = document.getElementById('ecran-lista');
    if (lista) lista.style.display = 'block';
  }

  function esteDeschis() {
    const panel = document.getElementById('ecran-setari');
    return !!(panel && panel.style.display !== 'none');
  }

  root.SsideSettings = {
    arata,
    ascunde,
    esteDeschis,
    syncUiFromPrefs: null,
  };

  root.deschideSetari = function (sectionId) {
    root.SsideSettings.arata(sectionId);
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
