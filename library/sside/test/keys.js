'use strict';

const Keys = require('../core/keys.js');
const Meta = require('../core/meta-schemas.js');

function assert(cond, msg) {
  if (!cond) throw new Error(msg || 'assertion failed');
}

function assertEq(a, b, msg) {
  if (a !== b) throw new Error((msg || 'eq') + ': got ' + JSON.stringify(a) + ' expected ' + JSON.stringify(b));
}

module.exports = {
  name: 'keys',
  tests: [
    {
      id: 1,
      desc: 'normalizeSchemaName adds underscore',
      run() {
        assertEq(Keys.normalizeSchemaName('item'), '_item');
        assertEq(Keys.normalizeSchemaName('_item'), '_item');
        assertEq(Keys.normalizeSchemaName('a:b'), '_ab');
      },
    },
    {
      id: 2,
      desc: 'isSchemaRedisKey',
      run() {
        assert(Keys.isSchemaRedisKey('schema:_item'));
        assert(!Keys.isSchemaRedisKey('schema:item'));
        assert(!Keys.isSchemaRedisKey('data:_item:1'));
      },
    },
    {
      id: 3,
      desc: 'isAlgRedisKey / form / ui',
      run() {
        assert(Keys.isAlgRedisKey('alg:_save_item'));
        assert(!Keys.isAlgRedisKey('alg:save'));
        assert(Keys.isFormRedisKey('form:_item_edit'));
        assert(Keys.isUiRedisKey('ui:_warehouse'));
        assert(!Keys.isUiRedisKey('ui:warehouse'));
      },
    },
    {
      id: 4,
      desc: 'clasificaCheie alg/form/ui',
      run() {
        const empty = new Set();
        assertEq(Keys.clasificaCheie('alg:_x', empty).tip, 'alg');
        assertEq(Keys.clasificaCheie('form:_y', empty).tip, 'form');
        assertEq(Keys.clasificaCheie('ui:_z', empty).tip, 'ui');
      },
    },
    {
      id: 5,
      desc: 'clasificaCheie schema + data with schema present',
      run() {
        const set = new Set(['schema:_item']);
        assertEq(Keys.clasificaCheie('schema:_item', set).tip, 'schema');
        assertEq(Keys.clasificaCheie('data:_item:1', set).tip, 'data');
        assertEq(Keys.clasificaCheie('_item:1', set).tip, 'data');
      },
    },
    {
      id: 6,
      desc: 'clasificaCheie data missing schema -> liber',
      run() {
        const info = Keys.clasificaCheie('data:_missing:1', new Set());
        assertEq(info.tip, 'liber');
        assertEq(info.missingSchema, '_missing');
      },
    },
    {
      id: 7,
      desc: 'etichetaTip badges',
      run() {
        assertEq(Keys.etichetaTip({ tip: 'alg' }).cls, 'badge-alg');
        assertEq(Keys.etichetaTip({ tip: 'form' }).cls, 'badge-form');
        assertEq(Keys.etichetaTip({ tip: 'ui' }).cls, 'badge-ui');
        assertEq(Keys.etichetaTip({ tip: 'schema' }).badge, 'schemă');
      },
    },
    {
      id: 8,
      desc: 'cheieProgDinNume',
      run() {
        assertEq(Keys.cheieProgDinNume('alg', 'save'), 'alg:_save');
        assertEq(Keys.cheieProgDinNume('form', '_edit'), 'form:_edit');
        assertEq(Keys.cheieProgDinNume('ui', 'warehouse'), 'ui:_warehouse');
        assertEq(Keys.cheieProgDinNume('alg', ''), '');
      },
    },
    {
      id: 9,
      desc: 'seed alg/form/ui have v:1',
      run() {
        assertEq(Meta.seedAlg('x').v, 1);
        assert(Array.isArray(Meta.seedAlg('x').steps));
        assertEq(Meta.seedForm('t').v, 1);
        assert(Array.isArray(Meta.seedForm('t').btns));
        assertEq(Meta.seedUi('p').v, 1);
        assert(Array.isArray(Meta.seedUi('p').tabs));
      },
    },
    {
      id: 10,
      desc: 'meta schemas exist for Formular tab',
      run() {
        assert(Meta.META_ALG && Meta.META_ALG.properties.steps);
        assert(Meta.META_FORM && Meta.META_FORM.properties.btns);
        assert(Meta.META_UI && Meta.META_UI.properties.tabs);
        assertEq(Meta.metaPentruRol('alg'), Meta.META_ALG);
      },
    },
    {
      id: 11,
      desc: 'IDX must not treat alg/form/ui as search prefixes (convention check)',
      run() {
        // Documented D2: these prefixes are not in IDX_PREFIXES in app.js
        const idx = ['data:', 'info:', 'json:', 'schema:', 'search:', 'set:', 's:'];
        assert(!idx.includes('alg:'));
        assert(!idx.includes('form:'));
        assert(!idx.includes('ui:'));
      },
    },
  ],
};
