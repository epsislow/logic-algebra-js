'use strict';

/** Regenerare mmed-import-data.js după modificări prog-bundle.js */
const fs = require('fs');
const path = require('path');
const Bundle = require('./prog-bundle.js');

const out = path.join(__dirname, 'mmed-import-data.js');
const body =
  '/* generat: node extern/mmed/build-import-data.js */\nwindow.MMED_IMPORT_KEYS = ' +
  JSON.stringify(Bundle.KEYS, null, 0) +
  ';\n';
fs.writeFileSync(out, body, 'utf8');
console.log('Scris', out, Object.keys(Bundle.KEYS).length, 'chei');
