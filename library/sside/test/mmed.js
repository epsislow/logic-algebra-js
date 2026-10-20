'use strict';

const Ops = require('../core/alg-ops.js');
const Alg = require('../core/alg-runner.js');
const Keys = require('../core/keys.js');
const V = require('../core/prog-validate.js');
const ListLoad = require('../core/list-load.js');
const { createMemoryRedis } = require('../core/redis.js');
const Fx = require('./fixtures/mmed-v1.js');

function assert(cond, msg) {
  if (!cond) throw new Error(msg || 'assertion failed');
}

function assertEq(a, b, msg) {
  if (a !== b) {
    throw new Error((msg || 'eq') + ': ' + JSON.stringify(a) + ' !== ' + JSON.stringify(b));
  }
}

function scheckOk(schemaKey, val) {
  const schema = Fx.SCHEMAS[schemaKey];
  assert(schema, 'schema fixture lipsă: ' + schemaKey);
  const res = Ops.checkSchema(val, schema);
  if (!res.ok) throw new Error(res.err || 'scheck fail');
}

function scheckFail(schemaKey, val) {
  const schema = Fx.SCHEMAS[schemaKey];
  const res = Ops.checkSchema(val, schema);
  assert(!res.ok, 'așteptat scheck fail pentru ' + schemaKey);
}

async function seedJson(redis, key, val) {
  await redis.exec(['JSON.SET', key, '$', JSON.stringify(val)]);
}

async function seedPlanBundle(redis, plan, planToday) {
  await seedJson(redis, Fx.KEYS.plan, plan);
  await seedJson(redis, Fx.KEYS.planToday, planToday);
}

async function loadTodayLabels(redis) {
  const page = await ListLoad.loadListPage(Fx.LIST_TODAY, redis, 1);
  return page.rows.map(function (r) {
    return { medId: r.value.medId, luat: r.value.takenLabel };
  });
}

async function loadPlanMedIds(redis) {
  const page = await ListLoad.loadListPage(Fx.LIST_PLAN, redis, 1);
  return page.rows.map(function (r) {
    return r.value.medId;
  });
}

