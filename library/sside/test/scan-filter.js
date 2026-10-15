'use strict';

const SF = require('../core/scan-filter.js');

function assert(cond, msg) {
  if (!cond) throw new Error(msg || 'assertion failed');
}

function assertEq(a, b, msg) {
  if (a !== b) throw new Error((msg || 'eq') + ': ' + JSON.stringify(a) + ' !== ' + JSON.stringify(b));
}

module.exports = {
  name: 'scan-filter',
  tests: [
    {
      id: 1,
      desc: 'isScanFilter',
      run() {
        assert(SF.isScanFilter('>data:*'));
        assert(!SF.isScanFilter('data:*'));
        assert(!SF.isScanFilter('=x'));
      },
    },
    {
      id: 2,
      desc: 'parse pattern + default limit/batch',
      run() {
        SF.resetScanDefaults();
        const p = SF.parseScanFilter('>data:*');
        assertEq(p.pattern, 'data:*');
        assertEq(p.limitEffective, 50000);
        assertEq(p.batchEffective, 100);
        assert(!p.userSpecified.limit);
        assert(!p.userSpecified.batch);
      },
    },
    {
      id: 3,
      desc: 'parse limit:0',
      run() {
        const p = SF.parseScanFilter('>data:* limit:0');
        assertEq(p.limitEffective, 0);
        assert(p.userSpecified.limit);
      },
    },
    {
      id: 4,
      desc: 'parse token order + type + timeout',
      run() {
        const p = SF.parseScanFilter('>x:* timeout:5000 type:string limit:100 batch:50');
        assertEq(p.pattern, 'x:*');
        assertEq(p.limitEffective, 100);
        assertEq(p.batchEffective, 50);
        assertEq(p.type, 'string');
        assertEq(p.timeout, 5000);
      },
    },
    {
      id: 5,
      desc: 'normalizeScanFilterForSave materialize limit/batch',
      run() {
        SF.resetScanDefaults();
        assertEq(SF.normalizeScanFilterForSave('>data:*'), '>data:* limit:50000 batch:100');
        assertEq(
          SF.normalizeScanFilterForSave('>data:* limit:1000'),
          '>data:* limit:1000 batch:100'
        );
        assertEq(
          SF.normalizeScanFilterForSave('>data:* type:hash batch:200'),
          '>data:* limit:50000 batch:200 type:hash'
        );
      },
    },
    {
      id: 6,
      desc: 'normalize nu adaugă timeout dacă lipsește',
      run() {
        const s = SF.normalizeScanFilterForSave('>a:* type:set timeout:999');
        assert(s.indexOf('timeout:999') !== -1);
        assert(SF.normalizeScanFilterForSave('>a:* type:set').indexOf('timeout:') === -1);
      },
    },
    {
      id: 7,
      desc: 'canonFilterForCompare',
      run() {
        SF.resetScanDefaults();
        assertEq(SF.canonFilterForCompare('>data:*'), '>data:* limit:50000 batch:100');
        assertEq(SF.canonFilterForCompare('*'), '*');
      },
    },
    {
      id: 8,
      desc: 'setScanDefaults user limit/batch',
      run() {
        SF.resetScanDefaults();
        SF.setScanDefaults({ limit: 2500, batch: 25 });
        const p = SF.parseScanFilter('>x:*');
        assertEq(p.limitEffective, 2500);
        assertEq(p.batchEffective, 25);
        assertEq(SF.normalizeScanFilterForSave('>x:*'), '>x:* limit:2500 batch:25');
        SF.resetScanDefaults();
      },
    },
  ],
};
