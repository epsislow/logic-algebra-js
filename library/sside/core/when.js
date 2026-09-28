/**
 * Evaluare expresii `when` (D6): eq/neq/gt/… + and/or/not + truthy.
 * getVal(token) rezolvă refs / literale.
 */
(function (root) {
  'use strict';

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

  root.SsideWhen = { evalWhen };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { evalWhen };
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
