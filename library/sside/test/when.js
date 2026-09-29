'use strict';

const {
  evalWhen,
  printWhenExpr,
  parseWhenExpr,
  tryParseWhenExpr,
} = require('../core/when.js');

function assert(cond, msg) {
  if (!cond) throw new Error(msg || 'assertion failed');
}

function assertEq(a, b, msg) {
  if (a !== b) throw new Error((msg || 'eq') + ': ' + JSON.stringify(a) + ' !== ' + JSON.stringify(b));
}

function assertDeep(a, b, msg) {
  const sa = JSON.stringify(a);
  const sb = JSON.stringify(b);
  if (sa !== sb) throw new Error((msg || 'deep') + ': ' + sa + ' !== ' + sb);
}

function lit(x) {
  return x;
}

function roundTrip(ast) {
  const text = printWhenExpr(ast);
  const back = parseWhenExpr(text);
  assertDeep(back, ast, 'roundTrip ' + text);
  return text;
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
        const expr = ['or', ['lte', 'qty', 0], ['not', ['eq', 'id', '']]];
        assert(evalWhen(expr, get));
      },
    },
    {
      id: 9,
      desc: 'empty array / string / null',
      run() {
        const ctx = { a: [], b: [1], c: '', d: 'x', e: null, f: {} };
        const get = (t) =>
          typeof t === 'string' && Object.prototype.hasOwnProperty.call(ctx, t)
            ? ctx[t]
            : t;
        assert(evalWhen(['empty', 'a'], get));
        assert(!evalWhen(['empty', 'b'], get));
        assert(evalWhen(['empty', 'c'], get));
        assert(!evalWhen(['empty', 'd'], get));
        assert(evalWhen(['empty', 'e'], get));
        assert(evalWhen(['empty', 'f'], get));
      },
    },
    {
      id: 10,
      desc: 'printWhenExpr atomic + calls',
      run() {
        assertEq(printWhenExpr(['eq', 'form.id', '']), 'form.id == ""');
        assertEq(printWhenExpr(['lte', 'qty', 0]), 'qty <= 0');
        assertEq(printWhenExpr(['neq', 'a', 'b']), 'a != b');
        assertEq(printWhenExpr(['truthy', 'form.ok']), 'truthy(form.ok)');
        assertEq(printWhenExpr(['empty', 'hits']), 'empty(hits)');
      },
    },
    {
      id: 11,
      desc: 'parseWhenExpr atomic + literals vs refs',
      run() {
        assertDeep(parseWhenExpr('form.id == ""'), ['eq', 'form.id', '']);
        assertDeep(parseWhenExpr('qty <= 0'), ['lte', 'qty', 0]);
        assertDeep(parseWhenExpr('a != "x"'), ['neq', 'a', 'x']);
        assertDeep(parseWhenExpr('$key == "data:1"'), ['eq', '$key', 'data:1']);
        assertDeep(parseWhenExpr('truthy(form.ok)'), ['truthy', 'form.ok']);
        assertDeep(parseWhenExpr('empty(hits)'), ['empty', 'hits']);
      },
    },
    {
      id: 12,
      desc: 'parse and/or/not + paranteze + precedență',
      run() {
        assertDeep(parseWhenExpr('a == 1 and b == 2'), [
          'and',
          ['eq', 'a', 1],
          ['eq', 'b', 2],
        ]);
        assertDeep(
          parseWhenExpr('qty <= 0 or (form.id == "" and not truthy(form.ok))'),
          [
            'or',
            ['lte', 'qty', 0],
            [
              'and',
              ['eq', 'form.id', ''],
              ['not', ['truthy', 'form.ok']],
            ],
          ]
        );
        assertDeep(parseWhenExpr('a == 1 or b == 2 and c == 3'), [
          'or',
          ['eq', 'a', 1],
          ['and', ['eq', 'b', 2], ['eq', 'c', 3]],
        ]);
        assertDeep(parseWhenExpr('(a == 1 or b == 2) and c == 3'), [
          'and',
          ['or', ['eq', 'a', 1], ['eq', 'b', 2]],
          ['eq', 'c', 3],
        ]);
      },
    },
    {
      id: 13,
      desc: 'round-trip print ↔ parse (set docs)',
      run() {
        roundTrip(['eq', 'form.id', '']);
        roundTrip(['neq', 'qty', 0]);
        roundTrip(['lte', 'qty', 0]);
        roundTrip(['gt', 'a', 'b']);
        roundTrip(['truthy', 'form.ok']);
        roundTrip(['empty', 'hits']);
        roundTrip(['and', ['eq', 'a', 1], ['eq', 'b', 2]]);
        roundTrip([
          'or',
          ['lte', 'qty', 0],
          ['not', ['eq', 'form.id', '']],
        ]);
        roundTrip(['not', ['eq', 'x', 'y']]);
        roundTrip([
          'or',
          ['lte', 'qty', 0],
          [
            'and',
            ['eq', 'form.id', ''],
            ['not', ['truthy', 'form.ok']],
          ],
        ]);
      },
    },
    {
      id: 14,
      desc: 'parse JSON array fallback + erori clare',
      run() {
        assertDeep(parseWhenExpr('["lte","qty",0]'), ['lte', 'qty', 0]);
        const bad = tryParseWhenExpr('qty < = 0');
        assert(!bad.ok);
        assert(bad.error && bad.error.length > 0);
        const unclosed = tryParseWhenExpr('(a == 1');
        assert(!unclosed.ok);
        assert(unclosed.error.indexOf(')') !== -1);
        const empty = tryParseWhenExpr('   ');
        assert(!empty.ok);
      },
    },
  ],
};
