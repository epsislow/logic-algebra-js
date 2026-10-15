/**
 * Preferințe UI (localStorage + atribute html). Testabil în Node fără DOM.
 */
(function (root) {
  'use strict';

  const FONT_SCALES = ['s', 'm', 'l'];
  const LIST_VIEWS = ['list', 'tiles', 'tree'];
  const THEMES = ['light', 'dark'];

  const KEYS = {
    theme: 'sside-theme',
    listKeysView: 'sside-list-keys-view',
    listareType: 'sside-listare-type',
    uiFont: 'sside-ui-font',
    listFont: 'sside-list-font',
    docsFont: 'sside-docs-font',
    footerFont: 'sside-footer-font',
    scanLimit: 'sside-scan-default-limit',
    scanBatch: 'sside-scan-default-batch',
  };

  const BUILTIN_SCAN_LIMIT = 50000;
  const BUILTIN_SCAN_BATCH = 100;
  const MAX_SCAN_LIMIT = 50000;

  function normalizeFontScale(v) {
    const x = String(v == null ? '' : v).toLowerCase();
    if (FONT_SCALES.indexOf(x) !== -1) return x;
    return 's';
  }

  function normalizeTheme(v) {
    const x = String(v == null ? '' : v).toLowerCase();
    if (THEMES.indexOf(x) !== -1) return x;
    return 'light';
  }

  function normalizeListView(v) {
    const x = String(v == null ? '' : v).toLowerCase();
    if (LIST_VIEWS.indexOf(x) !== -1) return x;
    return 'list';
  }

  function parseScanLimit(v, fallback) {
    const fb = fallback == null ? BUILTIN_SCAN_LIMIT : fallback;
    if (v == null || v === '') return fb;
    const n = parseInt(String(v), 10);
    if (!Number.isFinite(n) || n < 0) return fb;
    return Math.min(n, MAX_SCAN_LIMIT);
  }

  function parseScanBatch(v, fallback) {
    const fb = fallback == null ? BUILTIN_SCAN_BATCH : fallback;
    if (v == null || v === '') return fb;
    const n = parseInt(String(v), 10);
    if (!Number.isFinite(n) || n < 1) return fb;
    return n;
  }

  /** @param {(key:string)=>string|null|undefined} getItem */
  function readFromStorage(getItem) {
    const get = typeof getItem === 'function' ? getItem : () => null;
    const listareRaw = get(KEYS.listareType);
    return {
      theme: normalizeTheme(get(KEYS.theme)),
      listKeysView: normalizeListView(get(KEYS.listKeysView)),
      listareType: listareRaw === '1',
      uiFont: normalizeFontScale(get(KEYS.uiFont)),
      listFont: normalizeFontScale(get(KEYS.listFont)),
      docsFont: normalizeFontScale(get(KEYS.docsFont)),
      footerFont: normalizeFontScale(get(KEYS.footerFont)),
      scanLimit: parseScanLimit(get(KEYS.scanLimit), BUILTIN_SCAN_LIMIT),
      scanBatch: parseScanBatch(get(KEYS.scanBatch), BUILTIN_SCAN_BATCH),
    };
  }

  function prefsToStorageEntries(prefs) {
    const p = prefs || {};
    return {
      [KEYS.theme]: normalizeTheme(p.theme),
      [KEYS.listKeysView]: normalizeListView(p.listKeysView),
      [KEYS.listareType]: p.listareType ? '1' : '0',
      [KEYS.uiFont]: normalizeFontScale(p.uiFont),
      [KEYS.listFont]: normalizeFontScale(p.listFont),
      [KEYS.docsFont]: normalizeFontScale(p.docsFont),
      [KEYS.footerFont]: normalizeFontScale(p.footerFont),
      [KEYS.scanLimit]: String(parseScanLimit(p.scanLimit, BUILTIN_SCAN_LIMIT)),
      [KEYS.scanBatch]: String(parseScanBatch(p.scanBatch, BUILTIN_SCAN_BATCH)),
    };
  }

  function applyToDocument(doc, prefs) {
    if (!doc || !doc.documentElement) return prefs;
    const p = prefs || readFromStorage(() => null);
    const el = doc.documentElement;
    el.setAttribute('data-theme', normalizeTheme(p.theme));
    el.setAttribute('data-ui-font', normalizeFontScale(p.uiFont));
    el.setAttribute('data-list-font', normalizeFontScale(p.listFont));
    el.setAttribute('data-docs-font', normalizeFontScale(p.docsFont));
    el.setAttribute('data-footer-font', normalizeFontScale(p.footerFont));
    return p;
  }

  function syncScanFilterModule(prefs) {
    const SF = root.SsideScanFilter;
    if (!SF || typeof SF.setScanDefaults !== 'function') return;
    SF.setScanDefaults({
      limit: parseScanLimit(prefs && prefs.scanLimit, BUILTIN_SCAN_LIMIT),
      batch: parseScanBatch(prefs && prefs.scanBatch, BUILTIN_SCAN_BATCH),
    });
  }

  function loadFromLocalStorage() {
    try {
      return readFromStorage((k) => root.localStorage && root.localStorage.getItem(k));
    } catch (e) {
      return readFromStorage(() => null);
    }
  }

  function saveToLocalStorage(prefs) {
    const entries = prefsToStorageEntries(prefs);
    try {
      Object.keys(entries).forEach((k) => {
        root.localStorage.setItem(k, entries[k]);
      });
    } catch (e) { /* ignore */ }
  }

  function applyAll(prefs) {
    const p = prefs || loadFromLocalStorage();
    applyToDocument(root.document, p);
    syncScanFilterModule(p);
    return p;
  }

  const api = {
    KEYS,
    FONT_SCALES,
    LIST_VIEWS,
    THEMES,
    BUILTIN_SCAN_LIMIT,
    BUILTIN_SCAN_BATCH,
    MAX_SCAN_LIMIT,
    normalizeFontScale,
    normalizeTheme,
    normalizeListView,
    parseScanLimit,
    parseScanBatch,
    readFromStorage,
    prefsToStorageEntries,
    applyToDocument,
    syncScanFilterModule,
    loadFromLocalStorage,
    saveToLocalStorage,
    applyAll,
  };

  root.SsideUserPrefs = api;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
