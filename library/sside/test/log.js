'use strict';

const Alg = require('../core/alg-runner.js');
const Ops = require('../core/alg-ops.js');
const Validate = require('../core/prog-validate.js');
const { createMemoryRedis } = require('../core/redis.js');

function assert(cond, msg) {
  if (!cond) throw new Error(msg || 'assertion failed');
}

function assertEq(a, b, msg) {
  if (a !== b) throw new Error((msg || 'eq') + ': ' + JSON.stringify(a) + ' !== ' + JSON.stringify(b));
}

async function readLogEntries(redis, name) {
  const raw = await redis.exec(['LRANGE', 'log:' + name, 0, -1]);
  return (raw || []).map((s) => JSON.parse(s));
}

module.exports = {
  name: 'log',
  tests: [
    {
      id: 1,
      desc: 'RPUSH log:stock — payload default ISO ts',
      async run() {
        const redis = createMemoryRedis();
        const r = await Alg.run(
          {
            v: 1,
            steps: [
              {
                op: 'log',
                name: 'stock',
                level: 'info',
                action: 'refresh',
                context: { list: 'stockMain' },
                dataWith: 'list.page',
              },
              { op: 'end', msg: 'ok' },
            ],
          },
          { form: {}, list: { page: 2 }, redis, algKey: 'alg:_x', btn: { id: 'refBtn' } }
        );
        assert(!r.err, r.err);
        const entries = await readLogEntries(redis, 'stock');
        assertEq(entries.length, 1);
        const e = entries[0];
        assertEq(e.level, 'info');
        assertEq(e.name, 'stock');
        assertEq(e.action, 'refresh');
        assertEq(e.context.list, 'stockMain');
        assertEq(e.data, 2);
        assertEq(e.alg, 'alg:_x');
        assertEq(e.button, 'refBtn');
        assert(typeof e.ts === 'string' && e.ts.indexOf('T') > 0, 'ts ISO');
      },
    },
    {
      id: 2,
      desc: 'format ts custom',
      async run() {
        const redis = createMemoryRedis();
        await Alg.run(
          {
            v: 1,
            steps: [
              {
                op: 'log',
                name: 'app',
                level: 'warning',
                action: 'ping',
                format: 'YYYY',
              },
              { op: 'end', msg: 'ok' },
            ],
          },
          { form: {}, redis }
        );
        const e = (await readLogEntries(redis, 'app'))[0];
        assert(/^\d{4}$/.test(e.ts), 'ts YYYY: ' + e.ts);
        assertEq(e.level, 'warning');
      },
    },
    {
      id: 3,
      desc: 'tstart + tdo — log commit cu ksave',
      async run() {
        const redis = createMemoryRedis();
        await Alg.run(
          {
            v: 1,
            steps: [
              { op: 'tstart' },
              { op: 'ksave', key: 'data:_x:1', val: { ok: 1 }, as: 'json' },
              {
                op: 'log',
                name: 'app',
                level: 'info',
                action: 'save',
                data: { ok: true },
              },
              { op: 'tdo' },
              { op: 'end', msg: 'ok' },
            ],
          },
          { form: {}, redis }
        );
        assertEq(await redis.type('data:_x:1'), 'json');
        assertEq((await readLogEntries(redis, 'app')).length, 1);
      },
    },
    {
      id: 4,
      desc: 'tstop — log discard',
      async run() {
        const redis = createMemoryRedis();
        await Alg.run(
          {
            v: 1,
            steps: [
              { op: 'tstart' },
              {
                op: 'log',
                name: 'app',
                level: 'error',
                action: 'fail',
              },
              { op: 'tstop' },
              { op: 'end', err: 'x' },
            ],
          },
          { form: {}, redis }
        );
        assertEq((await readLogEntries(redis, 'app')).length, 0);
      },
    },
    {
      id: 5,
      desc: 'context și contextWith → eroare',
      async run() {
        const redis = createMemoryRedis();
        const r = await Alg.run(
          {
            v: 1,
            steps: [
              {
                op: 'log',
                name: 'app',
                level: 'info',
                action: 'x',
                context: {},
                contextWith: 'form.x',
              },
            ],
          },
          { form: {}, redis }
        );
        assert(r.err && /context/i.test(r.err), r.err);
      },
    },
    {
      id: 6,
      desc: 'data cu s_prefix — salvat ca atare, fără index',
      async run() {
        const redis = createMemoryRedis();
        await Alg.run(
          {
            v: 1,
            steps: [
              {
                op: 'log',
                name: 'audit',
                level: 'info',
                action: 'note',
                data: { s_prefix: 'stock', qty: 1 },
              },
              { op: 'end', msg: 'ok' },
            ],
          },
          { form: {}, redis }
        );
        const e = (await readLogEntries(redis, 'audit'))[0];
        assertEq(e.data.s_prefix, 'stock');
        assertEq(e.data.qty, 1);
        assert(!e.s_prefix, 'fără s_prefix la rădăcină');
      },
    },
    {
      id: 7,
      desc: 'validate alg — log obligatorii',
      run() {
        const bad = Validate.validateAlg({
          v: 1,
          steps: [{ op: 'log', name: '', level: 'info', action: 'x' }],
        });
        assert(!bad.ok);
        const ok = Validate.validateAlg({
          v: 1,
          steps: [
            {
              op: 'log',
              name: 'stock',
              level: 'error',
              action: 'refresh',
              dataWith: 'form.qty',
            },
          ],
        });
        assert(ok.ok, ok.err);
      },
    },
    {
      id: 8,
      desc: 'buildLogPayload — level invalid',
      run() {
        let threw = false;
        try {
          Ops.buildLogPayload(
            { op: 'log', name: 'a', level: 'debug', action: 'x' },
            { form: {}, vars: {}, list: {} },
            (c, t) => Ops.resolveRef(t, c),
            {}
          );
        } catch (e) {
          threw = true;
          assert(/level/i.test(e.message));
        }
        assert(threw);
      },
    },
  ],
};
