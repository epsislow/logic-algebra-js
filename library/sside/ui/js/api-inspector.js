/**
 * Jurnal sesiune /api/comanda — panou debug (fără persistare).
 */
(function (root) {
  'use strict';

  const API_LOG_MAX = 100;
  const TRUNC_CHARS = 650;

  let apiLog = [];
  let apiLogIdSeq = 0;
  let checkedIds = new Set();
  let expandedIds = new Set();
  let modalOpen = false;
  let lastOk = true;

  let els = {};

  function cloneSafe(obj) {
    if (obj === undefined || obj === null) return obj;
    try {
      return JSON.parse(JSON.stringify(obj));
    } catch (e) {
      return String(obj);
    }
  }

  function formatTime(d) {
    if (!(d instanceof Date)) return '';
    return d.toLocaleTimeString('ro-RO', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }

  function clasificaComandaRedis(cmd) {
    const c = String(cmd || '').toUpperCase();
    if (c === 'SEARCH.QUERY') return 'advSearch';
    if (c === 'TYPE') return 'type';
    if (
      c === 'SET' ||
      c === 'JSON.SET' ||
      c === 'SADD' ||
      c === 'SREM' ||
      c === 'DEL' ||
      c === 'HSET' ||
      c === 'HDEL' ||
      c === 'LPUSH' ||
      c === 'RPUSH' ||
      c === 'LSET' ||
      c === 'LREM' ||
      c === 'ZADD' ||
      c === 'ZREM' ||
      c === 'EXPIRE' ||
      c === 'PEXPIRE' ||
      c === 'PERSIST'
    ) {
      return 'write';
    }
    return 'read';
  }

  function chipClassPentruCat(cat) {
    if (cat === 'type') return 'is-type';
    if (cat === 'write') return 'is-write';
    if (cat === 'advSearch') return 'is-search';
    return 'is-read';
  }

  function kindLabel(kind) {
    if (kind === 'tranzactie') return 'TRZ';
    return 'CMDREDIS';
  }

  function appendSummaryTo(parent, row) {
    parent.textContent = '';
    if (row.kind === 'tranzactie') {
      const tx = row.request && row.request.tranzactie;
      const n = Array.isArray(tx) ? tx.length : 0;
      const t = document.createElement('span');
      t.className = 'api-log-tx-summary';
      t.textContent = n + ' cmd';
      parent.appendChild(t);
      return;
    }
    const argv = row.request && row.request.comandaRedis;
    if (Array.isArray(argv) && argv.length && argv[0]) {
      const cmd = String(argv[0]).toUpperCase();
      const chip = document.createElement('span');
      chip.className = 'api-cmd-chip ' + chipClassPentruCat(clasificaComandaRedis(cmd));
      chip.textContent = cmd;
      parent.appendChild(chip);
      if (argv[1] != null && argv[1] !== '') {
        const key = document.createElement('span');
        key.className = 'api-log-key';
        key.textContent = String(argv[1]).slice(0, 56);
        parent.appendChild(key);
      }
      return;
    }
    const fallback = document.createElement('span');
    fallback.className = 'api-log-key';
    fallback.textContent = kindLabel(row.kind);
    parent.appendChild(fallback);
  }

  function truncDisplay(obj) {
    const s =
      obj === undefined || obj === null
        ? ''
        : typeof obj === 'string'
          ? obj
          : JSON.stringify(obj, null, 2);
    if (s.length <= TRUNC_CHARS) return s;
    return s.slice(0, TRUNC_CHARS) + '…';
  }

  function fullCopyText(row) {
    const ts = row.ts instanceof Date ? row.ts.toISOString() : String(row.ts);
    const response =
      row.errorText != null
        ? { httpStatus: row.httpStatus, error: row.errorText, body: row.response }
        : row.response;
    return (
      '--- ' +
      ts +
      ' ' +
      row.kind +
      (row.ok ? '' : ' ERR') +
      ' ---\nREQUEST:\n' +
      JSON.stringify(row.request, null, 2) +
      '\nRESPONSE:\n' +
      JSON.stringify(response, null, 2)
    );
  }

  function updateActionButtons() {
    const n = checkedIds.size;
    if (els.btnCopy) els.btnCopy.disabled = n === 0;
    if (els.btnDelete) els.btnDelete.disabled = n === 0;
  }

  function updateFooterBadge() {
    const badge = document.getElementById('api-stats-err-badge');
    if (!badge) return;
    badge.classList.toggle('is-visible', !lastOk);
  }

  function renderList() {
    if (!els.list) return;
    els.list.innerHTML = '';
    if (!apiLog.length) {
      const empty = document.createElement('p');
      empty.className = 'api-inspector-empty';
      empty.textContent = 'Nicio cerere înregistrată în sesiune.';
      els.list.appendChild(empty);
      updateActionButtons();
      return;
    }
    apiLog.forEach((row) => {
      const selected = checkedIds.has(row.id);
      const wrap = document.createElement('div');
      wrap.className =
        'api-log-row' +
        (row.ok ? '' : ' is-err') +
        (selected ? ' is-selected' : '');
      wrap.dataset.id = String(row.id);

      const head = document.createElement('div');
      head.className = 'api-log-row-head';

      const selZone = document.createElement('button');
      selZone.type = 'button';
      selZone.className = 'api-log-select-zone' + (selected ? ' is-on' : '');
      selZone.setAttribute('aria-pressed', selected ? 'true' : 'false');
      selZone.setAttribute('aria-label', selected ? 'Deselectează rând' : 'Selectează rând');
      selZone.title = 'Selectează pentru copiere / ștergere';
      selZone.innerHTML = '<span class="api-log-select-icon" aria-hidden="true"></span>';

      const body = document.createElement('div');
      body.className = 'api-log-expand-zone';
      body.title = 'Click pentru detalii request / response';

      const status = document.createElement('span');
      status.className = 'api-log-status';
      status.textContent = row.ok ? '✓' : '✗';

      const time = document.createElement('span');
      time.className = 'api-log-time';
      time.textContent = formatTime(row.ts);

      const kind = document.createElement('span');
      kind.className = 'api-log-kind';
      kind.textContent = kindLabel(row.kind);

      const sum = document.createElement('span');
      sum.className = 'api-log-summary';
      appendSummaryTo(sum, row);

      const ms = document.createElement('span');
      ms.className = 'api-log-ms';
      ms.textContent = row.durationMs != null ? row.durationMs + 'ms' : '';

      body.appendChild(status);
      body.appendChild(time);
      body.appendChild(kind);
      body.appendChild(sum);
      body.appendChild(ms);

      head.appendChild(selZone);
      head.appendChild(body);

      const detail = document.createElement('div');
      detail.className = 'api-log-detail';
      const open = expandedIds.has(row.id);
      detail.hidden = !open;
      detail.innerHTML =
        '<div class="api-log-block api-log-block-req"><strong>REQUEST</strong><pre></pre></div>' +
        '<div class="api-log-block api-log-block-res"><strong>RESPONSE</strong><pre></pre></div>';
      const pres = detail.querySelectorAll('pre');
      pres[0].textContent = truncDisplay(row.request);
      pres[1].textContent = truncDisplay(
        row.errorText
          ? { error: row.errorText, status: row.httpStatus, body: row.response }
          : row.response
      );

      body.addEventListener('click', () => {
        if (expandedIds.has(row.id)) expandedIds.delete(row.id);
        else expandedIds.add(row.id);
        detail.hidden = !expandedIds.has(row.id);
      });

      selZone.addEventListener('click', (ev) => {
        ev.stopPropagation();
        if (checkedIds.has(row.id)) checkedIds.delete(row.id);
        else checkedIds.add(row.id);
        const on = checkedIds.has(row.id);
        wrap.classList.toggle('is-selected', on);
        selZone.classList.toggle('is-on', on);
        selZone.setAttribute('aria-pressed', on ? 'true' : 'false');
        selZone.setAttribute('aria-label', on ? 'Deselectează rând' : 'Selectează rând');
        updateActionButtons();
      });

      wrap.appendChild(head);
      wrap.appendChild(detail);
      els.list.appendChild(wrap);
    });
    updateActionButtons();
  }

  function openModal() {
    if (!els.modal) return;
    modalOpen = true;
    els.modal.classList.add('open');
    els.modal.setAttribute('aria-hidden', 'false');
    renderList();
  }

  function closeModal() {
    if (!els.modal) return;
    modalOpen = false;
    els.modal.classList.remove('open');
    els.modal.setAttribute('aria-hidden', 'true');
  }

  function appendLog(entry) {
    const id = ++apiLogIdSeq;
    const row = {
      id,
      ts: new Date(),
      kind: entry.kind || 'comandaRedis',
      request: cloneSafe(entry.request),
      response: cloneSafe(entry.response),
      durationMs: entry.durationMs != null ? entry.durationMs : null,
      ok: !!entry.ok,
      httpStatus: entry.httpStatus != null ? entry.httpStatus : null,
      errorText: entry.errorText || null,
    };
    apiLog.unshift(row);
    if (apiLog.length > API_LOG_MAX) apiLog.length = API_LOG_MAX;
    lastOk = row.ok;
    updateFooterBadge();
    if (modalOpen) renderList();
  }

  function clearLog() {
    apiLog = [];
    checkedIds = new Set();
    expandedIds = new Set();
    lastOk = true;
    updateFooterBadge();
    if (modalOpen) renderList();
  }

  async function copyChecked() {
    const parts = [];
    apiLog.forEach((row) => {
      if (checkedIds.has(row.id)) parts.push(fullCopyText(row));
    });
    if (!parts.length) return;
    const text = parts.join('\n\n');
    try {
      await navigator.clipboard.writeText(text);
    } catch (e) {
      window.prompt('Copiază:', text);
    }
  }

  function deleteChecked() {
    if (!checkedIds.size) return;
    const drop = checkedIds;
    apiLog = apiLog.filter((row) => !drop.has(row.id));
    checkedIds = new Set();
    expandedIds = new Set();
    renderList();
  }

  function selectAll(on) {
    if (on) {
      apiLog.forEach((row) => checkedIds.add(row.id));
    } else {
      checkedIds = new Set();
    }
    renderList();
  }

  function init() {
    els.modal = document.getElementById('api-inspector-modal');
    els.list = document.getElementById('api-inspector-list');
    els.btnCopy = document.getElementById('api-inspector-copy');
    els.btnDelete = document.getElementById('api-inspector-delete');
    const foot = document.getElementById('api-stats-footer');
    const closeBtn = document.getElementById('api-inspector-close');
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (els.modal) {
      els.modal.addEventListener('click', (ev) => {
        if (ev.target === els.modal) closeModal();
      });
    }
    document.addEventListener('keydown', (ev) => {
      if (ev.key === 'Escape' && modalOpen) closeModal();
    });

    if (foot) {
      foot.addEventListener('click', (ev) => {
        if (ev.target.closest('.api-stats-reset')) return;
        openModal();
      });
    }

    if (els.btnCopy) els.btnCopy.addEventListener('click', () => copyChecked());
    if (els.btnDelete) els.btnDelete.addEventListener('click', () => deleteChecked());
    const btnAll = document.getElementById('api-inspector-all');
    const btnNone = document.getElementById('api-inspector-none');
    if (btnAll) btnAll.addEventListener('click', () => selectAll(true));
    if (btnNone) btnNone.addEventListener('click', () => selectAll(false));

    updateFooterBadge();
  }

  root.SsideApiInspector = {
    appendLog,
    clearLog,
    init,
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(typeof globalThis !== 'undefined' ? globalThis : window);
