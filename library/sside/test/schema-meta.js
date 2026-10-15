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
      desc: 'readStringUiFromSchema roundtrip',
      run() {
        const cfg = Meta.readStringUiFromSchema(
          { type: 'string', format: 'textarea', options: { input_height: '280px' } },
          { type: 'string', key: 'content' }
        );
        assertEq(cfg.string_format, 'textarea');
        assertEq(cfg.string_format_height, '280px');
      },
    },
  ],
};