module.exports = {
  name: 'mmed',
  tests: [
    {
      id: 1,
      desc: 'chei v1 — clasificare schema/data/list/alg (convenție sside)',
      run() {
        assert(Keys.isSchemaRedisKey('schema:_mmed_med'));
        assert(Keys.isListRedisKey('list:_mmed_plan'));
        assert(Keys.isFormRedisKey('form:_mmed_med'));
        assert(Keys.isUiRedisKey('ui:_mmed'));

        const medKey = 'data:_mmed_med:default:abc';
        const info = Keys.clasificaCheie(medKey, new Set(['schema:_mmed_med']));
        assertEq(info.tip, 'data');
        assertEq(info.schemaKey, 'schema:_mmed_med');
        assertEq(info.instance, 'default:abc');

        const planKey = 'data:_mmed_plan:default';
        const planInfo = Keys.clasificaCheie(planKey, new Set());
        assertEq(planInfo.tip, 'data');
        assertEq(planInfo.schemaName, '_mmed_plan');
      },
    },
    {
      id: 2,
      desc: 'scheck — person, settings, med, plan_row (fixture v1)',
      run() {
        scheckOk('schema:_mmed_person', Fx.SAMPLE_PERSON);
        scheckOk('schema:_mmed_settings', Fx.SAMPLE_SETTINGS);
        scheckOk('schema:_mmed_med', Fx.SAMPLE_MED);
        scheckOk('schema:_mmed_plan_row', Fx.buildPlanRow({ taken: false }));
        scheckOk('schema:_mmed_plan_row', Fx.buildPlanRow({ taken: true }));

        scheckFail('schema:_mmed_person', { v: 1 });
        scheckFail('schema:_mmed_med', Object.assign({}, Fx.SAMPLE_MED, { initialQty: undefined }));
        const rowBad = Fx.buildPlanRow({ taken: false });
        delete rowBad.dose;
        scheckFail('schema:_mmed_plan_row', rowBad);
      },
    },
    {
      id: 3,
      desc: 'alg scheck — loadSchema din fixture (fără Redis live)',
      async run() {
        const redis = createMemoryRedis();
        const loadSchema = async (k) => Fx.SCHEMAS[k] || null;

        const ok = await Alg.run(
          {
            v: 1,
            steps: [
              { op: 'scheck', schema: 'schema:_mmed_med', val: 'form' },
              { op: 'end', msg: 'ok' },
            ],
          },
          { form: Fx.SAMPLE_MED, redis, loadSchema }
        );
        assertEq(ok.msg, 'ok');

        const bad = await Alg.run(
          {
            v: 1,
            steps: [
              { op: 'scheck', schema: 'schema:_mmed_plan_row', val: 'form' },
              { op: 'end', msg: 'ok' },
            ],
          },
          {
            form: { date: '2026-10-20', period: 'dim' },
            redis,
            loadSchema,
          }
        );
        assert(bad.err);
      },
    },
    {
      id: 4,
      desc: 'plan root array — list from:key paginare pageSize 8 (memory Redis)',
      async run() {
        const redis = createMemoryRedis();
        const rows = [];
        for (let i = 0; i < 10; i++) {
          rows.push(
            Fx.buildPlanRow({
              date: '2026-10-' + String(20 + (i % 3)).padStart(2, '0'),
              period: i % 2 === 0 ? 'dim' : 'pranz',
              medId: 'm' + i,
              medName: 'Med ' + i,
            })
          );
        }
        await seedJson(redis, Fx.KEYS.plan, rows);

        const page1 = await ListLoad.resolveSourceKeyContent(
          Fx.LIST_PLAN.source,
          redis,
          { page: 1, pageSize: 8, rowMode: 'object', needsValue: true }
        );
        assertEq(page1.total, 10);
        assertEq(page1.keys.length, 8);
        assert(page1.hasMore);

        const page2 = await ListLoad.resolveSourceKeyContent(
          Fx.LIST_PLAN.source,
          redis,
          { page: 2, pageSize: 8, rowMode: 'object', needsValue: true }
        );
        assertEq(page2.keys.length, 2);
        assert(!page2.hasMore);
        assertEq(page2._preloadedRows['8'].medName, 'Med 8');
      },
    },
    {
      id: 5,
      desc: 'plan wrapper { rows } — un singur rând listă (anti-pattern v1)',
      async run() {
        const redis = createMemoryRedis();
        await seedJson(redis, Fx.KEYS.plan, {
          v: 1,
          rows: [Fx.buildPlanRow({})],
        });
        const pack = await ListLoad.resolveSourceKeyContent(
          Fx.LIST_PLAN.source,
          redis,
          { page: 1, pageSize: 8, rowMode: 'object', needsValue: true }
        );
        assertEq(pack.total, 1);
        assert(pack._preloadedRows['0'].rows);
      },
    },
    {
      id: 6,
      desc: 'plan_today — subset după dată + sync patch Luat',
      run() {
        const today = '2026-10-20';
        const plan = [
          Fx.buildPlanRow({ date: today, period: 'dim', medId: 'a' }),
          Fx.buildPlanRow({ date: '2026-10-21', period: 'dim', medId: 'b' }),
          Fx.buildPlanRow({ date: today, period: 'seara', medId: 'c' }),
        ];
        const todayRows = Fx.filterPlanToday(plan, today);
        assertEq(todayRows.length, 2);

        const rowId = Fx.mmedRowId(today, 'dim', 'a');
        const planAfter = Fx.patchRowTaken(plan, rowId);
        const todayAfter = Fx.patchRowTaken(todayRows, rowId);
        assertEq(planAfter[0].takenLabel, 'DA');
        assertEq(todayAfter[0].takenLabel, 'DA');
        assertEq(planAfter[1].takenLabel, 'nu');
      },
    },
    {
      id: 7,
      desc: 'rebuild — păstrează taken după rowId',
      run() {
        const oldPlan = [
          Fx.buildPlanRow({ date: '2026-10-20', period: 'pranz', medId: 'x', taken: true }),
          Fx.buildPlanRow({ date: '2026-10-21', period: 'dim', medId: 'x', taken: false }),
        ];
        const map = Fx.takenMapFromRows(oldPlan);
        const rebuilt = [
          Fx.buildPlanRow({ date: '2026-10-20', period: 'pranz', medId: 'x', taken: false }),
          Fx.buildPlanRow({ date: '2026-10-21', period: 'dim', medId: 'x', taken: false }),
          Fx.buildPlanRow({ date: '2026-10-22', period: 'seara', medId: 'y', taken: false }),
        ];
        const merged = Fx.reapplyTakenFromMap(rebuilt, map);
        assertEq(merged[0].takenLabel, 'DA');
        assertEq(merged[1].takenLabel, 'nu');
        assertEq(merged[2].takenLabel, 'nu');
      },
    },
    {
      id: 8,
      desc: 'validateProg — list/form v1 ok; ui draft cu kind e respins',
      run() {
        assert(V.validateProg('list', Fx.LIST_PLAN).ok);
        assert(V.validateProg('list', Fx.LIST_TODAY).ok);
        assert(V.validateProg('list', Fx.LIST_INVENTORY).ok);
        assert(V.validateProg('form', Fx.FORM_MED).ok);
        assert(V.validateProg('ui', Fx.uiMmedForValidate()).ok);
        assert(!V.validateProg('ui', Fx.UI_MMED_PLAN_DRAFT).ok);
      },
    },
    {
      id: 9,
      desc: 'inventar — source list + membri chei med (memory Redis)',
      async run() {
        const redis = createMemoryRedis();
        await seedJson(redis, Fx.KEYS.med, Fx.SAMPLE_MED);
        const medKey2 = 'data:_mmed_med:default:m2';
        await seedJson(
          redis,
          medKey2,
          Object.assign({}, Fx.SAMPLE_MED, { medId: 'm2', name: 'Spirulina', remainingQty: 5 })
        );
        await redis.exec(['RPUSH', Fx.KEYS.inventoryIndex, Fx.KEYS.med, medKey2]);

        const page = await ListLoad.loadListPage(Fx.LIST_INVENTORY, redis, 1);
        assertEq(page.rows.length, 2);
        assertEq(page.rows[0].value.name, 'Vitamina C');
        assertEq(page.rows[1].value.name, 'Spirulina');
      },
    },
    {
      id: 10,
      desc: 'rowId stabil — format plan v1',
      run() {
        assertEq(Fx.mmedRowId('2026-10-20', 'pranz', 'm1'), '2026-10-20|pranz|m1');
        const row = Fx.buildPlanRow({});
        assertEq(row.rowId, Fx.mmedRowId(row.date, row.period, row.medId));
      },
    },
    {
      id: 11,
      desc: 'flux add med — rebuild plan + Azi (list Live simulat, mock Redis)',
      async run() {
        const today = '2026-10-20';
        const medA = Object.assign({}, Fx.SAMPLE_MED, { medId: 'a', name: 'A', pranz: 1, dim: 0, seara: 0 });
        let state = Fx.simulateSaveMed([], medA, [], { todayIso: today, anchorDate: today, horizonDays: 3 });
        const medB = Object.assign({}, Fx.SAMPLE_MED, {
          medId: 'b',
          name: 'B',
          dim: 1,
          pranz: 0,
          seara: 1,
        });
        state = Fx.simulateSaveMed(state.meds, medB, state.plan, {
          todayIso: today,
          anchorDate: today,
          horizonDays: 3,
        });

        const redis = createMemoryRedis();
        await seedPlanBundle(redis, state.plan, state.planToday);

        const azi = await loadTodayLabels(redis);
        assertEq(azi.length, 3);
        assert(azi.some(function (x) {
          return x.medId === 'a' && x.luat === 'nu';
        }));
        assert(
          azi.filter(function (x) {
            return x.medId === 'b' && x.luat === 'nu';
          }).length === 2
        );

        const planIds = await loadPlanMedIds(redis);
        assert(planIds.indexOf('a') !== -1);
        assert(planIds.indexOf('b') !== -1);
        assert(state.plan.length > state.planToday.length);
      },
    },
    {
      id: 12,
      desc: 'flux delete med — dispare din Plan + Azi; Luat pe alt med păstrat',
      async run() {
        const today = '2026-10-20';
        const medA = Object.assign({}, Fx.SAMPLE_MED, { medId: 'a', name: 'A', pranz: 1, dim: 0, seara: 0 });
        const medB = Object.assign({}, Fx.SAMPLE_MED, { medId: 'b', name: 'B', dim: 1, pranz: 0, seara: 0 });
        let state = Fx.simulateSaveMed([], medA, [], { todayIso: today, anchorDate: today, horizonDays: 5 });
        state = Fx.simulateSaveMed(state.meds, medB, state.plan, { todayIso: today, anchorDate: today, horizonDays: 5 });

        const rowB = Fx.mmedRowId(today, 'dim', 'b');
        const taken = Fx.simulateTakeDose(state.plan, today, rowB);
        state = Fx.simulateDeleteMed(state.meds, 'a', taken.plan, {
          todayIso: today,
          anchorDate: today,
          horizonDays: 5,
        });

        assert(!state.plan.some(function (r) {
          return r.medId === 'a';
        }));
        assert(!state.planToday.some(function (r) {
          return r.medId === 'a';
        }));
        assertEq(state.planToday.length, 1);
        assertEq(state.planToday[0].medId, 'b');
        assertEq(state.planToday[0].takenLabel, 'DA');

        const redis = createMemoryRedis();
        await seedPlanBundle(redis, state.plan, state.planToday);
        const azi = await loadTodayLabels(redis);
        assertEq(azi.length, 1);
        assertEq(azi[0].medId, 'b');
        assertEq(azi[0].luat, 'DA');
      },
    },
    {
      id: 13,
      desc: 'Luat + neluat — coloane list Plan și Azi (takenLabel DA/nu)',
      async run() {
        const today = '2026-10-20';
        const med = Object.assign({}, Fx.SAMPLE_MED, { medId: 'x', dim: 1, pranz: 1, seara: 0 });
        let state = Fx.simulateSaveMed([], med, [], { todayIso: today, anchorDate: today, horizonDays: 2 });
        assertEq(state.planToday.length, 2);
        assertEq(state.planToday[0].takenLabel, 'nu');
        assertEq(state.planToday[1].takenLabel, 'nu');

        const rid = state.planToday[0].rowId;
        state = Fx.simulateTakeDose(state.plan, today, rid);

        const redis = createMemoryRedis();
        await seedPlanBundle(redis, state.plan, state.planToday);

        const azi = await loadTodayLabels(redis);
        assertEq(azi.length, 2);
        const da = azi.filter(function (x) {
          return x.luat === 'DA';
        }).length;
        const nu = azi.filter(function (x) {
          return x.luat === 'nu';
        }).length;
        assertEq(da, 1);
        assertEq(nu, 1);

        const planPage = await ListLoad.loadListPage(Fx.LIST_PLAN, redis, 1);
        const labels = planPage.rows
          .filter(function (r) {
            return r.value.date === today;
          })
          .map(function (r) {
            return r.value.takenLabel;
          })
          .sort();
        assertEq(labels.join(','), 'DA,nu');
      },
    },
    {
      id: 14,
      desc: 'delete med — inventar index fără cheie; rebuild fără rânduri medId',
      run() {
        const idx = [Fx.medRedisKey('a'), Fx.medRedisKey('b')];
        const after = Fx.removeMedFromInventoryIndex(idx, 'a');
        assertEq(after.length, 1);
        assertEq(after[0], Fx.medRedisKey('b'));
      },
    },
  ],
};
