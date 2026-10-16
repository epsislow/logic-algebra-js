/**
 * Panou Cronuri — listă joburi + acțiuni (Rulează acum, enabled).
 */
(function (root) {
  'use strict';

  let deps = {
    getRegistry: () => new Map(),
    formatFire: null,
    onOpenEdit: null,
    onToggleEnabled: null,
    onRunNow: null,
    loadStateSnippet: null,
  };

  function setDeps(partial) {
    deps = Object.assign({}, deps, partial || {});
  }

  function fmtTime(date, tz) {
    if (!date) return '—';
    const Sched = root.SsideCronSchedule;
    if (Sched && typeof Sched.formatFireInTz === 'function') {
      return Sched.formatFireInTz(date, tz || Sched.DEFAULT_TZ);
    }
    try {
      return new Date(date).toLocaleString();
    } catch (e) {
      return '—';
    }
  }

  function render() {
    const host = document.getElementById('cron-panel-list');
    if (!host) return;
    const reg = deps.getRegistry();
    const rows = Array.from(reg.values()).sort((a, b) =>
      String(a.cronKey || '').localeCompare(String(b.cronKey || ''))
    );
    if (!rows.length) {
      host.innerHTML =
        '<p class="prog-live-stub">Niciun job <code>cron:…</code> în listă. Creează cheie JSON rol Cron sau rulează SCAN <code>cron:*</code>.</p>';
      return;
    }
    host.innerHTML = '';
    const table = document.createElement('table');
    table.className = 'cron-panel-table';
    table.innerHTML =
      '<thead><tr><th>Job</th><th>Schedule</th><th>Activ</th><th>Următor</th><th>Urm. 2–3</th><th>Ultima</th><th>Mesaj</th><th></th></tr></thead>';
    const tbody = document.createElement('tbody');

    rows.forEach((entry) => {
      const cfg = entry.config || {};
      const tz =
        (cfg.schedule && cfg.schedule.timezone) ||
        (root.SsideCronSchedule && root.SsideCronSchedule.DEFAULT_TZ) ||
        'Europe/Bucharest';
      const tr = document.createElement('tr');
      const title = cfg.title ? cfg.title + ' · ' : '';
      const schedText =
        cfg.schedule && cfg.schedule.kind === 'cron'
          ? cfg.schedule.expr + ' (' + tz + ')'
          : cfg.schedule && cfg.schedule.kind === 'interval'
            ? 'interval ' + cfg.schedule.minutes + ' min (' + tz + ')'
            : '—';

      const st = entry.state || {};
      const lastLine =
        (st.lastRunAt ? st.lastRunAt.slice(0, 19) : '—') +
        ' · ' +
        (st.lastStatus || '—') +
        (st.lastTrigger === 'manual' ? ' (manual)' : '');

      let msg = st.lastErr || st.lastMsg || '';
      if (msg.length > 80) msg = msg.slice(0, 77) + '…';

      const upcoming = (entry.upcomingFires || [])
        .slice(0, 3)
        .map((d) => fmtTime(d, tz))
        .join('<br>');

      tr.innerHTML =
        '<td><code>' +
        entry.cronKey +
        '</code><br><span class="cron-panel-sub">' +
        title +
        (cfg.alg || '') +
        '</span></td>' +
        '<td><code>' +
        schedText +
        '</code></td>' +
        '<td class="cron-panel-toggle"></td>' +
        '<td>' +
        fmtTime(entry.nextRunAt, tz) +
        '</td>' +
        '<td class="cron-panel-upcoming">' +
        upcoming +
        '</td>' +
        '<td>' +
        lastLine +
        '</td>' +
        '<td title="' +
        (st.lastErr || st.lastMsg || '').replace(/"/g, '&quot;') +
        '">' +
        (msg || '—') +
        '</td>' +
        '<td class="cron-panel-actions"></td>';

      const toggleCell = tr.querySelector('.cron-panel-toggle');
      const chk = document.createElement('input');
      chk.type = 'checkbox';
      chk.checked = !!cfg.enabled;
      chk.title = 'enabled în cron:…';
      chk.addEventListener('change', () => {
        if (typeof deps.onToggleEnabled === 'function') {
          deps.onToggleEnabled(entry.cronKey, chk.checked);
        }
      });
      toggleCell.appendChild(chk);

      const act = tr.querySelector('.cron-panel-actions');
      const btnEdit = document.createElement('button');
      btnEdit.type = 'button';
      btnEdit.className = 'btn-gri btn-inline';
      btnEdit.textContent = 'Edit';
      btnEdit.onclick = () => {
        if (deps.onOpenEdit) deps.onOpenEdit(entry.cronKey);
      };
      const btnRun = document.createElement('button');
      btnRun.type = 'button';
      btnRun.className = 'btn-albastru btn-inline';
      btnRun.textContent = 'Acum';
      btnRun.title = 'Rulează acum (lock ca la tick)';
      btnRun.onclick = () => {
        if (deps.onRunNow) deps.onRunNow(entry.cronKey);
      };
      act.appendChild(btnEdit);
      act.appendChild(btnRun);

      tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    host.appendChild(table);
  }

  function refreshFromRegistry() {
    render();
  }

  function show() {
    const el = document.getElementById('ecran-cron');
    if (el) el.style.display = 'block';
    render();
  }

  function ascunde() {
    const el = document.getElementById('ecran-cron');
    if (el) el.style.display = 'none';
  }

  root.SsideCronPanel = {
    setDeps,
    render,
    refreshFromRegistry,
    show,
    ascunde,
  };

  root.deschidePanouCron = function deschidePanouCron() {
    if (root.SsideDocs) root.SsideDocs.ascunde();
    if (root.SsideSettings) root.SsideSettings.ascunde();
    document.getElementById('ecran-lista').style.display = 'none';
    document.getElementById('ecran-detaliu').style.display = 'none';
    document.getElementById('ecran-cautari-salvate').style.display = 'none';
    const rt = document.getElementById('ecran-ui-runtime');
    if (rt) rt.style.display = 'none';
    show();
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
