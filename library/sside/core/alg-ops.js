/**
 * Helpers runner: refs, schema check/gen, whitelist redis, argv k*.
 */
(function (root) {
  'use strict';

  const REDIS_ALLOW = new Set([
    'GET', 'SET', 'DEL', 'TYPE', 'EXISTS', 'TTL', 'PTTL', 'EXPIRE', 'PERSIST',
    'JSON.GET', 'JSON.SET', 'JSON.DEL', 'JSON.TYPE',
    'SADD', 'SREM', 'SMEMBERS', 'SISMEMBER', 'SCARD',
    'RPUSH', 'LPUSH', 'LRANGE', 'LREM', 'LLEN', 'LINDEX', 'LSET',
    'HSET', 'HGET', 'HDEL', 'HGETALL', 'HINCRBY',
    'ZADD', 'ZREM', 'ZRANGE', 'ZSCORE',
    'INCR', 'INCRBY', 'DECR', 'DECRBY', 'MGET',
  ]);

  function isIdent(s) {
    return typeof s === 'string' && /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(s);
  }

  function getPath(obj, path) {
    if (path === '' || path == null) return obj;
    const parts = String(path).split('.');
    let cur = obj;
    for (const p of parts) {
      if (cur == null || typeof cur !== 'object') return undefined;
      cur = cur[p];
    }
    return cur;
  }

  function setPath(obj, path, val) {
    const parts = String(path).split('.');
    let cur = obj;
    for (let i = 0; i < parts.length - 1; i++) {
      const p = parts[i];
      if (cur[p] == null || typeof cur[p] !== 'object') cur[p] = {};
      cur = cur[p];
    }
    cur[parts[parts.length - 1]] = val;
  }

  /**
   * Rezolvă ref DSL: form / form.x / $var / ident var / literal.
   */
  function resolveRef(ref, ctx) {
    if (ref === null || ref === undefined) return ref;
    if (typeof ref !== 'string') return ref;

    if (ref === 'form') return ctx.form;
    if (ref.indexOf('form.') === 0) {
      return getPath(ctx.form, ref.slice(5));
    }
    if (ref === 'list') return ctx.list;
    if (ref.indexOf('list.') === 0) {
      return getPath(ctx.list || {}, ref.slice(5));
    }
    if (ref.charAt(0) === '$') {
      return getPath(ctx.vars, ref.slice(1));
    }
    if (isIdent(ref)) {
      if (Object.prototype.hasOwnProperty.call(ctx.vars, ref)) {
        return getPath(ctx.vars, ref);
      }
      // nu e în vars → literal (ex. membru kadd: "tag")
      return ref;
    }
    return ref; // literal string (ex. "data:_item:")
  }

  function setVar(ctx, to, val) {
    if (!to || typeof to !== 'string') throw new Error('assign/cat: lipsește to');
    const name = to.charAt(0) === '$' ? to.slice(1) : to;
    if (!name) throw new Error('to invalid');
    setPath(ctx.vars, name, val);
  }

  function defaultFromSchema(schema) {
    if (!schema || typeof schema !== 'object') return null;
    if (Object.prototype.hasOwnProperty.call(schema, 'default')) {
      const d = schema.default;
      const emptyObjDefault =
        d !== null && typeof d === 'object' && !Array.isArray(d) && Object.keys(d).length === 0;
      if (!(emptyObjDefault && schema.properties && Object.keys(schema.properties).length > 0)) {
        return d;
      }
    }
    let t = schema.type;
    if (Array.isArray(t)) t = t[0];
    if (t === 'object' || (!t && schema.properties)) {
      const obj = {};
      if (schema.properties) {
        Object.keys(schema.properties).forEach((k) => {
          const v = defaultFromSchema(schema.properties[k]);
          if (v !== undefined) obj[k] = v;
        });
      }
      return obj;
    }
    if (t === 'array') {
      if (Array.isArray(schema.items)) {
        return schema.items.map((itemSch) => defaultFromSchema(itemSch));
      }
      const min = schema.minItems || 0;
      const arr = [];
      for (let i = 0; i < min; i++) {
        arr.push(defaultFromSchema(schema.items || { type: 'string' }));
      }
      return arr;
    }
    if (t === 'string') return '';
    if (t === 'integer' || t === 'number') return 0;
    if (t === 'boolean') return false;
    if (t === 'null') return null;
    return null;
  }

  function typeOfVal(val) {
    if (val === null) return 'null';
    if (Array.isArray(val)) return 'array';
    if (typeof val === 'number') {
      return Number.isInteger(val) ? 'integer' : 'number';
    }
    return typeof val;
  }

  function matchType(val, t) {
    if (Array.isArray(t)) return t.some((x) => matchType(val, x));
    const actual = typeOfVal(val);
    if (t === 'number') return actual === 'number' || actual === 'integer';
    if (t === 'integer') return actual === 'integer';
    return actual === t;
  }

  /**
   * Validare JSON Schema subset (type, properties, required, items).
   * @returns {{ ok: boolean, err?: string }}
   */
  function checkSchema(val, schema, path) {
    path = path || '';
    if (!schema || typeof schema !== 'object') return { ok: true };
    let t = schema.type;
    if (t && !matchType(val, t)) {
      return { ok: false, err: 'Tip invalid la ' + (path || '/') + ': așteptat ' + t };
    }
    const effective = Array.isArray(t) ? t[0] : t;
    if ((effective === 'object' || (!effective && schema.properties)) && val && typeof val === 'object' && !Array.isArray(val)) {
      if (Array.isArray(schema.required)) {
        for (const r of schema.required) {
          if (val[r] === undefined) {
            return { ok: false, err: 'Câmp obligatoriu lipsă: ' + (path ? path + '.' : '') + r };
          }
        }
      }
      if (schema.properties) {
        for (const k of Object.keys(schema.properties)) {
          if (val[k] === undefined) continue;
          const sub = checkSchema(val[k], schema.properties[k], path ? path + '.' + k : k);
          if (!sub.ok) return sub;
        }
      }
    }
    if (effective === 'array' && Array.isArray(val) && schema.items && !Array.isArray(schema.items)) {
      for (let i = 0; i < val.length; i++) {
        const sub = checkSchema(val[i], schema.items, path + '[' + i + ']');
        if (!sub.ok) return sub;
      }
    }
    return { ok: true };
  }

  function assertRedisAllowed(cmd) {
    const c = String(cmd || '').toUpperCase();
    if (!REDIS_ALLOW.has(c)) {
      throw new Error('redis cmd interzis: ' + cmd);
    }
    return c;
  }

  function normalizeAs(as) {
    const a = (as || 'auto').toLowerCase();
    if (a === 'json' || a === 'string' || a === 'auto') return a;
    return 'auto';
  }

  function looksJsonType(redisType) {
    const t = String(redisType || '').toLowerCase();
    return t === 'json' || t === 'rejson' || t === 'rejson-rl';
  }

  function buildKsaveArgv(key, val, as) {
    as = normalizeAs(as);
    const useJson =
      as === 'json' ||
      (as === 'auto' && val !== null && typeof val === 'object');
    if (useJson) {
      return ['JSON.SET', key, '$', JSON.stringify(val)];
    }
    const text = val === undefined || val === null ? '' : typeof val === 'string' ? val : String(val);
    return ['SET', key, text];
  }

  function buildKgetArgv(key, as, redisType) {
    as = normalizeAs(as);
    const useJson =
      as === 'json' || (as === 'auto' && looksJsonType(redisType));
    if (useJson) return ['JSON.GET', key, '$'];
    return ['GET', key];
  }

  function unwrapJsonGet(raw) {
    if (raw == null || raw === '') return null;
    let v = raw;
    if (typeof v === 'string') {
      try {
        v = JSON.parse(v);
      } catch (e) {
        return raw;
      }
    }
    // JSON.GET cu $ întoarce adesea [value]
    if (Array.isArray(v) && v.length === 1) return v[0];
    return v;
  }

  function normalizeCastAs(as) {
    const a = (as || 'auto').toLowerCase();
    if (a === 'json' || a === 'string' || a === 'auto' || a === 'date') return a;
    if (a === 'integer' || a === 'number' || a === 'boolean' || a === 'null') return a;
    return 'auto';
  }

  function isEmptyObject(val) {
    return typeof val === 'object' && val !== null && !(val instanceof Date) && Object.keys(val).length === 0;
  }

  function isEmptyArray(val) {
    return Array.isArray(val) && val.length === 0;
  }

  function castValue(val, as) {
    as = normalizeCastAs(as);
    //console.log('castValue', val, as);
    if (as === 'auto') {
      if (val === undefined || val === null) return null;
      if (typeof val === 'string') return parseMaybeJson(val);
      if (typeof val === 'object') return val;
      return String(val);
    }
    if (as === 'json') {
      if (val === undefined || val === null) return null;
      if (typeof val === 'string') return parseMaybeJson(val);
      return val;
    }
    if (as === 'string') {
      if (val === undefined || val === null) return '';
      if (typeof val === 'string') return val;
      if (val instanceof Date) {
        return Number.isNaN(val.getTime()) ? '' : val.toISOString();
      }
      if (typeof val === 'object') return JSON.stringify(val);
      return String(val);
    }
    if (as === 'integer') {
      if (val === undefined || val === null) return 0;
      if (val instanceof Date) {
        const t = val.getTime();
        return Number.isNaN(t) ? 0 : t;
      }
      if (typeof val === 'number') {
        return Number.isNaN(val) ? 0 : Math.round(val);
      }
      const parsedFloat = Number.parseFloat(val);
      return Number.isNaN(parsedFloat) ? 0 : Math.round(parsedFloat);
    }
    if (as === 'number') {
      if (val === undefined || val === null) return 0;
      if (val instanceof Date) {
        const t = val.getTime();
        return Number.isNaN(t) ? 0 : t;
      }
      if (typeof val === 'number') {
        return Number.isNaN(val) ? 0 : val;
      }
      if (typeof val === 'string') {
        const parsedFloat = Number.parseFloat(val);
        return Number.isNaN(parsedFloat) ? 0 : parsedFloat;
      }
      if (typeof val === 'object') {
        return isEmptyArray(val) ? 0 : isEmptyObject(val) ? 0 : 1;
      }
      if (typeof val === 'boolean') {
        return val ? 1 : 0;
      }
      return 0;
    }
    if (as === 'boolean') {
      if (val === undefined || val === null) return false;
      if (typeof val === 'boolean') return val;
      if (val === 'false') return false;
      if (val === 'true') return true;
      return !!val;
    }
    if (as === 'null') {
      return null;
    }
    if (as === 'date') {
      if (val === undefined || val === null) return null;
      if (val instanceof Date) {
        return Number.isNaN(val.getTime()) ? null : val;
      }
      if (typeof val === 'number' || typeof val === 'string') {
        const d = parseRelativeDate(val);
        return d && !Number.isNaN(d.getTime()) ? d : null;
      }
      return null;
    }
    throw new Error('cast: invalid as value: ' + as);
  }

  function parseMaybeJson(raw) {
    if (raw == null || raw === '') return raw;
    if (typeof raw !== 'string') return raw;
    try {
      return JSON.parse(raw);
    } catch (e) {
      return raw;
    }
  }

  function formatDateValue(dateObj, formatStr) {
    if (!dateObj || !(dateObj instanceof Date) || Number.isNaN(dateObj.getTime())) {
      return '';
    }
    const pad = (n) => String(n).padStart(2, '0');
    const hours24 = dateObj.getHours();
    const hours12 = hours24 % 12 || 12;
    const ampm = hours24 >= 12 ? 'PM' : 'AM';
    const hours24U = dateObj.getUTCHours();
    const hours12U = hours24U % 12 || 12;
    const ampmU = hours24U >= 12 ? 'PM' : 'AM';
    const tokens = {
      'ISO': dateObj.toISOString(),
      'YYYYU': dateObj.getUTCFullYear(),
      'MMU': pad(dateObj.getUTCMonth() + 1),
      'DDU': pad(dateObj.getUTCDate()),
      'HHU': pad(hours24U),
      'hhU': pad(hours12U),
      'mmU': pad(dateObj.getUTCMinutes()),
      'ssU': pad(dateObj.getUTCSeconds()),
      'AU': ampmU,
      'Z': dateObj.getTimezoneOffset(),
      'YYYY': dateObj.getFullYear(),
      'MM': pad(dateObj.getMonth() + 1),
      'DD': pad(dateObj.getDate()),
      'HH': pad(hours24),
      'hh': pad(hours12),
      'mm': pad(dateObj.getMinutes()),
      'ss': pad(dateObj.getSeconds()),
      'A': ampm
    };
    let result = formatStr || 'YYYY-MM-DD';
    const pattern = new RegExp(Object.keys(tokens).join('|'), 'g');
    return result.replace(pattern, (match) => tokens[match]);
  }

  function parseRelativeDate(rawStr) {
    if (rawStr === undefined || rawStr === null) return null;
    if (typeof rawStr === 'number') {
      const d = new Date(rawStr);
      return Number.isNaN(d.getTime()) ? null : d;
    }
    const str = String(rawStr).trim();
    if (str === '') return null;
    let dateObj;
    let modifiersIdx = -1;
    if (str === 'now' || str === '+0' || str === '-0') {
      return new Date();
    }
    if (str.startsWith('+') || str.startsWith('-')) {
      dateObj = new Date();
      modifiersIdx = 0;
    } else {
      const parts = str.split(/\s+(?=[\+\-])/);
      if (parts.length > 1) {
        dateObj = new Date(parts[0]);
        modifiersIdx = parts[0].length;
      } else {
        const lastSignMatch = str.match(/\s*([\+\-]\d+[a-zA-Z]*)$/);
        if (lastSignMatch) {
          const basePart = str.substring(0, lastSignMatch.index).trim();
          dateObj = new Date(basePart);
          modifiersIdx = lastSignMatch.index;
        } else {
          dateObj = new Date(str);
          return Number.isNaN(dateObj.getTime()) ? null : dateObj;
        }
      }
      if (Number.isNaN(dateObj.getTime())) return null;
    }
    const modStr = str.substring(modifiersIdx);
    const regex = /([\+\-])(\d+)([a-zA-Z]*)/g;
    let match;
    while ((match = regex.exec(modStr)) !== null) {
      const sign = match[1];
      const value = parseInt(match[2], 10) * (sign === '-' ? -1 : 1);
      const unit = match[3].toLowerCase();
      if (unit === 'y' || unit === 'year' || unit === 'years') {
        dateObj.setFullYear(dateObj.getFullYear() + value);
      } else if (unit === 'month' || unit === 'months') {
        dateObj.setMonth(dateObj.getMonth() + value);
      } else if (unit === 'd' || unit === 'day' || unit === 'days') {
        dateObj.setDate(dateObj.getDate() + value);
      } else if (unit === 'h' || unit === 'hour' || unit === 'hours') {
        dateObj.setHours(dateObj.getHours() + value);
      } else if (unit === 'm' || unit === 'min' || unit === 'minute' || unit === 'minutes') {
        dateObj.setMinutes(dateObj.getMinutes() + value);
      } else if (unit === 's' || unit === 'sec' || unit === 'second' || unit === 'seconds' || unit === '') {
        dateObj.setSeconds(dateObj.getSeconds() + value);
      }
    }
    return dateObj;
  }


  /**
   * kadd/krm argv după tip Redis (set/list; hash/zset → F4f-a amânat).
   */
  function buildKaddArgv(key, member, redisType) {
    const t = String(redisType || 'none').toLowerCase();
    const m = member === undefined || member === null ? '' : typeof member === 'string' ? member : JSON.stringify(member);
    if (t === 'list') return ['RPUSH', key, m];
    if (t === 'hash') throw new Error('kadd pe hash amânat (F4f-a); folosește redis');
    if (t === 'zset') throw new Error('kadd pe zset amânat (F4f-a); folosește redis');
    // set sau none → SADD
    return ['SADD', key, m];
  }

  function buildKrmArgv(key, member, redisType) {
    const t = String(redisType || 'none').toLowerCase();
    const m = member === undefined || member === null ? '' : typeof member === 'string' ? member : JSON.stringify(member);
    if (t === 'list') return ['LREM', key, '1', m];
    if (t === 'hash') throw new Error('krm pe hash amânat (F4f-a); folosește redis');
    if (t === 'zset') throw new Error('krm pe zset amânat (F4f-a); folosește redis');
    return ['SREM', key, m];
  }

  const api = {
    REDIS_ALLOW,
    resolveRef,
    setVar,
    getPath,
    setPath,
    defaultFromSchema,
    checkSchema,
    assertRedisAllowed,
    normalizeAs,
    normalizeCastAs,
    isEmptyObject,
    isEmptyArray,
    castValue,
    formatDateValue,
    buildKsaveArgv,
    buildKgetArgv,
    buildKaddArgv,
    buildKrmArgv,
    unwrapJsonGet,
    parseMaybeJson,
    looksJsonType,
  };

  root.SsideAlgOps = api;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
