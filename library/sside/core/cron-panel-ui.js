/**
 * Helpers UI panou Cron (testabil din Node + browser).
 */
(function (root) {
  'use strict';

  function cronRunExpandId(cronKey, run) {
    return (
      String(cronKey || '') +
      '::' +
      String((run && run.runAt) || '') +
      '::' +
      String((run && run.runId) || '')
    );
  }

  /**
   * Interpretare filtru Nume:
   * - `blabla` → prefix `cron:blabla…` (fără `*` la final)
   * - `*nume` → conține `nume` în cheie (`cron:…*nume*…`)
   */
  /** Suffix job din cheie config `cron:…` — valoare filtru Nume (prefix implicit). */
  function cronNameFilterFromCronKey(cronKey) {
    const k = String(cronKey || '').trim();
    if (!k) return '';
    return k.replace(/^cron:/i, '');
  }

  function parseCronNameFilter(input) {
    const raw = String(input || '').trim();
    if (!raw || raw === '*') return { kind: 'any' };

    if (raw.startsWith('*')) {
      let inner = raw.slice(1);
      if (inner.endsWith('*')) inner = inner.slice(0, -1);
      inner = inner.trim();
      if (!inner) return { kind: 'any' };
      return { kind: 'contains', needle: inner.toLowerCase() };
    }

    let p = raw;
    if (p.endsWith('*')) p = p.slice(0, -1).trim();
    if (!p) return { kind: 'any' };
    if (!/^cron:/i.test(p)) p = 'cron:' + p;
    return { kind: 'prefix', prefix: p.toLowerCase() };
  }

  /** @deprecated test — doar mod prefix */
  function cronNamePrefixFromFilter(input) {
    const f = parseCronNameFilter(input);
    return f.kind === 'prefix' ? f.prefix : null;
  }

  function matchCronNameFilter(cronKey, nameInput) {
    const f = parseCronNameFilter(nameInput);
    if (f.kind === 'any') return true;
    const key = String(cronKey || '').toLowerCase();
    if (f.kind === 'prefix') return key.startsWith(f.prefix);
    return key.includes(f.needle);
  }

  function createEmptyJobFilters() {
    return { name: '', mode: '', enabled: '' };
  }

  function createEmptyRunFilters() {
    return { name: '', mode: '', trigger: '', status: '' };
  }

  function jobFiltersActive(f) {
    if (!f) return false;
    return !!(String(f.name || '').trim() || f.mode || f.enabled);
  }

  function runFiltersActive(f) {
    if (!f) return false;
    return !!(String(f.name || '').trim() || f.mode || f.trigger || f.status);
  }

  function normalizeRunStatus(status) {
    return String(status || '').toLowerCase();
  }

  function isRunStatusOk(status) {
    return normalizeRunStatus(status) === 'ok';
  }

  function filterJobEntries(entries, filters) {
    const f = filters || createEmptyJobFilters();
    return (entries || []).filter((entry) => {
      const cfg = (entry && entry.config) || {};
      const key = entry && entry.cronKey;
      if (!matchCronNameFilter(key, f.name)) return false;
      if (f.mode === 'client' || f.mode === 'edge') {
        const m = cfg.mode === 'edge' ? 'edge' : 'client';
        if (m !== f.mode) return false;
      }
      if (f.enabled === 'on' && !cfg.enabled) return false;
      if (f.enabled === 'off' && cfg.enabled) return false;
      return true;
    });
  }

  function filterRunRows(rows, filters) {
    const f = filters || createEmptyRunFilters();
    return (rows || []).filter((row) => {
      const key = row && row.cronKey;
      const run = row && row.run;
      if (!matchCronNameFilter(key, f.name)) return false;
      if (f.mode === 'client' || f.mode === 'edge') {
        const h = run && run.runHost;
        if (h !== f.mode) return false;
      }
      if (f.trigger === 'scheduled' || f.trigger === 'manual') {
        const t = String((run && run.trigger) || '').toLowerCase();
        if (t !== f.trigger) return false;
      }
      if (f.status === 'ok') {
        if (!isRunStatusOk(run && run.status)) return false;
      } else if (f.status === 'not_ok') {
        if (isRunStatusOk(run && run.status)) return false;
      }
      return true;
    });
  }

  const api = {
    cronRunExpandId,
    cronNameFilterFromCronKey,
    parseCronNameFilter,
    cronNamePrefixFromFilter,
    matchCronNameFilter,
    createEmptyJobFilters,
    createEmptyRunFilters,
    jobFiltersActive,
    runFiltersActive,
    filterJobEntries,
    filterRunRows,
    isRunStatusOk,
  };

  root.SsideCronPanelUi = api;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
