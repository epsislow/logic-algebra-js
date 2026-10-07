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

async function readLogLines(redis, name) {
  return await redis.exec(['LRANGE', 'log:' + name, 0, -1]);
}

async function readLogEntries(redis, name) {
  const raw = await readLogLines(redis, name);
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
      desc: 'tsformat custom',
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
                tsformat: 'YYYY',
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
        assertEq((await readLogLines(redis, 'app')).length, 0);
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
              tsformat: 'YYYY-MM-DD',
              format: '[<ts>] <lvl>',
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
    {
      id: 9,
      desc: 'format linie — RPUSH text, placeholders',
      async run() {
        const redis = createMemoryRedis();
        await Alg.run(
          {
            v: 1,
            steps: [
              {
                op: 'log',
                name: 'txt',
                level: 'warning',
                action: 'low',
                tsformat: 'YYYY',
                format: '[<ts>] <lvl> <act> d=<dat>',
                data: 'x',
              },
              { op: 'end', msg: 'ok' },
            ],
          },
          { form: {}, redis, algKey: 'alg:_a', btn: { id: 'b1' } }
        );
        const lines = await readLogLines(redis, 'txt');
        assertEq(lines.length, 1);
        assertEq(lines[0], '[2026] warning low d=x');
        let parsed = false;
        try {
          JSON.parse(lines[0]);
          parsed = true;
        } catch (e) {
          parsed = false;
        }
        assert(!parsed, 'nu e JSON');
      },
    },
    {
      id: 10,
      desc: 'format linie — ctx obiect JSON compact',
      async run() {
        const redis = createMemoryRedis();
        await Alg.run(
          {
            v: 1,
            steps: [
              {
                op: 'log',
                name: 'txt',
                level: 'info',
                action: 'a',
                format: 'ctx=<ctx>',
                context: { a: 1 },
              },
              { op: 'end', msg: 'ok' },
            ],
          },
          { form: {}, redis }
        );
        const lines = await readLogLines(redis, 'txt');
        assertEq(lines[0], 'ctx={"a":1}');
      },
    },
    {
      id: 11,
      desc: 'formatLogLine — escape \\<',
      run() {
        const line = Ops.formatLogLine('\\<ts> ok <lvl>', { ts: 'T', level: 'info' });
        assertEq(line, '<ts> ok info');
      },
    },
    {
      id: 12,
      desc: 'aceeași listă — JSON apoi text',
      async run() {
        const redis = createMemoryRedis();
        await Alg.run(
          {
            v: 1,
            steps: [
              {
                op: 'log',
                name: 'mix',
                level: 'info',
                action: 'json',
              },
              {
                op: 'log',
                name: 'mix',
                level: 'error',
                action: 'line',
                format: '<act>!',
              },
              { op: 'end', msg: 'ok' },
            ],
          },
          { form: {}, redis }
        );
        const lines = await readLogLines(redis, 'mix');
        assertEq(lines.length, 2);
        assert(JSON.parse(lines[0]).action === 'json');
        assertEq(lines[1], 'line!');
      },
    },
    {
      id: 13,
      desc: 'format fără <> — tsformat legacy (JSON ts)',
      async run() {
        const redis = createMemoryRedis();
        await Alg.run(
          {
            v: 1,
            steps: [
              {
                op: 'log',
                name: 'leg',
                level: 'info',
                action: 'a',
                format: 'YYYY',
              },
              { op: 'end', msg: 'ok' },
            ],
          },
          { form: {}, redis }
        );
        const e = (await readLogEntries(redis, 'leg'))[0];
        assert(/^\d{4}$/.test(e.ts));
      },
    },
  ],
};
