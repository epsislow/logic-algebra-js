'use strict';

/**
 * Specificație mmed v1 — fixture pentru teste Node (fără scriere în Redis live).
 * Sursă: .cursor/plans/mmed-meds-monitor.plan.md
 */

const SCHEMA_PERSON = {
  type: 'object',
  required: ['v', 'name'],
  properties: {
    v: { type: 'integer' },
    name: { type: 'string' },
  },
};

const SCHEMA_SETTINGS = {
  type: 'object',
  required: ['v', 'activePersonId'],
  properties: {
    v: { type: 'integer' },
    activePersonId: { type: 'string' },
  },
};

const SCHEMA_PLAN_ROW = {
  type: 'object',
  required: ['date', 'period', 'medId', 'medName', 'dose', 'taken', 'takenLabel'],
  properties: {
    date: { type: 'string' },
    dateLabel: { type: 'string' },
    period: { type: 'string' },
    periodOrd: { type: 'integer' },
    periodLabel: { type: 'string' },
    medId: { type: 'string' },
    medName: { type: 'string' },
    dose: { type: 'number' },
    unit: { type: 'string' },
    doseLabel: { type: 'string' },
    taken: { type: 'boolean' },
    takenLabel: { type: 'string' },
    rowId: { type: 'string' },
  },
};

const SCHEMA_MED = {
  type: 'object',
  required: [
    'v',
    'personId',
    'name',
    'initialQty',
    'startDate',
    'unit',
    'freqType',
    'dim',
    'pranz',
    'seara',
  ],
  properties: {
    v: { type: 'integer' },
    personId: { type: 'string' },
    medId: { type: 'string' },
    name: { type: 'string' },
    unit: { type: 'string' },
    initialQty: { type: 'number' },
    startDate: { type: 'string' },
    freqType: { type: 'string' },
    interval: { type: 'integer' },
    specificDays: { type: 'array', items: { type: 'string' } },
    dim: { type: 'number' },
    pranz: { type: 'number' },
    seara: { type: 'number' },
    remainingQty: { type: 'number' },
    stockOutDate: { type: ['string', 'null'] },
    stockOutLabel: { type: 'string' },
    stockStatus: { type: 'string' },
  },
};

const SCHEMAS = {
  'schema:_mmed_person': SCHEMA_PERSON,
  'schema:_mmed_settings': SCHEMA_SETTINGS,
  'schema:_mmed_plan_row': SCHEMA_PLAN_ROW,
  'schema:_mmed_med': SCHEMA_MED,
};

const SAMPLE_PERSON = { v: 1, name: 'Eu' };
const SAMPLE_SETTINGS = { v: 1, activePersonId: 'default' };

const SAMPLE_MED = {
  v: 1,
  personId: 'default',
  medId: 'm1',
  name: 'Vitamina C',
  unit: 'caps',
  initialQty: 30,
  startDate: '2026-10-01',
  freqType: 'daily',
  dim: 0,
  pranz: 1,
  seara: 0,
  remainingQty: 28,
  stockOutDate: '2026-11-15',
  stockOutLabel: '15.11.2026',
  stockStatus: 'ok',
};

function buildPlanRow(partial) {
  const date = partial.date || '2026-10-20';
  const period = partial.period || 'pranz';
  const medId = partial.medId || 'm1';
  const dose = partial.dose != null ? partial.dose : 1;
  const taken = !!partial.taken;
  return {
    date,
    dateLabel: partial.dateLabel || '20.10.2026',
    period,
    periodOrd: partial.periodOrd != null ? partial.periodOrd : period === 'dim' ? 0 : period === 'pranz' ? 1 : 2,
    periodLabel: partial.periodLabel || (period === 'dim' ? 'Dimineața' : period === 'pranz' ? 'Prânz' : 'Seara'),
    medId,
    medName: partial.medName || 'Vitamina C',
    dose,
    unit: partial.unit || 'caps',
    doseLabel: partial.doseLabel || dose + ' caps',
    taken,
    takenLabel: taken ? 'DA' : 'nu',
    rowId: partial.rowId || mmedRowId(date, period, medId),
  };
}

function mmedRowId(date, period, medId) {
  return String(date) + '|' + String(period) + '|' + String(medId);
}

function takenMapFromRows(rows) {
  const map = Object.create(null);
  for (const r of rows) {
    if (r && r.rowId) map[r.rowId] = !!r.taken;
  }
  return map;
}

