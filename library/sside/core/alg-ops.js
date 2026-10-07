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

  function evaluateMath(exprStr, ctx, getValFn) {
    if (!exprStr || String(exprStr).trim() === '') return 0;
    let str = String(exprStr).trim();
    let pos = 0;
    function peek() {
      return str[pos] || '';
    }
    function consume(char) {
      while (peek() === ' ') pos++;
      if (str[pos] === char) { pos++; return true; }
      return false;
    }
    function parseExpression() {
      let result = parseTerm();
      while (true) {
        if (consume('+')) result += parseTerm();
        else if (consume('-')) result -= parseTerm();
        else break;
      }
      return result;
    }
    function parseTerm() {
      let result = parsePower();
      while (true) {
        if (consume('*')) {
          result *= parsePower();
        } else if (consume('/')) {
          const denominator = parsePower();
          result = denominator === 0 ? 0 : result / denominator;
        } else if (consume('%')) {
          const denominator = parsePower();
          result = denominator === 0 ? 0 : result % denominator;
        } else break;
      }
      return result;
    }
    function parsePower() {
      let result = parseFactor();
      while (consume('^')) {
        result = Math.pow(result, parseFactor());
      }
      return result;
    }
    function parseFactor() {
      while (peek() === ' ') pos++;
      if (consume('-')) return -parseFactor();
      if (consume('+')) return parseFactor();
      if (consume('(')) {
        const result = parseExpression();
        consume(')');
        return result;
      }
      const funcMatch = str.substring(pos).match(/^(abs|min|max|sqrt|pow|floor|ceil|round)\(/);
      if (funcMatch) {
        const funcName = funcMatch[1];
        pos += funcName.length + 1;
        let argsStr = '';
        let depth = 1;
        while (pos < str.length && depth > 0) {
          const char = str[pos++];
          if (char === '(') depth++;
          if (char === ')') depth--;
          if (depth > 0) argsStr += char;
        }
        if (funcName === 'abs') return Math.abs(evaluateMath(argsStr, ctx, getValFn));
        if (funcName === 'sqrt') return Math.sqrt(evaluateMath(argsStr, ctx, getValFn));
        if (funcName === 'floor') return Math.floor(evaluateMath(argsStr, ctx, getValFn));
        if (funcName === 'ceil') return Math.ceil(evaluateMath(argsStr, ctx, getValFn));
        if (funcName === 'round') return Math.round(evaluateMath(argsStr, ctx, getValFn));
        if (funcName === 'pow') {
          const parts = splitArgs(argsStr);
          return Math.pow(evaluateMath(parts[0], ctx, getValFn), evaluateMath(parts[1], ctx, getValFn));
        }
        if (funcName === 'min' || funcName === 'max') {
          const rawArg = getValFn(ctx, argsStr.trim());
          if (Array.isArray(rawArg)) {
            const numElements = rawArg.map(v => castValue(v, 'number'));
            return funcName === 'min' ? Math.min(...numElements) : Math.max(...numElements);
          }
          const parts = splitArgs(argsStr);
          const values = parts.map(p => evaluateMath(p, ctx, getValFn));
          return funcName === 'min' ? Math.min(...values) : Math.max(...values);
        }
      }
      const varMatch = str.substring(pos).match(/^[a-zA-Z_][a-zA-Z0-9_\.]*/);
      if (varMatch) {
        const varName = varMatch[0];
        pos += varName.length;
        const rawVal = getValFn(ctx, varName);
        if (rawVal !== null && rawVal !== undefined) {
          if (Array.isArray(rawVal) || (typeof rawVal === 'object' && !(rawVal instanceof Date))) {
            throw new Error('[calc] Operație invalidă: nu se pot face calcule matematice folosind structuri de tip Object sau Array direct în expresie.');
          }
        }
        const firstPart = varName.split('.')[0];
        const rootVal = getValFn(ctx, firstPart);
        if (rootVal !== null && rootVal !== undefined && varName.includes('.')) {
          const pathParts = varName.split('.').slice(1);
          let currentObj = rootVal;
          for (let p of pathParts) {
            if (currentObj && typeof currentObj === 'object') {
              currentObj = currentObj[p];
            }
          }
          if (currentObj !== null && currentObj !== undefined) {
            if (Array.isArray(currentObj) || (typeof currentObj === 'object' && !(currentObj instanceof Date))) {
              throw new Error('[calc] Operație invalidă: nu se pot face calcule matematice folosind structuri de tip Object sau Array direct în expresie.');
            }
          }
        }
        return castValue(rawVal, 'number');
      }
      let numStr = '';
      while ((peek() >= '0' && peek() <= '9') || peek() === '.') {
        numStr += str[pos++];
      }
      while (peek() === ' ') pos++;
      return numStr !== '' ? parseFloat(numStr) : 0;
    }
    function splitArgs(argumentsStr) {
      const args = [];
      let current = '';
      let depth = 0;
      for (let i = 0; i < argumentsStr.length; i++) {
        const char = argumentsStr[i];
        if (char === '(') depth++;
        if (char === ')') depth--;
        if (char === ',' && depth === 0) {
          args.push(current);
          current = '';
        } else {
          current += char;
        }
      }
      if (current !== '') args.push(current);
      return args;
    }
    return parseExpression();
  }

  function executeStringMeta(step, ctx, getValFn) {
    const fn = String(step.fn || 'lower').toLowerCase();
    function safeStr(v) {
      if (v === undefined || v === null) return '';
      if (v instanceof Date) return v.toISOString();
      if (Array.isArray(v) || typeof v === 'object') {
        try { return JSON.stringify(v); } catch (e) { return ''; }
      }
      return String(v);
    }
    let inputStr = '';
    if (fn !== 'concat') {
      inputStr = safeStr(getValFn(ctx, step.value));
    }
    switch (fn) {
      case 'length':
        return inputStr.length;
      case 'lower':
        return inputStr.toLowerCase();
      case 'upper':
        return inputStr.toUpperCase();
      case 'trim':
        return inputStr.trim();
      case 'ltrim':
        return inputStr.replace(/^\s+/, '');
      case 'rtrim':
        return inputStr.replace(/\s+$/, '');
      case 'contains': {
        const s = safeStr(getValFn(ctx, step.search));
        return s !== '' ? inputStr.includes(s) : false;
      }
      case 'startswith': {
        const s = safeStr(getValFn(ctx, step.search));
        return inputStr.startsWith(s);
      }
      case 'endswith': {
        const s = safeStr(getValFn(ctx, step.search));
        return inputStr.endsWith(s);
      }
      case 'indexof': {
        const s = safeStr(getValFn(ctx, step.search));
        return inputStr.indexOf(s);
      }
      case 'lastindexof': {
        const s = safeStr(getValFn(ctx, step.search));
        return inputStr.lastIndexOf(s);
      }
      case 'substr': {
        const start = castValue(getValFn(ctx, step.start), 'integer');
        const length = step.length !== undefined && step.length !== null ? castValue(getValFn(ctx, step.length), 'integer') : undefined;
        if (length !== undefined) return inputStr.substring(start, start + length);
        return inputStr.substring(start);
      }
      case 'replace': {
        const s = safeStr(getValFn(ctx, step.search));
        const r = safeStr(getValFn(ctx, step.replace));
        return inputStr.replace(s, r);
      }
      case 'replaceall': {
        const s = safeStr(getValFn(ctx, step.search));
        const r = safeStr(getValFn(ctx, step.replace));
        if (s === '') return inputStr;
        return inputStr.split(s).join(r);
      }
      case 'split': {
        const sep = safeStr(getValFn(ctx, step.separator));
        return inputStr.split(sep);
      }
      case 'concat': {
        const args = Array.isArray(step.args) ? step.args : [];
        let res = '';
        for (let i = 0; i < args.length; i++) {
          const rawArg = args[i];
          const resolved = getValFn(ctx, rawArg);
          res += safeStr(resolved);
        }
        return res;
      }

      case 'padstart': {
        const len = castValue(getValFn(ctx, step.length), 'integer');
        const ch = step.char !== undefined && step.char !== null ? safeStr(getValFn(ctx, step.char)) : ' ';
        return inputStr.padStart(len, ch || ' ');
      }
      case 'padend': {
        const len = castValue(getValFn(ctx, step.length), 'integer');
        const ch = step.char !== undefined && step.char !== null ? safeStr(getValFn(ctx, step.char)) : ' ';
        return inputStr.padEnd(len, ch || ' ');
      }
      case 'repeat': {
        const count = Math.min(Math.max(0, castValue(getValFn(ctx, step.count), 'integer')), 500);
        return inputStr.repeat(count);
      }
      case 'matches': {
        const pattern = safeStr(getValFn(ctx, step.pattern));
        if (pattern === '') return false;
        const escaped = pattern.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&').replace(/\\\*/g, '.*');
        const rx = new RegExp('^' + escaped + '$');
        return rx.test(inputStr);
      }
      default:
        return inputStr;
    }
  }
  function executeArrayMeta(step, ctx, getValFn) {
    const fn = String(step.fn || 'length');
    let arr = Array.isArray(step.from) ? step.from : getValFn(ctx, step.from);
    if (arr === undefined || arr === null || arr === '') {
      arr = [];
    } else if (typeof arr === 'string' && (arr.trim().startsWith('[') || arr.trim().startsWith('{'))) {
      try { arr = JSON.parse(arr); } catch (e) { arr = [arr]; }
    }
    if (!Array.isArray(arr)) {
      arr = [arr];
    }
    function safeValues() {
      let v = typeof step.values === 'string' && !Array.isArray(step.values) ? getValFn(ctx, step.values) : step.values;
      if (v === undefined || v === null || v === '') return [];
      if (typeof v === 'string' && (v.trim().startsWith('[') || v.trim().startsWith('{'))) {
        try { v = JSON.parse(v); } catch (e) { return [v]; }
      }
      return Array.isArray(v) ? v : [v];
    }
    switch (fn) {
      case 'length':
        return arr.length;
      case 'isEmpty':
        return arr.length === 0;
      case 'contains': {
        const vals = safeValues();
        return vals.length > 0 ? arr.includes(vals[0]) : false;
      }
      case 'indexOf': {
        const vals = safeValues();
        return vals.length > 0 ? arr.indexOf(vals[0]) : -1;
      }
      case 'lastIndexOf': {
        const vals = safeValues();
        return vals.length > 0 ? arr.lastIndexOf(vals[0]) : -1;
      }
      case 'get': {
        const idx = castValue(getValFn(ctx, step.index), 'integer');
        return idx >= 0 && idx < arr.length ? arr[idx] : null;
      }
      case 'first':
        return arr.length > 0 ? arr[0] : null;
      case 'last':
        return arr.length > 0 ? arr[arr.length - 1] : null;
      case 'slice': {
        const start = castValue(getValFn(ctx, step.start), 'integer');
        const length = step.length !== undefined && step.length !== null ? castValue(getValFn(ctx, step.length), 'integer') : undefined;
        if (length !== undefined) return arr.slice(start, start + length);
        return arr.slice(start);
      }
      case 'push': {
        const vals = safeValues();
        return [...arr, ...vals];
      }
      case 'unshift': {
        const vals = safeValues();
        return [...vals, ...arr];
      }
      case 'removeFirst':
        return arr.slice(1);
      case 'removeLast':
        return arr.slice(0, -1);
      case 'reverse':
        return [...arr].reverse();
      case 'unique':
        return [...new Set(arr)];
      case 'join': {
        const sep = step.separator !== undefined && step.separator !== null ? String(step.separator) : ',';
        return arr.join(sep);
      }
      case 'sort': {
        const dir = String(step.direction || 'asc').toLowerCase();
        return [...arr].sort((a, b) => {
          if (typeof a === 'number' && typeof b === 'number') return dir === 'desc' ? b - a : a - b;
          const sa = String(a);
          const sb = String(b);
          return dir === 'desc' ? sb.localeCompare(sa) : sa.localeCompare(sb);
        });
      }
      case 'sum':
        return arr.reduce((acc, curr) => acc + castValue(curr, 'number'), 0);
      case 'min': {
        if (arr.length === 0) return 0;
        const nums = arr.map(v => castValue(v, 'number'));
        return Math.min(...nums);
      }
      case 'max': {
        if (arr.length === 0) return 0;
        const nums = arr.map(v => castValue(v, 'number'));
        return Math.max(...nums);
      }
      case 'avg': {
        if (arr.length === 0) return 0;
        const sum = arr.reduce((acc, curr) => acc + castValue(curr, 'number'), 0);
        return sum / arr.length;
      }
      default:
        return arr;
    }
  }

  function executeObjMeta(step, ctx, getValFn) {
    const fn = String(step.fn || 'get');
    let obj = (typeof step.from === 'object' && step.from !== null) ? step.from : getValFn(ctx, step.from);
    if (obj === undefined || obj === null || typeof obj !== 'object') {
      obj = {};
    } else {
      obj = JSON.parse(JSON.stringify(obj));
    }
    function resolveValue() {
      if (Object.prototype.hasOwnProperty.call(step, 'with')) {
        return getValFn(ctx, step.with);
      }
      return step.value;
    }
    function deepGet(o, pathStr) {
      if (!pathStr) return o;
      const parts = pathStr.split('.');
      let current = o;
      for (let p of parts) {
        if (current === null || current === undefined || typeof current !== 'object') return null;
        current = current[p];
      }
      return current === undefined ? null : current;
    }
    function deepSet(o, pathStr, val) {
      if (!pathStr) return o;
      const parts = pathStr.split('.');
      let current = o;
      for (let i = 0; i < parts.length - 1; i++) {
        const p = parts[i];
        if (current[p] === undefined || current[p] === null || typeof current[p] !== 'object') {
          current[p] = {};
        }
        current = current[p];
      }
      current[parts[parts.length - 1]] = val;
      return o;
    }
    function deepDelete(o, pathStr) {
      if (!pathStr) return o;
      const parts = pathStr.split('.');
      let current = o;
      for (let i = 0; i < parts.length - 1; i++) {
        const p = parts[i];
        if (current === null || current === undefined || typeof current !== 'object') return o;
        current = current[p];
      }
      if (current && typeof current === 'object') {
        delete current[parts[parts.length - 1]];
      }
      return o;
    }
    function deepHas(o, pathStr) {
      if (!pathStr) return false;
      const parts = pathStr.split('.');
      let current = o;
      for (let i = 0; i < parts.length - 1; i++) {
        const p = parts[i];
        if (current === null || current === undefined || typeof current !== 'object') return false;
        current = current[p];
      }
      if (current === null || current === undefined || typeof current !== 'object') return false;
      return Object.prototype.hasOwnProperty.call(current, parts[parts.length - 1]);
    }
    switch (fn) {
      case 'get':
        return deepGet(obj, step.path);
      case 'set': {
        const val = resolveValue();
        return deepSet(obj, step.path, val);
      }
      case 'delete':
        return deepDelete(obj, step.path);
      case 'has':
        return deepHas(obj, step.path);
      case 'keys':
        return Object.keys(obj);
      case 'values':
        return Object.values(obj);
      case 'entries':
        return Object.entries(obj);
      case 'merge': {
        const val = resolveValue();
        const src2 = (val && typeof val === 'object') ? val : {};
        return Object.assign({}, obj, src2);
      }
      case 'pick': {
        const val = resolveValue();
        const keysArr = Array.isArray(val) ? val : [];
        const res = {};
        for (let k of keysArr) {
          if (Object.prototype.hasOwnProperty.call(obj, k)) res[k] = obj[k];
        }
        return res;
      }
      case 'omit': {
        const val = resolveValue();
        const keysArr = Array.isArray(val) ? val : [];
        const res = Object.assign({}, obj);
        for (let k of keysArr) {
          delete res[k];
        }
        return res;
      }
      default:
        return obj;
    }
  }

  async function executeIdGen(step, ctx, getValFn, env) {
    const type = String(step.type || 'nanoid').toLowerCase();
    function cryptoRandom() {
      return Math.random();
    }
    function genNanoId(size) {
      const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
      let res = '';
      for (let i = 0; i < size; i++) {
        res += alphabet.charAt(Math.floor(cryptoRandom() * alphabet.length));
      }
      return res;
    }
    function genUuidV4() {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.floor(cryptoRandom() * 16);
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    }
    function genUuidV7() {
      const alphabet = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
      let time = Date.now();
      let timeStr = '';
      for (let i = 0; i < 10; i++) {
        timeStr = alphabet.charAt(time % 32) + timeStr;
        time = Math.floor(time / 32);
      }
      let randStr = '';
      for (let i = 0; i < 16; i++) {
        randStr += alphabet.charAt(Math.floor(cryptoRandom() * 32));
      }
      return timeStr + randStr;
    }
    switch (type) {
      case 'nanoid': {
        const sz = step.size !== undefined && step.size !== null ? castValue(getValFn(ctx, step.size), 'integer') : 21;
        return genNanoId(sz || 21);
      }
      case 'uuid':
        return genUuidV4();
      case 'ulid':
        return genUuidV7();
      case 'autoinc': {
        if (!step.key) throw new Error('id: Proprietatea key este obligatorie pentru tipul autoinc');
        const resolvedKey = getValFn(ctx, step.key);
        const rKey = (resolvedKey !== undefined && resolvedKey !== null && resolvedKey !== '') ? String(resolvedKey) : String(step.key);
        const res = await env.redis.exec(['INCR', rKey]);
        return parseInt(res, 10) || 0;
      }
      case 'dateinc': {
        if (!step.key) throw new Error('id: Proprietatea key este obligatorie pentru tipul dateinc');
        const d = new Date();
        const pad = (n) => String(n).padStart(2, '0');
        const datePrefix = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
        const resolvedKey = getValFn(ctx, step.key);
        const baseKey = (resolvedKey !== undefined && resolvedKey !== null && resolvedKey !== '') ? String(resolvedKey) : String(step.key);
        const rKey = `${baseKey}:${datePrefix}`;
        const seq = await env.redis.exec(['INCR', rKey]);
        return `${datePrefix}-${parseInt(seq, 10) || 0}`;
      }
      default:
        return genNanoId(21);
    }
  }

  const LOG_LEVELS = new Set(['info', 'warning', 'error']);

  function normalizeLogName(raw) {
    const n = String(raw == null ? '' : raw).trim();
    if (!n) throw new Error('log: name gol');
    if (!/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(n)) {
      throw new Error('log: name invalid (literă, cifre, _, -)');
    }
    return n;
  }

  function resolveLogName(step, ctx, getValFn) {
    const raw = step.name;
    if (raw == null || raw === '') throw new Error('log: name lipsă');
    let resolved = raw;
    if (typeof raw === 'string') {
      if (raw.charAt(0) === '$' || raw.indexOf('form.') === 0 || raw.indexOf('list.') === 0) {
        resolved = getValFn(ctx, raw);
      }
    }
    return normalizeLogName(resolved);
  }

  function resolveLogField(step, field, ctx, getValFn) {
    const withKey = field + 'With';
    const hasVal = Object.prototype.hasOwnProperty.call(step, field);
    const hasWith = Object.prototype.hasOwnProperty.call(step, withKey);
    if (hasVal && hasWith) {
      throw new Error('log: ' + field + ' și ' + withKey + ' simultan');
    }
    if (hasWith) {
      return getValFn(ctx, step[withKey]);
    }
    if (hasVal) {
      const v = step[field];
      if (v !== null && typeof v === 'object') {
        return JSON.parse(JSON.stringify(v));
      }
      return v;
    }
    return undefined;
  }

  /**
   * @returns {{ key: string, payload: object }}
   */
  function buildLogPayload(step, ctx, getValFn, meta) {
    meta = meta || {};
    const nameStr = resolveLogName(step, ctx, getValFn);
    const level = String(step.level || '').toLowerCase();
    if (!LOG_LEVELS.has(level)) {
      throw new Error('log: level invalid (info|warning|error)');
    }
    const action = String(step.action || '').trim();
    if (!action) throw new Error('log: action gol');

    const now = new Date();
    let ts;
    if (step.format != null && String(step.format).trim() !== '') {
      ts = formatDateValue(now, String(step.format));
    } else {
      ts = now.toISOString();
    }

    const payload = {
      ts,
      level,
      name: nameStr,
      action,
    };
    const ctxVal = resolveLogField(step, 'context', ctx, getValFn);
    const dataVal = resolveLogField(step, 'data', ctx, getValFn);
    if (ctxVal !== undefined) payload.context = ctxVal;
    if (dataVal !== undefined) payload.data = dataVal;
    if (meta.algId) payload.alg = String(meta.algId);
    if (meta.buttonId) payload.button = String(meta.buttonId);

    return { key: 'log:' + nameStr, payload };
  }

  function buildLogRpushArgv(key, payload) {
    const k = String(key || '');
    if (!k) throw new Error('log: cheie goală');
    return ['RPUSH', k, JSON.stringify(payload)];
  }

  function buildLogArgv(step, ctx, getValFn, meta) {
    const built = buildLogPayload(step, ctx, getValFn, meta);
    return buildLogRpushArgv(built.key, built.payload);
  }

  function executeNotify(step, ctx, getValFn) {
    const kind = String(step.kind || 'info').toLowerCase();
    let text = '';
    if (Object.prototype.hasOwnProperty.call(step, 'with')) {
      const v = getValFn(ctx, step.with);
      text = v == null ? '' : String(v);
    } else {
      text = step.value !== undefined ? String(step.value) : '';
    }
    if (!ctx._notifications) {
      ctx._notifications = [];
    }
    ctx._notifications.push({ kind, text });
  }

  async function executeLock(step, ctx, getValFn, env) {
    const fn = String(step.fn || 'acq').toLowerCase();
    let rawKeys = Array.isArray(step.keys) ? step.keys : getValFn(ctx, step.keys);
    if (rawKeys === undefined || rawKeys === null || rawKeys === '') {
      rawKeys = [];
    } else if (typeof rawKeys === 'string' && rawKeys.trim().startsWith('[')) {
      try { rawKeys = JSON.parse(rawKeys); } catch (e) { rawKeys = [rawKeys]; }
    }
    const keysArr = Array.isArray(rawKeys) ? rawKeys : [rawKeys];
    const resolvedKeys = keysArr.map(k => {
      const resolved = getValFn(ctx, k);
      return (resolved !== undefined && resolved !== null && resolved !== '') ? String(resolved) : String(k);
    }).filter(k => k.trim() !== '');
    if (resolvedKeys.length === 0) return fn === 'acq' ? false : true;
    if (fn === 'rel') {
      await env.redis.exec(['DEL', ...resolvedKeys]);
      return true;
    }
    const ttl = step.ttl !== undefined && step.ttl !== null ? castValue(getValFn(ctx, step.ttl), 'integer') : 5000;
    const txBatch = resolvedKeys.map(k => ['SET', k, '1', 'NX', 'PX', String(ttl || 5000)]);
    const txResults = await env.redis.execTx(txBatch);
    const allOk = txResults.every(res => res === 'OK');
    if (allOk) return true;
    const cleanupKeys = [];
    for (let i = 0; i < txResults.length; i++) {
      if (txResults[i] === 'OK') cleanupKeys.push(resolvedKeys[i]);
    }
    if (cleanupKeys.length > 0) {
      await env.redis.exec(['DEL', ...cleanupKeys]);
    }
    return false;
  }

  function buildKaddArgv(key, member, redisType) {
    let t = String(redisType || 'none').toLowerCase();
    if (t === 'none') {
      if (key.startsWith('list:')) t = 'list';
      else if (key.startsWith('set:')) t = 'set';
      else if (key.startsWith('hash:')) t = 'hash';
      else if (key.startsWith('zset:')) t = 'zset';
    }
    let elements = [];
    if (Array.isArray(member)) {
      elements = member.map(item => {
        if (item && typeof item === 'object') { try { return JSON.stringify(item); } catch (e) { return ''; } }
        return String(item != null ? item : '');
      });
    } else if (member && typeof member === 'object' && t !== 'hash' && t !== 'zset') {
      try { elements.push(JSON.stringify(member)); } catch (e) { elements.push(''); }
    } else {
      elements.push(member === undefined || member === null ? '' : String(member));
    }
    if (t === 'list') return ['RPUSH', key, ...elements];
    if (t === 'hash') {
      if (member && typeof member === 'object' && !Array.isArray(member)) {
        const firstKey = Object.keys(member)[0];
        return ['HSET', key, firstKey, String(member[firstKey])];
      }
      throw new Error('kadd pe hash necesită un obiect { field: value }');
    }
    if (t === 'zset') {
      if (member && typeof member === 'object' && !Array.isArray(member)) {
        if (Object.prototype.hasOwnProperty.call(member, 'score') && Object.prototype.hasOwnProperty.call(member, 'member')) {
          return ['ZADD', key, String(castValue(member.score, 'number')), String(member.member)];
        }
        const firstKey = Object.keys(member)[0];
        return ['ZADD', key, String(castValue(member[firstKey], 'number')), firstKey];
      }
      return ['ZADD', key, '0', String(member)];
    }
    return ['SADD', key, ...elements];
  }

  function buildKrmArgv(key, member, redisType) {
    let t = String(redisType || 'none').toLowerCase();
    if (t === 'none') {
      if (key.startsWith('list:')) t = 'list';
      else if (key.startsWith('set:')) t = 'set';
      else if (key.startsWith('hash:')) t = 'hash';
      else if (key.startsWith('zset:')) t = 'zset';
    }
    let elements = [];
    if (Array.isArray(member)) {
      elements = member.map(item => {
        if (item && typeof item === 'object') { try { return JSON.stringify(item); } catch (e) { return ''; } }
        return String(item != null ? item : '');
      });
    } else {
      elements.push(member === undefined || member === null ? '' : String(member));
    }
    if (t === 'list') return ['LREM', key, '0', elements[0] || ''];
    if (t === 'hash') return ['HDEL', key, elements[0]];
    if (t === 'zset') return ['ZREM', key, elements[0]];
    return ['SREM', key, ...elements];
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
    evaluateMath,
    executeStringMeta,
    executeObjMeta,
    executeArrayMeta,
    executeIdGen,
    executeNotify,
    LOG_LEVELS,
    buildLogPayload,
    buildLogRpushArgv,
    buildLogArgv,
    executeLock,
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
