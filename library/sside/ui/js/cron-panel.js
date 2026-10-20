/**
 * Panou Cron — tab Cronuri | tab Rulari.
 */
(function (root) {
  'use strict';

  let activeTab = 'jobs';
  /** Id rând Rulari expandat (un singur mesaj deschis). */
  let expandedRunId = '';

  const Ui = root.SsideCronPanelUi || {};
  const createEmptyJobFilters =
    typeof Ui.createEmptyJobFilters === 'function'
      ? Ui.createEmptyJobFilters
      : function () {
          return { name: '', mode: '', enabled: '' };
        };
  const createEmptyRunFilters =
    typeof Ui.createEmptyRunFilters === 'function'
      ? Ui.createEmptyRunFilters
      : function () {
          return { name: '', mode: '', trigger: '', status: '' };
        };
  let jobFilters = createEmptyJobFilters();
  let runFilters = createEmptyRunFilters();

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

  const PanelUi = root.SsideCronPanelUi || {};
  const cronRunExpandId =
    typeof PanelUi.cronRunExpandId === 'function'
      ? PanelUi.cronRunExpandId
      : function cronRunExpandIdFallback(cronKey, run) {
          return (
            String(cronKey || '') +
            '::' +
            String((run && run.runAt) || '') +
            '::' +
            String((run && run.runId) || '')
          );
        };

  function mountStatusBadge(status) {
    const s = String(status || '—').toLowerCase();
    let cls = 'cron-badge-neutral';
    if (s === 'ok') cls = 'cron-badge-ok';
    else if (s === 'err') cls = 'cron-badge-err';
    else if (s === 'skipped') cls = 'cron-badge-skip';
    else if (s === 'running') cls = 'cron-badge-run';
    const span = document.createElement('span');
    span.className = 'cron-badge ' + cls;
    span.textContent = s;
    return span;
  }

  function mountTriggerBadge(trigger) {
    const t = String(trigger || '').toLowerCase();
    if (!t) return null;
    const span = document.createElement('span');
    const kind = t === 'scheduled' || t === 'manual' ? t : 'other';
    span.className = 'cron-trigger-badge cron-trigger-badge--' + kind;
    if (t === 'scheduled') {
      span.classList.add('cron-trigger-badge--icon');
      span.textContent = '\u23F0';
      span.setAttribute('aria-label', 'Programat (scheduled)');
      span.title = 'Programat — tick / schedule';
    } else if (t === 'manual') {
      span.classList.add('cron-trigger-badge--icon');
      span.textContent = '\u25B6';
      span.setAttribute('aria-label', 'Manual (Acum)');
      span.title = 'Manual — Rulează acum';
    } else {
      span.textContent = t;
      span.title = 'trigger: ' + t;
    }
    return span;
  }

  function mountEnabledPill(entry, cfg) {
    const lab = document.createElement('label');
    lab.className =
      'cron-job-pill' + (cfg.enabled ? ' is-on' : ' is-off');
    const chk = document.createElement('input');
    chk.type = 'checkbox';
    chk.className = 'cron-job-pill-input';
    chk.checked = !!cfg.enabled;
    chk.setAttribute('aria-label', 'Activ job ' + entry.cronKey);
    const txt = document.createElement('span');
    txt.className = 'cron-job-pill-text';
    txt.textContent = cfg.enabled ? 'ON' : 'OFF';
    chk.addEventListener('change', () => {
      lab.classList.toggle('is-on', chk.checked);
      lab.classList.toggle('is-off', !chk.checked);
      txt.textContent = chk.checked ? 'ON' : 'OFF';
      if (deps.onToggleEnabled) deps.onToggleEnabled(entry.cronKey, chk.checked);
    });
    lab.appendChild(chk);
    lab.appendChild(txt);
    return lab;
  }

  /** Badge client (browser) vs edge (Supabase) — panou Edit / legacy. */
  function mountCronHostBadge(cfg) {
    const mode = cfg && cfg.mode === 'edge' ? 'edge' : 'client';
    const span = document.createElement('span');
    span.className = 'cron-host-badge cron-host-badge--' + mode;
    span.title =
      mode === 'edge'
        ? 'Mod edge — Supabase (pg_cron la 5 min)'
        : 'Mod client — browser (panou Cron → Pornește)';
    const icon = document.createElement('span');
    icon.className = 'cron-host-badge-icon';
    icon.setAttribute('aria-hidden', 'true');
    span.appendChild(icon);
    const lab = document.createElement('span');
    lab.className = 'cron-host-badge-label';
    lab.textContent = mode;
    span.appendChild(lab);
    return span;
  }

  function filterJobs(entries) {
    if (typeof Ui.filterJobEntries === 'function') {
      return Ui.filterJobEntries(entries, jobFilters);
    }
    return entries;
  }

  function filterRuns(rows) {
    if (typeof Ui.filterRunRows === 'function') {
      return Ui.filterRunRows(rows, runFilters);
    }
    return rows;
  }

  function jobFiltersActiveNow() {
    return typeof Ui.jobFiltersActive === 'function'
      ? Ui.jobFiltersActive(jobFilters)
      : false;
  }

  function runFiltersActiveNow() {
    return typeof Ui.runFiltersActive === 'function'
      ? Ui.runFiltersActive(runFilters)
      : false;
  }

  function clearJobFilters() {
    jobFilters = createEmptyJobFilters();
    renderJobs();
  }

  function clearRunFilters() {
    runFilters = createEmptyRunFilters();
    expandedRunId = '';
    renderRuns();
  }

  function appendSelect(parent, labelText, value, options, onChange) {
    const wrap = document.createElement('label');
    wrap.className = 'cron-filter-field';
    const lab = document.createElement('span');
    lab.className = 'cron-filter-label';
    lab.textContent = labelText;
    const sel = document.createElement('select');
    sel.className = 'cron-filter-select';
    options.forEach((o) => {
      const opt = document.createElement('option');
      opt.value = o.value;
      opt.textContent = o.label;
      if (o.value === value) opt.selected = true;
      sel.appendChild(opt);
    });
    sel.addEventListener('change', () => onChange(sel.value));
    wrap.appendChild(lab);
    wrap.appendChild(sel);
    parent.appendChild(wrap);
  }

  function createFiltersInner(kind) {
    const inner = document.createElement('div');
    inner.className = 'cron-panel-filters-inner cron-panel-filters-inner--' + kind;
    return inner;
  }

  function renderJobsToolbar() {
    const host = document.getElementById('cron-panel-jobs-toolbar');
    if (!host) return;
    host.innerHTML = '';
    const bar = document.createElement('div');
    bar.className = 'cron-panel-filters cron-panel-filters--jobs';
    const inner = createFiltersInner('jobs');

    const nameWrap = document.createElement('label');
    nameWrap.className = 'cron-filter-field cron-filter-field--grow';
    const nameLab = document.createElement('span');
    nameLab.className = 'cron-filter-label';
    nameLab.textContent = 'Nume';
    const nameIn = document.createElement('input');
    nameIn.type = 'text';
    nameIn.className = 'cron-filter-input';
    nameIn.placeholder = 'blabla → cron:blabla… · *nume → conține';
    nameIn.value = jobFilters.name;
    nameIn.addEventListener('input', () => {
      jobFilters.name = nameIn.value;
      renderJobsList();
      updateJobFilterActions();
    });
    nameWrap.appendChild(nameLab);
    nameWrap.appendChild(nameIn);
    inner.appendChild(nameWrap);

    appendSelect(
      inner,
      'Mode',
      jobFilters.mode,
      [
        { value: '', label: 'Toate' },
        { value: 'client', label: 'client' },
        { value: 'edge', label: 'edge' },
      ],
      (v) => {
        jobFilters.mode = v;
        renderJobsList();
        updateJobFilterActions();
      }
    );

    appendSelect(
      inner,
      'Activ',
      jobFilters.enabled,
      [
        { value: '', label: 'Toate' },
        { value: 'on', label: 'ON' },
        { value: 'off', label: 'OFF' },
      ],
      (v) => {
        jobFilters.enabled = v;
        renderJobsList();
        updateJobFilterActions();
      }
    );

    bar.appendChild(inner);
    bar.appendChild(createFilterClearField('cron-panel-jobs-filter-actions'));
    host.appendChild(bar);
    updateJobFilterActions();
  }

  function createFilterClearField(actionsId) {
    const wrap = document.createElement('div');
    wrap.className = 'cron-filter-field-clear';
    const lab = document.createElement('span');
    lab.className = 'cron-filter-label cron-filter-label--spacer';
    lab.setAttribute('aria-hidden', 'true');
    lab.textContent = '\u00a0';
    const actions = document.createElement('div');
    actions.className = 'cron-filter-actions';
    actions.id = actionsId;
    wrap.appendChild(lab);
    wrap.appendChild(actions);
    return wrap;
  }

  function mountFilterClearButton(actions, isActive, onClear) {
    if (!actions) return;
    actions.innerHTML = '';
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'cron-filter-clear-btn';
    if (isActive) {
      btn.classList.add('cron-filter-clear-btn--active', 'btn-rosu');
      btn.textContent = '\u00D7';
      btn.title = 'Șterge filtrele';
      btn.setAttribute('aria-label', 'Șterge filtrele');
      btn.addEventListener('click', onClear);
    } else {
      btn.classList.add('cron-filter-clear-btn--idle', 'btn-galben');
      btn.disabled = true;
      btn.textContent = '\u2610';
      btn.setAttribute('aria-label', 'Filtre inactive');
    }
    actions.appendChild(btn);
  }

  function updateJobFilterActions() {
    const actions = document.getElementById('cron-panel-jobs-filter-actions');
    mountFilterClearButton(actions, jobFiltersActiveNow(), clearJobFilters);
  }

  function updateRunFilterActions() {
    const actions = document.getElementById('cron-panel-runs-filter-actions');
    mountFilterClearButton(actions, runFiltersActiveNow(), clearRunFilters);
  }

  function renderRunsToolbar() {
    const host = document.getElementById('cron-panel-runs-toolbar');
    if (!host) return;
    host.innerHTML = '';
    const bar = document.createElement('div');
    bar.className = 'cron-panel-filters cron-panel-filters--runs';
    const inner = createFiltersInner('runs');

    const nameWrap = document.createElement('label');
    nameWrap.className = 'cron-filter-field cron-filter-field--grow';
    const nameLab = document.createElement('span');
    nameLab.className = 'cron-filter-label';
    nameLab.textContent = 'Nume';
    const nameIn = document.createElement('input');
    nameIn.type = 'text';
    nameIn.className = 'cron-filter-input';
    nameIn.placeholder = 'blabla → cron:blabla… · *nume → conține';
    nameIn.value = runFilters.name;
    nameIn.addEventListener('input', () => {
      runFilters.name = nameIn.value;
      renderRunsList();
      updateRunFilterActions();
    });
    nameWrap.appendChild(nameLab);
    nameWrap.appendChild(nameIn);
    inner.appendChild(nameWrap);

    appendSelect(
      inner,
      'Mode',
      runFilters.mode,
      [
        { value: '', label: 'Toate' },
        { value: 'client', label: 'client' },
        { value: 'edge', label: 'edge' },
      ],
      (v) => {
        runFilters.mode = v;
        renderRunsList();
        updateRunFilterActions();
      }
    );

    appendSelect(
      inner,
      'Trigger',
      runFilters.trigger,
      [
        { value: '', label: 'Toate' },
        { value: 'scheduled', label: 'scheduled' },
        { value: 'manual', label: 'manual' },
      ],
      (v) => {
        runFilters.trigger = v;
        renderRunsList();
        updateRunFilterActions();
      }
    );

    appendSelect(
      inner,
      'Status',
      runFilters.status,
      [
        { value: '', label: 'Toate' },
        { value: 'ok', label: 'ok' },
        { value: 'not_ok', label: 'nu ok' },
      ],
      (v) => {
        runFilters.status = v;
        renderRunsList();
        updateRunFilterActions();
      }
    );

    bar.appendChild(inner);
    bar.appendChild(createFilterClearField('cron-panel-runs-filter-actions'));
    host.appendChild(bar);
    updateRunFilterActions();
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
            runHost: st.lastRunHost,
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

  function renderJobsList() {
    const host = document.getElementById('cron-panel-list');
    if (!host) return;
    const reg = deps.getRegistry();
    let rows = Array.from(reg.values()).sort((a, b) =>
      String(a.cronKey || '').localeCompare(String(b.cronKey || ''))
    );
    rows = filterJobs(rows);
    host.innerHTML = '';
    if (!rows.length) {
      const p = document.createElement('p');
      p.className = 'prog-live-stub';
      p.textContent = jobFiltersActiveNow()
        ? 'Niciun job nu potrivește filtrelor.'
        : 'Niciun job cron:…. Creează cheie rol Cron sau SCAN cron:*.';
      host.appendChild(p);
      return;
    }
    const list = document.createElement('div');
    list.className = 'cron-job-list';

    rows.forEach((entry) => {
      const cfg = entry.config || {};
      const row = document.createElement('div');
      row.className = 'cron-job-row';

      const main = document.createElement('div');
      main.className = 'cron-job-row-main';

      main.appendChild(mountEnabledPill(entry, cfg));
      main.appendChild(mountCronHostBadge(cfg));

      const nameBtn = document.createElement('button');
      nameBtn.type = 'button';
      nameBtn.className = 'cron-job-name-btn';
      nameBtn.title = 'Editare cron';
      const nameCode = document.createElement('code');
      nameCode.className = 'cron-job-name';
      nameCode.textContent = entry.cronKey;
      nameBtn.appendChild(nameCode);
      nameBtn.addEventListener('click', (ev) => {
        ev.stopPropagation();
        if (deps.onOpenEdit) deps.onOpenEdit(entry.cronKey);
      });
      main.appendChild(nameBtn);

      const next = document.createElement('span');
      next.className = 'cron-job-next-inline';
      const nextText = fmtNextRun(entry.nextRunAt, cfg.schedule);
      next.textContent = nextText;
      next.title = nextText;
      main.appendChild(next);

      const act = document.createElement('div');
      act.className = 'cron-job-row-actions';
      const btnRun = document.createElement('button');
      btnRun.type = 'button';
      btnRun.className = 'cron-icon-btn cron-icon-btn--run';
      btnRun.textContent = '\u25B6';
      btnRun.title = 'Rulează acum (Acum)';
      btnRun.setAttribute('aria-label', 'Rulează acum');
      btnRun.addEventListener('click', (ev) => {
        ev.stopPropagation();
        if (deps.onRunNow) deps.onRunNow(entry.cronKey);
      });
      const btnRuns = document.createElement('button');
      btnRuns.type = 'button';
      btnRuns.className = 'cron-icon-btn cron-icon-btn--runs';
      btnRuns.textContent = '\u2630';
      btnRuns.title = 'Rulari pentru acest job';
      btnRuns.setAttribute('aria-label', 'Rulari filtrate');
      btnRuns.addEventListener('click', (ev) => {
        ev.stopPropagation();
        const suffix = String(entry.cronKey || '').replace(/^cron:/i, '');
        runFilters = createEmptyRunFilters();
        runFilters.name = suffix;
        expandedRunId = '';
        setActiveTab('runs');
      });
      act.appendChild(btnRun);
      act.appendChild(btnRuns);
      main.appendChild(act);

      row.appendChild(main);
      list.appendChild(row);
    });

    host.appendChild(list);
  }

  function renderJobs() {
    renderJobsToolbar();
    renderJobsList();
  }

  function renderRunsList() {
    const host = document.getElementById('cron-panel-runs-list');
    if (!host) return;
    const reg = deps.getRegistry();
    let rows = filterRuns(collectRunRows(reg));

    host.innerHTML = '';

    if (!rows.length) {
      const p = document.createElement('p');
      p.className = 'prog-live-stub';
      p.textContent = runFiltersActiveNow()
        ? 'Nicio rulare nu potrivește filtrelor.'
        : 'Nicio rulare încă. Rulează un cron (Acum) sau așteaptă tick-ul.';
      host.appendChild(p);
      return;
    }

    const list = document.createElement('div');
    list.className = 'cron-run-list';

    rows.slice(0, 80).forEach(({ cronKey, tz, run }) => {
      const expandId = cronRunExpandId(cronKey, run);
      const isOpen = expandedRunId === expandId;
      const text =
        run.err ||
        run.msg ||
        (run.skipReason ? 'skip: ' + run.skipReason : '');
      const runHostMode =
        run.runHost === 'edge' || run.runHost === 'client' ? run.runHost : '';
      const trigger = run.trigger ? String(run.trigger) : '';

      const item = document.createElement('div');
      item.className = 'cron-run-item' + (isOpen ? ' is-open' : '');

      const rowBtn = document.createElement('button');
      rowBtn.type = 'button';
      rowBtn.className = 'cron-run-row';
      rowBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');

      const parts = document.createElement('span');
      parts.className = 'cron-run-row-parts';

      parts.appendChild(mountStatusBadge(run.status));

      const tm = document.createElement('span');
      tm.className = 'cron-run-time';
      tm.textContent = fmtTime(run.runAt, tz);
      parts.appendChild(tm);

      const keyEl = document.createElement('code');
      keyEl.className = 'cron-run-key';
      keyEl.textContent = cronKey;
      parts.appendChild(keyEl);

      if (runHostMode) {
        const hb = mountCronHostBadge({ mode: runHostMode });
        hb.classList.add('cron-host-badge--run');
        parts.appendChild(hb);
      }
      const trBadge = mountTriggerBadge(trigger);
      if (trBadge) parts.appendChild(trBadge);

      rowBtn.appendChild(parts);
      rowBtn.addEventListener('click', () => {
        expandedRunId = expandedRunId === expandId ? '' : expandId;
        renderRunsList();
      });

      item.appendChild(rowBtn);

      if (isOpen) {
        const detail = document.createElement('div');
        detail.className = 'cron-run-detail';
        detail.textContent = text || '—';
        if (run.durationMs != null && !Number.isNaN(Number(run.durationMs))) {
          detail.textContent +=
            (text ? '\n' : '') + 'Durată: ' + run.durationMs + ' ms';
        }
        item.appendChild(detail);
      }

      list.appendChild(item);
    });

    host.appendChild(list);
  }

  function renderRuns() {
    renderRunsToolbar();
    renderRunsList();
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
    const jobsEl = document.getElementById('cron-panel-jobs');
    const runsEl = document.getElementById('cron-panel-runs');
    if (jobsEl) jobsEl.style.display = activeTab === 'jobs' ? 'block' : 'none';
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
      stateEl.textContent = armed ? 'client ON' : 'client OFF';
      stateEl.classList.toggle('is-on', armed);
      stateEl.classList.toggle('is-off', !armed);
      stateEl.title = armed
        ? 'Scheduler client activ — tick programat pentru joburi mode client în acest tab'
        : 'Scheduler client oprit — fără tick programat; Acum (manual) merge; edge pe server separat';
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
    /** @internal test / debug */
    cronRunExpandId,
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
