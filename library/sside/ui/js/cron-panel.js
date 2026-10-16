/**
 * Panou Cron — tab Cronuri | tab Rulari.
 */
(function (root) {
  'use strict';

  let activeTab = 'jobs';
  let filterCronKey = '';

  let deps = {
    getRegistry: () => new Map(),
    onOpenEdit: null,
    onToggleEnabled: null,
    onRunNow: null,
    onRefresh: null,
  };

  function setDeps(partial) {
    deps = Object.assign({}, deps, partial || {});
  }

  function fmtTime(date, tz) {
    if (!date) return '—';
    const Sched = root.SsideCronSchedule;
    const d = date instanceof Date ? date : new Date(date);
    if (Number.isNaN(d.getTime())) return '—';
    if (Sched && typeof Sched.formatFireInTz === 'function') {
      return Sched.formatFireInTz(d, tz || Sched.DEFAULT_TZ);
    }
    try {
      return d.toLocaleString();
    } catch (e) {
      return '—';
    }
  }

  function statusBadge(status) {
    const s = String(status || '—');
    let cls = 'cron-badge-neutral';
    if (s === 'ok') cls = 'cron-badge-ok';
    else if (s === 'err') cls = 'cron-badge-err';
    else if (s === 'skipped') cls = 'cron-badge-skip';
    else if (s === 'running') cls = 'cron-badge-run';
    return '<span class="cron-badge ' + cls + '">' + s + '</span>';
  }

  function collectRunRows(reg) {
    const rows = [];
    reg.forEach((entry) => {
      const cfg = entry.config || {};
      const tz =
        (cfg.schedule && cfg.schedule.timezone) ||
        (root.SsideCronSchedule && root.SsideCronSchedule.DEFAULT_TZ) ||
        'Europe/Bucharest';
      const st = entry.state || {};
      const list = Array.isArray(st.recentRuns) ? st.recentRuns : [];
      if (list.length) {
        list.forEach((run) => {
          rows.push({
            cronKey: entry.cronKey,
            title: cfg.title || '',
            tz,
            run,
          });
        });
      } else if (st.lastRunAt) {
        rows.push({
          cronKey: entry.cronKey,
          title: cfg.title || '',
          tz,
          run: {
            runAt: st.lastRunAt,
            status: st.lastStatus,
            trigger: st.lastTrigger,
            durationMs: st.lastDurationMs,
            msg: st.lastMsg,
            err: st.lastErr,
            runId: st.lastRunId,
            skipReason: st.lastSkipReason,
          },
        });
      }
    });
    rows.sort((a, b) => {
      const ta = new Date(a.run.runAt || 0).getTime();
      const tb = new Date(b.run.runAt || 0).getTime();
      return tb - ta;
    });
    return rows;
  }

  function renderJobs() {
    const host = document.getElementById('cron-panel-list');
    if (!host) return;
    const reg = deps.getRegistry();
    const rows = Array.from(reg.values()).sort((a, b) =>
      String(a.cronKey || '').localeCompare(String(b.cronKey || ''))
    );
    if (!rows.length) {
      host.innerHTML =
        '<p class="prog-live-stub">Niciun job <code>cron:…</code>. Creează cheie rol Cron sau SCAN <code>cron:*</code>.</p>';
      return;
    }
    host.innerHTML = '';
    const table = document.createElement('table');
    table.className = 'cron-panel-table';
    table.innerHTML =
      '<thead><tr><th>Job</th><th>Schedule</th><th>Activ</th><th>Următor</th><th>Urm. 2–3</th><th>Ultima rulare</th><th></th></tr></thead>';
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
      const lastWhen = st.lastRunAt ? fmtTime(st.lastRunAt, tz) : '—';
      const lastBadge = statusBadge(st.lastStatus);
      const trig =
        st.lastTrigger === 'manual'
          ? ' <span class="cron-panel-sub">manual</span>'
          : st.lastTrigger === 'scheduled'
            ? ' <span class="cron-panel-sub">programat</span>'
            : '';

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
        lastBadge +
        trig +
        '<br><span class="cron-panel-sub">' +
        lastWhen +
        '</span></td>' +
        '<td class="cron-panel-actions"></td>';

      const toggleCell = tr.querySelector('.cron-panel-toggle');
      const chk = document.createElement('input');
      chk.type = 'checkbox';
      chk.checked = !!cfg.enabled;
      chk.addEventListener('change', () => {
        if (deps.onToggleEnabled) deps.onToggleEnabled(entry.cronKey, chk.checked);
      });
      toggleCell.appendChild(chk);

      const act = tr.querySelector('.cron-panel-actions');
      const btnEdit = document.createElement('button');
      btnEdit.type = 'button';
      btnEdit.className = 'btn-gri btn-inline';
      btnEdit.textContent = 'Edit';
      btnEdit.onclick = () => deps.onOpenEdit && deps.onOpenEdit(entry.cronKey);
      const btnRun = document.createElement('button');
      btnRun.type = 'button';
      btnRun.className = 'btn-albastru btn-inline';
      btnRun.textContent = 'Acum';
      btnRun.onclick = () => deps.onRunNow && deps.onRunNow(entry.cronKey);
      const btnRuns = document.createElement('button');
      btnRuns.type = 'button';
      btnRuns.className = 'btn-gri btn-inline';
      btnRuns.textContent = 'Rulari';
      btnRuns.title = 'Tab Rulari filtrat pe acest job';
      btnRuns.onclick = () => {
        filterCronKey = entry.cronKey;
        setActiveTab('runs');
      };
      act.appendChild(btnEdit);
      act.appendChild(btnRun);
      act.appendChild(btnRuns);

      tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    host.appendChild(table);
  }

  function renderRuns() {
    const host = document.getElementById('cron-panel-runs');
    if (!host) return;
    const reg = deps.getRegistry();
    let rows = collectRunRows(reg);
    if (filterCronKey) {
      rows = rows.filter((r) => r.cronKey === filterCronKey);
    }

    host.innerHTML = '';

    const toolbar = document.createElement('div');
    toolbar.className = 'cron-runs-toolbar';
    if (filterCronKey) {
      const lab = document.createElement('span');
      lab.className = 'cron-panel-sub';
      lab.textContent = 'Filtru: ' + filterCronKey + ' ';
      const clear = document.createElement('button');
      clear.type = 'button';
      clear.className = 'btn-gri btn-inline';
      clear.textContent = 'Toate joburile';
      clear.onclick = () => {
        filterCronKey = '';
        renderRuns();
      };
      toolbar.appendChild(lab);
      toolbar.appendChild(clear);
    } else {
      const cap =
        (root.SsideCronClient && root.SsideCronClient.RECENT_RUNS_CAP) || 10;
      toolbar.innerHTML =
        '<span class="cron-panel-sub">Ultimele rulari (max ' +
        cap +
        ' per job, cele mai recente sus)</span>';
    }
    host.appendChild(toolbar);

    if (!rows.length) {
      const p = document.createElement('p');
      p.className = 'prog-live-stub';
      p.textContent = filterCronKey
        ? 'Nicio rulare înregistrată pentru acest job (încearcă „Acum”).'
        : 'Nicio rulare încă. Rulează un cron (Acum) sau așteaptă tick-ul.';
      host.appendChild(p);
      return;
    }

    const table = document.createElement('table');
    table.className = 'cron-panel-table cron-runs-table';
    table.innerHTML =
      '<thead><tr><th>Cron</th><th>Ora</th><th>Status</th><th>Trigger</th><th>Durată</th><th>Mesaj / eroare</th></tr></thead>';
    const tbody = document.createElement('tbody');

    rows.slice(0, 80).forEach(({ cronKey, title, tz, run }) => {
      const tr = document.createElement('tr');
      const text = run.err || run.msg || (run.skipReason ? 'skip: ' + run.skipReason : '—');
      const dur =
        run.durationMs != null && run.durationMs !== ''
          ? run.durationMs + ' ms'
          : '—';
      tr.innerHTML =
        '<td><code>' +
        cronKey +
        '</code>' +
        (title ? '<br><span class="cron-panel-sub">' + title + '</span>' : '') +
        '</td>' +
        '<td>' +
        fmtTime(run.runAt, tz) +
        '</td>' +
        '<td>' +
        statusBadge(run.status) +
        '</td>' +
        '<td>' +
        (run.trigger || '—') +
        '</td>' +
        '<td>' +
        dur +
        '</td>' +
        '<td class="cron-run-msg">' +
        escapeHtml(text) +
        '</td>';
      tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    host.appendChild(table);
  }

  function escapeHtml(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function syncTabUi() {
    document.querySelectorAll('[data-cron-tab]').forEach((btn) => {
      const on = btn.getAttribute('data-cron-tab') === activeTab;
      btn.classList.toggle('is-active', on);
    });
    const listEl = document.getElementById('cron-panel-list');
    const runsEl = document.getElementById('cron-panel-runs');
    if (listEl) listEl.style.display = activeTab === 'jobs' ? 'block' : 'none';
    if (runsEl) runsEl.style.display = activeTab === 'runs' ? 'block' : 'none';
  }

  function setActiveTab(tab) {
    activeTab = tab === 'runs' ? 'runs' : 'jobs';
    syncTabUi();
    if (activeTab === 'jobs') renderJobs();
    else renderRuns();
  }

  function wireTabs() {
    document.querySelectorAll('#cron-panel-tabs [data-cron-tab]').forEach((btn) => {
      if (btn._cronTabWired) return;
      btn._cronTabWired = true;
      btn.addEventListener('click', () => setActiveTab(btn.getAttribute('data-cron-tab')));
    });
    const refBtn = document.getElementById('btn-cron-refresh');
    if (refBtn && !refBtn._cronRefreshWired) {
      refBtn._cronRefreshWired = true;
      refBtn.addEventListener('click', () => {
        const run =
          (typeof deps.onRefresh === 'function' && deps.onRefresh) ||
          (typeof root.reincarcaRegistruCron === 'function' && root.reincarcaRegistruCron);
        if (!run) {
          alert('Reîncărcare indisponibilă (login necesar).');
          return;
        }
        const prev = refBtn.textContent;
        refBtn.disabled = true;
        refBtn.textContent = 'Se încarcă…';
        Promise.resolve(run())
          .catch((e) => alert(e.message || String(e)))
          .finally(() => {
            refBtn.disabled = false;
            refBtn.textContent = prev;
          });
      });
    }
  }

  function render() {
    wireTabs();
    syncTabUi();
    if (activeTab === 'jobs') renderJobs();
    else renderRuns();
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
    setActiveTab,
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
