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
    if (s.kind === 'interval') {
      const m = parseInt(s.minutes, 10);
      if (!Number.isFinite(m)) return null;
      return '*/' + m + ' * * * *';
    }
    return null;
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

  function getNextFireAfter(schedule, fromDate, opts) {
    opts = opts || {};
    const s = normalizeSchedule(schedule);
    if (!s) return null;
    const tz = scheduleTimezone(s);
    const expr = cronExprFromSchedule(s);
    if (!expr) return null;
    const fields = parseExpr(expr);
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
      if (cronFieldsMatch(fields, d, tz)) return d;
      t += 60000;
    }
    return null;
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
    partsFromExpr,
    exprFromParts,
    normalizeSchedule,
    scheduleTimezone,
    cronExprFromSchedule,
    minMinuteGap,
    validateMinuteGranularity,
    getNextFireAfter,
    getNextFires,
    getWallParts,
    formatFireInTz,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  root.SsideCronSchedule = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
