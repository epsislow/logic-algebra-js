'use strict';

/**
 * Logică Meds Monitor (port din medsTime/i3.html) — folosită de teste + referință pentru alg rebuild.
 * Nu face parte din UI sside; livrabil proiect mmed.
 */

const PERIODS = ['dim', 'pranz', 'seara'];
const PERIOD_LABELS = {
  dim: 'Dimineața',
  pranz: 'Prânz',
  seara: 'Seara',
};
const PERIOD_ORD = { dim: 0, pranz: 1, seara: 2 };

function parseIso(dateIso) {
  return new Date(dateIso + 'T12:00:00');
}

function formatIso(d) {
  return d.toISOString().slice(0, 10);
}

function addDays(iso, n) {
  const d = parseIso(iso);
  d.setDate(d.getDate() + n);
  return formatIso(d);
}

function compareIso(a, b) {
  if (a === b) return 0;
  return a < b ? -1 : 1;
}

function doseForPeriod(med, period) {
  const v = med[period];
  return typeof v === 'number' ? v : 0;
}

function rowId(date, period, medId) {
  return date + '|' + period + '|' + medId;
}

function formatDateLabel(iso) {
  const p = iso.split('-');
  if (p.length !== 3) return iso;
  return p[2] + '.' + p[1] + '.' + p[0];
}

function isMedScheduledOnDate(med, dateIso) {
  if (compareIso(dateIso, med.startDate) < 0) return false;
  if (med.freqType === 'daily') return true;
  const start = parseIso(med.startDate);
  const cur = parseIso(dateIso);
  const offset = Math.round((cur - start) / (24 * 60 * 60 * 1000));
  if (med.freqType === 'interval') {
    const iv = Math.max(1, med.interval || 1);
    return ((offset % iv) + iv) % iv === 0;
  }
  if (med.freqType === 'days') {
    const days = Array.isArray(med.specificDays) ? med.specificDays.map(String) : [];
    return days.includes(String(cur.getDay()));
  }
  return false;
}

function takenMapFromPlan(planRows) {
  const map = Object.create(null);
  for (const r of planRows || []) {
    if (r && r.rowId) map[r.rowId] = !!r.taken;
  }
  return map;
}

function buildPlanRow(med, dateIso, period, taken) {
  const dose = doseForPeriod(med, period);
  const t = !!taken;
  return {
    date: dateIso,
    dateLabel: formatDateLabel(dateIso),
    period,
    periodOrd: PERIOD_ORD[period],
    periodLabel: PERIOD_LABELS[period],
    medId: med.medId,
    medName: med.name,
    dose,
    unit: med.unit,
    doseLabel: dose + ' ' + med.unit,
    taken: t,
    takenLabel: t ? 'DA' : 'nu',
    rowId: rowId(dateIso, period, med.medId),
  };
}

function isMedChecked(planRows, medId, dateIso, period) {
  const id = rowId(dateIso, period, medId);
  const r = (planRows || []).find((x) => x.rowId === id);
  return !!(r && r.taken);
}

function getRemainingBeforeDose(med, planRows, dateIso, period, todayIso) {
  const epsilon = 0.0001;
  let remaining = med.initialQty;
  let cur = med.startDate;
  while (compareIso(cur, dateIso) <= 0) {
    for (const p of PERIODS) {
      if (cur === dateIso && p === period) return remaining;
      if (!isMedScheduledOnDate(med, cur)) continue;
      const dose = doseForPeriod(med, p);
      if (dose <= 0) continue;
      if (isMedChecked(planRows, med.medId, cur, p)) {
        remaining -= dose;
      } else if (compareIso(cur, todayIso) > 0) {
        remaining -= dose;
      }
      if (remaining < epsilon) return remaining;
    }
    cur = addDays(cur, 1);
  }
  return remaining;
}

function shouldShowDose(med, planRows, dateIso, period, todayIso) {
  if (compareIso(dateIso, med.startDate) < 0) return false;
  if (!isMedScheduledOnDate(med, dateIso)) return false;
  const dose = doseForPeriod(med, period);
  if (dose <= 0) return false;
  return getRemainingBeforeDose(med, planRows, dateIso, period, todayIso) >= dose - 0.0001;
}

function getCurrentRemaining(med, planRows, todayIso) {
  let consumed = 0;
  for (const r of planRows || []) {
    if (!r.taken || r.medId !== med.medId) continue;
    if (compareIso(r.date, med.startDate) < 0) continue;
    if (compareIso(r.date, todayIso) > 0) continue;
    consumed += r.dose;
  }
  return Math.max(0, med.initialQty - consumed);
}

function rebuildPlan(meds, oldPlan, opts) {
  opts = opts || {};
  const anchor = opts.anchorDate || opts.todayIso || formatIso(new Date());
  const todayIso = opts.todayIso || anchor;
  const horizon = Math.max(1, opts.horizonDays || 14);
  const takenMap = takenMapFromPlan(oldPlan);

  const draft = [];
  for (let d = 0; d < horizon; d++) {
    const dateIso = addDays(anchor, d);
    for (const med of meds) {
      for (const period of PERIODS) {
        if (!shouldShowDose(med, oldPlan, dateIso, period, todayIso)) continue;
        draft.push(buildPlanRow(med, dateIso, period, takenMap[rowId(dateIso, period, med.medId)]));
      }
    }
  }
  draft.sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? -1 : 1;
    if (a.periodOrd !== b.periodOrd) return a.periodOrd - b.periodOrd;
    return String(a.medName).localeCompare(String(b.medName));
  });
  return reapplyTaken(draft, takenMap);
}

function reapplyTaken(rows, takenMap) {
  return rows.map((r) => {
    if (!r.rowId || !Object.prototype.hasOwnProperty.call(takenMap, r.rowId)) return r;
    const taken = takenMap[r.rowId];
    return Object.assign({}, r, { taken, takenLabel: taken ? 'DA' : 'nu' });
  });
}

function filterToday(plan, todayIso) {
  return plan.filter((r) => r.date === todayIso);
}

function patchTaken(plan, targetRowId) {
  return plan.map((r) => {
    if (r.rowId !== targetRowId) return r;
    return Object.assign({}, r, { taken: true, takenLabel: 'DA' });
  });
}

function recalcMedStockFields(med, planRows, todayIso) {
  const remaining = getCurrentRemaining(med, planRows, todayIso);
  const out = Object.assign({}, med, { remainingQty: remaining });
  if (remaining <= 0) {
    out.stockStatus = 'out';
    out.stockOutDate = todayIso;
    out.stockOutLabel = formatDateLabel(todayIso);
  } else if (remaining <= 3) {
    out.stockStatus = 'low';
  } else {
    out.stockStatus = 'ok';
  }
  return out;
}

function sortMedKeysByStockOut(medDocs) {
  return medDocs
    .slice()
    .sort((a, b) => {
      const da = a.stockOutDate || '9999-99-99';
      const db = b.stockOutDate || '9999-99-99';
      if (da !== db) return da < db ? -1 : 1;
      return String(a.name).localeCompare(String(b.name));
    })
    .map((m) => 'data:_mmed_med:' + (m.personId || 'default') + ':' + m.medId);
}

module.exports = {
  PERIODS,
  rowId,
  rebuildPlan,
  filterToday,
  patchTaken,
  recalcMedStockFields,
  sortMedKeysByStockOut,
  isMedScheduledOnDate,
  shouldShowDose,
  getCurrentRemaining,
  buildPlanRow,
  addDays,
  formatIso,
};
