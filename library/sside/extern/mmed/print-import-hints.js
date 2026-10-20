'use strict';

/** Listează cheile din prog-bundle (import manual în sside Edit). */
const Bundle = require('./prog-bundle.js');

console.log('Chei mmed v1 de creat în Redis (JSON.SET):\n');
for (const key of Object.keys(Bundle.KEYS).sort()) {
  console.log('  ' + key);
}
console.log('\nFără Apache:');
console.log('  1) file:///.../extern/mmed/mmed-import.html — login + import');
console.log('  2) file:///.../sside/index.html — ui:_mmed → Live');
console.log('\nCLI (Node): node extern/mmed/seed-upstash.js <user> <parola>');
console.log('Teste: node node/run_tests.js mmed-flow mmed');
