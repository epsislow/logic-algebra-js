/**
 * Dosare — un nivel de explorare pe prefix (:).
 */
(function (root) {
  'use strict';

  var Nav =
    typeof module !== 'undefined' && module.exports
      ? require('./key-colon-nav.js')
      : root.SsideKeyColonNav;

  function listLevel(sortedKeys, pathSegments) {
    if (!Nav) {
      return { folders: [], keys: [] };
    }
    const path = (pathSegments || []).slice();
    const folderMap = Object.create(null);
    const keys = [];

    (sortedKeys || []).forEach((raw) => {
      const fullKey = String(raw);
      if (!Nav.cheieInDosar(fullKey, path)) return;

      const rest = Nav.restDupaPrefix(fullKey, path);
      if (rest === null) return;

      if (rest === '') {
        keys.push({ fullKey });
        return;
      }

      if (Nav.cheieCuColonFinal(fullKey)) {
        keys.push({ fullKey });
        return;
      }

      const parts = rest.split(':');
      const first = parts[0];
      if (!first) return;

      if (parts.length === 1) {
        keys.push({ fullKey });
        return;
      }

      if (!folderMap[first]) {
        folderMap[first] = { label: first, prefixSegments: path.concat([first]) };
      }
    });

    const folders = Object.keys(folderMap)
      .sort((a, b) => a.localeCompare(b))
      .map((k) => folderMap[k]);

    keys.sort((a, b) => a.fullKey.localeCompare(b.fullKey));

    return { folders, keys };
  }

  /** Scade nivel din path cât timp listLevel e gol (path invalid). */
  function listLevelClamped(sortedKeys, pathSegments) {
    let path = (pathSegments || []).slice();
    let level = listLevel(sortedKeys, path);
    while (path.length && !level.folders.length && !level.keys.length) {
      path.pop();
      level = listLevel(sortedKeys, path);
    }
    return { pathSegments: path, folders: level.folders, keys: level.keys };
  }

  const api = { listLevel, listLevelClamped };

  root.SsideKeyListFolder = api;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
