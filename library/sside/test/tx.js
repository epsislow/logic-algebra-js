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
  name: 'tx',
  tests: [
    {
      id: 1,
      desc: 'tstart + tdo commit',
      async run() {
        const redis = createMemoryRedis();
        const r = await Alg.run(
          {
            v: 1,
            steps: [
              { op: 'tstart' },
              { op: 'ksave', key: 's:a', val: 'form', as: 'json' },
              { op: 'ksave', key: 's:b', val: 'form', as: 'json' },
              { op: 'tdo' },
              { op: 'end', msg: 'Salvat atomic' },
            ],
          },
          { form: { ok: true }, redis }
        );
        assertEq(r.msg, 'Salvat atomic');
        assertEq(await redis.type('s:a'), 'json');
        assertEq(await redis.type('s:b'), 'json');
      },
    },
    {
      id: 2,
      desc: 'tstop discard',
      async run() {
        const redis = createMemoryRedis();
        await Alg.run(
          {
            v: 1,
            steps: [
              { op: 'tstart' },
              { op: 'ksave', key: 's:x', val: 'form', as: 'json' },
              { op: 'tstop' },
              { op: 'end', err: 'Anulat' },
            ],
          },
          { form: { ok: false }, redis }
        );
        assertEq(await redis.type('s:x'), 'none');
      },
    },
    {
      id: 3,
      desc: 'nested tstart → err',
      async run() {
        const redis = createMemoryRedis();
        const r = await Alg.run(
          {
            v: 1,
            steps: [{ op: 'tstart' }, { op: 'tstart' }],
          },
          { form: {}, redis }
        );
        assert(r.err && /nested/i.test(r.err));
      },
    },
    {
      id: 4,
      desc: 'end în tx → discard implicit',
      async run() {
        const redis = createMemoryRedis();
        await Alg.run(
          {
            v: 1,
            steps: [
              { op: 'tstart' },
              { op: 'ksave', key: 's:y', val: 'form', as: 'json' },
              { op: 'end', err: 'stop' },
            ],
          },
          { form: {}, redis }
        );
        assertEq(await redis.type('s:y'), 'none');
      },
    },
    {
      id: 5,
      desc: 'if + tdo / tstop ca în plan',
      async run() {
        const redis = createMemoryRedis();
        const r = await Alg.run(
          {
            v: 1,
            steps: [
              { op: 'tstart' },
              { op: 'kdel', key: 's:vechi' },
              {
                op: 'if',
                when: ['eq', 'form.ok', true],
                then: [
                  { op: 'ksave', key: 's:stock:1', val: 'form.stock', as: 'json' },
                  { op: 'tdo' },
                  { op: 'end', msg: 'Salvat atomic' },
                ],
                else: [{ op: 'tstop' }, { op: 'end', err: 'Anulat' }],
              },
            ],
          },
          { form: { ok: true, stock: { n: 1 } }, redis }
        );
        assertEq(r.msg, 'Salvat atomic');
        assertEq(await redis.type('s:stock:1'), 'json');
      },
    },
  ],
};
