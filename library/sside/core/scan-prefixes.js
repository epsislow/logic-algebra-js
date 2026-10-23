/**
 * Registry Redis scan:prefixes (ZSET) — prefix = path fără ultimul segment.
 * Browser + Node; pe worker logica e inline în extern/worker/src/index.js
 */
(function (root) {
  'use strict';

  const SCAN_PREFIXES_KEY = 'scan:prefixes';

  /**
   * @param {string} key
   * @returns {string|null} ex. mydata:test:blabla → mydata:test:
   */
  function extragePrefixDinCheie(key) {
    const raw = String(key == null ? '' : key);
    if (!raw.includes(':')) return null;
    const parts = raw.split(':');
    while (parts.length && parts[parts.length - 1] === '') parts.pop();
    if (parts.length < 2) return null;
    return parts.slice(0, -1).join(':') + ':';
  }

  function shouldTrackKeyForPrefixes(key) {
    const k = String(key || '');
    if (!k || k === SCAN_PREFIXES_KEY) return false;
    if (k.startsWith('user:') || k.startsWith('session:')) return false;
    return true;
  }

  function normalizeCommandsList(commands) {
    if (!Array.isArray(commands) || !commands.length) return [];
    if (Array.isArray(commands[0])) return commands;
    return [commands];
  }

  /**
   * Din argv Redis: chei create/suprascrise vs șterse.
   * @returns {{ added: string[], deleted: string[] }}
   */
  function collectKeyMutationsFromCommands(commands) {
    const added = [];
    const deleted = [];
    const list = normalizeCommandsList(commands);

    for (let i = 0; i < list.length; i++) {
      const argv = list[i];
      if (!Array.isArray(argv) || !argv.length) continue;
      const cmd = String(argv[0] || '')
        .trim()
        .toUpperCase();
      const a = argv.slice(1);

      if (cmd === 'ZADD' || cmd === 'ZREM') {
        if (a[0] === SCAN_PREFIXES_KEY) continue;
      }

      if (cmd === 'SET' || cmd === 'SETNX' || cmd === 'GETSET') {
        if (a[0] != null) added.push(String(a[0]));
        continue;
      }
      if (cmd === 'SETEX' || cmd === 'PSETEX') {
        if (a[0] != null) added.push(String(a[0]));
        continue;
      }
      if (cmd === 'MSET' || cmd === 'MSETNX') {
        for (let j = 0; j + 1 < a.length; j += 2) {
          added.push(String(a[j]));
        }
        continue;
      }
      if (cmd === 'JSON.SET') {
        if (a[0] != null) added.push(String(a[0]));
        continue;
      }
      if (cmd === 'DEL' || cmd === 'UNLINK') {
        for (let j = 0; j < a.length; j++) deleted.push(String(a[j]));
        continue;
      }
      if (cmd === 'JSON.DEL') {
        const path = a[1] == null ? '$' : String(a[1]);
        if (a[0] != null && (path === '$' || path === '')) {
          deleted.push(String(a[0]));
        }
        continue;
      }
    }

    return {
      added: added.filter(shouldTrackKeyForPrefixes),
      deleted: deleted.filter(shouldTrackKeyForPrefixes),
    };
  }

  function uniqueStrings(arr) {
    const out = [];
    const seen = Object.create(null);
    for (let i = 0; i < arr.length; i++) {
      const s = arr[i];
      if (s == null || seen[s]) continue;
      seen[s] = true;
      out.push(s);
    }
    return out;
  }

  function prefixesFromKeys(keys) {
    const prefs = [];
    for (let i = 0; i < keys.length; i++) {
      const p = extragePrefixDinCheie(keys[i]);
      if (p) prefs.push(p);
    }
    return uniqueStrings(prefs);
  }

  /**
   * SCAN MATCH până la primul hit (sau cursor 0).
   * @param {(argv: any[]) => Promise<any>} exec
   * @param {string} matchPattern
   */
  async function scanHasAnyMatch(exec, matchPattern) {
    let cursor = '0';
    do {
      const res = await exec(['SCAN', cursor, 'MATCH', matchPattern, 'COUNT', '50']);
      const next = res && res[0] != null ? String(res[0]) : '0';
      const keys = res && Array.isArray(res[1]) ? res[1] : [];
      for (let i = 0; i < keys.length; i++) {
        if (String(keys[i]) !== SCAN_PREFIXES_KEY) return true;
      }
      cursor = next;
    } while (cursor !== '0');
    return false;
  }

  /**
   * După comenzi Redis reușite: ZADD prefixe noi; pentru prefixe din DEL → SCAN + ZREM dacă gol.
   * Ordine: întâi ZADD (stare netă vizibilă la SCAN pentru MULTI mixt).
   * @param {(argv: any[]) => Promise<any>} exec
   * @param {any[]} commands
   */
  async function syncScanPrefixesAfterSuccess(exec, commands) {
    const { added, deleted } = collectKeyMutationsFromCommands(commands);
    if (!added.length && !deleted.length) return { zadd: [], zrem: [] };

    const toAdd = prefixesFromKeys(added);
    const zadd = [];
    if (toAdd.length) {
      const argv = ['ZADD', SCAN_PREFIXES_KEY];
      for (let i = 0; i < toAdd.length; i++) {
        argv.push('0', toAdd[i]);
      }
      await exec(argv);
      zadd.push.apply(zadd, toAdd);
    }

    const toCheck = prefixesFromKeys(deleted);
    const zrem = [];
    for (let i = 0; i < toCheck.length; i++) {
      const prefix = toCheck[i];
      const still = await scanHasAnyMatch(exec, prefix + '*');
      if (!still) {
        await exec(['ZREM', SCAN_PREFIXES_KEY, prefix]);
        zrem.push(prefix);
      }
    }

    return { zadd, zrem };
  }

  const api = {
    SCAN_PREFIXES_KEY,
    extragePrefixDinCheie,
    shouldTrackKeyForPrefixes,
    normalizeCommandsList,
    collectKeyMutationsFromCommands,
    prefixesFromKeys,
    scanHasAnyMatch,
    syncScanPrefixesAfterSuccess,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  root.SsideScanPrefixes = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
