'use strict';

const Alg = require('../../core/alg-runner.js');
const V = require('../../core/prog-validate.js');
const ListLoad = require('../../core/list-load.js');
const Bundle = require('../../extern/mmed/prog-bundle.js');
const RedisOps = require('../../extern/mmed/mmed-redis-ops.js');
const Engine = require('../../extern/mmed/mmed-engine.js');

async function seedProgKeys(redis) {
  for (const [key, val] of Object.entries(Bundle.KEYS)) {
    if (key.startsWith('schema:') || key.startsWith('form:') || key.startsWith('list:') || key.startsWith('ui:') || key.startsWith('alg:')) {
      await redis.exec(['JSON.SET', key, '$', JSON.stringify(val)]);
    }
  }
}

function loadSchema(key) {
  return Bundle.SCHEMAS[key] || null;
}

async function loadAlg(key) {
  if (!Bundle.ALGS[key]) throw new Error('alg lipsă în bundle: ' + key);
  return Bundle.ALGS[key];
}

/**
 * Simulează click pe buton (form / list row / list toolbar).
 * opts.rebuildEngine: true → după save/delete, applyRebuild (i3) în loc de stub alg.
 */
async function pressButton(redis, algKey, opts) {
  opts = opts || {};
  const form = Object.assign({}, opts.form || {});
  const list = opts.list || {};
  const todayIso = opts.todayIso || '2026-10-20';

  if (algKey === 'alg:_mmed_rebuild_plan' && opts.rebuildEngine === true) {
    await RedisOps.applyRebuild(redis, opts.personId || 'default', { todayIso });
    return { msg: 'Plan reîmprospătat (engine)' };
  }

  if (algKey === 'alg:_mmed_take_dose' && form.rowId) {
    await RedisOps.takeDose(redis, opts.personId || 'default', form.rowId, todayIso);
    return { msg: 'Marcat Luat' };
  }

  const r = await Alg.run(
    { v: 1, steps: [{ op: 'call', alg: algKey, with: 'form', list: 'list' }] },
    {
      form,
      list,
      redis,
      loadSchema: async (k) => loadSchema(k),
      loadAlg: async (k) => loadAlg(k),
    }
  );

  /** Engine rebuild (interval/stoc i3) doar dacă rebuildEngine: true — altfel rebuild e în alg la save/delete. */
  if (
    opts.rebuildEngine === true &&
    (algKey === 'alg:_mmed_save_med' || algKey === 'alg:_mmed_delete_med')
  ) {
    await RedisOps.applyRebuild(redis, opts.personId || 'default', { todayIso });
    await RedisOps.applyRecalcAll(redis, opts.personId || 'default', todayIso);
  }

  return r;
}

async function loadTodayLabels(redis) {
  const page = await ListLoad.loadListPage(Bundle.KEYS['list:_mmed_today'], redis, 1);
  return page.rows.map((r) => ({
    medId: r.value.medId,
    luat: r.value.takenLabel,
    rowId: r.value.rowId,
  }));
}

async function loadPlanCount(redis) {
  const plan = await RedisOps.jsonGet(redis, RedisOps.planKey('default'));
  return Array.isArray(plan) ? plan.length : 0;
}

function validateAllProg() {
  const errors = [];
  for (const [k, v] of Object.entries(Bundle.KEYS)) {
    if (k.startsWith('schema:')) continue;
    if (k.startsWith('form:')) {
      const r = V.validateProg('form', v);
      if (!r.ok) errors.push(k + ': ' + r.err);
    }
    if (k.startsWith('list:')) {
      const r = V.validateProg('list', v);
      if (!r.ok) errors.push(k + ': ' + r.err);
    }
    if (k.startsWith('ui:')) {
      const r = V.validateProg('ui', v);
      if (!r.ok) errors.push(k + ': ' + r.err);
    }
    if (k.startsWith('alg:')) {
      const r = V.validateProg('alg', v);
      if (!r.ok) errors.push(k + ': ' + r.err);
    }
  }
  return errors;
}

module.exports = {
  Bundle,
  RedisOps,
  Engine,
  seedProgKeys,
  pressButton,
  loadTodayLabels,
  loadPlanCount,
  validateAllProg,
  loadSchema,
  loadAlg,
};
