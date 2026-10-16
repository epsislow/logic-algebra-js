'use strict';

const S = require('../core/cron-schedule.js');
const V = require('../core/prog-validate.js');

function assert(cond, msg) {
  if (!cond) throw new Error(msg || 'assertion failed');
}

function assertEq(a, b, msg) {
  if (a !== b) throw new Error((msg || 'eq') + ': ' + JSON.stringify(a) + ' !== ' + JSON.stringify(b));
}

module.exports = {
  name: 'cron-schedule',
  tests: [
    {
      id: 1,
      desc: 'expr canonic — 5 fire Europe/Bucharest',
      run() {
        const expr = '10/30 2/2 * * 1-5';
        const tz = 'Europe/Bucharest';
        const from = new Date('2026-10-16T16:00:00.000Z');
        const fires = S.getNextFires({ kind: 'cron', expr, timezone: tz }, from, 5, {
          strictFuture: true,
        });
        const fmt = fires.map((d) => S.formatFireInTz(d, tz));
        assertEq(fmt[0], '2026-10-16 20:10:00');
        assertEq(fmt[1], '2026-10-16 20:40:00');
        assertEq(fmt[2], '2026-10-16 22:10:00');
        assertEq(fmt[3], '2026-10-16 22:40:00');
        assertEq(fmt[4], '2026-10-19 02:10:00');
      },
    },
    {
      id: 2,
      desc: 'validateMinuteGranularity respinge */2',
      run() {
        const r = S.validateMinuteGranularity('*/2 * * * *');
        assert(!r.ok);
        const ok = S.validateMinuteGranularity('*/5 * * * *');
        assert(ok.ok);
      },
    },
    {
      id: 3,
      desc: 'validateCron respinge pas < 5 min',
      run() {
        const bad = V.validateCron({
          v: 1,
          mode: 'client',
          enabled: true,
          schedule: { kind: 'cron', expr: '*/2 * * * *', timezone: 'UTC' },
          alg: 'alg:_x',
        });
        assert(!bad.ok);
        const good = V.validateCron({
          v: 1,
          mode: 'client',
          enabled: true,
          schedule: { kind: 'interval', minutes: 15, timezone: 'UTC' },
          alg: 'alg:_x',
        });
        assert(good.ok);
      },
    },
    {
      id: 4,
      desc: 'UTC timezone — ora wall = expr',
      run() {
        const expr = '30 14 * * *';
        const next = S.getNextFireAfter(
          { kind: 'cron', expr, timezone: 'UTC' },
          new Date('2026-03-16T14:20:00.000Z'),
          { strictFuture: true }
        );
        assert(next);
        assertEq(S.formatFireInTz(next, 'UTC').slice(11, 16), '14:30');
      },
    },
  ],
};
