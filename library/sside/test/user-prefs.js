'use strict';

const Prefs = require('../core/user-prefs.js');
const SF = require('../core/scan-filter.js');

function assertEq(a, b, msg) {
  if (a !== b) throw new Error((msg || 'eq') + ': ' + JSON.stringify(a) + ' !== ' + JSON.stringify(b));
}

module.exports = {
  name: 'user-prefs',
  tests: [
    {
      id: 1,
      desc: 'normalizeFontScale',
      run() {
        assertEq(Prefs.normalizeFontScale('m'), 'm');
        assertEq(Prefs.normalizeFontScale(''), 's');
        assertEq(Prefs.normalizeFontScale('xl'), 's');
      },
    },
    {
      id: 2,
      desc: 'parseScanLimit/Batch',
      run() {
        assertEq(Prefs.parseScanLimit('2000', 50000), 2000);
        assertEq(Prefs.parseScanLimit('-1', 50000), 50000);
        assertEq(Prefs.parseScanLimit('999999', 50000), 50000);
        assertEq(Prefs.parseScanBatch('50', 100), 50);
        assertEq(Prefs.parseScanBatch('0', 100), 100);
      },
    },
    {
      id: 3,
      desc: 'readFromStorage + prefsToStorageEntries',
      run() {
        const p = Prefs.readFromStorage((k) => {
          if (k === Prefs.KEYS.theme) return 'dark';
          if (k === Prefs.KEYS.listareType) return '1';
          if (k === Prefs.KEYS.scanLimit) return '3000';
          return null;
        });
        assertEq(p.theme, 'dark');
        assertEq(p.listareType, true);
        assertEq(p.scanLimit, 3000);
        const entries = Prefs.prefsToStorageEntries(p);
        assertEq(entries[Prefs.KEYS.theme], 'dark');
        assertEq(entries[Prefs.KEYS.listareType], '1');
      },
    },
    {
      id: 4,
      desc: 'syncScanFilterModule via setScanDefaults',
      run() {
        SF.resetScanDefaults();
        Prefs.syncScanFilterModule({ scanLimit: 1200, scanBatch: 40 });
        const parsed = SF.parseScanFilter('>data:*');
        assertEq(parsed.limitEffective, 1200);
        assertEq(parsed.batchEffective, 40);
        SF.resetScanDefaults();
      },
    },
  ],
};
