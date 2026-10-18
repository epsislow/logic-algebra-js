/**
 * Cron client — registry, journal, lock, run (browser + Node tests).
 */
(function (root) {
  'use strict';

  const Schedule = root.SsideCronSchedule || require('./cron-schedule.js');
  const Keys = root.SsideKeys || null;

  const JOURNAL_KEY = 'cronlog:scheduler';
  const JOURNAL_SEQ = 'cronlog:scheduler:seq';
  const JOURNAL_CAP = 200;
  const TICK_MS = 5 * 60 * 1000;
  /** Grila execuție due (aliniat la minute 0/5/10/… în fusul de referință). */
  const TICK_GRID_MINUTES = 5;
  /** Journal sync cu 2 min înainte de execuție → :03, :08, :13, … (București). */
  const JOURNAL_SYNC_CRON_EXPR = '3/5 * * * *';
  const LOCK_TTL_MAX = 240;
  const RECENT_RUNS_CAP = 10;

  function prependRecentRuns(existing, entry) {
    if (!entry || typeof entry !== 'object') {
      return Array.isArray(existing) ? existing.slice() : [];
    }
    const list = Array.isArray(existing) ? existing.slice() : [];
    list.unshift(entry);
    if (list.length > RECENT_RUNS_CAP) list.length = RECENT_RUNS_CAP;
    return list;
  }

  function cronSuffix(cronKey) {
    const k = String(cronKey || '');
    if (!k.startsWith('cron:')) return '';
    return k.slice('cron:'.length);
  }

  function stateKey(cronKey) {
    return 'cron:state:' + cronSuffix(cronKey);
  }

  function lockKey(cronKey) {
    return 'cron:lock:' + cronSuffix(cronKey);
  }

  function isCronConfigKey(key) {
    if (Keys && typeof Keys.isCronRedisKey === 'function') {
      return Keys.isCronRedisKey(key);
    }
    return /^cron:(?!state:|lock:)[^:]+$/.test(key || '');
  }

  function newRunId() {
    const t = new Date().toISOString().replace(/[-:]/g, '').replace(/\..+/, '');
    const r = Math.random().toString(36).slice(2, 8);
    return t + 'Z-' + r;
  }

  async function jsonGet(redis, key) {
    const raw = await redis.exec(['JSON.GET', key, '$']);
    if (raw == null) return null;
    let parsed;
    try {
      parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    } catch (e) {
      return null;
    }
    if (Array.isArray(parsed) && parsed.length) return parsed[0];
    if (parsed && typeof parsed === 'object') return parsed;
    return null;
  }

  async function jsonSet(redis, key, obj) {
    await redis.exec(['JSON.SET', key, '$', JSON.stringify(obj)]);
  }

  function normalizeConfig(cfg) {
    if (!cfg || typeof cfg !== 'object') return null;
    const out = Object.assign({}, cfg);
    out.schedule = Schedule.normalizeSchedule(out.schedule, out.intervalMinutes);
    if (out.enabled == null) out.enabled = false;
    if (out.mode == null) out.mode = 'client';
    if (out.timeoutSeconds == null) out.timeoutSeconds = 300;
    if (out.vars == null || typeof out.vars !== 'object' || Array.isArray(out.vars)) {
      out.vars = {};
    }
    return out;
  }

  /** Următoarea fire pentru afișare (strict viitoare). dueAt = catch-up dacă e restanțier. */
  function computeRegistryTimes(config, state, now) {
    const n = now instanceof Date ? now : new Date();
    const sched = config && config.schedule;
    if (!sched) {
      return { nextRunAt: null, dueAt: null, upcomingFires: [] };
    }
    const nextRunAt = Schedule.getNextFireAfter(sched, n, { strictFuture: true });
    let dueAt = nextRunAt;
    if (config.enabled) {
      const lastSlot =
        typeof Schedule.getLastFireAtOrBefore === 'function'
          ? Schedule.getLastFireAtOrBefore(sched, n)
          : null;
      let lastRunMs = 0;
      if (state && state.lastRunAt) {
        const lr = new Date(state.lastRunAt);
        if (!Number.isNaN(lr.getTime())) lastRunMs = lr.getTime();
      }
      if (lastSlot && lastSlot.getTime() <= n.getTime() && lastSlot.getTime() > lastRunMs) {
        dueAt = lastSlot;
      } else if (state && state.nextRunAt) {
        const prev = new Date(state.nextRunAt);
        if (!Number.isNaN(prev.getTime()) && prev.getTime() <= n.getTime()) {
          dueAt = prev;
        }
      }
    }
    const upcomingFires = nextRunAt
      ? Schedule.getNextFires(sched, n, 3, { strictFuture: true })
      : [];
    return { nextRunAt, dueAt, upcomingFires };
  }

  function buildRegistryEntry(config, state, now) {
    const cfg = normalizeConfig(config);
    if (!cfg) return null;
    const times = computeRegistryTimes(cfg, state, now);
    return {
      cronKey: null,
      config: cfg,
      state: state || null,
      nextRunAt: times.nextRunAt,
      dueAt: times.dueAt,
      upcomingFires: times.upcomingFires,
      enabledEffective: !!cfg.enabled && cfg.mode === 'client',
    };
  }

  async function appendJournal(redis, action, cronKey, hint) {
    let seq = 0;
    try {
      seq = await redis.exec(['INCR', JOURNAL_SEQ]);
    } catch (e) {
      seq = Date.now();
    }
    const msg = JSON.stringify({
      seq,
      at: new Date().toISOString(),
      action,
      cronKey,
      hint: hint || '',
    });
    await redis.exec(['RPUSH', JOURNAL_KEY, msg]);
    await redis.exec(['LTRIM', JOURNAL_KEY, -JOURNAL_CAP, -1]);
    return seq;
  }

  async function syncFromJournal(ctx) {
    const redis = ctx.deps.redis;
    let len = 0;
    try {
      len = parseInt(await redis.exec(['LLEN', JOURNAL_KEY]), 10) || 0;
    } catch (e) {
      return;
    }
    if (len < ctx.logCursor) {
      await reloadAll(ctx);
      ctx.logCursor = len;
      return;
    }
    if (len <= ctx.logCursor) return;
    const rows = await redis.exec(['LRANGE', JOURNAL_KEY, ctx.logCursor, len - 1]);
    const list = Array.isArray(rows) ? rows : [];
    for (const row of list) {
      let msg;
      try {
        msg = typeof row === 'string' ? JSON.parse(row) : row;
      } catch (e) {
        continue;
      }
      if (!msg || !msg.cronKey) continue;
      if (msg.action === 'deleted') {
        ctx.registry.delete(msg.cronKey);
      } else {
        await reloadOne(ctx, msg.cronKey);
      }
    }
    ctx.logCursor = len;
    notifyRegistry(ctx);
  }

  async function reloadOne(ctx, cronKey) {
    if (!isCronConfigKey(cronKey)) return;
    const cfg = await jsonGet(ctx.deps.redis, cronKey);
    if (!cfg) {
      ctx.registry.delete(cronKey);
      notifyRegistry(ctx);
      return;
    }
    const st = await jsonGet(ctx.deps.redis, stateKey(cronKey));
    const entry = buildRegistryEntry(cfg, st, new Date());
    if (entry) {
      entry.cronKey = cronKey;
      ctx.registry.set(cronKey, entry);
    }
    notifyRegistry(ctx);
  }

  async function reloadAll(ctx) {
    ctx.registry.clear();
    const keys = await ctx.deps.listCronKeys();
    const sorted = (keys || []).filter(isCronConfigKey).sort();
    for (const k of sorted) {
      await reloadOne(ctx, k);
    }
    try {
      ctx.logCursor = parseInt(await ctx.deps.redis.exec(['LLEN', JOURNAL_KEY]), 10) || 0;
    } catch (e) {
      ctx.logCursor = 0;
    }
    notifyRegistry(ctx);
  }

  function notifyRegistry(ctx) {
    if (typeof ctx.deps.onRegistryChange === 'function') {
      ctx.deps.onRegistryChange(ctx.registry);
    }
  }

  function lockTtlSeconds(config) {
    const t = parseInt(config.timeoutSeconds, 10) || 300;
    return Math.min(Math.max(1, t), LOCK_TTL_MAX);
  }

  async function tryAcquireLock(redis, cronKey, runId, config) {
    const ttl = lockTtlSeconds(config);
    const res = await redis.exec(['SET', lockKey(cronKey), runId, 'NX', 'EX', String(ttl)]);
    return res === 'OK';
  }

  async function releaseLock(redis, cronKey) {
    try {
      await redis.exec(['DEL', lockKey(cronKey)]);
    } catch (e) {
      /* ignore */
    }
  }

  async function writeState(redis, cronKey, patch, recentEntry) {
    const sk = stateKey(cronKey);
    let cur = await jsonGet(redis, sk);
    if (!cur || typeof cur !== 'object') cur = {};
    const next = Object.assign({}, cur, patch);
    if (recentEntry) {
      next.recentRuns = prependRecentRuns(cur.recentRuns, recentEntry);
    }
    await jsonSet(redis, sk, next);
    return next;
  }

  async function runOnce(ctx, cronKey, trigger) {
    trigger = trigger === 'manual' ? 'manual' : 'scheduled';
    const entry = ctx.registry.get(cronKey);
    if (!entry || !entry.config) return { ok: false, reason: 'missing' };
    const cfg = entry.config;
    if (!cfg.enabled && trigger === 'scheduled') {
      return { ok: false, reason: 'disabled' };
    }
    if (trigger === 'scheduled') {
      const now = new Date();
      const times = computeRegistryTimes(cfg, entry.state, now);
      entry.dueAt = times.dueAt;
      entry.nextRunAt = times.nextRunAt;
      entry.upcomingFires = times.upcomingFires;
      const dueRef = times.dueAt || times.nextRunAt;
      if (!dueRef || dueRef.getTime() > now.getTime()) {
        return { ok: false, reason: 'not_due' };
      }
    }
    if (cfg.mode !== 'client') {
      return { ok: false, reason: 'mode' };
    }
    if (!cfg.alg) {
      return { ok: false, reason: 'no_alg' };
    }

    const redis = ctx.deps.redis;
    const runId = newRunId();
    const scheduledAt = (entry.dueAt || entry.nextRunAt)
      ? (entry.dueAt || entry.nextRunAt).toISOString()
      : null;
    const tickAt = new Date().toISOString();

    const locked = await tryAcquireLock(redis, cronKey, runId, cfg);
    if (!locked) {
      const skipAt = new Date().toISOString();
      await writeState(
        redis,
        cronKey,
        {
          lastStatus: 'skipped',
          lastSkipReason: 'lock',
          lastRunId: runId,
        },
        {
          runAt: skipAt,
          status: 'skipped',
          trigger,
          runId,
          durationMs: 0,
          msg: null,
          err: null,
          skipReason: 'lock',
        }
      );
      await reloadOne(ctx, cronKey);
      return { ok: false, reason: 'lock' };
    }

    const started = Date.now();
    await writeState(redis, cronKey, {
      runningSince: new Date(started).toISOString(),
      lastStatus: 'running',
      lastRunId: runId,
      lastAlgKey: cfg.alg,
    });

    let result = { err: 'onRunAlg lipsă' };
    try {
      if (typeof ctx.deps.onRunAlg === 'function') {
        result = await ctx.deps.onRunAlg({
          algKey: cfg.alg,
          form: {},
          list: {},
          vars: Object.assign({}, cfg.vars, {
            cron: { key: cronKey, runId, scheduledAt, tickAt, trigger },
          }),
          btn: { id: 'cron', label: 'cron' },
          uiContext: null,
          cronMode: true,
        });
      }
    } catch (e) {
      result = { err: e.message || String(e) };
    }

    const durationMs = Date.now() - started;
    const lastRunAt = new Date().toISOString();
    let lastStatus = 'ok';
    let lastMsg = result && result.msg != null ? String(result.msg) : null;
    let lastErr = result && result.err != null ? String(result.err) : null;
    if (lastErr) lastStatus = 'err';

    const after = new Date();
    const nextRunAt = Schedule.getNextFireAfter(cfg.schedule, after, { strictFuture: true });

    await writeState(
      redis,
      cronKey,
      {
        lastRunAt,
        lastDurationMs: durationMs,
        lastStatus,
        lastMsg,
        lastErr,
        lastRunId: runId,
        lastAlgKey: cfg.alg,
        lastTrigger: trigger,
        runningSince: null,
        lastSkipReason: null,
        nextRunAt: nextRunAt ? nextRunAt.toISOString() : null,
      },
      {
        runAt: lastRunAt,
        status: lastStatus,
        trigger,
        runId,
        durationMs,
        msg: lastMsg,
        err: lastErr,
        skipReason: null,
      }
    );

    await releaseLock(redis, cronKey);
    await reloadOne(ctx, cronKey);
    return { ok: !lastErr, status: lastStatus, durationMs };
  }

  async function runDueJobs(ctx) {
    const keys = Array.from(ctx.registry.keys()).sort();
    const out = [];
    for (const k of keys) {
      const r = await runOnce(ctx, k, 'scheduled');
      if (r.reason !== 'not_due' && r.reason !== 'disabled') out.push({ cronKey: k, result: r });
    }
    return out;
  }

  function tickGridSchedule() {
    return {
      kind: 'interval',
      minutes: TICK_GRID_MINUTES,
      timezone: Schedule.DEFAULT_TZ || 'Europe/Bucharest',
    };
  }

  function journalSyncSchedule() {
    return {
      kind: 'cron',
      expr: JOURNAL_SYNC_CRON_EXPR,
      timezone: Schedule.DEFAULT_TZ || 'Europe/Bucharest',
    };
  }

  function createScheduler(deps) {
    const ctx = {
      deps: Object.assign(
        {
          redis: null,
          listCronKeys: async () => [],
          onRunAlg: null,
          onRegistryChange: null,
        },
        deps || {}
      ),
      registry: new Map(),
      logCursor: 0,
      timers: [],
      gridTimerId: null,
      journalTimerId: null,
    };

    function stopTimers() {
      ctx.timers.forEach((id) => {
        clearInterval(id);
        clearTimeout(id);
      });
      ctx.timers = [];
      if (ctx.gridTimerId != null) {
        clearTimeout(ctx.gridTimerId);
        ctx.gridTimerId = null;
      }
      if (ctx.journalTimerId != null) {
        clearTimeout(ctx.journalTimerId);
        ctx.journalTimerId = null;
      }
    }

    function scheduleGridTick() {
      if (ctx.gridTimerId != null) {
        clearTimeout(ctx.gridTimerId);
        ctx.gridTimerId = null;
      }
      const delay = Schedule.msUntilNextScheduleTick(new Date(), tickGridSchedule());
      ctx.gridTimerId = setTimeout(() => {
        ctx.gridTimerId = null;
        runDueJobs(ctx)
          .catch(() => {})
          .finally(() => scheduleGridTick());
      }, delay);
    }

    function scheduleJournalSync() {
      if (ctx.journalTimerId != null) {
        clearTimeout(ctx.journalTimerId);
        ctx.journalTimerId = null;
      }
      const delay = Schedule.msUntilNextScheduleTick(new Date(), journalSyncSchedule());
      ctx.journalTimerId = setTimeout(() => {
        ctx.journalTimerId = null;
        syncFromJournal(ctx)
          .catch(() => {})
          .finally(() => scheduleJournalSync());
      }, delay);
    }

    function start() {
      stopTimers();
      scheduleJournalSync();
      scheduleGridTick();
    }

    function stop() {
      stopTimers();
      ctx.registry.clear();
      ctx.logCursor = 0;
    }

    return {
      ctx,
      reloadAll: () => reloadAll(ctx),
      reloadOne: (k) => reloadOne(ctx, k),
      syncFromJournal: () => syncFromJournal(ctx),
      runDueJobs: () => runDueJobs(ctx),
      runOnce: (k, trigger) => runOnce(ctx, k, trigger),
      appendJournal: (action, cronKey, hint) => appendJournal(ctx.deps.redis, action, cronKey, hint),
      start,
      stop,
      getRegistry: () => ctx.registry,
    };
  }

  const api = {
    JOURNAL_KEY,
    TICK_MS,
    TICK_GRID_MINUTES,
    JOURNAL_SYNC_CRON_EXPR,
    RECENT_RUNS_CAP,
    prependRecentRuns,
    cronSuffix,
    stateKey,
    lockKey,
    isCronConfigKey,
    normalizeConfig,
    buildRegistryEntry,
    appendJournal,
    createScheduler,
    runOnce,
    jsonGet,
    jsonSet,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  root.SsideCronClient = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
