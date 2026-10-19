'use strict';

const Alg = require('../core/alg-runner.js');
const { createMemoryRedis } = require('../core/redis.js');

const COUNTER_KEY = 'info:edge:totalLogs';

const RESET_WHEN =
  'tickHour == "03" and tickMin == "00" and totalLogs >= 4032';

/** Alg prod (alg:_edge_total_logs) — cheie contor info:edge:totalLogs */
const EDGE_TOTAL_LOGS_ALG = {
  v: 1,
  title: 'Contor tick edge (totalLogs, reset 4032 @ 03:00 UTC)',
  steps: [
    {
      op: 'scope',
      note: 'INCR apoi reset doar la 03:00 UTC dacă totalLogs >= 4032',
      steps: [
        {
          op: 'kincr',
          key: COUNTER_KEY,
          as: 'int',
          to: 'totalLogs',
          recover: [
            {
              op: 'end',
              type: 'err',
              value: 'totalLogs: increment Redis eșuat.',
            },
          ],
        },
        {
          op: 'fdate',
          format: 'HHU',
          to: 'tickHour',
          val: 'now',
        },
        {
          op: 'fdate',
          format: 'mmU',
          to: 'tickMin',
          val: 'now',
        },
        {
          op: 'if',
          when: RESET_WHEN,
          then: [
            {
              op: 'ksave',
              key: COUNTER_KEY,
              val: 0,
              as: 'string',
            },
            {
              op: 'assign',
              to: 'totalLogs',
              val: 0,
            },
            {
              op: 'notify',
              kind: 'info',
              value: 'totalLogs reset (>= 4032, slot 03:00 UTC).',
            },
          ],
        },
        {
          op: 'end',
          type: 'msg',
          with: 'totalLogs',
        },
      ],
      recover: [
        {
          op: 'end',
          type: 'err',
          value: 'Contor tick edge: eșec neașteptat (totalLogs / fdate / reset).',
        },
      ],
    },
  ],
};

function assert(cond, msg) {
  if (!cond) throw new Error(msg || 'assertion failed');
}

function assertEq(a, b, msg) {
  if (a !== b) {
    throw new Error((msg || 'eq') + ': ' + JSON.stringify(a) + ' !== ' + JSON.stringify(b));
  }
}

async function redisCounter(redis) {
  const v = await redis.exec(['GET', COUNTER_KEY]);
  return v == null ? null : String(v);
}

/** Fixează `new Date()` / `Date.now()` pentru fdate `now` (UTC). */
function withFrozenUtc(iso, fn) {
  const RealDate = Date;
  const fixedMs = new RealDate(iso).getTime();
  assert(!Number.isNaN(fixedMs), 'invalid frozen time: ' + iso);

  function FakeDate(...args) {
    if (args.length === 0) {
      return new RealDate(fixedMs);
    }
    return new RealDate(...args);
  }
  FakeDate.now = () => fixedMs;
  FakeDate.parse = RealDate.parse;
  FakeDate.UTC = RealDate.UTC;
  FakeDate.prototype = RealDate.prototype;

  global.Date = FakeDate;
  return Promise.resolve()
    .then(fn)
    .finally(() => {
      global.Date = RealDate;
    });
}

async function runEdgeTotalLogs(redis) {
  return Alg.run(EDGE_TOTAL_LOGS_ALG, { form: {}, vars: {}, redis });
}

module.exports = {
  name: 'alg-edge-total-logs',
  EDGE_TOTAL_LOGS_ALG,
  COUNTER_KEY,
  tests: [
    {
      id: 1,
      desc: 'tick obișnuit: INCR de la 0 → 1, fără reset',
      async run() {
        const redis = createMemoryRedis();
        const r = await runEdgeTotalLogs(redis);
        assert(!r.err, r.err);
        assertEq(r.msg, '1');
        assertEq(r.vars.totalLogs, 1);
        assertEq(await redisCounter(redis), '1');
        assert(r.vars.tickHour === undefined || typeof r.vars.tickHour === 'string');
      },
    },
    {
      id: 2,
      desc: '03:00 UTC + contor 4031 → INCR 4032 apoi reset la 0',
      async run() {
        const redis = createMemoryRedis();
        await redis.exec(['SET', COUNTER_KEY, '4031']);

        await withFrozenUtc('2026-06-01T03:00:00.000Z', async () => {
          const r = await runEdgeTotalLogs(redis);
          assert(!r.err, r.err);
          assertEq(r.vars.tickHour, '03');
          assertEq(r.vars.tickMin, '00');
          assertEq(r.vars.totalLogs, 0);
          assertEq(r.msg.split('\n').pop(), '0');
          assert(r.msg.includes('totalLogs reset'));
          assertEq(await redisCounter(redis), '0');
        });
      },
    },
    {
      id: 3,
      desc: '03:00 UTC + contor 4030 → INCR 4031, fără reset (< 4032)',
      async run() {
        const redis = createMemoryRedis();
        await redis.exec(['SET', COUNTER_KEY, '4030']);

        await withFrozenUtc('2026-06-01T03:00:00.000Z', async () => {
          const r = await runEdgeTotalLogs(redis);
          assert(!r.err, r.err);
          assertEq(r.vars.totalLogs, 4031);
          assertEq(r.msg, '4031');
          assertEq(await redisCounter(redis), '4031');
        });
      },
    },
    {
      id: 4,
      desc: '03:05 UTC + contor 5000 → INCR, fără reset (nu e slot :00)',
      async run() {
        const redis = createMemoryRedis();
        await redis.exec(['SET', COUNTER_KEY, '5000']);

        await withFrozenUtc('2026-06-01T03:05:00.000Z', async () => {
          const r = await runEdgeTotalLogs(redis);
          assert(!r.err, r.err);
          assertEq(r.vars.tickMin, '05');
          assertEq(r.vars.totalLogs, 5001);
          assertEq(await redisCounter(redis), '5001');
        });
      },
    },
  ],
};
