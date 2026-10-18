/**
 * Panou Cron — tab Cronuri | tab Rulari.
 */
(function (root) {
  'use strict';

  let activeTab = 'jobs';
  let filterCronKey = '';

  let deps = {
    getRegistry: () => new Map(),
    isSchedulerArmed: () => false,
    onToggleSchedulerPower: null,
    onPanelShow: null,
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

  /** Următor run — programare + tick client când diferă. */
  function fmtNextRun(date, schedule) {
    if (!date) return '—';
    const Sched = root.SsideCronSchedule;
    const d = date instanceof Date ? date : new Date(date);
    if (Number.isNaN(d.getTime())) return '—';
    const sch =
      schedule && typeof schedule === 'object'
        ? schedule
        : { timezone: schedule || (Sched && Sched.DEFAULT_TZ) };
    if (Sched && typeof Sched.formatFireLineWithClientTick === 'function') {
      return Sched.formatFireLineWithClientTick(d, sch);
    }
    if (Sched && typeof Sched.formatFireForSchedule === 'function') {
      return Sched.formatFireForSchedule(d, sch).slice(0, 16);
    }
    return fmtTime(date, sch.timezone).slice(0, 16);
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
    const list = document.createElement('div');
    list.className = 'cron-job-list';

    rows.forEach((entry) => {
      const cfg = entry.config || {};
      const tz =
        (cfg.schedule && cfg.schedule.timezone) ||
        (root.SsideCronSchedule && root.SsideCronSchedule.DEFAULT_TZ) ||
        'Europe/Bucharest';

      const card = document.createElement('div');
      card.className = 'cron-job-card';

      const head = document.createElement('div');
      head.className = 'cron-job-card-main';
      const name = document.createElement('code');
      name.className = 'cron-job-name';
      name.textContent = entry.cronKey;
      const next = document.createElement('div');
      next.className = 'cron-job-next';
      next.textContent = 'Următor: ' + fmtNextRun(entry.nextRunAt, cfg.schedule);
      head.appendChild(name);
      head.appendChild(next);

      const foot = document.createElement('div');
      foot.className = 'cron-job-card-foot';

      const enLab = document.createElement('label');
      enLab.className = 'cron-job-enabled';
      const chk = document.createElement('input');
      chk.type = 'checkbox';
      chk.checked = !!cfg.enabled;
      chk.addEventListener('change', () => {
        if (deps.onToggleEnabled) deps.onToggleEnabled(entry.cronKey, chk.checked);
      });
      enLab.appendChild(chk);
      enLab.appendChild(document.createTextNode(' Activ'));

      const act = document.createElement('div');
      act.className = 'cron-panel-actions';
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

      foot.appendChild(enLab);
      foot.appendChild(act);
      card.appendChild(head);
      card.appendChild(foot);
      list.appendChild(card);
    });

    host.appendChild(list);
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

    const list = document.createElement('div');
    list.className = 'cron-run-list';

    rows.slice(0, 80).forEach(({ cronKey, tz, run }) => {
      const card = document.createElement('div');
      card.className = 'cron-run-card';
      const top = document.createElement('div');
      top.className = 'cron-run-card-top';
      top.innerHTML =
        statusBadge(run.status) +
        ' <span class="cron-run-time">' +
        escapeHtml(fmtTime(run.runAt, tz)) +
        '</span>' +
        (run.trigger
          ? ' <span class="cron-panel-sub">' + escapeHtml(run.trigger) + '</span>'
          : '');
      const keyEl = document.createElement('code');
      keyEl.className = 'cron-run-key';
      keyEl.textContent = cronKey;
      const text = run.err || run.msg || (run.skipReason ? 'skip: ' + run.skipReason : '');
      card.appendChild(top);
      card.appendChild(keyEl);
      if (text) {
        const msg = document.createElement('div');
        msg.className = 'cron-run-msg';
        msg.textContent = text;
        card.appendChild(msg);
      }
      list.appendChild(card);
    });

    host.appendChild(list);
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

  function syncSchedulerPowerUi() {
    const armed =
      typeof deps.isSchedulerArmed === 'function' ? !!deps.isSchedulerArmed() : false;
    const stateEl = document.getElementById('cron-scheduler-state');
    const powerBtn = document.getElementById('btn-cron-power');
    if (stateEl) {
      stateEl.textContent = armed ? 'ON' : 'OFF';
      stateEl.classList.toggle('is-on', armed);
      stateEl.classList.toggle('is-off', !armed);
      stateEl.title = armed
        ? 'Scheduler activ — rulează joburile programate (enabled) în acest tab'
        : 'Scheduler oprit — nu rulează tick programat; Acum (manual) merge';
    }
    if (powerBtn) {
      powerBtn.textContent = armed ? 'Oprește' : 'Pornește';
      powerBtn.className = armed ? 'btn-rosu btn-inline' : 'btn-albastru btn-inline';
      powerBtn.title = armed
        ? 'Oprește tick-ul programat (joburile rămân cu Activ on/off ca înainte)'
        : 'SCAN + registry + pornește scheduler (ca vechiul login)';
    }
  }

  function wireSchedulerPower() {
    const powerBtn = document.getElementById('btn-cron-power');
    if (!powerBtn || powerBtn._cronPowerWired) return;
    powerBtn._cronPowerWired = true;
    powerBtn.addEventListener('click', () => {
      if (!deps.onToggleSchedulerPower) return;
      const prev = powerBtn.textContent;
      powerBtn.disabled = true;
      powerBtn.textContent = '…';
      Promise.resolve(deps.onToggleSchedulerPower())
        .catch((e) => alert(e.message || String(e)))
        .finally(() => {
          powerBtn.disabled = false;
          syncSchedulerPowerUi();
        });
    });
    syncSchedulerPowerUi();
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
    wireSchedulerPower();
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
    syncSchedulerPowerUi();
    if (typeof deps.onPanelShow === 'function') {
      const reg = deps.getRegistry();
      const needsLoad = !reg || reg.size === 0;
      if (needsLoad && activeTab === 'jobs') {
        const host = document.getElementById('cron-panel-list');
        if (host) {
          host.innerHTML = '<p class="prog-live-stub">Se încarcă joburile…</p>';
        }
      }
      Promise.resolve(deps.onPanelShow())
        .catch((e) => alert(e.message || String(e)))
        .finally(() => render());
    } else {
      render();
    }
  }

  function ascunde() {
    const el = document.getElementById('ecran-cron');
    if (el) el.style.display = 'none';
  }

  root.SsideCronPanel = {
    setDeps,
    render,
    refreshFromRegistry,
    syncSchedulerPowerUi,
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
