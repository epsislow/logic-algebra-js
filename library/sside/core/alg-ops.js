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

  function parseMaybeJson(raw) {
    if (raw == null || raw === '') return raw;
    if (typeof raw !== 'string') return raw;
    try {
      return JSON.parse(raw);
    } catch (e) {
      return raw;
    }
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
