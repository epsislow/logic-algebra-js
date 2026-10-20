'use strict';

const { buildRebuildPlanSteps } = require('./rebuild-plan-dsl.js');

/**
 * Chei Redis mmed v1 — de importat în Upstash (Edit / script).
 * Rebuild plan: alg:_mmed_rebuild_plan (daily v1) la fiecare save/delete + refresh.
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

/** Document complet în Redis (alg scheck / data:_mmed_med:…). */
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
    unit: { type: 'string', enum: ['caps', 'ml', 'mg'] },
    initialQty: { type: 'number' },
    startDate: { type: 'string' },
    freqType: { type: 'string', enum: ['daily', 'interval', 'days'] },
    interval: { type: 'integer' },
    specificDays: { type: 'array', items: { type: 'string' } },
    dim: { type: 'number' },
    pranz: { type: 'number' },
    seara: { type: 'number' },
    remainingQty: { type: 'number' },
    stockOutDate: { type: ['string', 'null'] },
    stockOutLabel: { type: 'string' },
    stockStatus: { type: 'string', enum: ['ok', 'low', 'soon', 'out'] },
  },
};

/** Doar câmpuri editabile în tab Medicament (Live). */
const SCHEMA_MED_FORM = {
  v: 1,
  type: 'object',
  propertyOrder: [
    'name',
    'unit',
    'initialQty',
    'startDate',
    'freqType',
    'interval',
    'specificDays',
    'dim',
    'pranz',
    'seara',
    'medId',
  ],
  required: ['name', 'unit', 'initialQty', 'startDate', 'freqType', 'dim', 'pranz', 'seara'],
  properties: {
    name: { type: 'string', title: 'Nume medicament' },
    unit: { type: 'string', title: 'Unitate', enum: ['caps', 'ml', 'mg'], default: 'caps' },
    initialQty: { type: 'number', title: 'Cantitate inițială (stoc)', default: 30 },
    startDate: {
      type: 'string',
      format: 'date',
      title: 'Program de la data',
      description: 'Obligatoriu — alege data în calendar (dacă lași gol, se folosește azi).',
    },
    freqType: {
      type: 'string',
      title: 'Frecvență',
      enum: ['daily', 'interval', 'days'],
      default: 'daily',
    },
    interval: {
      type: 'integer',
      title: 'La câte zile',
      default: 0,
      description: 'Folosit când frecvența e „La N zile”. Ex.: 2 = din 2 în 2 zile.',
    },
    specificDays: {
      type: 'array',
      title: 'Zile din săptămână',
      description: 'Folosit când frecvența e „Zile alese”. 0=duminică … 6=sâmbătă.',
      items: { type: 'integer', minimum: 0, maximum: 6 },
      default: [],
    },
    dim: { type: 'number', title: 'Dimineața — doze', default: 0 },
    pranz: { type: 'number', title: 'Prânz — doze', default: 0 },
    seara: { type: 'number', title: 'Seara — doze', default: 0 },
    medId: {
      type: 'string',
      title: 'ID (doar citire)',
      readOnly: true,
      description: 'Gol la medicament nou; se generează la Salvează.',
    },
  },
};

const ALG_TAKE_DOSE = {
  v: 1,
  name: 'take_dose',
  steps: [
    { op: 'assign', to: 'personId', val: 'default' },
    { op: 'assign', to: 'rowId', from: 'form.rowId' },
    { op: 'cat', to: 'planKey', parts: ['data:_mmed_plan:', 'personId'] },
    { op: 'cat', to: 'todayKey', parts: ['data:_mmed_plan_today:', 'personId'] },
    { op: 'kget', key: '$planKey', to: 'plan', as: 'json' },
    {
      op: 'if',
      when: ['eq', 'plan', null],
      then: [{ op: 'assign', to: 'plan', val: [] }],
    },
    { op: 'assign', to: 'nextPlan', val: [] },
    {
      op: 'foreach',
      in: 'plan',
      as: 'row',
      do: [
        { op: 'assign', to: 'outRow', from: 'row' },
        {
          op: 'if',
          when: 'row.rowId == form.rowId',
          then: [
            { op: 'jset', to: 'outRow', path: 'taken', val: true },
            { op: 'jset', to: 'outRow', path: 'takenLabel', val: 'DA' },
          ],
        },
        { op: 'array', fn: 'push', from: 'nextPlan', values: 'outRow', to: 'nextPlan' },
      ],
    },
    { op: 'ksave', key: '$planKey', val: 'nextPlan', as: 'json' },
    { op: 'assign', to: 'todayRows', val: [] },
    {
      op: 'foreach',
      in: 'nextPlan',
      as: 'row',
      do: [
        {
          op: 'if',
          when: 'row.date == form.date',
          then: [{ op: 'array', fn: 'push', from: 'todayRows', values: 'row', to: 'todayRows' }],
        },
      ],
    },
    { op: 'ksave', key: '$todayKey', val: 'todayRows', as: 'json' },
    { op: 'call', alg: 'alg:_mmed_recalc_stock_med' },
    { op: 'ui', do: 'refresh', listid: ['todayList', 'planList', 'invList'] },
    { op: 'end', msg: 'Marcat Luat' },
  ],
};

