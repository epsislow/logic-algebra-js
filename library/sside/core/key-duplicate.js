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
    if (t === 'alg' || t === 'form' || t === 'ui' || t === 'list' || t === 'cron') return t;
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
  function esteDuplicareMembruPermisa(ctx) {
    ctx = ctx || {};
    if (ctx.isSearchIndex || ctx.isSystem || ctx.panelUnsupported) return false;
    const tip = ctx.redisTip == null ? '' : String(ctx.redisTip);
    if (tip === 'set') {
      return ctx.setMembruEditIndex != null && ctx.setMembruEditIndex !== -1;
    }
    if (tip === 'hash' || tip === 'list' || tip === 'zset') {
      return ctx.colEditIndex != null && ctx.colEditIndex !== -1;
    }
    return false;
  }

  function normalizeTipRedisMember(tip) {
    const t = String(tip == null ? '' : tip).toLowerCase();
    if (t === 'zset' || t === 'sorted set') return 'zset';
    return t;
  }

  /**
   * v2.1 — destinația trebuie să existe și același tip ca sursa.
   * @param {string} sourceType
   * @param {string} destType — TYPE Redis sau 'none'
   * @param {boolean} destExists
   */
  function validateMemberDuplicateDestination(sourceType, destType, destExists) {
    const s = normalizeTipRedisMember(sourceType);
    if (!destExists) {
      return { ok: false, err: 'Cheia destinație nu există. Creează containerul (ex. Duplică cheie) sau alege o cheie existentă.' };
    }
    const d = normalizeTipRedisMember(destType);
    if (d === 'none' || d === 'unknown' || !d) {
      return { ok: false, err: 'Cheia destinație nu există.' };
    }
    if (s !== d) {
      return { ok: false, err: 'Tip Redis diferit: sursă ' + s + ', destinație ' + d + '.' };
    }
    return { ok: true };
  }

  /**
   * @param {string} redisType
   * @param {object} spec
   * @param {object} [opts] — members[], fields[], entries[] pentru același container
   * @returns {{ ok: boolean, err?: string, needsConfirm?: boolean, confirmMsg?: string }}
   */
  function evaluateMemberDuplicateConflict(redisType, spec, opts) {
    opts = opts || {};
    spec = spec || {};
    const tip = normalizeTipRedisMember(redisType);

    if (tip === 'set') {
      const members = Array.isArray(opts.members) ? opts.members : [];
      const val = String(spec.value == null ? '' : spec.value);
      if (members.indexOf(val) !== -1) {
        return { ok: false, err: 'Membrul există deja în Set (unicitate Redis). Schimbă valoarea.' };
      }
      return { ok: true };
    }
    if (tip === 'hash') {
      const field = String(spec.field == null ? '' : spec.field).trim();
      if (!field) return { ok: false, err: 'Completează numele câmpului.' };
      const fields = Array.isArray(opts.fields) ? opts.fields : [];
      const exista = fields.some((row) => String(row.field) === field);
      if (exista) {
        return {
          ok: true,
          needsConfirm: true,
          confirmMsg: 'Câmpul „' + field + '” există deja. Suprascrii valoarea?',
        };
      }
      return { ok: true };
    }
    if (tip === 'list') {
      return { ok: true };
    }
    if (tip === 'zset') {
      const member = String(spec.member == null ? '' : spec.member);
      if (!member) return { ok: false, err: 'Completează member-ul.' };
      const score = spec.score;
      if (score == null || score === '' || !Number.isFinite(Number(score))) {
        return { ok: false, err: 'Score invalid.' };
      }
      const entries = Array.isArray(opts.entries) ? opts.entries : [];
      const exista = entries.some((row) => String(row.member) === member);
      if (exista) {
        return {
          ok: true,
          needsConfirm: true,
          confirmMsg: 'Membrul „' + member + '” există deja în Sorted Set. Suprascrii score/valoarea?',
        };
      }
      return { ok: true };
    }
    return { ok: false, err: 'Tip Redis nesuportat: ' + tip };
  }

  /**
   * O singură comandă Redis pentru duplicare membru/item.
   * @param {string} targetKey
   * @param {string} redisType set|hash|list|zset
   * @param {object} spec — set: { value }; hash: { field, value }; list: { value }; zset: { score, member }
   */
  function buildMemberDuplicateCommand(targetKey, redisType, spec) {
    if (!targetKey) return null;
    const tip = normalizeTipRedisMember(redisType);
    spec = spec || {};

    if (tip === 'set') {
      return { comandaRedis: ['SADD', targetKey, String(spec.value == null ? '' : spec.value)] };
    }
    if (tip === 'hash') {
      return {
        comandaRedis: [
          'HSET',
          targetKey,
          String(spec.field == null ? '' : spec.field),
          String(spec.value == null ? '' : spec.value),
        ],
      };
    }
    if (tip === 'list') {
      return { comandaRedis: ['RPUSH', targetKey, String(spec.value == null ? '' : spec.value)] };
    }
    if (tip === 'zset') {
      return {
        comandaRedis: ['ZADD', targetKey, String(spec.score), String(spec.member == null ? '' : spec.member)],
      };
    }
    return null;
  }

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
    esteDuplicareMembruPermisa,
    normalizeTipRedisMember,
    validateMemberDuplicateDestination,
    evaluateMemberDuplicateConflict,
    buildMemberDuplicateCommand,
    rolCheieNouaDinInfo,
    suggestCopySuffix,
    buildCollectionCloneCommands,
  };

  root.SsideKeyDuplicate = api;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
