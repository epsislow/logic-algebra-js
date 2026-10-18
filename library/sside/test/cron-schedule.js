'use strict';

const S = require('../core/cron-schedule.js');
const V = require('../core/prog-validate.js');
const INT5 = require('./cron-schedule-interval-fixture.js');

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
          schedule: {
            kind: 'interval',
            minutes: 15,
            timezone: 'UTC',
            startAt: '2026-01-01 00:00',
          },
          alg: 'alg:_x',
        });
        assert(good.ok);
      },
    },
    {
      id: 10,
      desc: 'interval 25 + startAt — grilă ancorată',
      run() {
        const sched = {
          kind: 'interval',
          minutes: 25,
          timezone: 'Europe/Bucharest',
          startAt: '2026-10-18 13:00',
        };
        const fires = S.getNextFires(sched, new Date('2026-10-18T10:00:00.000Z'), 4, {
          strictFuture: true,
        });
        const fmt = fires.map((d) => S.formatFireInTz(d, 'Europe/Bucharest'));
        assertEq(fmt[0], '2026-10-18 13:25:00');
        assertEq(fmt[1], '2026-10-18 13:50:00');
        assertEq(fmt[2], '2026-10-18 14:15:00');
        assertEq(fmt[3], '2026-10-18 14:40:00');
      },
    },
    {
      id: 11,
      desc: 'interval 90 min + startAt',
      run() {
        const sched = {
          kind: 'interval',
          minutes: 90,
          timezone: 'UTC',
          startAt: '2026-01-01 00:00',
        };
        const next = S.getNextFireAfter(sched, new Date('2026-01-01T02:00:00.000Z'), {
          strictFuture: true,
        });
        assertEq(S.formatFireInTz(next, 'UTC'), '2026-01-01 03:00:00');
      },
    },
    {
      id: 12,
      desc: 'cron startAt — activ de la',
      run() {
        const sched = {
          kind: 'cron',
          expr: '0/5 * * * *',
          timezone: 'Europe/Bucharest',
          startAt: '2026-10-18 15:30',
        };
        const next = S.getNextFireAfter(sched, new Date('2026-10-18T12:00:00.000Z'), {
          strictFuture: true,
        });
        assertEq(S.formatFireInTz(next, 'Europe/Bucharest'), '2026-10-18 15:30:00');
      },
    },
    {
      id: 6,
      desc: 'msUntilNextScheduleTick — login 15:12 → tick 15:15',
      run() {
        const sched = INT5;
        const from = new Date('2026-10-18T12:12:00.000Z');
        const ms = S.msUntilNextScheduleTick(from, sched);
        assertEq(ms, 3 * 60 * 1000);
        const next = new Date(from.getTime() + ms);
        assertEq(S.formatFireInTz(next, 'Europe/Bucharest'), '2026-10-18 15:15:00');
      },
    },
    {
      id: 8,
      desc: 'journal sync grid 3/5 — :03, :08',
      run() {
        const sched = { kind: 'cron', expr: '3/5 * * * *', timezone: 'Europe/Bucharest' };
        const a = S.getNextFireAfter(sched, new Date('2026-10-18T12:01:00.000Z'), {
          strictFuture: true,
        });
        assertEq(S.formatFireInTz(a, 'Europe/Bucharest'), '2026-10-18 15:03:00');
        const b = S.getNextFireAfter(sched, new Date('2026-10-18T12:04:00.000Z'), {
          strictFuture: true,
        });
        assertEq(S.formatFireInTz(b, 'Europe/Bucharest'), '2026-10-18 15:08:00');
      },
    },
    {
      id: 7,
      desc: 'msUntilNextScheduleTick — la 15:15 următorul tick 15:20',
      run() {
        const sched = INT5;
        const from = new Date('2026-10-18T12:15:00.000Z');
        const ms = S.msUntilNextScheduleTick(from, sched);
        assertEq(ms, 5 * 60 * 1000);
      },
    },
    {
      id: 5,
      desc: 'getLastFireAtOrBefore interval 5 min',
      run() {
        const sched = INT5;
        const at = new Date('2026-10-18T12:16:00.000Z');
        const slot = S.getLastFireAtOrBefore(sched, at);
        assert(slot, 'slot');
        assertEq(S.formatFireInTz(slot, 'Europe/Bucharest'), '2026-10-18 15:15:00');
      },
    },
    {
      id: 12,
      desc: 'preview — același tick, un singur run',
      run() {
        const sched = { kind: 'cron', expr: '* * * * *', timezone: 'Europe/Bucharest' };
        const fires = [
          new Date('2026-10-18T14:51:00.000Z'),
          new Date('2026-10-18T14:52:00.000Z'),
          new Date('2026-10-18T14:53:00.000Z'),
        ];
        const lines = S.formatPreviewFireLines(fires, sched);
        assertEq(lines.length, 3);
        assert(lines[0].indexOf('același tick 17:55') >= 0);
        assert(lines[1].indexOf('același tick 17:55') >= 0);
        assert(lines[2].indexOf('rulează la 17:55') >= 0);
      },
    },
    {
      id: 11,
      desc: 'Fixed UTC+2 — expr wall 14:30',
      run() {
        const sched = {
          kind: 'cron',
          expr: '30 14 * * *',
          timezone: 'Fixed',
          utcOffset: '+02:00',
        };
        assert(S.validateScheduleTimezone(sched).ok);
        const next = S.getNextFireAfter(
          sched,
          new Date('2026-03-16T11:00:00.000Z'),
          { strictFuture: true }
        );
        assert(next);
        assertEq(S.formatFireForSchedule(next, sched).slice(11, 16), '14:30');
      },
    },
    {
      id: 10,
      desc: 'tick client — 10/7 off-grid → rulează la :20/:25',
      run() {
        const sched = { kind: 'cron', expr: '10/7 * * * *', timezone: 'Europe/Bucharest' };
        const from = new Date('2026-10-18T14:16:00.000Z');
        const fires = S.getNextFires(sched, from, 5, { strictFuture: true });
        assert(fires.length >= 3, 'fires');
        assertEq(S.formatFireInTz(fires[0], 'Europe/Bucharest').slice(0, 16), '2026-10-18 17:17');
        assertEq(
          S.formatFireInTz(S.getClientExecutionTickAtOrAfter(fires[0]), 'Europe/Bucharest').slice(
            0,
            16
          ),
          '2026-10-18 17:20'
        );
        assertEq(S.formatFireInTz(fires[1], 'Europe/Bucharest').slice(11, 16), '17:24');
        assertEq(
          S.formatFireInTz(S.getClientExecutionTickAtOrAfter(fires[1]), 'Europe/Bucharest').slice(
            11,
            16
          ),
          '17:25'
        );
        const onGrid = S.getNextFireAfter(
          sched,
          new Date('2026-10-18T14:09:00.000Z'),
          { strictFuture: true }
        );
        assertEq(S.formatFireInTz(onGrid, 'Europe/Bucharest').slice(11, 16), '17:10');
        assertEq(
          S.formatFireInTz(S.getClientExecutionTickAtOrAfter(onGrid), 'Europe/Bucharest').slice(
            11,
            16
          ),
          '17:10'
        );
        assertEq(
          S.formatFireLineWithClientTick(fires[1], 'Europe/Bucharest'),
          '2026-10-18 17:24  (rulează la 17:25)'
        );
      },
    },
    {
      id: 9,
      desc: 'expr imposibil (minut 99) — fără scan lung',
      run() {
        const t0 = Date.now();
        const fires = S.getNextFires(
          { kind: 'cron', expr: '99 * * * *', timezone: 'UTC' },
          new Date('2026-01-01T00:00:00.000Z'),
          5,
          { strictFuture: true }
        );
        assertEq(fires.length, 0);
        assert(Date.now() - t0 < 500, 'getNextFires prea lent pentru expr imposibil');
        assert(S.scheduleFieldsNeverFire(S.parseExpr('99 * * * *')), 'never fire');
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
