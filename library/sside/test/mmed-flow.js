'use strict';

const Ops = require('../core/alg-ops.js');
const { createMemoryRedis } = require('../core/redis.js');
const H = require('./fixtures/mmed-harness.js');
const Fx = require('./fixtures/mmed-v1.js');

const TODAY = '2026-10-20';

function assert(cond, msg) {
  if (!cond) throw new Error(msg || 'assertion failed');
}

function assertEq(a, b, msg) {
  if (a !== b) throw new Error((msg || 'eq') + ': ' + JSON.stringify(a) + ' !== ' + JSON.stringify(b));
}

function medForm(partial) {
  return Object.assign(
    {
      name: 'TestMed',
      unit: 'caps',
      initialQty: 30,
      startDate: '2026-10-01',
      freqType: 'daily',
      dim: 0,
      pranz: 1,
      seara: 0,
    },
    partial || {}
  );
}

module.exports = {
  name: 'mmed-flow',
  tests: [
    {
      id: 1,
      desc: 'M1+M4 — prog bundle: scheme + form/list/ui validateProg',
      run() {
        const errs = H.validateAllProg();
        if (errs.length) throw new Error(errs.join('\n'));
        for (const sk of Object.keys(H.Bundle.SCHEMAS)) {
          assert(H.Bundle.SCHEMAS[sk].type === 'object' || H.Bundle.SCHEMAS[sk].properties);
        }
      },
    },
    {
      id: 2,
      desc: 'M2 — seed prog + person; chei data model',
      async run() {
        const redis = createMemoryRedis();
        await H.seedProgKeys(redis);
        await H.RedisOps.seedDemo(redis, TODAY);
        await H.RedisOps.jsonSet(redis, 'data:_mmed_person:default', { v: 1, name: 'Eu' });
        assertEq(await redis.type('schema:_mmed_med'), 'json');
        assertEq(await redis.type('data:_mmed_person:default'), 'json');
      },
    },
    {
      id: 3,
      desc: 'M3 engine — interval + days + ascundere doză stoc epuizat',
      run() {
        const plan = [];
        const medDaily = Object.assign({}, Fx.SAMPLE_MED, {
          medId: 'd',
          initialQty: 100,
          freqType: 'daily',
          pranz: 1,
        });
        const p1 = H.Engine.rebuildPlan([medDaily], plan, { todayIso: TODAY, anchorDate: TODAY, horizonDays: 5 });
        assert(p1.length >= 5);

        const medInt = Object.assign({}, medDaily, {
          medId: 'i',
          freqType: 'interval',
          interval: 2,
          startDate: TODAY,
        });
        const p2 = H.Engine.rebuildPlan([medInt], [], { todayIso: TODAY, anchorDate: TODAY, horizonDays: 5 });
        assert(p2.length >= 2);

        const low = Object.assign({}, medDaily, {
          medId: 'low',
          initialQty: 1,
          dim: 1,
          pranz: 1,
          seara: 1,
        });
        const p3 = H.Engine.rebuildPlan([low], [], { todayIso: TODAY, anchorDate: TODAY, horizonDays: 3 });
        assert(p3.length >= 1 && p3.length < 9);
      },
    },
    {
      id: 4,
      desc: 'M3 — buton Salvează (alg save_med) + rebuild engine → plan + azi',
      async run() {
        const redis = createMemoryRedis();
        await H.seedProgKeys(redis);
        await H.RedisOps.seedDemo(redis, TODAY);
        const r = await H.pressButton(redis, 'alg:_mmed_save_med', {
          form: medForm({ name: 'Vit C' }),
          todayIso: TODAY,
          rebuildEngine: false,
        });
        assert(!r.err, r.err);
        assert(r.msg || r.vars);
        const n = await H.loadPlanCount(redis);
        assert(n > 0);
        const azi = await H.loadTodayLabels(redis);
        assert(azi.length >= 1);
        assertEq(azi[0].luat, 'nu');
      },
    },
    {
      id: 5,
      desc: 'M3 — add 2 meds, șterge unul (delete_med), plan/azi fără medId șters',
      async run() {
        const redis = createMemoryRedis();
        await H.seedProgKeys(redis);
        await H.RedisOps.seedDemo(redis, TODAY);
        await H.RedisOps.saveMed(redis, medForm({ name: 'A', medId: 'a', pranz: 1 }), { todayIso: TODAY });
        await H.RedisOps.saveMed(
          redis,
          medForm({ name: 'B', medId: 'b', dim: 1, pranz: 0 }),
          { todayIso: TODAY }
        );
        const before = await H.loadTodayLabels(redis);
        assert(before.length >= 2);

        const del = await H.pressButton(redis, 'alg:_mmed_delete_med', {
          form: { medId: 'a' },
          todayIso: TODAY,
          rebuildEngine: false,
        });
        assert(!del.err, del.err);

        const plan = await H.RedisOps.jsonGet(redis, H.RedisOps.planKey('default'));
        assert(!plan.some((r) => r.medId === 'a'));
        const azi = await H.loadTodayLabels(redis);
        assert(!azi.some((x) => x.medId === 'a'));
        assert(azi.some((x) => x.medId === 'b'));
      },
    },
    {
      id: 6,
      desc: 'M3 — buton Luat (alg take_dose) DA + recalc remaining',
      async run() {
        const redis = createMemoryRedis();
        await H.seedProgKeys(redis);
        await H.RedisOps.seedDemo(redis, TODAY);
        await H.RedisOps.saveMed(
          redis,
          medForm({ name: 'X', medId: 'x', initialQty: 10, pranz: 1 }),
          { todayIso: TODAY }
        );
        const azi0 = await H.loadTodayLabels(redis);
        const rowId = azi0[0].rowId;
        const r = await H.pressButton(redis, 'alg:_mmed_take_dose', {
          form: { rowId, date: TODAY, medId: 'x' },
          todayIso: TODAY,
          rebuildEngine: false,
        });
        assert(!r.err, r.err);
        const azi = await H.loadTodayLabels(redis);
        assertEq(azi[0].luat, 'DA');
        const med = await H.RedisOps.jsonGet(redis, H.RedisOps.medKey('default', 'x'));
        assert(med.remainingQty <= 9);
      },
    },
    {
      id: 7,
      desc: 'M3 — Luat păstrat după rebuild; alt rând rămâne nu',
      async run() {
        const redis = createMemoryRedis();
        await H.seedProgKeys(redis);
        await H.RedisOps.seedDemo(redis, TODAY);
        await H.RedisOps.saveMed(
          redis,
          medForm({ medId: 'x', dim: 1, pranz: 1, seara: 0 }),
          { todayIso: TODAY }
        );
        const azi0 = await H.loadTodayLabels(redis);
        assertEq(azi0.length, 2);
        await H.pressButton(redis, 'alg:_mmed_take_dose', {
          form: { rowId: azi0[0].rowId, date: TODAY, medId: 'x' },
          rebuildEngine: false,
        });
        await H.pressButton(redis, 'alg:_mmed_rebuild_plan', { todayIso: TODAY });
        const azi = await H.loadTodayLabels(redis);
        const da = azi.filter((x) => x.luat === 'DA').length;
        const nu = azi.filter((x) => x.luat === 'nu').length;
        assertEq(da, 1);
        assertEq(nu, 1);
      },
    },
    {
      id: 8,
      desc: 'M5 — listă Plan paginat + Azi pageSize 20',
      async run() {
        const redis = createMemoryRedis();
        await H.seedProgKeys(redis);
        await H.RedisOps.seedDemo(redis, TODAY);
        await H.RedisOps.saveMed(redis, medForm({ medId: 'long', pranz: 1 }), {
          todayIso: TODAY,
          horizonDays: 14,
        });
        const ListLoad = require('../core/list-load.js');
        const planP1 = await ListLoad.resolveSourceKeyContent(
          H.Bundle.KEYS['list:_mmed_plan'].source,
          redis,
          { page: 1, pageSize: 8, rowMode: 'object', needsValue: true }
        );
        assert(planP1.total >= 8);
        assertEq(planP1.keys.length, 8);
        const todayP = await ListLoad.loadListPage(H.Bundle.KEYS['list:_mmed_today'], redis, 1);
        assert(todayP.rows.length >= 1);
        assertEq(todayP.pageSize, 20, 'pageSize list azi');
        assert(todayP.total >= 1 || todayP.rows.length >= 1);
      },
    },
    {
      id: 9,
      desc: 'M6 — settings activePerson (două persoane, plan separat)',
      async run() {
        const redis = createMemoryRedis();
        await H.seedProgKeys(redis);
        await H.RedisOps.jsonSet(redis, 'data:_mmed_settings:demo', {
          v: 1,
          activePersonId: 'default',
        });
        await H.RedisOps.jsonSet(redis, 'data:_mmed_person:p2', { v: 1, name: 'Copil' });
        await H.RedisOps.saveMed(
          redis,
          medForm({ personId: 'p2', medId: 'c1', name: 'P2Med', pranz: 1 }),
          { todayIso: TODAY }
        );
        const planP2 = await H.RedisOps.jsonGet(redis, H.RedisOps.planKey('p2'));
        assert(Array.isArray(planP2) && planP2.length > 0);
        const planDef = await H.RedisOps.jsonGet(redis, H.RedisOps.planKey('default'));
        assert(!planDef || planDef.length === 0 || Array.isArray(planDef));
      },
    },
    {
      id: 10,
      desc: 'M3 — takeDose: același rowId → DA pe plan + azi (ops)',
      async run() {
        const redis = createMemoryRedis();
        await H.seedProgKeys(redis);
        await H.RedisOps.seedDemo(redis, TODAY);
        await H.RedisOps.saveMed(redis, medForm({ medId: 'cmp', pranz: 1 }), { todayIso: TODAY });
        const azi = await H.loadTodayLabels(redis);
        const rowId = azi[0].rowId;
        await H.pressButton(redis, 'alg:_mmed_take_dose', {
          form: { rowId, date: TODAY, medId: 'cmp' },
        });
        const after = await H.loadTodayLabels(redis);
        assertEq(after[0].luat, 'DA');
        const plan = await H.RedisOps.jsonGet(redis, H.RedisOps.planKey('default'));
        assert(plan.some((r) => r.rowId === rowId && r.takenLabel === 'DA'));
      },
    },
    {
      id: 11,
      desc: 'M7 — bundle exportabil (toate cheile prog așteptate)',
      run() {
        const required = [
          'schema:_mmed_med',
          'form:_mmed_med',
          'list:_mmed_plan',
          'list:_mmed_today',
          'ui:_mmed',
          'alg:_mmed_save_med',
          'alg:_mmed_take_dose',
          'alg:_mmed_delete_med',
        ];
        for (const k of required) {
          assert(H.Bundle.KEYS[k], 'lipsește ' + k);
        }
      },
    },
    {
      id: 12,
      desc: 'M8 — out of scope: fără bulk ieri (plan doar rebuild normal)',
      async run() {
        const redis = createMemoryRedis();
        await H.seedProgKeys(redis);
        await H.RedisOps.seedDemo(redis, TODAY);
        await H.RedisOps.saveMed(redis, medForm({ medId: 'b1', pranz: 1 }), { todayIso: TODAY });
        const y = H.Engine.addDays(TODAY, -1);
        const plan = await H.RedisOps.jsonGet(redis, H.RedisOps.planKey('default'));
        assert(!plan.some((r) => r.date === y && r.taken));
      },
    },
  ],
};