const ALG_RECALC_STOCK_MED = {
  v: 1,
  name: 'recalc_stock_med',
  steps: [
    { op: 'assign', to: 'personId', val: 'default' },
    { op: 'assign', to: 'medId', from: 'form.medId' },
    { op: 'cat', to: 'medKey', parts: ['data:_mmed_med:', 'personId', ':', 'medId'] },
    { op: 'cat', to: 'planKey', parts: ['data:_mmed_plan:', 'personId'] },
    { op: 'kget', key: '$medKey', to: 'med', as: 'json' },
    { op: 'kget', key: '$planKey', to: 'plan', as: 'json' },
    {
      op: 'if',
      when: ['eq', 'plan', null],
      then: [{ op: 'assign', to: 'plan', val: [] }],
    },
    { op: 'comment', note: 'Derivate stoc simplu v1 — remaining din doze luate pe plan' },
    { op: 'assign', to: 'consumed', val: 0 },
    {
      op: 'foreach',
      in: 'plan',
      as: 'row',
      do: [
        {
          op: 'if',
          when: ['and', ['eq', 'row.medId', '$medId'], ['eq', 'row.taken', true]],
          then: [{ op: 'calc', expr: 'consumed + row.dose', to: 'consumed' }],
        },
      ],
    },
    { op: 'calc', expr: 'med.initialQty - consumed', to: 'remainingQty' },
    { op: 'jset', to: 'med', path: 'remainingQty', from: 'remainingQty' },
    { op: 'ksave', key: '$medKey', val: 'med', as: 'json' },
    { op: 'call', alg: 'alg:_mmed_rebuild_inventory_index' },
    { op: 'end', msg: 'ok' },
  ],
};

const ALG_REBUILD_INVENTORY = {
  v: 1,
  name: 'rebuild_inventory_index',
  steps: [
    { op: 'assign', to: 'personId', val: 'default' },
    { op: 'comment', note: 'v1: index menținut la save/delete via kadd; refresh sort = reload keys' },
    { op: 'end', msg: 'ok' },
  ],
};

const ALG_SAVE_MED = {
  v: 1,
  name: 'save_med',
  steps: [
    { op: 'assign', to: 'personId', val: 'default' },
    { op: 'jset', to: 'payload', path: 'v', val: 1 },
    { op: 'jset', to: 'payload', path: 'personId', from: 'personId' },
    { op: 'jset', to: 'payload', path: 'name', from: 'form.name' },
    { op: 'jset', to: 'payload', path: 'unit', from: 'form.unit' },
    { op: 'jset', to: 'payload', path: 'initialQty', from: 'form.initialQty' },
    { op: 'cat', to: 'personKey', parts: ['data:_mmed_person:', 'personId'] },
    { op: 'kget', key: 'personKey', to: 'person', as: 'json' },
    {
      op: 'if',
      when: ['or', ['eq', 'form.startDate', ''], ['eq', 'form.startDate', null]],
      then: [
        {
          op: 'if',
          when: ['truthy', 'person.todayIso'],
          then: [{ op: 'assign', to: 'startDateVal', from: 'person.todayIso' }],
          else: [{ op: 'fdate', val: 'now', format: 'YYYY-MM-DD', to: 'startDateVal' }],
        },
      ],
      else: [{ op: 'assign', to: 'startDateVal', from: 'form.startDate' }],
    },
    { op: 'jset', to: 'payload', path: 'startDate', from: 'startDateVal' },
    { op: 'jset', to: 'payload', path: 'freqType', from: 'form.freqType' },
    {
      op: 'if',
      when: ['eq', 'form.interval', null],
      then: [{ op: 'assign', to: 'intervalVal', val: 0 }],
      else: [{ op: 'assign', to: 'intervalVal', from: 'form.interval' }],
    },
    { op: 'jset', to: 'payload', path: 'interval', from: 'intervalVal' },
    {
      op: 'if',
      when: ['eq', 'form.specificDays', null],
      then: [{ op: 'assign', to: 'specificDaysVal', val: [] }],
      else: [{ op: 'assign', to: 'specificDaysVal', from: 'form.specificDays' }],
    },
    { op: 'jset', to: 'payload', path: 'specificDays', from: 'specificDaysVal' },
    { op: 'jset', to: 'payload', path: 'dim', from: 'form.dim' },
    { op: 'jset', to: 'payload', path: 'pranz', from: 'form.pranz' },
    { op: 'jset', to: 'payload', path: 'seara', from: 'form.seara' },
    {
      op: 'if',
      when: ['or', ['eq', 'form.medId', ''], ['eq', 'form.medId', null]],
      then: [{ op: 'id', type: 'nanoid', size: 8, to: 'newMedId' }],
      else: [{ op: 'assign', to: 'newMedId', from: 'form.medId' }],
    },
    { op: 'jset', to: 'payload', path: 'medId', from: 'newMedId' },
    { op: 'scheck', schema: 'schema:_mmed_med', val: 'payload' },
    { op: 'cat', to: 'medKey', parts: ['data:_mmed_med:', 'personId', ':', 'newMedId'] },
    { op: 'ksave', key: '$medKey', val: 'payload', as: 'json' },
    {
      op: 'cat',
      to: 'idxKey',
      parts: ['list:_mmed_inventory_index:', 'personId'],
    },
    { op: 'kadd', key: '$idxKey', val: '$medKey' },
    { op: 'assign', to: 'syncForm', val: {} },
    { op: 'jset', to: 'syncForm', path: 'medKey', from: 'medKey' },
    { op: 'call', alg: 'alg:_mmed_sync_med_index', with: 'syncForm' },
    { op: 'call', alg: 'alg:_mmed_rebuild_plan' },
    { op: 'call', alg: 'alg:_mmed_recalc_stock_med', with: 'payload', to: 'rec' },
    { op: 'ui', do: 'refresh', listid: ['invList', 'planList', 'todayList'] },
    { op: 'end', msg: 'Medicament salvat' },
  ],
};

