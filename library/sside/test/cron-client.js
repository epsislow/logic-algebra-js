'use strict';

const { createMemoryRedis } = require('../core/redis.js');
const Cron = require('../core/cron-client.js');
const Alg = require('../core/alg-runner.js');

function assert(cond, msg) {
  if (!cond) throw new Error(msg || 'assertion failed');
}

module.exports = {
  name: 'cron-client',
  tests: [
    {
      id: 1,
      desc: 'enabled false — runDue skip',
      async run() {
        const redis = createMemoryRedis();
        await redis.exec([
          'JSON.SET',
          'cron:test',
          '$',
          JSON.stringify({
            v: 1,
            mode: 'client',
            enabled: false,
            schedule: {
              kind: 'interval',
              minutes: 5,
              timezone: 'UTC',
              startAt: '2020-01-01 00:00',
            },
            alg: 'alg:_t',
          }),
        ]);
        const sched = Cron.createScheduler({
          redis,
          listCronKeys: async () => ['cron:test'],
          onRunAlg: async () => ({ msg: 'ok' }),
        });
        await sched.reloadAll();
        const entry = sched.getRegistry().get('cron:test');
        entry.nextRunAt = new Date(Date.now() - 60000);
        const runs = await sched.runDueJobs();
        assertEqRunsZero(runs);
        sched.stop();
      },
    },
    {
      id: 2,
      desc: 'lock NX — al doilea run skipped',
      async run() {
        const redis = createMemoryRedis();
        await redis.exec([
          'JSON.SET',
          'cron:a',
          '$',
          JSON.stringify({
            v: 1,
            mode: 'client',
            enabled: true,
            schedule: {
              kind: 'interval',
              minutes: 5,
              timezone: 'UTC',
              startAt: '2020-01-01 00:00',
            },
            alg: 'alg:_a',
            timeoutSeconds: 300,
          }),
        ]);
        const sched = Cron.createScheduler({
          redis,
          listCronKeys: async () => ['cron:a'],
          onRunAlg: async () => ({ msg: 'done' }),
        });
        await sched.reloadAll();
        await redis.exec(['SET', Cron.lockKey('cron:a'), 'other-tab', 'NX', 'EX', '120']);
        const r2 = await sched.runOnce('cron:a', 'manual');
        assert(!r2.ok && r2.reason === 'lock');
        sched.stop();
      },
    },
    {
      id: 3,
      desc: 'run manual fără due + state nextRunAt',
      async run() {
        const redis = createMemoryRedis();
        await redis.exec(['JSON.SET', 'alg:_hi', '$', JSON.stringify({ v: 1, steps: [{ op: 'end', type: 'msg', value: 'hi' }] })]);
        await redis.exec([
          'JSON.SET',
          'cron:manual',
          '$',
          JSON.stringify({
            v: 1,
            mode: 'client',
            enabled: true,
            schedule: {
              kind: 'interval',
              minutes: 60,
              timezone: 'UTC',
              startAt: '2020-01-01 00:00',
            },
            alg: 'alg:_hi',
          }),
        ]);
        const sched = Cron.createScheduler({
          redis,
          listCronKeys: async () => ['cron:manual'],
          onRunAlg: async ({ algKey }) => {
            const alg = await Cron.jsonGet(redis, algKey);
            return Alg.run(alg, { form: {}, redis, algKey });
          },
        });
        await sched.reloadAll();
        const far = sched.getRegistry().get('cron:manual');
        far.nextRunAt = new Date(Date.now() + 3600000);
        const r = await sched.runOnce('cron:manual', 'manual');
        assert(r.ok);
        const st = await Cron.jsonGet(redis, 'cron:state:manual');
        assert(st.lastMsg === 'hi' || st.lastStatus === 'ok');
        assert(st.lastTrigger === 'manual');
        assert(st.lastRunHost === 'client');
        assert(Array.isArray(st.recentRuns) && st.recentRuns.length >= 1);
        assert(st.recentRuns[0].runHost === 'client');
        assert(st.recentRuns[0].msg === 'hi' || st.recentRuns[0].status === 'ok');
        sched.stop();
      },
    },
    {
      id: 5,
      desc: 'prependRecentRuns cap',
      run() {
        let list = [];
        for (let i = 0; i < 15; i++) {
          list = Cron.prependRecentRuns(list, { runAt: 't' + i, status: 'ok' });
        }
        assert(list.length === Cron.RECENT_RUNS_CAP);
        assert(list[0].runAt === 't14');
      },
    },
    {
      id: 6,
      desc: 'reloadAll apoi start păstrează registry',
      async run() {
        const redis = createMemoryRedis();
        await redis.exec([
          'JSON.SET',
          'cron:keep',
          '$',
          JSON.stringify({
            v: 1,
            mode: 'client',
            enabled: true,
            schedule: {
              kind: 'interval',
              minutes: 5,
              timezone: 'UTC',
              startAt: '2020-01-01 00:00',
            },
            alg: 'alg:_k',
          }),
        ]);
        const sched = Cron.createScheduler({
          redis,
          listCronKeys: async () => ['cron:keep'],
          onRunAlg: async () => ({ msg: 'ok' }),
        });
        await sched.reloadAll();
        assert(sched.getRegistry().has('cron:keep'), 'după reloadAll');
        sched.start();
        assert(sched.getRegistry().has('cron:keep'), 'după start');
        sched.stop();
      },
    },
    {
      id: 4,
      desc: 'journal reloadOne',
      async run() {
        const redis = createMemoryRedis();
        await redis.exec([
          'JSON.SET',
          'cron:j',
          '$',
          JSON.stringify({
            v: 1,
            mode: 'client',
            enabled: true,
            schedule: {
              kind: 'interval',
              minutes: 5,
              timezone: 'UTC',
              startAt: '2020-01-01 00:00',
            },
            alg: 'alg:_x',
          }),
        ]);
        const sched = Cron.createScheduler({
          redis,
          listCronKeys: async () => ['cron:j'],
          onRunAlg: async () => ({ msg: 'x' }),
        });
        await sched.reloadAll();
        await sched.appendJournal('saved', 'cron:j', 'test');
        sched.ctx.logCursor = 0;
        await sched.syncFromJournal();
        assert(sched.getRegistry().has('cron:j'));
        sched.stop();
      },
    },
    {
      id: 10,
      desc: 'client scheduler ignoră job mode edge',
      async run() {
        const redis = createMemoryRedis();
        await redis.exec([
          'JSON.SET',
          'cron:edgeOnly',
          '$',
          JSON.stringify({
            v: 1,
            mode: 'edge',
            enabled: true,
            schedule: {
              kind: 'interval',
              minutes: 5,
              timezone: 'UTC',
              startAt: '2020-01-01 00:00',
            },
            alg: 'alg:_e',
          }),
        ]);
        const sched = Cron.createScheduler({
          redis,
          listCronKeys: async () => ['cron:edgeOnly'],
          onRunAlg: async () => ({ msg: 'ok' }),
        });
        await sched.reloadAll();
        const entry = sched.getRegistry().get('cron:edgeOnly');
        entry.nextRunAt = new Date(Date.now() - 60000);
        const r = await sched.runOnce('cron:edgeOnly', 'scheduled');
        assert(!r.ok && r.reason === 'mode');
        sched.stop();
      },
    },
    {
      id: 11,
      desc: 'runEdgeSchedulerTick — edge job due rulează',
      async run() {
        const redis = createMemoryRedis();
        await redis.exec([
          'JSON.SET',
          'cron:edgeJob',
          '$',
          JSON.stringify({
            v: 1,
            mode: 'edge',
            enabled: true,
            schedule: {
              kind: 'interval',
              minutes: 5,
              timezone: 'UTC',
              startAt: '2020-01-01 00:00',
            },
            alg: 'alg:_e',
          }),
        ]);
        let ran = false;
        const summary = await Cron.runEdgeSchedulerTick({
          redis,
          listCronKeys: async () => ['cron:edgeJob'],
          onRunAlg: async () => {
            ran = true;
            return { msg: 'edge-ok' };
          },
        });
        assert(summary.ok === true);
        assert(summary.edgeJobs === 1);
        assert(ran, 'onRunAlg apelat');
        const st = await Cron.jsonGet(redis, 'cron:state:edgeJob');
        assert(st.lastRunHost === 'edge');
        assert(st.recentRuns[0].runHost === 'edge');
      },
    },
  ],
};

function assertEqRunsZero(runs) {
  const started = (runs || []).filter((x) => x.result && x.result.ok);
  assert(started.length === 0, 'expected no ok runs');
}
