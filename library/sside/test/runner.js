'use strict';

const Alg = require('../core/alg-runner.js');
const { createMemoryRedis } = require('../core/redis.js');

function assert(cond, msg) {
  if (!cond) throw new Error(msg || 'assertion failed');
}

function assertEq(a, b, msg) {
  if (a !== b) throw new Error((msg || 'eq') + ': ' + JSON.stringify(a) + ' !== ' + JSON.stringify(b));
}

function assertEqJson(a, b, msg) {
  if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error((msg || 'eq') + ': ' + JSON.stringify(a) + ' !== ' + JSON.stringify(b));
}

module.exports = {
  name: 'runner',
  tests: [
    {
      id: 1,
      desc: 'assign + cat + end msg',
      async run() {
        const redis = createMemoryRedis();
        const r = await Alg.run(
          {
            v: 1,
            steps: [
              { op: 'assign', to: 'qty', from: 'form.qty' },
              { op: 'cat', to: 'key', parts: ['data:_item:', 'form.id'] },
              { op: 'end', msg: 'Salvat' },
            ],
          },
          { form: { qty: 3, id: '42' }, redis }
        );
        assertEq(r.vars.qty, 3);
        assertEq(r.vars.key, 'data:_item:42');
        assertEq(r.msg, 'Salvat');
        assert(!r.err);
        assert(r.stopped);
      },
    },
    {
      id: 2,
      desc: 'end err prioritate pe msg',
      async run() {
        const redis = createMemoryRedis();
        const r = await Alg.run(
          { v: 1, steps: [{ op: 'end', msg: 'ok', err: 'fail' }] },
          { form: {}, redis }
        );
        assertEq(r.err, 'fail');
      },
    },
    {
      id: 3,
      desc: 'assign val literal',
      async run() {
        const redis = createMemoryRedis();
        const r = await Alg.run(
          {
            v: 1,
            steps: [
              { op: 'assign', to: 'x', val: 7 },
              { op: 'end', msg: 'ok' },
            ],
          },
          { form: {}, redis }
        );
        assertEq(r.vars.x, 7);
      },
    },
    {
      id: 4,
      desc: 'if then else',
      async run() {
        const redis = createMemoryRedis();
        const r = await Alg.run(
          {
            v: 1,
            steps: [
              { op: 'assign', to: 'qty', from: 'form.qty' },
              {
                op: 'if',
                when: ['lte', 'qty', 0],
                then: [{ op: 'end', err: 'Cantitate invalida' }],
                else: [{ op: 'end', msg: 'ok' }],
              },
            ],
          },
          { form: { qty: 0 }, redis }
        );
        assertEq(r.err, 'Cantitate invalida');
      },
    },
    {
      id: 5,
      desc: 'foreach setează as',
      async run() {
        const redis = createMemoryRedis();
        const r = await Alg.run(
          {
            v: 1,
            steps: [
              {
                op: 'foreach',
                in: 'form.nums',
                as: 'n',
                do: [{ op: 'assign', to: 'last', from: 'n' }],
              },
              { op: 'end', msg: 'done' },
            ],
          },
          { form: { nums: [1, 2, 3] }, redis }
        );
        assertEq(r.vars.n, 3);
        assertEq(r.vars.last, 3);
        assertEq(r.msg, 'done');
      },
    },
    {
      id: 6,
      desc: 'v nesuportat',
      async run() {
        const redis = createMemoryRedis();
        const r = await Alg.run({ v: 2, steps: [] }, { form: {}, redis });
        assert(r.err && /versiune/i.test(r.err));
      },
    },
    {
      id: 7,
      desc: 'exemplu save_item (fără redis write)',
      async run() {
        const redis = createMemoryRedis();
        const r = await Alg.run(
          {
            v: 1,
            steps: [
              { op: 'assign', to: 'qty', from: 'form.qty' },
              {
                op: 'if',
                when: ['lte', 'qty', 0],
                then: [{ op: 'end', err: 'Cantitate invalida' }],
              },
              { op: 'cat', to: 'key', parts: ['data:_item:', 'form.id'] },
              { op: 'ksave', key: '$key', val: 'form', as: 'auto' },
              { op: 'end', msg: 'Salvat' },
            ],
          },
          { form: { qty: 2, id: '9', name: 'x' }, redis }
        );
        assertEq(r.msg, 'Salvat');
        assertEq(r.vars.key, 'data:_item:9');
        const tip = await redis.type('data:_item:9');
        assertEq(tip, 'json');
      },
    },
    {
      id: 8,
      desc: 'comment no-op + off skip + thenOff/elseOff (F2-alg-E)',
      async run() {
        const redis = createMemoryRedis();
        const r1 = await Alg.run(
          {
            v: 1,
            steps: [
              { op: 'comment', note: 'secțiune' },
              { op: 'assign', to: 'x', val: 1 },
              { op: 'assign', to: 'y', val: 2, off: true },
              { op: 'end', msg: 'ok' },
            ],
          },
          { form: {}, redis }
        );
        assertEq(r1.vars.x, 1);
        assert(r1.vars.y === undefined, 'off skip assign y');
        assertEq(r1.msg, 'ok');

        const r2 = await Alg.run(
          {
            v: 1,
            steps: [
              {
                op: 'if',
                when: ['eq', 1, 1],
                then: [{ op: 'assign', to: 't', val: 'then' }],
                else: [{ op: 'assign', to: 'e', val: 'else' }],
                thenOff: true,
              },
              { op: 'end', msg: 'ok' },
            ],
          },
          { form: {}, redis }
        );
        assert(r2.vars.t === undefined, 'thenOff');
        assert(r2.vars.e === undefined);

        const r3 = await Alg.run(
          {
            v: 1,
            steps: [
              {
                op: 'if',
                when: ['eq', 1, 2],
                then: [{ op: 'assign', to: 't', val: 'then' }],
                else: [{ op: 'assign', to: 'e', val: 'else' }],
                elseOff: true,
              },
              { op: 'end', msg: 'ok' },
            ],
          },
          { form: {}, redis }
        );
        assert(r3.vars.e === undefined, 'elseOff');
        assert(r3.vars.t === undefined);

        const r4 = await Alg.run(
          {
            v: 1,
            steps: [
              {
                op: 'if',
                off: true,
                when: ['eq', 1, 1],
                then: [{ op: 'assign', to: 't', val: 'then' }],
              },
              { op: 'assign', to: 'z', val: 9 },
              { op: 'end', msg: 'ok' },
            ],
          },
          { form: {}, redis }
        );
        assert(r4.vars.t === undefined, 'if off');
        assertEq(r4.vars.z, 9);
      },
    },
    {
      id: 9,
      desc: 'cast from string to json',
      async run() {
        const redis = createMemoryRedis();
        const r = await Alg.run(
          {
            v: 1,
            steps: [{ op: 'cast', val: '{"a":1}', as: 'json', to: 'x' }, { op: 'end', msg: 'ok' }],
          },
          { form: {}, redis }
        );
        assertEqJson(r.vars.x, { a: 1 });
        assertEq(r.msg, 'ok');
        assert(!r.err);
        assert(r.stopped);
      },
    },
    {
      id: 10,
      desc: 'cast from json to string',
      async run() {
        const redis = createMemoryRedis();
        const r = await Alg.run(
          {
            v: 1,
            steps: [{ op: 'cast', val: '{"a":1}', as: 'string', to: 'x' }, { op: 'end', msg: 'ok' }],
          },
          { form: {}, redis }
        );
        assertEq(r.vars.x, '{"a":1}');
        assertEq(r.msg, 'ok');
        assert(!r.err);
        assert(r.stopped);
      },
    },
    {
      id: 11,
      desc: 'cast from number to integer round down',
      async run() {
        const redis = createMemoryRedis();
        const r = await Alg.run(
          {
            v: 1,
            steps: [{ op: 'cast', val: 1.4, as: 'integer', to: 'x' }, { op: 'end', msg: 'ok' }],
          },
          { form: {}, redis }
        );
        assertEq(r.vars.x, 1);
        assertEq(r.msg, 'ok');
        assert(!r.err);
        assert(r.stopped);
      },
    },
    {
      id: 12,
      desc: 'cast from number to integer round up',
      async run() {
        const redis = createMemoryRedis();
        const r = await Alg.run(
          {
            v: 1,
            steps: [{ op: 'cast', val: 1.5, as: 'integer', to: 'x' }, { op: 'end', msg: 'ok' }],
          },
          { form: {}, redis }
        );
        assertEq(r.vars.x, 2);
        assertEq(r.msg, 'ok');
        assert(!r.err);
        assert(r.stopped);
      },
    },
    {
      id: 13,
      desc: 'cast from integer to number',
      async run() {
        const redis = createMemoryRedis();
        const r = await Alg.run(
          {
            v: 1,
            steps: [{ op: 'cast', val: 1, as: 'number', to: 'x' }, { op: 'end', msg: 'ok' }],
          },
          { form: {}, redis }
        );
        assertEq(r.vars.x, 1);
        assertEq(r.msg, 'ok');
        assert(!r.err);
        assert(r.stopped);
      },
    },
    {
      id: 14,
      desc: 'cast from boolean to string',
      async run() {
        const redis = createMemoryRedis();
        const r = await Alg.run(
          {
            v: 1,
            steps: [{ op: 'cast', val: true, as: 'string', to: 'x' }, { op: 'end', msg: 'ok' }],
          },
          { form: {}, redis }
        );
        assertEq(r.vars.x, 'true');
        assertEq(r.msg, 'ok');
        assert(!r.err);
        assert(r.stopped);
      },
    },
    {
      id: 15,
      desc: 'cast from null to string',
      async run() {
        const redis = createMemoryRedis();
        const r = await Alg.run(
          {
            v: 1,
            steps: [{ op: 'cast', val: null, as: 'string', to: 'x' }, { op: 'end', msg: 'ok' }],
          },
          { form: {}, redis }
        );
        assertEq(r.vars.x, '');
        assertEq(r.msg, 'ok');
        assert(!r.err);
        assert(r.stopped);
      },
    },
    {
      id: 16,
      desc: 'cast from undefined to string',
      async run() {
        const redis = createMemoryRedis();
        const r = await Alg.run(
          {
            v: 1,
            steps: [{ op: 'cast', val: undefined, as: 'string', to: 'x' }, { op: 'end', msg: 'ok' }],
          },
          { form: {}, redis }
        );
        assertEq(r.vars.x, '');
        assertEq(r.msg, 'ok');
        assert(!r.err);
        assert(r.stopped);
      },
    },
    {
      id: 17,
      desc: 'cast from number to boolean',
      async run() {
        const redis = createMemoryRedis();
        const r = await Alg.run(
          {
            v: 1,
            steps: [{ op: 'cast', val: 1, as: 'boolean', to: 'x' }, { op: 'end', msg: 'ok' }],
          },
          { form: {}, redis }
        );
        assertEq(r.vars.x, true);
        assertEq(r.msg, 'ok');
        assert(!r.err);
        assert(r.stopped);
      },
    },
    {
      id: 18,
      desc: 'cast from boolean to number',
      async run() {
        const redis = createMemoryRedis();
        const r = await Alg.run(
          {
            v: 1,
            steps: [{ op: 'cast', val: true, as: 'number', to: 'x' }, { op: 'end', msg: 'ok' }],
          },
          { form: {}, redis }
        );
        assertEq(r.vars.x, 1);
        assertEq(r.msg, 'ok');
        assert(!r.err);
        assert(r.stopped);
      },
    },
    {
      id: 19,
      desc: 'cast from null to boolean',
      async run() {
        const redis = createMemoryRedis();
        const r = await Alg.run(
          {
            v: 1,
            steps: [{ op: 'cast', val: null, as: 'boolean', to: 'x' }, { op: 'end', msg: 'ok' }],
          },
          { form: {}, redis }
        );
        assertEq(r.vars.x, false);
        assertEq(r.msg, 'ok');
        assert(!r.err);
        assert(r.stopped);
      },
    },
    {
      id: 20,
      desc: 'cast invalid string to number gives zero instead of NaN',
      async run() {
        const redis = createMemoryRedis();
        const r = await Alg.run(
          {
            v: 1,
            steps: [{ op: 'cast', val: 'not-a-number', as: 'number', to: 'x' }, { op: 'end', msg: 'ok' }],
          },
          { form: {}, redis }
        );
        assertEq(r.vars.x, 0);
        assertEq(r.msg, 'ok');
        assert(!r.err);
        assert(r.stopped);
      },
    },
    {
      id: 21,
      desc: 'cast empty array to number gives zero',
      async run() {
        const redis = createMemoryRedis();
        const r = await Alg.run(
          {
            v: 1,
            steps: [{ op: 'cast', val: [], as: 'number', to: 'x' }, { op: 'end', msg: 'ok' }],
          },
          { form: {}, redis }
        );
        assertEq(r.vars.x, 0);
        assertEq(r.msg, 'ok');
        assert(!r.err);
        assert(r.stopped);
      },
    },
    {
      id: 22,
      desc: 'cast empty object to number gives zero',
      async run() {
        const redis = createMemoryRedis();
        const r = await Alg.run(
          {
            v: 1,
            steps: [{ op: 'cast', val: {}, as: 'number', to: 'x' }, { op: 'end', msg: 'ok' }],
          },
          { form: {}, redis }
        );
        assertEq(r.vars.x, 0);
        assertEq(r.msg, 'ok');
        assert(!r.err);
        assert(r.stopped);
      },
    },
    {
      id: 23,
      desc: 'cast populated object to number gives one',
      async run() {
        const redis = createMemoryRedis();
        const r = await Alg.run(
          {
            v: 1,
            steps: [{ op: 'cast', val: { a: 10 }, as: 'number', to: 'x' }, { op: 'end', msg: 'ok' }],
          },
          { form: {}, redis }
        );
        assertEq(r.vars.x, 1);
        assertEq(r.msg, 'ok');
        assert(!r.err);
        assert(r.stopped);
      },
    },
    {
      id: 24,
      desc: 'cast invalid string to integer gives zero instead of NaN',
      async run() {
        const redis = createMemoryRedis();
        const r = await Alg.run(
          {
            v: 1,
            steps: [{ op: 'cast', val: 'abc', as: 'integer', to: 'x' }, { op: 'end', msg: 'ok' }],
          },
          { form: {}, redis }
        );
        assertEq(r.vars.x, 0);
        assertEq(r.msg, 'ok');
        assert(!r.err);
        assert(r.stopped);
      },
    },
    {
      id: 25,
      desc: 'cast from string to json valid array',
      async run() {
        const redis = createMemoryRedis();
        const r = await Alg.run(
          {
            v: 1,
            steps: [{ op: 'cast', val: '[1,2,3]', as: 'json', to: 'x' }, { op: 'end', msg: 'ok' }],
          },
          { form: {}, redis }
        );
        assertEqJson(r.vars.x, [1, 2, 3]);
        assertEq(r.msg, 'ok');
        assert(!r.err);
        assert(r.stopped);
      },
    },
    {
      id: 26,
      desc: 'cast from json to string valid array',
      async run() {
        const redis = createMemoryRedis();
        const r = await Alg.run(
          {
            v: 1,
            steps: [{ op: 'cast', val: [1,2,3], as: 'string', to: 'x' }, { op: 'end', msg: 'ok' }],
          },
          { form: {}, redis }
        );
        assertEq(r.vars.x, '[1,2,3]');
        assertEq(r.msg, 'ok');
        assert(!r.err);
        assert(r.stopped);
      },
    },
    {
      id: 27,
      desc: 'cast from invalid json string to json fallback handling',
      async run() {
        const redis = createMemoryRedis();
        const r = await Alg.run(
          {
            v: 1,
            steps: [{ op: 'cast', val: '{invalid-json}', as: 'json', to: 'x' }, { op: 'end', msg: 'ok' }],
          },
          { form: {}, redis }
        );
        assertEq(r.msg, 'ok');
        assert(!r.err);
        assert(r.stopped);
      },
    },
    {
      id: 28,
      desc: 'cast from primitive string to json',
      async run() {
        const redis = createMemoryRedis();
        const r = await Alg.run(
          {
            v: 1,
            steps: [{ op: 'cast', val: '"text-in-ghilimele"', as: 'json', to: 'x' }, { op: 'end', msg: 'ok' }],
          },
          { form: {}, redis }
        );
        assertEq(r.msg, 'ok');
        assert(!r.err);
        assert(r.stopped);
      },
    },
    {
      id: 29,
      desc: 'cast empty string to json handling',
      async run() {
        const redis = createMemoryRedis();
        const r = await Alg.run(
          {
            v: 1,
            steps: [{ op: 'cast', val: '', as: 'json', to: 'x' }, { op: 'end', msg: 'ok' }],
          },
          { form: {}, redis }
        );
        assertEq(r.msg, 'ok');
        assert(!r.err);
        assert(r.stopped);
      },
    },
    {
      id: 30,
      desc: 'cast auto from valid json string to object',
      async run() {
        const redis = createMemoryRedis();
        const r = await Alg.run(
          {
            v: 1,
            steps: [{ op: 'cast', val: '{"status":true}', as: 'auto', to: 'x' }, { op: 'end', msg: 'ok' }],
          },
          { form: {}, redis }
        );
        assertEqJson(r.vars.x, { status: true });
        assertEq(r.msg, 'ok');
        assert(!r.err);
        assert(r.stopped);
      },
    },
    {
      id: 31,
      desc: 'cast auto from object returns the object untouched',
      async run() {
        const redis = createMemoryRedis();
        const r = await Alg.run(
          {
            v: 1,
            steps: [{ op: 'cast', val: { user: 'admin' }, as: 'auto', to: 'x' }, { op: 'end', msg: 'ok' }],
          },
          { form: {}, redis }
        );
        assertEqJson(r.vars.x, { user: 'admin' });
        assertEq(r.msg, 'ok');
        assert(!r.err);
        assert(r.stopped);
      },
    },
    {
      id: 32,
      desc: 'cast auto from number returns string representation',
      async run() {
        const redis = createMemoryRedis();
        const r = await Alg.run(
          {
            v: 1,
            steps: [{ op: 'cast', val: 42.5, as: 'auto', to: 'x' }, { op: 'end', msg: 'ok' }],
          },
          { form: {}, redis }
        );
        assertEq(r.vars.x, '42.5');
        assertEq(r.msg, 'ok');
        assert(!r.err);
        assert(r.stopped);
      },
    },
    {
      id: 33,
      desc: 'cast to null always returns null',
      async run() {
        const redis = createMemoryRedis();
        const r = await Alg.run(
          {
            v: 1,
            steps: [{ op: 'cast', val: 'anything', as: 'null', to: 'x' }, { op: 'end', msg: 'ok' }],
          },
          { form: {}, redis }
        );
        assertEq(r.vars.x, null);
        assertEq(r.msg, 'ok');
        assert(!r.err);
        assert(r.stopped);
      },
    },
    {
      id: 34,
      desc: 'cast invalid string to number gives zero instead of NaN',
      async run() {
        const redis = createMemoryRedis();
        const r = await Alg.run(
          {
            v: 1,
            steps: [{ op: 'cast', val: 'not-a-number', as: 'number', to: 'x' }, { op: 'end', msg: 'ok' }],
          },
          { form: {}, redis }
        );
        assertEq(r.vars.x, 0);
        assertEq(r.msg, 'ok');
        assert(!r.err);
        assert(r.stopped);
      },
    },
    {
      id: 35,
      desc: 'cast empty array to number gives zero',
      async run() {
        const redis = createMemoryRedis();
        const r = await Alg.run(
          {
            v: 1,
            steps: [{ op: 'cast', val: [], as: 'number', to: 'x' }, { op: 'end', msg: 'ok' }],
          },
          { form: {}, redis }
        );
        assertEq(r.vars.x, 0);
        assertEq(r.msg, 'ok');
        assert(!r.err);
        assert(r.stopped);
      },
    },
    {
      id: 36,
      desc: 'cast empty object to number gives zero',
      async run() {
        const redis = createMemoryRedis();
        const r = await Alg.run(
          {
            v: 1,
            steps: [{ op: 'cast', val: {}, as: 'number', to: 'x' }, { op: 'end', msg: 'ok' }],
          },
          { form: {}, redis }
        );
        assertEq(r.vars.x, 0);
        assertEq(r.msg, 'ok');
        assert(!r.err);
        assert(r.stopped);
      },
    },
    {
      id: 37,
      desc: 'cast populated object to number gives one',
      async run() {
        const redis = createMemoryRedis();
        const r = await Alg.run(
          {
            v: 1,
            steps: [{ op: 'cast', val: { a: 10 }, as: 'number', to: 'x' }, { op: 'end', msg: 'ok' }],
          },
          { form: {}, redis }
        );
        assertEq(r.vars.x, 1);
        assertEq(r.msg, 'ok');
        assert(!r.err);
        assert(r.stopped);
      },
    },
    {
      id: 38,
      desc: 'cast invalid string to integer gives zero instead of NaN',
      async run() {
        const redis = createMemoryRedis();
        const r = await Alg.run(
          {
            v: 1,
            steps: [{ op: 'cast', val: 'abc', as: 'integer', to: 'x' }, { op: 'end', msg: 'ok' }],
          },
          { form: {}, redis }
        );
        assertEq(r.vars.x, 0);
        assertEq(r.msg, 'ok');
        assert(!r.err);
        assert(r.stopped);
      },
    },
    {
      id: 39,
      desc: 'cast with from reference string to json',
      async run() {
        const redis = createMemoryRedis();
        const r = await Alg.run(
          {
            v: 1,
            steps: [
              { op: 'cast', from: 'form.payload', as: 'json', to: 'x' },
              { op: 'end', msg: 'ok' },
            ],
          },
          { form: { payload: '{"active":true}' }, redis }
        );
        assertEqJson(r.vars.x, { active: true });
        assertEq(r.msg, 'ok');
        assert(!r.err);
        assert(r.stopped);
      },
    },
    {
      id: 40,
      desc: 'cast with from reference string to integer',
      async run() {
        const redis = createMemoryRedis();
        const r = await Alg.run(
          {
            v: 1,
            steps: [
              { op: 'cast', from: 'form.count', as: 'integer', to: 'x' },
              { op: 'end', msg: 'ok' },
            ],
          },
          { form: { count: '15.7' }, redis }
        );
        assertEq(r.vars.x, 16);
        assertEq(r.msg, 'ok');
        assert(!r.err);
        assert(r.stopped);
      },
    },
    {
      id: 41,
      desc: 'cast with from reference empty array to number',
      async run() {
        const redis = createMemoryRedis();
        const r = await Alg.run(
          {
            v: 1,
            steps: [
              { op: 'cast', from: 'form.items', as: 'number', to: 'x' },
              { op: 'end', msg: 'ok' },
            ],
          },
          { form: { items: [] }, redis }
        );
        assertEq(r.vars.x, 0);
        assertEq(r.msg, 'ok');
        assert(!r.err);
        assert(r.stopped);
      },
    },
    {
      id: 42,
      desc: 'cast with from reference missing value fallback to zero',
      async run() {
        const redis = createMemoryRedis();
        const r = await Alg.run(
          {
            v: 1,
            steps: [
              { op: 'cast', from: 'form.missing_field', as: 'number', to: 'x' },
              { op: 'end', msg: 'ok' },
            ],
          },
          { form: {}, redis }
        );
        assertEq(r.vars.x, 0);
        assertEq(r.msg, 'ok');
        assert(!r.err);
        assert(r.stopped);
      },
    },
  ],
};
