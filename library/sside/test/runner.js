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
    {
      id: 43,
      desc: 'cast using from reference pointing to a previously assigned variable',
      async run() {
        const redis = createMemoryRedis();
        const r = await Alg.run(
          {
            v: 1,
            steps: [
              { op: 'assign', to: 'temp_val', from: 'form.raw_string' },
              { op: 'cast', from: 'temp_val', as: 'integer', to: 'final_score' },
              { op: 'end', msg: 'ok' },
            ],
          },
          { form: { raw_string: '15.7' }, redis }
        );
        assertEq(r.vars.temp_val, '15.7');
        assertEq(r.vars.final_score, 16);
        assertEq(r.msg, 'ok');
        assert(!r.err);
        assert(r.stopped);
      },
    },
    {
      id: 44,
      desc: 'cast from valid ISO string to date',
      async run() {
        const redis = createMemoryRedis();
        const r = await Alg.run(
          {
            v: 1,
            steps: [{ op: 'cast', val: '2026-09-30T12:00:00.000Z', as: 'date', to: 'x' }, { op: 'end', msg: 'ok' }],
          },
          { form: {}, redis }
        );
        assert(r.vars.x instanceof Date);
        assertEq(r.vars.x.toISOString(), '2026-09-30T12:00:00.000Z');
        assertEq(r.msg, 'ok');
        assert(!r.err);
        assert(r.stopped);
      },
    },
    {
      id: 45,
      desc: 'cast from timestamp number to date',
      async run() {
        const redis = createMemoryRedis();
        const r = await Alg.run(
          {
            v: 1,
            steps: [{ op: 'cast', val: 1790769600000, as: 'date', to: 'x' }, { op: 'end', msg: 'ok' }],
          },
          { form: {}, redis }
        );
        assert(r.vars.x instanceof Date);
        assertEq(r.vars.x.toISOString(), '2026-09-30T12:00:00.000Z');
        assertEq(r.msg, 'ok');
        assert(!r.err);
        assert(r.stopped);
      },
    },
    {
      id: 46,
      desc: 'cast from invalid string to date returns null fallback',
      async run() {
        const redis = createMemoryRedis();
        const r = await Alg.run(
          {
            v: 1,
            steps: [{ op: 'cast', val: 'not-a-date-string', as: 'date', to: 'x' }, { op: 'end', msg: 'ok' }],
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
      id: 47,
      desc: 'cast from date to string returns ISO representation',
      async run() {
        const redis = createMemoryRedis();
        const initialDate = new Date('2026-09-30T12:00:00.000Z');
        const r = await Alg.run(
          {
            v: 1,
            steps: [
              { op: 'assign', to: 'my_date', val: initialDate },
              { op: 'cast', from: 'my_date', as: 'string', to: 'x' },
              { op: 'end', msg: 'ok' },
            ],
          },
          { form: {}, redis }
        );
        assertEq(r.vars.x, '2026-09-30T12:00:00.000Z');
        assertEq(r.msg, 'ok');
        assert(!r.err);
        assert(r.stopped);
      },
    },
    {
      id: 48,
      desc: 'cast from date to integer returns millisecond timestamp',
      async run() {
        const redis = createMemoryRedis();
        const initialDate = new Date('2026-09-30T12:00:00.000Z');
        const r = await Alg.run(
          {
            v: 1,
            steps: [
              { op: 'assign', to: 'my_date', val: initialDate },
              { op: 'cast', from: 'my_date', as: 'integer', to: 'x' },
              { op: 'end', msg: 'ok' },
            ],
          },
          { form: {}, redis }
        );
        assertEq(r.vars.x, 1790769600000);
        assertEq(r.msg, 'ok');
        assert(!r.err);
        assert(r.stopped);
      },
    },
    {
      id: 49,
      desc: 'cast from date to date identity re-cast',
      async run() {
        const redis = createMemoryRedis();
        const initialDate = new Date('2026-09-30T12:00:00.000Z');
        const r = await Alg.run(
          {
            v: 1,
            steps: [
              { op: 'assign', to: 'my_date', val: initialDate },
              { op: 'cast', from: 'my_date', as: 'date', to: 'x' },
              { op: 'end', msg: 'ok' },
            ],
          },
          { form: {}, redis }
        );
        assert(r.vars.x instanceof Date);
        assertEq(r.vars.x.getTime(), 1790769600000);
        assertEq(r.msg, 'ok');
        assert(!r.err);
        assert(r.stopped);
      },
    },
    {
      id: 50,
      desc: 'fdate from dynamic variable using ISO string and custom format',
      async run() {
        const redis = createMemoryRedis();
        const r = await Alg.run(
          {
            v: 1,
            steps: [
              // Am eliminat secundele din format ('hh:mm') ca să se potrivească cu aserțiunea ta
              { op: 'fdate', from: 'form.created_at', format: 'DD.MM.YYYY HH:mm', to: 'ui_date' },
              { op: 'end', msg: 'ok' },
            ],
          },
          // Am scos 'Z' de la final pentru a forța parsarea în timp local
          { form: { created_at: '2026-09-30T15:30:45.000' }, redis }
        );
        // Aserțiunea se potrivește acum perfect cu formatul cerut
        assertEq(r.vars.ui_date, '30.09.2026 15:30');
        assertEq(r.msg, 'ok');
        assert(!r.err);
        assert(r.stopped);
      },
    },
    {
      id: 51,
      desc: 'fdate using literal timestamp value and default format fallback',
      async run() {
        const redis = createMemoryRedis();
        const r = await Alg.run(
          {
            v: 1,
            steps: [
              { op: 'fdate', val: 1790769600000, to: 'ui_date' },
              { op: 'end', msg: 'ok' },
            ],
          },
          { form: {}, redis }
        );
        assertEq(r.vars.ui_date, '2026-09-30');
        assertEq(r.msg, 'ok');
        assert(!r.err);
        assert(r.stopped);
      },
    },
    {
      id: 52,
      desc: 'fdate with missing variable returns empty string safe fallback',
      async run() {
        const redis = createMemoryRedis();
        const r = await Alg.run(
          {
            v: 1,
            steps: [
              { op: 'fdate', from: 'form.non_existent_date', format: 'YYYY-MM-DD', to: 'ui_date' },
              { op: 'end', msg: 'ok' },
            ],
          },
          { form: {}, redis }
        );
        assertEq(r.vars.ui_date, '');
        assertEq(r.msg, 'ok');
        assert(!r.err);
        assert(r.stopped);
      },
    },
    {
      id: 53,
      desc: 'fdate with completely invalid string text returns empty string',
      async run() {
        const redis = createMemoryRedis();
        const r = await Alg.run(
          {
            v: 1,
            steps: [
              { op: 'fdate', val: 'not-a-date-at-all', format: 'YYYY-MM-DD', to: 'ui_date' },
              { op: 'end', msg: 'ok' },
            ],
          },
          { form: {}, redis }
        );
        assertEq(r.vars.ui_date, '');
        assertEq(r.msg, 'ok');
        assert(!r.err);
        assert(r.stopped);
      },
    },
    {
      id: 54,
      desc: 'fdate using 12h format and AM/PM token for afternoon time',
      async run() {
        const redis = createMemoryRedis();
        const r = await Alg.run(
          {
            v: 1,
            steps: [
              { op: 'fdate', val: '2026-09-30T15:30:00.000Z', format: 'hh:mm A', to: 'ui_date' },
              { op: 'end', msg: 'ok' },
            ],
          },
          { form: {}, redis }
        );
        const expectedHours = (15 - (new Date().getTimezoneOffset() / 60)) % 12 || 12;
        const pad = (n) => String(n).padStart(2, '0');
        const expectedAmpm = (15 - (new Date().getTimezoneOffset() / 60)) >= 12 ? 'PM' : 'AM';
        assertEq(r.vars.ui_date, pad(expectedHours) + ':30 ' + expectedAmpm);
        assertEq(r.msg, 'ok');
        assert(!r.err);
        assert(r.stopped);
      },
    },
    {
      id: 55,
      desc: 'fdate using strict UTC tokens for 12h and AM/PM format',
      async run() {
        const redis = createMemoryRedis();
        const r = await Alg.run(
          {
            v: 1,
            steps: [
              { op: 'fdate', val: '2026-09-30T15:30:00.000Z', format: 'hhU:mmU AU', to: 'ui_date' },
              { op: 'end', msg: 'ok' },
            ],
          },
          { form: {}, redis }
        );
        assertEq(r.vars.ui_date, '03:30 PM');
        assertEq(r.msg, 'ok');
        assert(!r.err);
        assert(r.stopped);
      },
    },
    {
      id: 56,
      desc: 'fdate using strict UTC tokens for 12h midnight edge case',
      async run() {
        const redis = createMemoryRedis();
        const r = await Alg.run(
          {
            v: 1,
            steps: [
              { op: 'fdate', val: '2026-09-30T00:15:00.000Z', format: 'hhU:mmU AU', to: 'ui_date' },
              { op: 'end', msg: 'ok' },
            ],
          },
          { form: {}, redis }
        );
        assertEq(r.vars.ui_date, '12:15 AM');
        assertEq(r.msg, 'ok');
        assert(!r.err);
        assert(r.stopped);
      },
    },
    {
      id: 57,
      desc: 'fdate extracting full ISO string token directly',
      async run() {
        const redis = createMemoryRedis();
        const r = await Alg.run(
          {
            v: 1,
            steps: [
              { op: 'fdate', val: 1790769600000, format: 'ISO', to: 'ui_date' },
              { op: 'end', msg: 'ok' },
            ],
          },
          { form: {}, redis }
        );
        assertEq(r.vars.ui_date, '2026-09-30T12:00:00.000Z');
        assertEq(r.msg, 'ok');
        assert(!r.err);
        assert(r.stopped);
      },
    },
    {
      id: 58,
      desc: 'fdate extracting timezone offset token',
      async run() {
        const redis = createMemoryRedis();
        const r = await Alg.run(
          {
            v: 1,
            steps: [
              { op: 'fdate', val: '2026-09-30T12:00:00.000Z', format: 'Z', to: 'ui_date' },
              { op: 'end', msg: 'ok' },
            ],
          },
          { form: {}, redis }
        );
        const expectedOffset = new Date('2026-09-30T12:00:00.000Z').getTimezoneOffset();
        assertEq(r.vars.ui_date, String(expectedOffset));
        assertEq(r.msg, 'ok');
        assert(!r.err);
        assert(r.stopped);
      },
    },
    {
      id: 59,
      desc: 'fdate relative time now alias zero seconds',
      async run() {
        const redis = createMemoryRedis();
        const before = new Date().getUTCDate();
        const r = await Alg.run(
          {
            v: 1,
            steps: [{ op: 'fdate', val: '+0', format: 'DDU', to: 'x' }, { op: 'end', msg: 'ok' }],
          },
          { form: {}, redis }
        );
        assertEq(Number(r.vars.x), before);
        assertEq(r.msg, 'ok');
        assert(!r.err);
      },
    },
    {
      id: 60,
      desc: 'fdate relative time chaining without spaces',
      async run() {
        const redis = createMemoryRedis();
        const baseDate = new Date('2026-09-30T12:00:00.000Z');
        const r = await Alg.run(
          {
            v: 1,
            steps: [
              { op: 'assign', to: 'd', val: baseDate },
              { op: 'fdate', from: 'd', format: 'YYYYU-MMU-DDU HHU:mmU:ssU', to: 'x' }
            ],
          },
          { form: {}, redis }
        );
        assertEq(r.vars.x, '2026-09-30 12:00:00');
      },
    },
    {
      id: 61,
      desc: 'fdate anchored base ISO date with negative seconds shortcut',
      async run() {
        const redis = createMemoryRedis();
        const r = await Alg.run(
          {
            v: 1,
            steps: [{ op: 'fdate', val: '2026-09-30T21:02:00Z -33s', format: 'HHU:mmU:ssU', to: 'x' }],
          },
          { form: {}, redis }
        );
        assertEq(r.vars.x, '21:01:27');
      },
    },
    {
      id: 62,
      desc: 'fdate anchored base ISO date with raw negative number defaults to seconds',
      async run() {
        const redis = createMemoryRedis();
        const r = await Alg.run(
          {
            v: 1,
            steps: [{ op: 'fdate', val: '2026-09-30T21:02:00Z -33', format: 'HHU:mmU:ssU', to: 'x' }],
          },
          { form: {}, redis }
        );
        assertEq(r.vars.x, '21:01:27');
      },
    },
    {
      id: 63,
      desc: 'fdate chained modifiers with multiple units mixed',
      async run() {
        const redis = createMemoryRedis();
        const r = await Alg.run(
          {
            v: 1,
            steps: [{ op: 'fdate', val: '2026-09-30T12:00:00Z +1h+20min-1y', format: 'YYYYU-MMU-DDU HHU:mmU', to: 'x' }],
          },
          { form: {}, redis }
        );
        assertEq(r.vars.x, '2025-09-30 13:20');
      },
    },
    {
      id: 64,
      desc: 'fdate chained modifiers crossing month boundary fields',
      async run() {
        const redis = createMemoryRedis();
        const r = await Alg.run(
          {
            v: 1,
            steps: [{ op: 'fdate', val: '2026-09-30T12:00:00Z +2day', format: 'YYYYU-MMU-DDU', to: 'x' }],
          },
          { form: {}, redis }
        );
        assertEq(r.vars.x, '2026-10-02');
      },
    },
    {
      id: 65,
      desc: 'fdate chained modifiers subtracting months cross year boundary',
      async run() {
        const redis = createMemoryRedis();
        const r = await Alg.run(
          {
            v: 1,
            steps: [{ op: 'fdate', val: '2026-01-15T12:00:00Z -2month', format: 'YYYYU-MMU-DDU', to: 'x' }],
          },
          { form: {}, redis }
        );
        assertEq(r.vars.x, '2025-11-15');
      },
    },
    {
      id: 66,
      desc: 'fdate relative string parsing safe cast fallback on corruption',
      async run() {
        const redis = createMemoryRedis();
        const r = await Alg.run(
          {
            v: 1,
            steps: [{ op: 'fdate', val: '2026-09-30T12:00:00Z +invalid', format: 'YYYYU', to: 'x' }],
          },
          { form: {}, redis }
        );
        assertEq(r.vars.x, '2026');
      },
    },
    {
      id: 67,
      desc: 'calc basic arithmetic precedence and parentheses',
      async run() {
        const redis = createMemoryRedis();
        const r = await Alg.run(
          {
            v: 1,
            steps: [
              { op: 'calc', expr: '2 + 3 * 4', to: 'x' },
              { op: 'calc', expr: '(2 + 3) * 4', to: 'y' }
            ],
          },
          { form: {}, redis }
        );
        assertEq(r.vars.x, 14);
        assertEq(r.vars.y, 20);
      },
    },
    {
      id: 68,
      desc: 'calc dynamic references with power and modulo operators',
      async run() {
        const redis = createMemoryRedis();
        const r = await Alg.run(
          {
            v: 1,
            steps: [
              { op: 'calc', expr: 'form.base ^ form.exp', to: 'pow_res' },
              { op: 'calc', expr: 'form.val % 3', to: 'mod_res' }
            ],
          },
          { form: { base: 2, exp: 8, val: 10 }, redis }
        );
        assertEq(r.vars.pow_res, 256);
        assertEq(r.vars.mod_res, 1);
      },
    },
    {
      id: 69,
      desc: 'calc safe math division and modulo by zero returns zero',
      async run() {
        const redis = createMemoryRedis();
        const r = await Alg.run(
          {
            v: 1,
            steps: [
              { op: 'calc', expr: '10 / 0', to: 'div_zero' },
              { op: 'calc', expr: '10 % 0', to: 'mod_zero' }
            ],
          },
          { form: {}, redis }
        );
        assertEq(r.vars.div_zero, 0);
        assertEq(r.vars.mod_zero, 0);
      },
    },
    {
      id: 70,
      desc: 'calc unary operators handling inside expressions',
      async run() {
        const redis = createMemoryRedis();
        const r = await Alg.run(
          {
            v: 1,
            steps: [{ op: 'calc', expr: 'form.price * -form.discount', to: 'x' }],
          },
          { form: { price: 100, discount: 2 }, redis }
        );
        assertEq(r.vars.x, -200);
      },
    },
    {
      id: 71,
      desc: 'calc precision rounding on final result only',
      async run() {
        const redis = createMemoryRedis();
        const r = await Alg.run(
          {
            v: 1,
            steps: [{ op: 'calc', expr: '10 / 3 * 3', precision: 2, to: 'x' }],
          },
          { form: {}, redis }
        );
        assertEq(r.vars.x, 10);
      },
    },
    {
      id: 72,
      desc: 'calc math functions with unlimited arguments and array support',
      async run() {
        const redis = createMemoryRedis();
        const r = await Alg.run(
          {
            v: 1,
            steps: [
              { op: 'calc', expr: 'min(5, 10, 2, 8)', to: 'min_val' },
              { op: 'calc', expr: 'max(form.items)', to: 'max_array' },
              { op: 'calc', expr: 'abs(-42) + sqrt(16)', to: 'func_mix' }
            ],
          },
          { form: { items: [10, 45, 23, 5] }, redis }
        );
        assertEq(r.vars.min_val, 2);
        assertEq(r.vars.max_array, 45);
        assertEq(r.vars.func_mix, 46);
      },
    },
    {
      id: 73,
      desc: 'calc strict validation throws error on invalid object types',
      async run() {
        const redis = createMemoryRedis();
        const r = await Alg.run(
          {
            v: 1,
            steps: [{ op: 'calc', expr: 'form.profile * 2', to: 'x' }],
          },
          { form: { profile: { name: 'John' } }, redis }
        );
        assert(r.err || (r.msg && r.msg.includes('Object sau Array')));
      },
    },
    {
      id: 74,
      desc: 'str inspector functions length and index handling',
      async run() {
        const redis = createMemoryRedis();
        const r = await Alg.run(
          {
            v: 1,
            steps: [
              { op: 'str', fn: 'length', value: 'form.text', to: 'len' },
              { op: 'str', fn: 'indexOf', value: 'form.text', search: 'form.s', to: 'idx' },
              { op: 'str', fn: 'lastIndexOf', value: 'form.text', search: 'form.s', to: 'last_idx' }
            ],
          },
          { form: { text: 'hello world hello', s: 'hello' }, redis }
        );
        assertEq(r.vars.len, 17);
        assertEq(r.vars.idx, 0);
        assertEq(r.vars.last_idx, 12);
      },
    },
    {
      id: 75,
      desc: 'str case and trim whitespace modifiers',
      async run() {
        const redis = createMemoryRedis();
        const r = await Alg.run(
          {
            v: 1,
            steps: [
              { op: 'str', fn: 'lower', value: 'form.t', to: 'lo' },
              { op: 'str', fn: 'upper', value: 'form.t', to: 'up' },
              { op: 'str', fn: 'trim', value: 'form.t', to: 'tr' },
              { op: 'str', fn: 'ltrim', value: 'form.t', to: 'lt' },
              { op: 'str', fn: 'rtrim', value: 'form.t', to: 'rt' }
            ],
          },
          { form: { t: '  John Smith  ' }, redis }
        );
        assertEq(r.vars.lo, '  john smith  ');
        assertEq(r.vars.up, '  JOHN SMITH  ');
        assertEq(r.vars.tr, 'John Smith');
        assertEq(r.vars.lt, 'John Smith  ');
        assertEq(r.vars.rt, '  John Smith');
      },
    },
    {
      id: 76,
      desc: 'str search boolean predicate operations',
      async run() {
        const redis = createMemoryRedis();
        const r = await Alg.run(
          {
            v: 1,
            steps: [
              { op: 'str', fn: 'contains', value: 'form.email', search: 'form.s1', to: 'c1' },
              { op: 'str', fn: 'contains', value: 'form.email', search: 'form.s2', to: 'c2' },
              { op: 'str', fn: 'startsWith', value: 'form.code', search: 'form.p1', to: 'sw' },
              { op: 'str', fn: 'endsWith', value: 'form.file', search: 'form.p2', to: 'ew' }
            ],
          },
          { form: { email: 'john@test.com', s1: '@', s2: 'xyz', code: 'SKU-123', p1: 'SKU-', file: 'conf.json', p2: '.json' }, redis }
        );
        assertEq(r.vars.c1, true);
        assertEq(r.vars.c2, false);
        assertEq(r.vars.sw, true);
        assertEq(r.vars.ew, true);
      },
    },
    {
      id: 77,
      desc: 'str extraction and replacement operations',
      async run() {
        const redis = createMemoryRedis();
        const r = await Alg.run(
          {
            v: 1,
            steps: [
              { op: 'str', fn: 'substr', value: 'form.t', start: 'form.s', length: 'form.l', to: 'sub1' },
              { op: 'str', fn: 'substr', value: 'form.t', start: 'form.s', to: 'sub2' },
              { op: 'str', fn: 'replace', value: 'form.t', search: 'form.f', replace: 'form.r', to: 'rep' },
              { op: 'str', fn: 'replaceAll', value: 'form.t', search: 'form.f', replace: 'form.r', to: 'repA' }
            ],
          },
          { form: { t: 'A B A B', s: 2, l: 3, f: 'A', r: 'X' }, redis }
        );
        assertEq(r.vars.sub1, 'B A');
        assertEq(r.vars.sub2, 'B A B');
        assertEq(r.vars.rep, 'X B A B');
        assertEq(r.vars.repA, 'X B X B');
      },
    },
    {
      id: 78,
      desc: 'str conversion split and construction concat steps',
      async run() {
        const redis = createMemoryRedis();
        const r = await Alg.run(
          {
            v: 1,
            steps: [
              { op: 'str', fn: 'split', value: 'form.tags', separator: 'form.s', to: 'arr' },
              { op: 'str', fn: 'concat', args: ['form.a1', 'form.a2', 'form.a3'], to: 'str' }
            ],
          },
          { form: { tags: 'r,g,b', s: ',', a1: 'X', a2: '-', a3: 'Y' }, redis }
        );
        assertEqJson(r.vars.arr, ['r', 'g', 'b']);
        assertEq(r.vars.str, 'X-Y');
      },
    },
    {
      id: 79,
      desc: 'str formatting padding repeat and wildcard matching',
      async run() {
        const redis = createMemoryRedis();
        const r = await Alg.run(
          {
            v: 1,
            steps: [
              { op: 'str', fn: 'padStart', value: 'form.v', length: 'form.l', char: 'form.c', to: 'pS' },
              { op: 'str', fn: 'padEnd', value: 'form.v', length: 'form.l', char: 'form.c', to: 'pE' },
              { op: 'str', fn: 'repeat', value: 'form.ch', count: 'form.cnt', to: 'rep' },
              { op: 'str', fn: 'matches', value: 'form.code', pattern: 'form.p1', to: 'm1' },
              { op: 'str', fn: 'matches', value: 'form.code', pattern: 'form.p2', to: 'm2' }
            ],
          },
          { form: { v: '7', l: 3, c: '0', ch: '-', cnt: 4, code: 'SKU-456', p1: 'SKU-*', p2: 'SKU-1*' }, redis }
        );
        assertEq(r.vars.pS, '007');
        assertEq(r.vars.pE, '700');
        assertEq(r.vars.rep, '----');
        assertEq(r.vars.m1, true);
        assertEq(r.vars.m2, false);
      },
    },
    {
      id: 80,
      desc: 'str safe cast fallback handling for empty and object types',
      async run() {
        const redis = createMemoryRedis();
        const r = await Alg.run(
          {
            v: 1,
            steps: [
              { op: 'str', fn: 'lower', value: 'form.missing', to: 's1' },
              { op: 'str', fn: 'split', value: 'form.missing', separator: ',', to: 's2' },
              { op: 'str', fn: 'trim', value: 'form.obj', to: 's3' }
            ],
          },
          { form: { obj: { name: 'A' } }, redis }
        );
        assertEq(r.vars.s1, '');
        assertEqJson(r.vars.s2, ['']);
        assertEq(r.vars.s3, '{"name":"A"}');
      },
    },
    {
      id: 81,
      desc: 'array inspection functions length isEmpty and contains',
      async run() {
        const redis = createMemoryRedis();
        const r = await Alg.run(
          {
            v: 1,
            steps: [
              { op: 'array', fn: 'length', from: 'form.items', to: 'len' },
              { op: 'array', fn: 'isEmpty', from: 'form.items', to: 'empty1' },
              { op: 'array', fn: 'isEmpty', from: 'form.empty_arr', to: 'empty2' },
              { op: 'array', fn: 'contains', from: 'form.items', values: ['red'], to: 'c1' },
              { op: 'array', fn: 'contains', from: 'form.items', values: ['yellow'], to: 'c2' }
            ],
          },
          { form: { items: ['red', 'green', 'blue'], empty_arr: [] }, redis }
        );
        assertEq(r.vars.len, 3);
        assertEq(r.vars.empty1, false);
        assertEq(r.vars.empty2, true);
        assertEq(r.vars.c1, true);
        assertEq(r.vars.c2, false);
      },
    },
    {
      id: 82,
      desc: 'array search index positions first and last occurrences',
      async run() {
        const redis = createMemoryRedis();
        const r = await Alg.run(
          {
            v: 1,
            steps: [
              { op: 'array', fn: 'indexOf', from: 'form.colors', values: ['red'], to: 'idx1' },
              { op: 'array', fn: 'lastIndexOf', from: 'form.colors', values: ['red'], to: 'idx2' },
              { op: 'array', fn: 'indexOf', from: 'form.colors', values: ['blue'], to: 'idx3' }
            ],
          },
          { form: { colors: ['green', 'red', 'yellow', 'red'] }, redis }
        );
        assertEq(r.vars.idx1, 1);
        assertEq(r.vars.idx2, 3);
        assertEq(r.vars.idx3, -1);
      },
    },
    {
      id: 83,
      desc: 'array access element get first last and slice',
      async run() {
        const redis = createMemoryRedis();
        const r = await Alg.run(
          {
            v: 1,
            steps: [
              { op: 'array', fn: 'get', from: 'form.letters', index: 2, to: 'item' },
              { op: 'array', fn: 'first', from: 'form.letters', to: 'f' },
              { op: 'array', fn: 'last', from: 'form.letters', to: 'l' },
              { op: 'array', fn: 'slice', from: 'form.letters', start: 1, length: 3, to: 'sl' }
            ],
          },
          { form: { letters: ['A', 'B', 'C', 'D', 'E'] }, redis }
        );
        assertEq(r.vars.item, 'C');
        assertEq(r.vars.f, 'A');
        assertEq(r.vars.l, 'E');
        assertEqJson(r.vars.sl, ['B', 'C', 'D']);
      },
    },
    {
      id: 84,
      desc: 'array addition push and unshift literal values and arrays',
      async run() {
        const redis = createMemoryRedis();
        const r = await Alg.run(
          {
            v: 1,
            steps: [
              { op: 'array', fn: 'push', from: 'form.base', values: [30, 40], to: 'r1' },
              { op: 'array', fn: 'push', from: 'form.base', values: [[30, 40]], to: 'r2' },
              { op: 'array', fn: 'unshift', from: 'form.base', values: [5, 10], to: 'r3' }
            ],
          },
          { form: { base: [10, 20] }, redis }
        );
        assertEqJson(r.vars.r1, [10, 20, 30, 40]);
        assertEqJson(r.vars.r2, [10, 20, [30, 40]]);
        assertEqJson(r.vars.r3, [5, 10, 10, 20]);
      },
    },
    {
      id: 85,
      desc: 'array addition push using dynamic references',
      async run() {
        const redis = createMemoryRedis();
        const r = await Alg.run(
          {
            v: 1,
            steps: [{ op: 'array', fn: 'push', from: 'form.items', values: 'form.news', to: 'res' }],
          },
          { form: { items: [1, 2], news: [3, 4] }, redis }
        );
        assertEqJson(r.vars.res, [1, 2, 3, 4]);
      },
    },
    {
      id: 86,
      desc: 'array element removal first and last bounds',
      async run() {
        const redis = createMemoryRedis();
        const r = await Alg.run(
          {
            v: 1,
            steps: [
              { op: 'array', fn: 'removeFirst', from: 'form.list', to: 'rf' },
              { op: 'array', fn: 'removeLast', from: 'form.list', to: 'rl' }
            ],
          },
          { form: { list: [100, 200, 300] }, redis }
        );
        assertEqJson(r.vars.rf, [200, 300]);
        assertEqJson(r.vars.rl, [100, 200]);
      },
    },
    {
      id: 87,
      desc: 'array transformation functions reverse unique and sort directions',
      async run() {
        const redis = createMemoryRedis();
        const r = await Alg.run(
          {
            v: 1,
            steps: [
              { op: 'array', fn: 'reverse', from: 'form.nums', to: 'rev' },
              { op: 'array', fn: 'unique', from: 'form.dups', to: 'uniq' },
              { op: 'array', fn: 'sort', from: 'form.unsorted', direction: 'asc', to: 's_asc' },
              { op: 'array', fn: 'sort', from: 'form.unsorted', direction: 'desc', to: 's_desc' }
            ],
          },
          { form: { nums: [1, 2, 3], dups: [1, 2, 2, 3], unsorted: [30, 10, 20] }, redis }
        );
        assertEqJson(r.vars.rev, [3, 2, 1]);
        assertEqJson(r.vars.uniq, [1, 2, 3]);
        assertEqJson(r.vars.s_asc, [10, 20, 30]);
        assertEqJson(r.vars.s_desc, [30, 20, 10]);
      },
    },
    {
      id: 88,
      desc: 'array conversion join counter-part to string split',
      async run() {
        const redis = createMemoryRedis();
        const r = await Alg.run(
          {
            v: 1,
            steps: [{ op: 'array', fn: 'join', from: 'form.words', separator: '-', to: 'txt' }],
          },
          { form: { words: ['red', 'green', 'blue'] }, redis }
        );
        assertEq(r.vars.txt, 'red-green-blue');
      },
    },
    {
      id: 89,
      desc: 'array numeric aggregation math operations',
      async run() {
        const redis = createMemoryRedis();
        const r = await Alg.run(
          {
            v: 1,
            steps: [
              { op: 'array', fn: 'sum', from: 'form.prices', to: 's' },
              { op: 'array', fn: 'min', from: 'form.prices', to: 'mi' },
              { op: 'array', fn: 'max', from: 'form.prices', to: 'ma' },
              { op: 'array', fn: 'avg', from: 'form.prices', to: 'av' }
            ],
          },
          { form: { prices: [10, 25, 40, 15] }, redis }
        );
        assertEq(r.vars.s, 90);
        assertEq(r.vars.mi, 10);
        assertEq(r.vars.ma, 40);
        assertEq(r.vars.av, 22.5);
      },
    },
    {
      id: 90,
      desc: 'array safe cast input convention fallback handling',
      async run() {
        const redis = createMemoryRedis();
        const r = await Alg.run(
          {
            v: 1,
            steps: [
              { op: 'array', fn: 'length', from: 'form.missing', to: 's1' },
              { op: 'array', fn: 'min', from: 'form.empty_arr', to: 's2' },
              { op: 'array', fn: 'push', from: 'form.primitive', values: [2], to: 's3' },
              { op: 'array', fn: 'length', from: 'form.primitive', to: 's4' }
            ],
          },
          { form: { empty_arr: [], primitive: 1 }, redis }
        );
        assertEq(r.vars.s1, 0);
        assertEq(r.vars.s2, 0);
        assertEqJson(r.vars.s3, [1, 2]);
        assertEq(r.vars.s4, 1);
      },
    },
    {
      id: 91,
      desc: 'obj deep access functions get and has with dot notation',
      async run() {
        const redis = createMemoryRedis();
        const r = await Alg.run(
          {
            v: 1,
            steps: [
              { op: 'obj', fn: 'get', from: 'form.user', path: 'profile.name', to: 'n1' },
              { op: 'obj', fn: 'get', from: 'form.user', path: 'profile.missing', to: 'n2' },
              { op: 'obj', fn: 'has', from: 'form.user', path: 'profile.active', to: 'h1' },
              { op: 'obj', fn: 'has', from: 'form.user', path: 'profile.missing', to: 'h2' }
            ],
          },
          { form: { user: { profile: { name: 'John', active: false } } }, redis }
        );
        assertEq(r.vars.n1, 'John');
        assertEq(r.vars.n2, null);
        assertEq(r.vars.h1, true);
        assertEq(r.vars.h2, false);
      },
    },
    {
      id: 92,
      desc: 'obj mutation set and delete operations with dot notation',
      async run() {
        const redis = createMemoryRedis();
        const r = await Alg.run(
          {
            v: 1,
            steps: [
              { op: 'obj', fn: 'set', from: 'form.user', path: 'profile.city', value: 'Bucharest', to: 'u1' },
              { op: 'obj', fn: 'set', from: 'form.user', path: 'profile.name', with: 'form.new_name', to: 'u2' },
              { op: 'obj', fn: 'delete', from: 'form.user', path: 'profile.age', to: 'u3' }
            ],
          },
          { form: { user: { profile: { name: 'John', age: 30 } }, new_name: 'Jane' }, redis }
        );
        assertEq(r.vars.u1.profile.city, 'Bucharest');
        assertEq(r.vars.u1.profile.name, 'John');
        assertEq(r.vars.u2.profile.name, 'Jane');
        assertEq(r.vars.u3.profile.age, undefined);
        assertEq(r.vars.u3.profile.name, 'John');
      },
    },
    {
      id: 93,
      desc: 'obj structural array extraction keys values and entries',
      async run() {
        const redis = createMemoryRedis();
        const r = await Alg.run(
          {
            v: 1,
            steps: [
              { op: 'obj', fn: 'keys', from: 'form.data', to: 'k' },
              { op: 'obj', fn: 'values', from: 'form.data', to: 'v' },
              { op: 'obj', fn: 'entries', from: 'form.data', to: 'e' }
            ],
          },
          { form: { data: { id: 10, role: 'admin' } }, redis }
        );
        assertEqJson(r.vars.k, ['id', 'role']);
        assertEqJson(r.vars.v, [10, 'admin']);
        assertEqJson(r.vars.e, [['id', 10], ['role', 'admin']]);
      },
    },
    {
      id: 94,
      desc: 'obj filtering operations pick and omit with fields filtering',
      async run() {
        const redis = createMemoryRedis();
        const r = await Alg.run(
          {
            v: 1,
            steps: [
              { op: 'obj', fn: 'pick', from: 'form.user', value: ['id', 'email'], to: 'p1' },
              { op: 'obj', fn: 'pick', from: 'form.user', with: 'form.fields', to: 'p2' },
              { op: 'obj', fn: 'omit', from: 'form.user', value: ['password'], to: 'o1' }
            ],
          },
          { form: { user: { id: 1, email: 'a@b.com', password: '123' }, fields: ['id'] }, redis }
        );
        assertEqJson(r.vars.p1, { id: 1, email: 'a@b.com' });
        assertEqJson(r.vars.p2, { id: 1 });
        assertEqJson(r.vars.o1, { id: 1, email: 'a@b.com' });
      },
    },
    {
      id: 95,
      desc: 'obj aggregation merge literal and reference extensions',
      async run() {
        const redis = createMemoryRedis();
        const r = await Alg.run(
          {
            v: 1,
            steps: [
              { op: 'obj', fn: 'merge', from: 'form.base', value: { active: true, role: 'admin' }, to: 'm1' },
              { op: 'obj', fn: 'merge', from: 'form.base', with: 'form.extra', to: 'm2' }
            ],
          },
          { form: { base: { name: 'John', active: false }, extra: { role: 'user' } }, redis }
        );
        assertEqJson(r.vars.m1, { name: 'John', active: true, role: 'admin' });
        assertEqJson(r.vars.m2, { name: 'John', active: false, role: 'user' });
      },
    },
    {
      id: 96,
      desc: 'obj safe cast convention fallbacks on missing and primitive types',
      async run() {
        const redis = createMemoryRedis();
        const r = await Alg.run(
          {
            v: 1,
            steps: [
              { op: 'obj', fn: 'get', from: 'form.missing', path: 'a.b', to: 's1' },
              { op: 'obj', fn: 'keys', from: 'form.primitive', to: 's2' },
              { op: 'obj', fn: 'set', from: {}, path: 'profile.id', value: 99, to: 's3' }
            ],
          },
          { form: { primitive: 42 }, redis }
        );
        assertEq(r.vars.s1, null);
        assertEqJson(r.vars.s2, []);
        assertEqJson(r.vars.s3, { profile: { id: 99 } });
      },
    },
  ],
};
