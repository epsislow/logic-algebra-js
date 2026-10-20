'use strict';

const Engine = require('./mmed-engine.js');

const DEFAULT_PERSON = 'default';
const HORIZON = 14;

function planKey(personId) {
  return 'data:_mmed_plan:' + (personId || DEFAULT_PERSON);
}

function planTodayKey(personId) {
  return 'data:_mmed_plan_today:' + (personId || DEFAULT_PERSON);
}

function medKey(personId, medId) {
  return 'data:_mmed_med:' + (personId || DEFAULT_PERSON) + ':' + medId;
}

function inventoryIndexKey(personId) {
  return 'list:_mmed_inventory_index:' + (personId || DEFAULT_PERSON);
}

function medIndexKey(personId) {
  return 'data:_mmed_med_index:' + (personId || DEFAULT_PERSON);
}

async function syncMedIndexJson(redis, personId, medKeyStr) {
  const key = medIndexKey(personId);
  let idx = (await jsonGet(redis, key)) || [];
  if (!Array.isArray(idx)) idx = [];
  if (!idx.includes(medKeyStr)) {
    idx.push(medKeyStr);
    await jsonSet(redis, key, idx);
  }
}

async function removeMedIndexJson(redis, personId, medKeyStr) {
  const key = medIndexKey(personId);
  let idx = (await jsonGet(redis, key)) || [];
  if (!Array.isArray(idx)) idx = [];
  idx = idx.filter((k) => k !== medKeyStr);
  await jsonSet(redis, key, idx);
}

async function jsonGet(redis, key) {
  const raw = await redis.exec(['JSON.GET', key, '$']);
  if (raw == null) return null;
  const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
  return Array.isArray(parsed) ? parsed[0] : parsed;
}

async function jsonSet(redis, key, val) {
  await redis.exec(['JSON.SET', key, '$', JSON.stringify(val)]);
}

async function listAll(redis, key) {
  const raw = await redis.exec(['LRANGE', key, '0', '-1']);
  return Array.isArray(raw) ? raw.map(String) : [];
}

async function listReplace(redis, key, members) {
  await redis.exec(['DEL', key]);
  if (members.length) {
    await redis.exec(['RPUSH', key].concat(members));
  }
}

async function loadMeds(redis, personId) {
  const keys = await listAll(redis, inventoryIndexKey(personId));
  const meds = [];
  for (const k of keys) {
    const doc = await jsonGet(redis, k);
    if (doc) meds.push(doc);
  }
  return meds;
}

async function applyRebuild(redis, personId, opts) {
  opts = opts || {};
  const todayIso = opts.todayIso || Engine.formatIso(new Date());
  const oldPlan = (await jsonGet(redis, planKey(personId))) || [];
  const oldArr = Array.isArray(oldPlan) ? oldPlan : [];
  const meds = await loadMeds(redis, personId);
  const plan = Engine.rebuildPlan(meds, oldArr, {
    todayIso,
    anchorDate: opts.anchorDate || todayIso,
    horizonDays: opts.horizonDays || HORIZON,
  });
  await jsonSet(redis, planKey(personId), plan);
  await jsonSet(redis, planTodayKey(personId), Engine.filterToday(plan, todayIso));
  return plan;
}

async function applyRecalcAll(redis, personId, todayIso) {
  const meds = await loadMeds(redis, personId);
  const plan = (await jsonGet(redis, planKey(personId))) || [];
  const planArr = Array.isArray(plan) ? plan : [];
  for (const med of meds) {
    const updated = Engine.recalcMedStockFields(med, planArr, todayIso);
    await jsonSet(redis, medKey(personId, med.medId), updated);
  }
  await applyInventoryIndex(redis, personId, todayIso);
}

async function applyInventoryIndex(redis, personId, todayIso) {
  const meds = await loadMeds(redis, personId);
  const plan = (await jsonGet(redis, planKey(personId))) || [];
  const planArr = Array.isArray(plan) ? plan : [];
  const refreshed = meds.map((m) => Engine.recalcMedStockFields(m, planArr, todayIso));
  const keys = Engine.sortMedKeysByStockOut(refreshed);
  await listReplace(redis, inventoryIndexKey(personId), keys);
}

async function saveMed(redis, med, opts) {
  opts = opts || {};
  const personId = med.personId || DEFAULT_PERSON;
  const todayIso = opts.todayIso || Engine.formatIso(new Date());
  if (!med.medId) med.medId = 'm' + Date.now();
  med.v = 1;
  med.personId = personId;
  await jsonSet(redis, medKey(personId, med.medId), med);
  const keys = await listAll(redis, inventoryIndexKey(personId));
  const mk = medKey(personId, med.medId);
  if (!keys.includes(mk)) {
    await redis.exec(['RPUSH', inventoryIndexKey(personId), mk]);
  }
  await syncMedIndexJson(redis, personId, mk);
  await applyRecalcAll(redis, personId, todayIso);
  await applyRebuild(redis, personId, { todayIso });
}

async function deleteMed(redis, personId, medId, opts) {
  opts = opts || {};
  const todayIso = opts.todayIso || Engine.formatIso(new Date());
  await redis.exec(['DEL', medKey(personId, medId)]);
  const keys = await listAll(redis, inventoryIndexKey(personId));
  await listReplace(
    redis,
    inventoryIndexKey(personId),
    keys.filter((k) => k !== medKey(personId, medId))
  );
  await removeMedIndexJson(redis, personId, medKey(personId, medId));
  await applyRebuild(redis, personId, { todayIso });
  await applyRecalcAll(redis, personId, todayIso);
}

async function takeDose(redis, personId, rowId, todayIso) {
  const pk = planKey(personId);
  const plan = (await jsonGet(redis, pk)) || [];
  const arr = Array.isArray(plan) ? plan.slice() : [];
  const next = Engine.patchTaken(arr, rowId);
  await jsonSet(redis, pk, next);
  await jsonSet(redis, planTodayKey(personId), Engine.filterToday(next, todayIso));
  const row = next.find((r) => r.rowId === rowId);
  if (row) {
    const med = await jsonGet(redis, medKey(personId, row.medId));
    if (med) {
      const updated = Engine.recalcMedStockFields(med, next, todayIso);
      await jsonSet(redis, medKey(personId, row.medId), updated);
      await applyInventoryIndex(redis, personId, todayIso);
    }
  }
}

async function seedDemo(redis, todayIso) {
  const person = { v: 1, name: 'Eu' };
  if (todayIso) person.todayIso = todayIso;
  await jsonSet(redis, 'data:_mmed_person:default', person);
  await listReplace(redis, inventoryIndexKey(DEFAULT_PERSON), []);
  await jsonSet(redis, planKey(DEFAULT_PERSON), []);
  await jsonSet(redis, planTodayKey(DEFAULT_PERSON), []);
}

module.exports = {
  planKey,
  planTodayKey,
  medKey,
  inventoryIndexKey,
  saveMed,
  deleteMed,
  takeDose,
  applyRebuild,
  applyRecalcAll,
  applyInventoryIndex,
  loadMeds,
  seedDemo,
  jsonGet,
  jsonSet,
};
