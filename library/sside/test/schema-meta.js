'use strict';

const Meta = require('../core/schema-meta.js');

function assertEq(a, b, msg) {
  if (a !== b) throw new Error((msg || 'eq') + ': ' + JSON.stringify(a) + ' !== ' + JSON.stringify(b));
}

module.exports = {
  name: 'schema-meta',
  tests: [
    {
      id: 1,
      desc: 'applyStringUiToSchema textarea + height',
      run() {
        const sn = Meta.applyStringUiToSchema(
          { type: 'string', string_format: 'textarea', string_format_height: '200px' },
          { type: 'string', title: 'Content' }
        );
        assertEq(sn.format, 'textarea');
        assertEq(sn.options.input_height, '200px');
      },
    },
    {
      id: 2,
      desc: 'applyStringUiToSchema input — fără format',
      run() {
        const sn = Meta.applyStringUiToSchema(
          { type: 'string', string_format: 'input' },
          { type: 'string', title: 'Path' }
        );
        assertEq(sn.format, undefined);
      },
    },
    {
      id: 3,
      desc: 'readStringUiFromSchema textarea roundtrip',
      run() {
        const cfg = Meta.readStringUiFromSchema(
          { type: 'string', format: 'textarea', options: { input_height: '280px' } },
          { type: 'string', key: 'content' }
        );
        assertEq(cfg.string_format, 'textarea');
        assertEq(cfg.string_format_height, '280px');
      },
    },
    {
      id: 4,
      desc: 'apply/read date-time și datetime-local',
      run() {
        let sn = Meta.applyStringUiToSchema(
          { type: 'string', string_format: 'date-time' },
          { type: 'string', title: 'At' }
        );
        assertEq(sn.format, 'date-time');
        sn = Meta.applyStringUiToSchema(
          { type: 'string', string_format: 'datetime-local' },
          { type: 'string', title: 'Local' }
        );
        assertEq(sn.format, 'datetime-local');
        const cfg = Meta.readStringUiFromSchema({ type: 'string', format: 'date' }, { type: 'string' });
        assertEq(cfg.string_format, 'date');
      },
    },
    {
      id: 6,
      desc: 'prepareSchemaForJsonEditor: date-time → datetime-local',
      run() {
        const sch = {
          type: 'object',
          properties: {
            created: { type: 'string', format: 'date-time' },
            path: { type: 'string' },
          },
        };
        Meta.prepareSchemaForJsonEditor(sch);
        assertEq(sch.properties.created.format, 'datetime-local');
        assertEq(sch.properties.path.format, undefined);
      },
    },
    {
      id: 5,
      desc: 'format necunoscut → input în meta-editor',
      run() {
        const cfg = Meta.readStringUiFromSchema({ type: 'string', format: 'email' }, { type: 'string' });
        assertEq(cfg.string_format, 'input');
      },
    },
  ],
};
