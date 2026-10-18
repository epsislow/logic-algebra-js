/**
 * Planificare cron (5 câmpuri) + interval, IANA timezone, preview fire.
 */
(function (root) {
  'use strict';

  const DEFAULT_TZ = 'Europe/Bucharest';
  const WEEKDAY_MAP = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

  function partsFromExpr(expr) {
    const parts = String(expr || '')
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    while (parts.length < 5) parts.push('*');
    return parts.slice(0, 5);
  }

  function exprFromParts(parts) {
    const p = Array.isArray(parts) ? parts.slice(0, 5) : [];
    while (p.length < 5) p.push('*');
    return p
      .map((x) => {
        const s = String(x == null ? '' : x).trim();
        return s === '' ? '*' : s;
      })
      .join(' ');
  }

  function parseExpr(expr) {
    const parts = partsFromExpr(expr);
    if (parts.length !== 5) {
      throw new Error('expr cron: exact 5 câmpuri (min oră zi-lună lună zi-săpt)');
    }
    return {
      minute: expandField(parts[0], 0, 59),
      hour: expandField(parts[1], 0, 23),
      dom: expandField(parts[2], 1, 31),
      month: expandField(parts[3], 1, 12),
      dow: expandDowField(parts[4]),
      raw: parts,
    };
  }

  function expandField(spec, min, max) {
    const set = new Set();
    const text = String(spec || '').trim();
    if (!text) throw new Error('câmp cron gol');
    if (text === '*') {
      for (let i = min; i <= max; i++) set.add(i);
      return { all: true, values: set, spec: text };
    }
    text.split(',').forEach((part) => {
      const p = part.trim();
      if (!p) return;
      let step = 1;
      let base = p;
      if (p.includes('/')) {
        const idx = p.indexOf('/');
        base = p.slice(0, idx);
        step = parseInt(p.slice(idx + 1), 10);
        if (!Number.isFinite(step) || step < 1) throw new Error('step invalid: ' + p);
      }
      let start = min;
      let end = max;
      if (base === '*' || base === '') {
        start = min;
        end = max;
      } else if (base.includes('-')) {
        const [a, b] = base.split('-');
        start = parseInt(a, 10);
        end = parseInt(b, 10);
        if (!Number.isFinite(start) || !Number.isFinite(end)) throw new Error('interval invalid: ' + p);
      } else if (base !== '*' && base !== '' && !base.includes('-')) {
        start = parseInt(base, 10);
        if (!Number.isFinite(start)) throw new Error('număr invalid: ' + p);
        end = max;
        if (!p.includes('/')) {
          end = start;
        }
      }
      for (let v = start; v <= end; v += step) {
        if (v >= min && v <= max) set.add(v);
      }
    });
    return { all: false, values: set, spec: text };
  }

  function expandDowField(spec) {
    const f = expandField(spec, 0, 7);
    if (f.values.has(7)) {
      f.values.add(0);
      f.values.delete(7);
    }
    return f;
  }

  function getWallParts(date, timeZone) {
    const fmt = new Intl.DateTimeFormat('en-US', {
      timeZone: timeZone || DEFAULT_TZ,
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: false,
      weekday: 'short',
    });
    const map = {};
    fmt.formatToParts(date).forEach((p) => {
      if (p.type !== 'literal') map[p.type] = p.value;
    });
    let hour = parseInt(map.hour, 10);
    if (hour === 24) hour = 0;
    return {
      year: parseInt(map.year, 10),
      month: parseInt(map.month, 10),
      dom: parseInt(map.day, 10),
      hour,
      minute: parseInt(map.minute, 10),
      second: parseInt(map.second, 10),
      dow: WEEKDAY_MAP[map.weekday] != null ? WEEKDAY_MAP[map.weekday] : 0,
    };
  }

  function fieldMatches(field, value) {
    if (field.all) return true;
    return field.values.has(value);
  }

  /** Câmp restricționat fără niciun număr valid (ex. minut 99). */
  function fieldIsEmptyRestriction(field) {
    return !field.all && field.values.size === 0;
  }

  /** Expr parsabil dar fără niciun minut care poate satisface toate câmpurile. */
  function scheduleFieldsNeverFire(fields) {
    if (fieldIsEmptyRestriction(fields.minute)) return true;
    if (fieldIsEmptyRestriction(fields.hour)) return true;
    if (fieldIsEmptyRestriction(fields.month)) return true;
    const domRestricted = !fields.dom.all;
    const dowRestricted = !fields.dow.all;
    if (domRestricted && fieldIsEmptyRestriction(fields.dom)) {
      if (!dowRestricted || fieldIsEmptyRestriction(fields.dow)) return true;
    }
    if (dowRestricted && fieldIsEmptyRestriction(fields.dow)) {
      if (!domRestricted || fieldIsEmptyRestriction(fields.dom)) return true;
    }
    return false;
  }

  function cronFieldsMatch(fields, date, timeZone) {
    const w = getWallParts(date, timeZone);
    if (!fieldMatches(fields.minute, w.minute)) return false;
    if (!fieldMatches(fields.hour, w.hour)) return false;
    if (!fieldMatches(fields.month, w.month)) return false;

    const domRestricted = !fields.dom.all;
    const dowRestricted = !fields.dow.all;
    const domOk = fieldMatches(fields.dom, w.dom);
    const dowOk = fieldMatches(fields.dow, w.dow);
    if (domRestricted && dowRestricted) {
      if (!domOk && !dowOk) return false;
    } else {
      if (domRestricted && !domOk) return false;
      if (dowRestricted && !dowOk) return false;
    }
    return true;
  }

  function normalizeSchedule(schedule, legacyIntervalMinutes) {
    if (schedule && typeof schedule === 'object' && schedule.kind) {
      const s = Object.assign({}, schedule);
      if (s.kind === 'interval') {
        s.minutes = parseInt(s.minutes, 10);
        s.timezone = s.timezone || DEFAULT_TZ;
      }
      if (s.kind === 'cron') {
        s.timezone = s.timezone || DEFAULT_TZ;
      }
      if (s.startAt != null && String(s.startAt).trim() !== '') {
        s.startAt = String(s.startAt).trim();
      } else {
        delete s.startAt;
      }
      return s;
    }
    if (legacyIntervalMinutes != null) {
      return {
        kind: 'interval',
        minutes: parseInt(legacyIntervalMinutes, 10),
        timezone: DEFAULT_TZ,
      };
    }
    return null;
  }

  function scheduleTimezone(schedule) {
    const s = normalizeSchedule(schedule);
    if (!s) return DEFAULT_TZ;
    return s.timezone || DEFAULT_TZ;
  }

  function cronExprFromSchedule(schedule) {
    const s = normalizeSchedule(schedule);
    if (!s) return null;
    if (s.kind === 'cron') return String(s.expr || '').trim();
    return null;
  }

  function wallTimeToInstant(y, mo, dom, hour, minute, timeZone) {
    let guess = Date.UTC(y, mo - 1, dom, hour, minute, 0);
    for (let i = 0; i < 96; i++) {
      const w = getWallParts(new Date(guess), timeZone);
      if (
        w.year === y &&
        w.month === mo &&
        w.dom === dom &&
        w.hour === hour &&
        w.minute === minute
      ) {
        return new Date(guess);
      }
      const want = Date.UTC(y, mo - 1, dom, hour, minute, 0);
      const got = Date.UTC(w.year, w.month - 1, w.dom, w.hour, w.minute, 0);
      guess += want - got;
    }
    return null;
  }

  /** startAt: YYYY-MM-DD HH:MM[:SS] în schedule.timezone sau ISO cu offset/Z. */
  function parseScheduleStartAt(text, timeZone) {
    const s = String(text || '').trim();
    if (!s) return null;
    if (/[zZ]$|[+-]\d{2}:?\d{2}$/.test(s)) {
      const d = new Date(s);
      return Number.isNaN(d.getTime()) ? null : d;
    }
    const m = s.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?$/);
    if (!m) return null;
    const y = parseInt(m[1], 10);
    const mo = parseInt(m[2], 10);
    const dom = parseInt(m[3], 10);
    const hour = parseInt(m[4], 10);
    const minute = parseInt(m[5], 10);
    if (!Number.isFinite(y + mo + dom + hour + minute)) return null;
    return wallTimeToInstant(y, mo, dom, hour, minute, timeZone || DEFAULT_TZ);
  }

  function scheduleStartAtInstant(schedule) {
    const s = normalizeSchedule(schedule);
    if (!s || !s.startAt) return null;
    return parseScheduleStartAt(s.startAt, scheduleTimezone(s));
  }

  function validateScheduleStartAt(text, timeZone) {
    if (text == null || String(text).trim() === '') {
      return { ok: false, err: 'startAt obligatoriu pentru interval; opțional pentru cron (activ de la)' };
    }
    const d = parseScheduleStartAt(String(text).trim(), timeZone);
    if (!d) {
      return {
        ok: false,
        err: 'startAt invalid — folosește YYYY-MM-DD HH:MM în schedule.timezone',
      };
    }
    return { ok: true, date: d };
  }

  function validateIntervalMinutes(minutes) {
    const m = parseInt(minutes, 10);
    if (!Number.isFinite(m) || m < 5) {
      return { ok: false, err: 'interval.minutes minim 5' };
    }
    if (m % 5 !== 0) {
      return { ok: false, err: 'interval.minutes trebuie multiplu de 5' };
    }
    return { ok: true };
  }

  function floorToMinuteUtc(d) {
    const x = d instanceof Date ? d.getTime() : new Date(d).getTime();
    return Math.floor(x / 60000) * 60000;
  }

  function getNextIntervalFire(schedule, fromDate, opts) {
    const s = normalizeSchedule(schedule);
    if (!s || s.kind !== 'interval') return null;
    const step = parseInt(s.minutes, 10);
    const start = scheduleStartAtInstant(s);
    if (!start || !Number.isFinite(step) || step < 1) return null;
    const startMs = floorToMinuteUtc(start);
    let fromMs = floorToMinuteUtc(fromDate instanceof Date ? fromDate : new Date(fromDate));
    if (Number.isNaN(fromMs)) fromMs = floorToMinuteUtc(new Date());
    if (opts && opts.strictFuture) fromMs += 60000;
    if (fromMs <= startMs) return new Date(startMs);
    const k = Math.ceil((fromMs - startMs) / (step * 60000));
    return new Date(startMs + k * step * 60000);
  }

  function getLastIntervalFireAtOrBefore(schedule, beforeDate) {
    const s = normalizeSchedule(schedule);
    if (!s || s.kind !== 'interval') return null;
    const step = parseInt(s.minutes, 10);
    const start = scheduleStartAtInstant(s);
    if (!start || !Number.isFinite(step) || step < 1) return null;
    const startMs = floorToMinuteUtc(start);
    let endMs = floorToMinuteUtc(beforeDate instanceof Date ? beforeDate : new Date(beforeDate));
    if (Number.isNaN(endMs)) endMs = floorToMinuteUtc(new Date());
    if (endMs < startMs) return null;
    const k = Math.floor((endMs - startMs) / (step * 60000));
    return new Date(startMs + k * step * 60000);
  }

  function minMinuteGap(expr) {
    const fields = parseExpr(expr);
    if (fields.minute.all) return 1;
    const arr = Array.from(fields.minute.values).sort((a, b) => a - b);
    if (arr.length <= 1) return 60;
    let minGap = 60;
    for (let i = 1; i < arr.length; i++) {
      minGap = Math.min(minGap, arr[i] - arr[i - 1]);
    }
    minGap = Math.min(minGap, 60 - arr[arr.length - 1] + arr[0]);
    return minGap;
  }

  function validateMinuteGranularity(expr) {
    const parts = String(expr || '').trim().split(/\s+/);
    if (parts.length !== 5) return { ok: false, err: 'expr: 5 câmpuri obligatorii' };
    const minPart = parts[0];
    if (minPart.includes('/')) {
      const step = parseInt(minPart.split('/').pop(), 10);
      if (Number.isFinite(step) && step < 5) {
        return { ok: false, err: 'pas minute < 5 (tick scheduler 5 min)' };
      }
    }
    try {
      const gap = minMinuteGap(expr);
      if (gap < 5) {
        return { ok: false, err: 'expr permite fire la < 5 minute distanță' };
      }
    } catch (e) {
      return { ok: false, err: e.message || String(e) };
    }
    return { ok: true };
  }

  /** Ultima fire a schedule-ului la sau înainte de `beforeDate` (granularitate minut). */
  function getLastFireAtOrBefore(schedule, beforeDate) {
    const s = normalizeSchedule(schedule);
    if (!s) return null;
    if (s.kind === 'interval') {
      return getLastIntervalFireAtOrBefore(s, beforeDate);
    }
    const tz = scheduleTimezone(s);
    const expr = cronExprFromSchedule(s);
    if (!expr) return null;
    const fields = parseExpr(expr);
    if (scheduleFieldsNeverFire(fields)) return null;
    const startAt = scheduleStartAtInstant(s);
    const startMs = startAt ? floorToMinuteUtc(startAt) : null;
    let end = beforeDate instanceof Date ? new Date(beforeDate.getTime()) : new Date(beforeDate);
    if (Number.isNaN(end.getTime())) end = new Date();
    end.setUTCSeconds(0, 0);
    const maxSteps = 400 * 24 * 60;
    let t = end.getTime();
    for (let i = 0; i < maxSteps; i++) {
      const d = new Date(t);
      if (startMs != null && d.getTime() < startMs) break;
      if (cronFieldsMatch(fields, d, tz)) return d;
      t -= 60000;
    }
    return null;
  }

  function getNextFireAfter(schedule, fromDate, opts) {
    opts = opts || {};
    const s = normalizeSchedule(schedule);
    if (!s) return null;
    if (s.kind === 'interval') {
      return getNextIntervalFire(s, fromDate, opts);
    }
    const tz = scheduleTimezone(s);
    const expr = cronExprFromSchedule(s);
    if (!expr) return null;
    const fields = parseExpr(expr);
    if (scheduleFieldsNeverFire(fields)) return null;
    const startAt = scheduleStartAtInstant(s);
    const startMs = startAt ? floorToMinuteUtc(startAt) : null;
    let from = fromDate instanceof Date ? new Date(fromDate.getTime()) : new Date(fromDate);
    if (Number.isNaN(from.getTime())) from = new Date();
    from.setUTCSeconds(0, 0);
    if (opts.strictFuture) {
      from = new Date(from.getTime() + 60000);
    }
    const maxSteps = 400 * 24 * 60;
    let t = from.getTime();
    for (let i = 0; i < maxSteps; i++) {
      const d = new Date(t);
      if (cronFieldsMatch(fields, d, tz)) {
        if (startMs == null || d.getTime() >= startMs) return d;
      }
      t += 60000;
    }
    return null;
  }

  /** Millisecunde până la următorul slot strict viitor al schedule-ului (pentru setTimeout aliniat). */
  function msUntilNextScheduleTick(fromDate, schedule) {
    const from = fromDate instanceof Date ? fromDate : new Date(fromDate);
    const next = getNextFireAfter(schedule, from, { strictFuture: true });
    if (!next) return 5 * 60 * 1000;
    return Math.max(0, next.getTime() - from.getTime());
  }

  function getNextFires(schedule, fromDate, count, opts) {
    const n = Math.max(0, parseInt(count, 10) || 0);
    if (!n) return [];
    const out = [];
    let cursor = fromDate instanceof Date ? new Date(fromDate.getTime()) : new Date(fromDate);
    for (let i = 0; i < n; i++) {
      const next = getNextFireAfter(schedule, cursor, {
        strictFuture: i === 0 ? !!(opts && opts.strictFuture) : true,
      });
      if (!next) break;
      out.push(next);
      cursor = new Date(next.getTime());
    }
    return out;
  }

  function formatFireInTz(date, timeZone) {
    const w = getWallParts(date, timeZone);
    const pad = (x) => String(x).padStart(2, '0');
    return (
      w.year +
      '-' +
      pad(w.month) +
      '-' +
      pad(w.dom) +
      ' ' +
      pad(w.hour) +
      ':' +
      pad(w.minute) +
      ':00'
    );
  }

  const api = {
    DEFAULT_TZ,
    parseExpr,
    scheduleFieldsNeverFire,
    partsFromExpr,
    exprFromParts,
    normalizeSchedule,
    scheduleTimezone,
    cronExprFromSchedule,
    minMinuteGap,
    validateMinuteGranularity,
    validateIntervalMinutes,
    parseScheduleStartAt,
    scheduleStartAtInstant,
    validateScheduleStartAt,
    getNextFireAfter,
    getLastFireAtOrBefore,
    msUntilNextScheduleTick,
    getNextFires,
    getWallParts,
    formatFireInTz,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  root.SsideCronSchedule = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
