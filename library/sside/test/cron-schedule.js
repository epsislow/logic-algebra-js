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
      id: 6,
      desc: 'msUntilNextScheduleTick — login 15:12 → tick 15:15',
      run() {
        const sched = { kind: 'interval', minutes: 5, timezone: 'Europe/Bucharest' };
        const from = new Date('2026-10-18T12:12:00.000Z');
        const ms = S.msUntilNextScheduleTick(from, sched);
        assertEq(ms, 3 * 60 * 1000);
        const next = new Date(from.getTime() + ms);
        assertEq(S.formatFireInTz(next, 'Europe/Bucharest'), '2026-10-18 15:15:00');
      },
    },
    {
      id: 7,
      desc: 'msUntilNextScheduleTick — la 15:15 următorul tick 15:20',
      run() {
        const sched = { kind: 'interval', minutes: 5, timezone: 'Europe/Bucharest' };
        const from = new Date('2026-10-18T12:15:00.000Z');
        const ms = S.msUntilNextScheduleTick(from, sched);
        assertEq(ms, 5 * 60 * 1000);
      },
    },
    {
      id: 5,
      desc: 'getLastFireAtOrBefore interval 5 min',
      run() {
        const sched = { kind: 'interval', minutes: 5, timezone: 'Europe/Bucharest' };
        const at = new Date('2026-10-18T12:16:00.000Z');
        const slot = S.getLastFireAtOrBefore(sched, at);
        assert(slot, 'slot');
        assertEq(S.formatFireInTz(slot, 'Europe/Bucharest'), '2026-10-18 15:15:00');
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
