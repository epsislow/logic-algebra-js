'use strict';

/**
 * Generează ui/js/doc-data_generated.js din doc/index.json + doc/*.md
 *
 * Usage: node node/gen_doc_data.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DOC_DIR = path.join(ROOT, 'doc');
const OUT = path.join(ROOT, 'ui', 'js', 'doc-data_generated.js');

function main() {
  const indexPath = path.join(DOC_DIR, 'index.json');
  if (!fs.existsSync(indexPath)) {
    console.error('Missing', indexPath);
    process.exit(1);
  }
  const index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
  const sections = Array.isArray(index.sections) ? index.sections : [];
  const outSections = [];

  for (const sec of sections) {
    const file = sec.file;
    if (!file) {
      console.error('Section without file:', sec.id);
      process.exit(1);
    }
    const mdPath = path.join(DOC_DIR, file);
    if (!fs.existsSync(mdPath)) {
      console.error('Missing md:', mdPath);
      process.exit(1);
    }
    const markdown = fs.readFileSync(mdPath, 'utf8');
    outSections.push({
      id: sec.id,
      label: sec.label || sec.id,
      file,
      markdown,
    });
  }

  const payload = {
    title: index.title || 'sside docs',
    generatedAt: new Date().toISOString(),
    sections: outSections,
  };

  const body =
    '/** GENERAT — nu edita. Rulează: node node/gen_doc_data.js */\n' +
    '(function (root) {\n' +
    "  'use strict';\n" +
    '  root.SsideDocData = ' +
    JSON.stringify(payload, null, 2) +
    ';\n' +
    '  if (typeof module !== "undefined" && module.exports) {\n' +
    '    module.exports = root.SsideDocData;\n' +
    '  }\n' +
    '})(typeof globalThis !== "undefined" ? globalThis : this);\n';

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, body, 'utf8');
  console.log('Wrote', path.relative(ROOT, OUT), '(' + outSections.length + ' sections)');
}

main();