const ALG_DELETE_MED = {
  v: 1,
  name: 'delete_med',
  steps: [
    { op: 'assign', to: 'personId', val: 'default' },
    { op: 'assign', to: 'medId', from: 'form.medId' },
    { op: 'cat', to: 'medKey', parts: ['data:_mmed_med:', 'personId', ':', 'medId'] },
    { op: 'kdel', key: '$medKey' },
    { op: 'cat', to: 'idxKey', parts: ['list:_mmed_inventory_index:', 'personId'] },
    { op: 'krm', key: '$idxKey', val: '$medKey' },
    { op: 'assign', to: 'syncForm', val: {} },
    { op: 'jset', to: 'syncForm', path: 'medKey', from: 'medKey' },
    { op: 'call', alg: 'alg:_mmed_remove_med_index', with: 'syncForm' },
    { op: 'call', alg: 'alg:_mmed_rebuild_plan' },
    { op: 'ui', do: 'refresh', listid: ['invList', 'planList', 'todayList', 'medForm'] },
    { op: 'end', msg: 'Medicament șters' },
  ],
};

const ALG_SYNC_MED_INDEX = {
  v: 1,
  name: 'sync_med_index',
  steps: [
    { op: 'assign', to: 'personId', val: 'default' },
    { op: 'assign', to: 'medKey', from: 'form.medKey' },
    { op: 'cat', to: 'indexKey', parts: ['data:_mmed_med_index:', 'personId'] },
    { op: 'kget', key: '$indexKey', to: 'idx', as: 'json' },
    {
      op: 'if',
      when: ['eq', 'idx', null],
      then: [{ op: 'assign', to: 'idx', val: [] }],
    },
    { op: 'array', fn: 'contains', from: 'idx', values: 'medKey', to: 'hasKey' },
    {
      op: 'if',
      when: ['eq', 'hasKey', false],
      then: [{ op: 'array', fn: 'push', from: 'idx', values: 'medKey', to: 'idx' }],
    },
    { op: 'ksave', key: '$indexKey', val: 'idx', as: 'json' },
    { op: 'end', msg: 'ok' },
  ],
};

const ALG_REMOVE_MED_INDEX = {
  v: 1,
  name: 'remove_med_index',
  steps: [
    { op: 'assign', to: 'personId', val: 'default' },
    { op: 'assign', to: 'medKey', from: 'form.medKey' },
    { op: 'cat', to: 'indexKey', parts: ['data:_mmed_med_index:', 'personId'] },
    { op: 'kget', key: '$indexKey', to: 'idx', as: 'json' },
    {
      op: 'if',
      when: ['eq', 'idx', null],
      then: [{ op: 'assign', to: 'idx', val: [] }],
    },
    { op: 'assign', to: 'newIdx', val: [] },
    {
      op: 'foreach',
      in: 'idx',
      as: 'k',
      do: [
        {
          op: 'if',
          when: 'k != form.medKey',
          then: [{ op: 'array', fn: 'push', from: 'newIdx', values: 'k', to: 'newIdx' }],
        },
      ],
    },
    { op: 'ksave', key: '$indexKey', val: 'newIdx', as: 'json' },
    { op: 'end', msg: 'ok' },
  ],
};

