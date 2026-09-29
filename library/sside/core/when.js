/**
 * Evaluare + text expresie `when` (D6, F2-alg-C / D42–D46).
 * AST pe disc neschimbat; UI: print ↔ parse 1:1 cu doc/when.md.
 */
(function (root) {
  'use strict';

  const CMP_OPS = {
    eq: '==',
    neq: '!=',
    lt: '<',
    lte: '<=',
    gt: '>',
    gte: '>=',
  };
  const CMP_FROM_SYM = {
    '==': 'eq',
    '!=': 'neq',
    '<=': 'lte',
    '>=': 'gte',
    '<': 'lt',
    '>': 'gt',
  };
  const KEYWORDS = { and: 1, or: 1, not: 1, true: 1, false: 1, null: 1 };
  const PREC = { or: 1, and: 2, not: 3, atom: 4 };

  function cmpNum(a, b) {
    const na = Number(a);
    const nb = Number(b);
    if (Number.isNaN(na) || Number.isNaN(nb)) return null;
    return na - nb;
  }

  function same(a, b) {
    if (a === b) return true;
    if (a == null || b == null) return a == b; // eslint-disable-line eqeqeq
    if (typeof a === 'number' || typeof b === 'number') {
      const d = cmpNum(a, b);
      return d === 0;
    }
    return false;
  }

  /**
   * @param {*} expr tuplu sau boolean
   * @param {(x:*)=>*} getVal
   */
  function evalWhen(expr, getVal) {
    if (expr === true || expr === false) return !!expr;
    if (!Array.isArray(expr) || expr.length === 0) {
      throw new Error('when invalid');
    }
    const op = expr[0];

    if (op === 'and') {
      for (let i = 1; i < expr.length; i++) {
        if (!evalWhen(expr[i], getVal)) return false;
      }
      return expr.length > 1;
    }
    if (op === 'or') {
      for (let i = 1; i < expr.length; i++) {
        if (evalWhen(expr[i], getVal)) return true;
      }
      return false;
    }
    if (op === 'not') {
      if (expr.length !== 2) throw new Error('not needs 1 arg');
      return !evalWhen(expr[1], getVal);
    }
    if (op === 'truthy') {
      if (expr.length !== 2) throw new Error('truthy needs 1 arg');
      return !!getVal(expr[1]);
    }
    if (op === 'empty') {
      if (expr.length !== 2) throw new Error('empty needs 1 arg');
      const v = getVal(expr[1]);
      if (v == null) return true;
      if (Array.isArray(v) || typeof v === 'string') return v.length === 0;
      if (typeof v === 'object') return Object.keys(v).length === 0;
      return false;
    }

    const a = getVal(expr[1]);
    const b = expr.length > 2 ? getVal(expr[2]) : undefined;

    switch (op) {
      case 'eq':
        return same(a, b);
      case 'neq':
        return !same(a, b);
      case 'gt': {
        const d = cmpNum(a, b);
        if (d == null) return false;
        return d > 0;
      }
      case 'gte': {
        const d = cmpNum(a, b);
        if (d == null) return false;
        return d >= 0;
      }
      case 'lt': {
        const d = cmpNum(a, b);
        if (d == null) return false;
        return d < 0;
      }
      case 'lte': {
        const d = cmpNum(a, b);
        if (d == null) return false;
        return d <= 0;
      }
      default:
        throw new Error('when op necunoscut: ' + op);
    }
  }

  function WhenParseError(message, index) {
    const err = new Error(message);
    err.name = 'WhenParseError';
    err.index = index == null ? 0 : index;
    return err;
  }

  /** Ref/ident tipărit fără ghilimele (form.id, $key, qty). */
  function isRefToken(s) {
    if (typeof s !== 'string' || !s) return false;
    if (KEYWORDS[s]) return false;
    return /^(?:\$[a-zA-Z_][a-zA-Z0-9_]*|[a-zA-Z_][a-zA-Z0-9_]*)(?:\.[a-zA-Z_][a-zA-Z0-9_]*)*$/.test(
      s
    );
  }

  function printAtom(v) {
    if (typeof v === 'number' && Number.isFinite(v)) return String(v);
    if (v === true) return 'true';
    if (v === false) return 'false';
    if (v === null) return 'null';
    if (typeof v === 'string') {
      if (isRefToken(v)) return v;
      return JSON.stringify(v);
    }
    try {
      return JSON.stringify(v);
    } catch (e) {
      return String(v);
    }
  }

  function isCmpAst(ast) {
    return (
      Array.isArray(ast) &&
      ast.length === 3 &&
      Object.prototype.hasOwnProperty.call(CMP_OPS, ast[0])
    );
  }

  function isCallAst(ast) {
    return (
      Array.isArray(ast) &&
      ast.length === 2 &&
      (ast[0] === 'truthy' || ast[0] === 'empty')
    );
  }

  function printWhenExpr(ast, parentPrec) {
    if (parentPrec == null) parentPrec = 0;
    if (ast === true) return 'true';
    if (ast === false) return 'false';
    if (!Array.isArray(ast) || ast.length === 0) {
      return printAtom(ast);
    }
    const op = ast[0];

    if (op === 'or' || op === 'and') {
      const prec = PREC[op];
      const parts = [];
      for (let i = 1; i < ast.length; i++) {
        parts.push(printWhenExpr(ast[i], prec));
      }
      let s = parts.join(op === 'or' ? ' or ' : ' and ');
      if (parts.length === 0) s = op;
      if (parentPrec > prec) s = '(' + s + ')';
      return s;
    }

    if (op === 'not') {
      const inner = ast[1];
      let arg;
      if (
        Array.isArray(inner) &&
        (inner[0] === 'and' ||
          inner[0] === 'or' ||
          inner[0] === 'not' ||
          isCmpAst(inner))
      ) {
        arg = '(' + printWhenExpr(inner, 0) + ')';
      } else {
        arg = printWhenExpr(inner, PREC.not);
      }
      let s = 'not ' + arg;
      if (parentPrec > PREC.not) s = '(' + s + ')';
      return s;
    }

    if (op === 'truthy' || op === 'empty') {
      const s = op + '(' + printAtom(ast[1]) + ')';
      return s;
    }

    if (Object.prototype.hasOwnProperty.call(CMP_OPS, op)) {
      const s =
        printAtom(ast[1]) + ' ' + CMP_OPS[op] + ' ' + printAtom(ast[2]);
      if (parentPrec > PREC.atom) return '(' + s + ')';
      return s;
    }

    try {
      return JSON.stringify(ast);
    } catch (e) {
      return String(ast);
    }
  }

  function tokenize(src) {
    const tokens = [];
    let i = 0;
    const n = src.length;

    function push(type, value, index) {
      tokens.push({ type: type, value: value, index: index });
    }

    while (i < n) {
      const ch = src.charAt(i);
      if (ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r') {
        i++;
        continue;
      }
      const start = i;

      if (ch === '(' || ch === ')') {
        push(ch, ch, start);
        i++;
        continue;
      }

      if (ch === '"' || ch === "'") {
        const quote = ch;
        i++;
        let out = '';
        while (i < n) {
          const c = src.charAt(i);
          if (c === quote) {
            i++;
            push('string', out, start);
            break;
          }
          if (c === '\\' && i + 1 < n) {
            const n2 = src.charAt(i + 1);
            if (n2 === quote || n2 === '\\') {
              out += n2;
              i += 2;
              continue;
            }
          }
          out += c;
          i++;
        }
        if (tokens.length === 0 || tokens[tokens.length - 1].index !== start) {
          throw WhenParseError('string neînchis', start);
        }
        continue;
      }

      if (ch === '=' || ch === '!' || ch === '<' || ch === '>') {
        let sym = ch;
        if (i + 1 < n && src.charAt(i + 1) === '=') {
          sym += '=';
          i += 2;
        } else {
          i++;
        }
        if (!CMP_FROM_SYM[sym]) {
          throw WhenParseError('operator necunoscut: ' + sym, start);
        }
        push('cmp', sym, start);
        continue;
      }

      if (
        (ch >= '0' && ch <= '9') ||
        (ch === '-' && i + 1 < n && src.charAt(i + 1) >= '0' && src.charAt(i + 1) <= '9')
      ) {
        let j = i;
        if (src.charAt(j) === '-') j++;
        while (j < n && src.charAt(j) >= '0' && src.charAt(j) <= '9') j++;
        if (j < n && src.charAt(j) === '.') {
          j++;
          while (j < n && src.charAt(j) >= '0' && src.charAt(j) <= '9') j++;
        }
        const num = Number(src.slice(i, j));
        if (!Number.isFinite(num)) {
          throw WhenParseError('număr invalid', start);
        }
        push('number', num, start);
        i = j;
        continue;
      }

      if (ch === '$' || (ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') || ch === '_') {
        let j = i + 1;
        while (j < n) {
          const c = src.charAt(j);
          if (
            (c >= 'a' && c <= 'z') ||
            (c >= 'A' && c <= 'Z') ||
            (c >= '0' && c <= '9') ||
            c === '_' ||
            c === '.' ||
            c === '$'
          ) {
            j++;
            continue;
          }
          break;
        }
        const word = src.slice(i, j);
        if (word === 'and' || word === 'or' || word === 'not') {
          push(word, word, start);
        } else if (word === 'true') {
          push('bool', true, start);
        } else if (word === 'false') {
          push('bool', false, start);
        } else if (word === 'null') {
          push('null', null, start);
        } else if (word === 'truthy' || word === 'empty') {
          push('call', word, start);
        } else {
          if (!isRefToken(word)) {
            throw WhenParseError('ident invalid: ' + word, start);
          }
          push('ident', word, start);
        }
        i = j;
        continue;
      }

      throw WhenParseError('caracter neașteptat: ' + ch, start);
    }
    push('eof', null, n);
    return tokens;
  }

  function parseWhenExpr(text) {
    if (text == null) throw WhenParseError('when gol', 0);
    const src = String(text);
    const trimmed = src.trim();
    if (!trimmed) throw WhenParseError('when gol', 0);

    // Fallback: JSON array (paste din tab Json / vechi)
    if (trimmed.charAt(0) === '[') {
      let ast;
      try {
        ast = JSON.parse(trimmed);
      } catch (e) {
        throw WhenParseError('JSON invalid: ' + (e && e.message ? e.message : e), 0);
      }
      if (!Array.isArray(ast)) {
        throw WhenParseError('when JSON trebuie să fie array', 0);
      }
      return ast;
    }

    const tokens = tokenize(src);
    let pos = 0;

    function peek() {
      return tokens[pos];
    }

    function eat(type) {
      const t = tokens[pos];
      if (!t || t.type !== type) {
        throw WhenParseError(
          'așteptat ' + type + (t && t.type !== 'eof' ? ', găsit ' + t.type : ''),
          t ? t.index : src.length
        );
      }
      pos++;
      return t;
    }

    function parseOr() {
      const parts = [parseAnd()];
      while (peek().type === 'or') {
        pos++;
        parts.push(parseAnd());
      }
      if (parts.length === 1) return parts[0];
      return ['or'].concat(parts);
    }

    function parseAnd() {
      const parts = [parseNot()];
      while (peek().type === 'and') {
        pos++;
        parts.push(parseNot());
      }
      if (parts.length === 1) return parts[0];
      return ['and'].concat(parts);
    }

    function parseNot() {
      if (peek().type === 'not') {
        const t = peek();
        pos++;
        const inner = parseNot();
        return ['not', inner];
      }
      return parsePrimary();
    }

    function parsePrimary() {
      const t = peek();
      if (t.type === '(') {
        pos++;
        const inner = parseOr();
        if (peek().type !== ')') {
          throw WhenParseError("așteptat ')'", peek().index);
        }
        pos++;
        return inner;
      }
      if (t.type === 'call') {
        pos++;
        if (peek().type !== '(') {
          throw WhenParseError('așteptat "(" după ' + t.value, peek().index);
        }
        pos++;
        const argTok = peek();
        let arg;
        if (argTok.type === 'ident') {
          arg = argTok.value;
          pos++;
        } else if (argTok.type === 'string') {
          arg = argTok.value;
          pos++;
        } else {
          throw WhenParseError(
            t.value + '() așteaptă ref sau string',
            argTok.index
          );
        }
        if (peek().type !== ')') {
          throw WhenParseError("așteptat ')'", peek().index);
        }
        pos++;
        return [t.value, arg];
      }

      // atom [cmp atom] | boolean literal (when = true/false)
      const left = parseAtom();
      if (peek().type === 'cmp') {
        const sym = peek().value;
        pos++;
        const right = parseAtom();
        return [CMP_FROM_SYM[sym], left, right];
      }
      if (typeof left === 'boolean') return left;
      throw WhenParseError(
        'expresie incompletă (lipsește operator == != < <= > >=)',
        t.index
      );
    }

    function parseAtom() {
      const t = peek();
      if (t.type === 'ident') {
        pos++;
        return t.value;
      }
      if (t.type === 'string') {
        pos++;
        return t.value;
      }
      if (t.type === 'number') {
        pos++;
        return t.value;
      }
      if (t.type === 'bool') {
        pos++;
        return t.value;
      }
      if (t.type === 'null') {
        pos++;
        return t.value;
      }
      throw WhenParseError('așteptat valoare / ref', t.index);
    }

    const ast = parseOr();
    if (peek().type !== 'eof') {
      throw WhenParseError(
        'input în plus după expresie',
        peek().index
      );
    }
    return ast;
  }

  function tryParseWhenExpr(text) {
    try {
      return { ok: true, ast: parseWhenExpr(text) };
    } catch (e) {
      return {
        ok: false,
        error: e && e.message ? e.message : String(e),
        index: e && typeof e.index === 'number' ? e.index : 0,
      };
    }
  }

  const api = {
    evalWhen,
    printWhenExpr: function (ast) {
      return printWhenExpr(ast, 0);
    },
    parseWhenExpr,
    tryParseWhenExpr,
    isRefToken,
  };

  root.SsideWhen = api;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
