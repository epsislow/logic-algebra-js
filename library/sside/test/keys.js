'use strict';

require('../core/badge-catalog.js');
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
      desc: 'isAlgRedisKey / form / ui / list',
      run() {
        assert(Keys.isListRedisKey('list:_stock'));
        assert(!Keys.isListRedisKey('list:stock'));
        assert(Keys.isAlgRedisKey('alg:_save_item'));
        assert(!Keys.isAlgRedisKey('alg:save'));
        assert(Keys.isFormRedisKey('form:_item_edit'));
        assert(Keys.isUiRedisKey('ui:_warehouse'));
        assert(!Keys.isUiRedisKey('ui:warehouse'));
      },
    },
    {
      id: 4,
      desc: 'clasificaCheie alg/form/ui/list',
      run() {
        const empty = new Set();
        assertEq(Keys.clasificaCheie('alg:_x', empty).tip, 'alg');
        assertEq(Keys.clasificaCheie('form:_y', empty).tip, 'form');
        assertEq(Keys.clasificaCheie('ui:_z', empty).tip, 'ui');
        assertEq(Keys.clasificaCheie('list:_stock', empty).tip, 'list');
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
      desc: 'clasificaCheie data:_ fără schema în set -> tot data',
      run() {
        const info = Keys.clasificaCheie('data:_missing:1', new Set());
        assertEq(info.tip, 'data');
        assertEq(info.schemaKey, 'schema:_missing');
        assertEq(info.schemaInSet, false);
      },
    },
    {
      id: 7,
      desc: 'etichetaTip badges',
      run() {
        assertEq(Keys.etichetaTip({ tip: 'alg' }).cls, 'badge-alg');
        assertEq(Keys.etichetaTip({ tip: 'form' }).cls, 'badge-form');
        assertEq(Keys.etichetaTip({ tip: 'ui' }).cls, 'badge-ui');
        assertEq(Keys.etichetaTip({ tip: 'list' }).cls, 'badge-list');
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
        assertEq(Keys.cheieProgDinNume('list', 'stock'), 'list:_stock');
        assertEq(Keys.cheieProgDinNume('alg', ''), '');
      },
    },
    {
      id: 9,
      desc: 'seed alg/form/ui/list have v:1',
      run() {
        assertEq(Meta.seedAlg('x').v, 1);
        assert(Array.isArray(Meta.seedAlg('x').steps));
        assertEq(Meta.seedForm('t').v, 1);
        assert(Array.isArray(Meta.seedForm('t').btns));
        assertEq(Meta.seedUi('p').v, 1);
        assert(Array.isArray(Meta.seedUi('p').tabs));
        assertEq(Meta.seedList('L').v, 1);
        assert(Array.isArray(Meta.seedList('L').columns));
      },
    },
    {
      id: 10,
      desc: 'meta schemas exist for Formular tab',
      run() {
        assert(Meta.META_ALG && Meta.META_ALG.properties.steps);
        assert(Meta.META_FORM && Meta.META_FORM.properties.btns);
        assert(Meta.META_UI && Meta.META_UI.properties.tabs);
        assert(Meta.META_LIST && Meta.META_LIST.properties.columns);
        assertEq(Meta.metaPentruRol('alg'), Meta.META_ALG);
        assertEq(Meta.metaPentruRol('list'), Meta.META_LIST);
      },
    },
    {
      id: 12,
      desc: 'clasificaCheie prefix log/info/json/search/set/s + etichetaTip rowTint',
      run() {
        const empty = new Set();
        assertEq(Keys.clasificaCheie('queue:jobs', empty).tip, 'queue');
        assertEq(Keys.etichetaTip({ tip: 'queue' }).badge, 'queue');
        assertEq(Keys.etichetaTip({ tip: 'queue' }).cls, 'badge-queue');
        assertEq(Keys.clasificaCheie('stack:undo', empty).tip, 'stack');
        assertEq(Keys.clasificaCheie('events:orders', empty).tip, 'events');
        assertEq(Keys.clasificaCheie('cache:myValuesHere', empty).tip, 'cache');
        assertEq(Keys.clasificaDosar([], 'cache', empty).tip, 'cache');
        assertEq(Keys.clasificaCheie('log:test', empty).tip, 'log');
        assertEq(Keys.etichetaTip({ tip: 'log' }).cls, 'badge-log');
        assertEq(Keys.etichetaTip({ tip: 'log' }).rowTint, 'key-row--log');
        assertEq(Keys.clasificaCheie('info:_x', empty).tip, 'info');
        assertEq(Keys.clasificaCheie('json:_y', empty).tip, 'json');
        assertEq(Keys.clasificaCheie('search:idx', empty).tip, 'search');
        assertEq(Keys.clasificaCheie('set:_loc', empty).tip, 'set');
        assertEq(Keys.clasificaCheie('s:tag', empty).tip, 's');
        assertEq(Keys.etichetaTip({ tip: 'liber' }).rowTint, undefined);
        assertEq(Keys.etichetaTip({ tip: 'form' }).rowTint, 'key-row--form');
        assertEq(Keys.etichetaTip({ tip: 'liber', sistem: true }).rowTint, 'key-row--admin');
        assertEq(Keys.clasificaCheie('settings:admin', new Set()).sistem, true);
        assert(Keys.isCheieSearchIndexRedisKey('idx_search_tags'));
        assert(!Keys.isCheieSearchIndexRedisKey('search:idx'));
        assertEq(Keys.clasificaCheie('idx_search_tags', new Set()).sistem, true);
        assertEq(Keys.etichetaTip({ tip: 'liber', sistem: true }).cls, 'badge-admin');
        assert(Keys.isScanPrefixesRedisKey('scan:prefixes'));
        assert(!Keys.isScanPrefixesRedisKey('scan:other'));
        assert(Keys.isCheieSistemAscunsa('scan:prefixes'));
        assertEq(Keys.clasificaCheie('scan:prefixes', new Set()).sistem, true);
      },
    },
    {
      id: 13,
      desc: 'data:_ — tip data indiferent de schema: în set',
      run() {
        const doarData = new Set(['data:_stock:AAA:A1']);
        const cuSchema = new Set(['data:_stock:AAA:A1', 'schema:_stock']);
        const a = Keys.clasificaCheie('data:_stock:AAA:A1', doarData);
        const b = Keys.clasificaCheie('data:_stock:AAA:A1', cuSchema);
        assertEq(a.tip, 'data');
        assertEq(b.tip, 'data');
        assertEq(a.schemaInSet, false);
        assertEq(b.schemaInSet, true);
      },
    },
    {
      id: 12,
      desc: 'clasificaDosar — prefix rădăcină și imbricat',
      run() {
        const set = new Set(['schema:_item']);
        assertEq(Keys.clasificaDosar([], 'schema', set).tip, 'schema');
        assertEq(Keys.clasificaDosar([], 'data', set).tip, 'data');
        assertEq(Keys.clasificaDosar([], 'settings', set).sistem, true);
        assertEq(Keys.clasificaDosar(['data'], '_item', set).tip, 'data');
        const et = Keys.etichetaTip(Keys.clasificaDosar([], 'settings', set));
        assertEq(et.cls, 'badge-admin');
      },
    },
    {
      id: 12,
      desc: 'cron config vs aux keys',
      run() {
        assert(Keys.isCronRedisKey('cron:sync'));
        assert(!Keys.isCronRedisKey('cron:state:sync'));
        assert(Keys.isCronAuxRedisKey('cron:state:sync'));
        assert(Keys.isCronStateRedisKey('cron:state:testPing'));
        assert(!Keys.isCheieSistemAscunsa('cron:state:testPing'));
        assert(Keys.isCheieSistemAscunsa('cron:lock:testPing'));
        const stInfo = Keys.clasificaCheie('cron:state:testPing', new Set());
        assert(stInfo.cronState === true);
        assertEq(stInfo.cronKey, 'cron:testPing');
        const stLbl = Keys.etichetaTip(stInfo);
        assertEq(stLbl.badge, 'cronst');
        assertEq(stLbl.cls, 'badge-cron-state');
        assertEq(Keys.clasificaCheie('cron:sync', new Set()).tip, 'cron');
        assertEq(Keys.cheieProgDinNume('cron', 'sync_stoc'), 'cron:sync_stoc');
      },
    },
    {
      id: 11,
      desc: 'IDX must not treat alg/form/ui/list as search prefixes (convention check)',
      run() {
        // Documented D2: these prefixes are not in IDX_PREFIXES in app.js
        const idx = ['data:', 'info:', 'json:', 'schema:', 'search:', 'set:', 's:'];
        assert(!idx.includes('alg:'));
        assert(!idx.includes('form:'));
        assert(!idx.includes('ui:'));
        assert(!idx.includes('list:'));
      },
    },
  ],
};
