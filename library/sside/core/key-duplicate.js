/**
 * Duplicare chei Redis — logică testabilă (clone colecții, permisiuni).
 */
(function (root) {
  'use strict';

  const TIPURI_COLECTIE = ['set', 'hash', 'list', 'zset'];

  function esteTipColecțieRedis(tip) {
    return TIPURI_COLECTIE.indexOf(tip) !== -1;
  }

  /**
   * @param {object} ctx
   * @param {boolean} [ctx.isSearchIndex]
   * @param {boolean} [ctx.isSystem]
   * @param {boolean} [ctx.panelUnsupported]
   * @param {string} [ctx.redisTip]
   * @param {number} [ctx.setMembruEditIndex]
   * @param {number} [ctx.colEditIndex]
   */
  function esteDuplicarePermisa(ctx) {
    ctx = ctx || {};
    if (ctx.isSearchIndex || ctx.isSystem || ctx.panelUnsupported) return false;
    if (ctx.setMembruEditIndex != null && ctx.setMembruEditIndex !== -1) return false;
    if (ctx.colEditIndex != null && ctx.colEditIndex !== -1) return false;
    const tip = ctx.redisTip == null ? '' : String(ctx.redisTip);
    if (tip === 'set' || esteTipColecțieRedis(tip)) return true;
    if (tip === 'string' || tip === 'none' || tip === 'json') return true;
    return false;
  }

  /** Mapare clasificare chei → rol modal „Cheie nouă”. */
  function rolCheieNouaDinInfo(info) {
    if (!info || !info.tip) return 'liber';
    const t = info.tip;
    if (t === 'schema' || t === 'data') return t;
    if (t === 'alg' || t === 'form' || t === 'ui' || t === 'list') return t;
    return 'liber';
  }

  function suggestCopySuffix(name) {
    const s = String(name == null ? '' : name).trim();
    if (!s) return '_copy';
    const m = s.match(/^(.*_copy)(\d*)$/i);
    if (m) {
      const n = m[2] ? parseInt(m[2], 10) + 1 : 2;
      return m[1] + String(n);
    }
    return s + '_copy';
  }

  /**
   * Comenzi Redis pentru clone colecție pe cheie nouă (cheie trebuie să nu existe).
   * @param {string} targetKey
   * @param {string} redisType set|hash|list|zset
   * @param {object} snapshot
   * @returns {{ comandaRedis: string[] }[]}
   */
  function buildCollectionCloneCommands(targetKey, redisType, snapshot) {
    if (!targetKey) return [];
    const tip = String(redisType || '');
    const snap = snapshot || {};

    if (tip === 'set') {
      const members = Array.isArray(snap.members) ? snap.members : [];
      return members.map((m) => ({
        comandaRedis: ['SADD', targetKey, String(m)],
      }));
    }
    if (tip === 'hash') {
      const fields = Array.isArray(snap.fields) ? snap.fields : [];
      return fields.map((row) => ({
        comandaRedis: ['HSET', targetKey, String(row.field), String(row.value == null ? '' : row.value)],
      }));
    }
    if (tip === 'list') {
      const items = Array.isArray(snap.items) ? snap.items : [];
      const out = [];
      items.forEach((item) => {
        out.push({ comandaRedis: ['RPUSH', targetKey, String(item)] });
      });
      return out;
    }
    if (tip === 'zset') {
      const entries = Array.isArray(snap.entries) ? snap.entries : [];
      return entries.map((row) => ({
        comandaRedis: ['ZADD', targetKey, String(row.score), String(row.member)],
      }));
    }
    return [];
  }

  const api = {
    TIPURI_COLECTIE,
    esteTipColecțieRedis,
    esteDuplicarePermisa,
    rolCheieNouaDinInfo,
    suggestCopySuffix,
    buildCollectionCloneCommands,
  };

  root.SsideKeyDuplicate = api;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