/** Simulare rebuild: păstrează bifările după rowId. */
function reapplyTakenFromMap(newRows, takenByRowId) {
  return newRows.map(function (r) {
    if (!r || !r.rowId || !Object.prototype.hasOwnProperty.call(takenByRowId, r.rowId)) {
      return r;
    }
    const taken = takenByRowId[r.rowId];
    return Object.assign({}, r, { taken: taken, takenLabel: taken ? 'DA' : 'nu' });
  });
}

function patchRowTaken(rows, rowId) {
  return rows.map(function (r) {
    if (!r || r.rowId !== rowId) return r;
    return Object.assign({}, r, { taken: true, takenLabel: 'DA' });
  });
}

function filterPlanToday(rows, todayIso) {
  return rows.filter(function (r) {
    return r && r.date === todayIso;
  });
}

const MMED_PERIODS = [
  { id: 'dim', field: 'dim' },
  { id: 'pranz', field: 'pranz' },
  { id: 'seara', field: 'seara' },
];

function addDaysIso(isoDate, days) {
  const d = new Date(isoDate + 'T12:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Simulare v1: doar freqType daily + startDate (ca rebuild simplificat în teste). */
function isMedScheduledOnDate(med, dateIso) {
  if (!med || med.freqType !== 'daily') return false;
  if (med.startDate && dateIso < med.startDate) return false;
  return true;
}

function generateRowsForMedOnDate(med, dateIso) {
  const rows = [];
  for (let i = 0; i < MMED_PERIODS.length; i++) {
    const p = MMED_PERIODS[i];
    const dose = med[p.field];
    if (!(dose > 0)) continue;
    rows.push(
      buildPlanRow({
        date: dateIso,
        period: p.id,
        medId: med.medId,
        medName: med.name,
        dose: dose,
        unit: med.unit,
        taken: false,
      })
    );
  }
  return rows;
}

/**
 * Pseudocode alg:_mmed_rebuild_plan — fără stoc/simulare i3, păstrează Luat după rowId.
 */
function rebuildPlanSimple(meds, oldPlan, anchorDate, horizonDays) {
  const takenMap = takenMapFromRows(oldPlan || []);
  let out = [];
  const horizon = Math.max(1, horizonDays || 14);
  for (let d = 0; d < horizon; d++) {
    const dateIso = addDaysIso(anchorDate, d);
    for (let m = 0; m < meds.length; m++) {
      const med = meds[m];
      if (!isMedScheduledOnDate(med, dateIso)) continue;
      out = out.concat(generateRowsForMedOnDate(med, dateIso));
    }
  }
  out.sort(function (a, b) {
    if (a.date !== b.date) return a.date < b.date ? -1 : 1;
    if (a.periodOrd !== b.periodOrd) return a.periodOrd - b.periodOrd;
    return String(a.medName).localeCompare(String(b.medName));
  });
  return reapplyTakenFromMap(out, takenMap);
}

function splitPlanAndToday(plan, todayIso) {
  return { plan: plan, planToday: filterPlanToday(plan, todayIso) };
}

function medRedisKey(medId) {
  return 'data:_mmed_med:default:' + medId;
}

/** După alg:_mmed_save_med + rebuild (simulat). */
function simulateSaveMed(meds, med, oldPlan, opts) {
  opts = opts || {};
  const todayIso = opts.todayIso || '2026-10-20';
  const anchor = opts.anchorDate || todayIso;
  const horizon = opts.horizonDays != null ? opts.horizonDays : 14;
  const nextMeds = meds.filter(function (m) {
    return m.medId !== med.medId;
  });
  nextMeds.push(med);
  const plan = rebuildPlanSimple(nextMeds, oldPlan, anchor, horizon);
  return Object.assign({ meds: nextMeds }, splitPlanAndToday(plan, todayIso));
}

/** După ștergere medicament + rebuild (simulat). */
function simulateDeleteMed(meds, medId, oldPlan, opts) {
  opts = opts || {};
  const todayIso = opts.todayIso || '2026-10-20';
  const anchor = opts.anchorDate || todayIso;
  const horizon = opts.horizonDays != null ? opts.horizonDays : 14;
  const nextMeds = meds.filter(function (m) {
    return m.medId !== medId;
  });
  const plan = rebuildPlanSimple(nextMeds, oldPlan, anchor, horizon);
  return Object.assign({ meds: nextMeds }, splitPlanAndToday(plan, todayIso));
}

/** După alg:_mmed_take_dose — rescrie plan + plan_today. */
function simulateTakeDose(plan, todayIso, rowId) {
  const nextPlan = patchRowTaken(plan, rowId);
  return splitPlanAndToday(nextPlan, todayIso);
}

function removeMedFromInventoryIndex(indexKeys, medId) {
  const key = medRedisKey(medId);
  return indexKeys.filter(function (k) {
    return k !== key;
  });
}

const LIST_PLAN = {
  v: 1,
  title: 'Plan doze',
  source: { from: 'key', key: 'data:_mmed_plan:default' },
  row: 'object',
  pageSize: 8,
  columns: [
    { id: 'date', label: 'Data', path: 'dateLabel' },
    { id: 'slot', label: 'Slot', path: 'periodLabel' },
    { id: 'med', label: 'Medicament', path: 'medName' },
    { id: 'qty', label: 'Cantitate', path: 'doseLabel' },
    { id: 'luat', label: 'Luat', path: 'takenLabel' },
  ],
  rowBtns: [{ id: 'take', label: 'Luat', alg: 'alg:_mmed_take_dose', kind: 'blue' }],
  btns: [
    {
      id: 'refresh',
      label: 'Reîmprospătează plan',
      alg: 'alg:_mmed_rebuild_plan',
      kind: 'gray',
      needsRow: false,
    },
  ],
};

const LIST_TODAY = Object.assign({}, LIST_PLAN, {
  title: 'Astăzi',
  source: { from: 'key', key: 'data:_mmed_plan_today:default' },
  pageSize: 20,
});

const LIST_INVENTORY = {
  v: 1,
  title: 'Inventar medicamente',
  source: { from: 'list', key: 'list:_mmed_inventory_index:default' },
  row: 'object',
  pageSize: 10,
  columns: [
    { id: 'name', label: 'Medicament', path: 'name' },
    { id: 'rem', label: 'Rămas', path: 'remainingQty' },
    { id: 'out', label: 'Se termină', path: 'stockOutLabel' },
    { id: 'st', label: 'Status', path: 'stockStatus' },
  ],
};

const FORM_MED = {
  v: 1,
  title: 'Medicament',
  schema: 'schema:_mmed_med',
  btns: [{ id: 'save', label: 'Salvează', alg: 'alg:_mmed_save_med', kind: 'blue' }],
};

/** Plan draft: blocks folosesc `kind` — trebuie `type` pentru validateProg. */
const UI_MMED_PLAN_DRAFT = {
  v: 1,
  title: 'Meds Monitor',
  tabs: [
    {
      id: 'azi',
      label: 'Azi',
      blocks: [{ kind: 'list', list: 'list:_mmed_today', id: 'todayList' }],
    },
    {
      id: 'plan',
      label: 'Plan',
      blocks: [{ kind: 'list', list: 'list:_mmed_plan', id: 'planList' }],
    },
    {
      id: 'inv',
      label: 'Inventar',
      blocks: [{ kind: 'list', list: 'list:_mmed_inventory', id: 'invList' }],
    },
    {
      id: 'med',
      label: 'Medicament',
      blocks: [{ kind: 'form', form: 'form:_mmed_med', id: 'medForm' }],
    },
  ],
};

function uiMmedForValidate() {
  return {
    v: 1,
    title: 'Meds Monitor',
    tabs: UI_MMED_PLAN_DRAFT.tabs.map(function (t) {
      return {
        id: t.id,
        label: t.label,
        blocks: t.blocks.map(function (b) {
          if (b.kind === 'list') {
            return { type: 'list', id: b.id, list: b.list };
          }
          if (b.kind === 'form') {
            return { type: 'form', id: b.id, form: b.form };
          }
          return b;
        }),
      };
    }),
  };
}

const KEYS = {
  plan: 'data:_mmed_plan:default',
  planToday: 'data:_mmed_plan_today:default',
  med: 'data:_mmed_med:default:m1',
  inventoryIndex: 'list:_mmed_inventory_index:default',
};

module.exports = {
  SCHEMAS,
  SCHEMA_PERSON,
  SCHEMA_SETTINGS,
  SCHEMA_PLAN_ROW,
  SCHEMA_MED,
  SAMPLE_PERSON,
  SAMPLE_SETTINGS,
  SAMPLE_MED,
  buildPlanRow,
  mmedRowId,
  takenMapFromRows,
  reapplyTakenFromMap,
  patchRowTaken,
  filterPlanToday,
  rebuildPlanSimple,
  simulateSaveMed,
  simulateDeleteMed,
  simulateTakeDose,
  medRedisKey,
  removeMedFromInventoryIndex,
  addDaysIso,
  LIST_PLAN,
  LIST_TODAY,
  LIST_INVENTORY,
  FORM_MED,
  UI_MMED_PLAN_DRAFT,
  uiMmedForValidate,
  KEYS,
};
