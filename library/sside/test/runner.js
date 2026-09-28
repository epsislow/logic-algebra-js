'use strict';

const Alg = require('../core/alg-runner.js');
const { createMemoryRedis } = require('../core/redis.js');

function assert(cond, msg) {
  if (!cond) throw new Error(msg || 'assertion failed');
}

function assertEq(a, b, msg) {
  if (a !== b) throw new Error((msg || 'eq') + ': ' + JSON.stringify(a) + ' !== ' + JSON.stringify(b));
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
  ],
};