const ALG_REBUILD_PLAN = {
  v: 1,
  name: 'rebuild_plan',
  steps: buildRebuildPlanSteps(),
};

const FORM_MED = {
  v: 1,
  title: 'Medicament',
  schema: 'schema:_mmed_med_form',
  fields: {
    unit: {
      options: {
        from: 'enum',
        values: ['caps', 'ml', 'mg'],
        titles: ['Capsule (buc)', 'Millilitri (ml)', 'Miligrame (mg)'],
      },
    },
    freqType: {
      options: {
        from: 'enum',
        values: ['daily', 'interval', 'days'],
        titles: ['Zilnic', 'La N zile', 'Anumite zile / săptămână'],
      },
    },
  },
  btns: [
    { id: 'save', label: 'Salvează', alg: 'alg:_mmed_save_med', kind: 'blue' },
    { id: 'del', label: 'Șterge', alg: 'alg:_mmed_delete_med', kind: 'red' },
  ],
};

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
  btns: [],
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

const UI_MMED = {
  v: 1,
  title: 'Meds Monitor',
  tabs: [
    {
      id: 'azi',
      label: 'Azi',
      blocks: [{ type: 'list', list: 'list:_mmed_today', id: 'todayList' }],
    },
    {
      id: 'plan',
      label: 'Plan',
      blocks: [{ type: 'list', list: 'list:_mmed_plan', id: 'planList' }],
    },
    {
      id: 'inv',
      label: 'Inventar',
      blocks: [{ type: 'list', list: 'list:_mmed_inventory', id: 'invList' }],
    },
    {
      id: 'med',
      label: 'Medicament',
      blocks: [{ type: 'form', form: 'form:_mmed_med', id: 'medForm' }],
    },
  ],
};

const KEYS = {
  'schema:_mmed_person': SCHEMA_PERSON,
  'schema:_mmed_settings': SCHEMA_SETTINGS,
  'schema:_mmed_plan_row': SCHEMA_PLAN_ROW,
  'schema:_mmed_med': SCHEMA_MED,
  'schema:_mmed_med_form': SCHEMA_MED_FORM,
  'form:_mmed_med': FORM_MED,
  'list:_mmed_plan': LIST_PLAN,
  'list:_mmed_today': LIST_TODAY,
  'list:_mmed_inventory': LIST_INVENTORY,
  'ui:_mmed': UI_MMED,
  'alg:_mmed_take_dose': ALG_TAKE_DOSE,
  'alg:_mmed_save_med': ALG_SAVE_MED,
  'alg:_mmed_delete_med': ALG_DELETE_MED,
  'alg:_mmed_rebuild_plan': ALG_REBUILD_PLAN,
  'alg:_mmed_sync_med_index': ALG_SYNC_MED_INDEX,
  'alg:_mmed_remove_med_index': ALG_REMOVE_MED_INDEX,
  'alg:_mmed_recalc_stock_med': ALG_RECALC_STOCK_MED,
  'alg:_mmed_rebuild_inventory_index': ALG_REBUILD_INVENTORY,
};

const SCHEMAS = {
  'schema:_mmed_person': SCHEMA_PERSON,
  'schema:_mmed_settings': SCHEMA_SETTINGS,
  'schema:_mmed_plan_row': SCHEMA_PLAN_ROW,
  'schema:_mmed_med': SCHEMA_MED,
  'schema:_mmed_med_form': SCHEMA_MED_FORM,
};

const ALGS = {
  'alg:_mmed_take_dose': ALG_TAKE_DOSE,
  'alg:_mmed_save_med': ALG_SAVE_MED,
  'alg:_mmed_delete_med': ALG_DELETE_MED,
  'alg:_mmed_rebuild_plan': ALG_REBUILD_PLAN,
  'alg:_mmed_sync_med_index': ALG_SYNC_MED_INDEX,
  'alg:_mmed_remove_med_index': ALG_REMOVE_MED_INDEX,
  'alg:_mmed_recalc_stock_med': ALG_RECALC_STOCK_MED,
  'alg:_mmed_rebuild_inventory_index': ALG_REBUILD_INVENTORY,
};

module.exports = {
  KEYS,
  SCHEMAS,
  ALGS,
};
