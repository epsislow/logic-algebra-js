'use strict';

const { evalWhen } = require('../core/when.js');

function assert(cond, msg) {
  if (!cond) throw new Error(msg || 'assertion failed');
}

function assertEq(a, b, msg) {
  if (a !== b) throw new Error((msg || 'eq') + ': ' + JSON.stringify(a) + ' !== ' + JSON.stringify(b));
}

function lit(x) {
  return x;
}

module.exports = {
  name: 'when',
  tests: [
    {
      id: 1,
      desc: 'eq numeric true',
      run() {
        assert(evalWhen(['eq', 1, 1], lit));
      },
    },
    {
      id: 2,
      desc: 'eq numeric false',
      run() {
        assert(!evalWhen(['eq', 1, 2], lit));
      },
    },
    {
      id: 3,
      desc: 'lte',
      run() {
        assert(evalWhen(['lte', 0, 0], lit));
        assert(evalWhen(['lte', -1, 0], lit));
        assert(!evalWhen(['lte', 1, 0], lit));
      },
    },
    {
      id: 4,
      desc: 'gt gte lt',
      run() {
        assert(evalWhen(['gt', 2, 1], lit));
        assert(evalWhen(['gte', 2, 2], lit));
        assert(evalWhen(['lt', 1, 2], lit));
      },
    },
    {
      id: 5,
      desc: 'neq',
      run() {
        assert(evalWhen(['neq', 1, 2], lit));
        assert(!evalWhen(['neq', 'a', 'a'], lit));
      },
    },
    {
      id: 6,
      desc: 'and / or / not',
      run() {
        assert(evalWhen(['and', ['eq', 1, 1], ['eq', 2, 2]], lit));
        assert(!evalWhen(['and', ['eq', 1, 1], ['eq', 1, 2]], lit));
        assert(evalWhen(['or', ['eq', 1, 2], ['eq', 2, 2]], lit));
        assert(!evalWhen(['or', ['eq', 1, 2], ['eq', 2, 3]], lit));
        assert(evalWhen(['not', ['eq', 1, 2]], lit));
        assert(!evalWhen(['not', ['eq', 1, 1]], lit));
      },
    },
    {
      id: 7,
      desc: 'truthy + getVal refs',
      run() {
        const ctx = { a: 0, b: 'x', c: null };
        const get = (t) => (typeof t === 'string' && Object.prototype.hasOwnProperty.call(ctx, t) ? ctx[t] : t);
        assert(!evalWhen(['truthy', 'a'], get));
        assert(evalWhen(['truthy', 'b'], get));
        assert(!evalWhen(['truthy', 'c'], get));
        assert(evalWhen(['eq', 'b', 'x'], get));
      },
    },
    {
      id: 8,
      desc: 'nested and/or ca în plan',
      run() {
        const get = (t) => ({ qty: -1, id: '' }[t]);
        // or(lte qty 0, not eq id "")
        const expr = ['or', ['lte', 'qty', 0], ['not', ['eq', 'id', '']]];
        assert(evalWhen(expr, get));
      },
    },
  ],
};
