'use strict';

/**
 * Generează pașii alg:_mmed_rebuild_plan (v1: daily, păstrare Luat, horizon 14).
 */

const PERIODS = [
  { id: 'dim', ord: 0, label: 'Dimineața' },
  { id: 'pranz', ord: 1, label: 'Prânz' },
  { id: 'seara', ord: 2, label: 'Seara' },
];

function pushRowSteps(period) {
  const p = period.id;
  return [
    {
      op: 'if',
      when: ['gt', 'med.' + p, 0],
      then: [
        { op: 'assign', to: 'row', val: {} },
        { op: 'jset', to: 'row', path: 'date', from: 'dateIso' },
        { op: 'fdate', from: 'dateIso', format: 'DD.MM.YYYY', to: 'dateLabel' },
        { op: 'jset', to: 'row', path: 'dateLabel', from: 'dateLabel' },
        { op: 'jset', to: 'row', path: 'period', val: p },
        { op: 'jset', to: 'row', path: 'periodOrd', val: period.ord },
        { op: 'jset', to: 'row', path: 'periodLabel', val: period.label },
        { op: 'jset', to: 'row', path: 'medId', from: 'med.medId' },
        { op: 'jset', to: 'row', path: 'medName', from: 'med.name' },
        { op: 'jset', to: 'row', path: 'dose', from: 'med.' + p },
        { op: 'jset', to: 'row', path: 'unit', from: 'med.unit' },
        {
          op: 'str',
          fn: 'concat',
          args: ['med.' + p, ' ', 'med.unit'],
          to: 'doseLabel',
        },
        { op: 'jset', to: 'row', path: 'doseLabel', from: 'doseLabel' },
        { op: 'jset', to: 'row', path: 'taken', val: false },
        { op: 'jset', to: 'row', path: 'takenLabel', val: 'nu' },
        {
          op: 'cat',
          to: 'rowId',
          parts: ['dateIso', '|', p, '|', 'med.medId'],
        },
        { op: 'jset', to: 'row', path: 'rowId', from: 'rowId' },
        { op: 'array', fn: 'push', from: 'rows', values: 'row', to: 'rows' },
      ],
    },
  ];
}

function buildRebuildPlanSteps() {
  const medDaySteps = [
    { op: 'kget', key: 'medKey', to: 'med', as: 'json' },
    {
      op: 'if',
      when: [
        'and',
        ['eq', 'med.freqType', 'daily'],
        ['or', ['empty', 'med.startDate'], ['gte', 'dateIso', 'med.startDate']],
      ],
      then: PERIODS.reduce(function (acc, period) {
        return acc.concat(pushRowSteps(period));
      }, []),
    },
  ];

  return [
    { op: 'assign', to: 'personId', val: 'default' },
    { op: 'cat', to: 'personKey', parts: ['data:_mmed_person:', 'personId'] },
    { op: 'kget', key: 'personKey', to: 'person', as: 'json' },
    {
      op: 'if',
      when: ['truthy', 'person.todayIso'],
      then: [{ op: 'assign', to: 'anchorDate', from: 'person.todayIso' }],
      else: [{ op: 'fdate', val: 'now', format: 'YYYY-MM-DD', to: 'anchorDate' }],
    },
    { op: 'cat', to: 'planKey', parts: ['data:_mmed_plan:', 'personId'] },
    { op: 'cat', to: 'todayKey', parts: ['data:_mmed_plan_today:', 'personId'] },
    { op: 'cat', to: 'indexKey', parts: ['data:_mmed_med_index:', 'personId'] },
    { op: 'kget', key: 'planKey', to: 'oldPlan', as: 'json' },
    {
      op: 'if',
      when: ['eq', 'oldPlan', null],
      then: [{ op: 'assign', to: 'oldPlan', val: [] }],
    },
    { op: 'kget', key: 'indexKey', to: 'medKeys', as: 'json' },
    {
      op: 'if',
      when: ['eq', 'medKeys', null],
      then: [{ op: 'assign', to: 'medKeys', val: [] }],
    },
    { op: 'assign', to: 'rows', val: [] },
    {
      op: 'assign',
      to: 'dayOffsets',
      val: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
    },
    {
      op: 'foreach',
      in: 'dayOffsets',
      as: 'di',
      do: [
        { op: 'cat', to: 'dateExpr', parts: ['anchorDate', ' +', 'di', 'd'] },
        { op: 'fdate', from: 'dateExpr', to: 'dateIso', format: 'YYYY-MM-DD' },
        {
          op: 'foreach',
          in: 'medKeys',
          as: 'medKey',
          do: medDaySteps,
        },
      ],
    },
    {
      op: 'foreach',
      in: 'rows',
      as: 'row',
      do: [
        {
          op: 'foreach',
          in: 'oldPlan',
          as: 'oldRow',
          do: [
            {
              op: 'if',
              when: 'row.rowId == oldRow.rowId and oldRow.taken == true',
              then: [
                { op: 'jset', to: 'row', path: 'taken', val: true },
                { op: 'jset', to: 'row', path: 'takenLabel', val: 'DA' },
              ],
            },
          ],
        },
      ],
    },
    { op: 'ksave', key: 'planKey', val: 'rows', as: 'json' },
    { op: 'assign', to: 'todayRows', val: [] },
    {
      op: 'foreach',
      in: 'rows',
      as: 'row',
      do: [
        {
          op: 'if',
          when: 'row.date == anchorDate',
          then: [{ op: 'array', fn: 'push', from: 'todayRows', values: 'row', to: 'todayRows' }],
        },
      ],
    },
    { op: 'ksave', key: 'todayKey', val: 'todayRows', as: 'json' },
    { op: 'end', msg: 'Plan reîmprospătat' },
  ];
}

module.exports = { buildRebuildPlanSteps, PERIODS };
