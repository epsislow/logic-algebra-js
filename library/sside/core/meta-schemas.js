/**
 * Meta-scheme JSON (pentru tab Formular F2) + seed la creare cheie (F1c / F4l).
 */
(function (root) {
  'use strict';

  const META_ALG = {
    $schema: 'http://json-schema.org/draft-07/schema#',
    title: 'Algorithm',
    type: 'object',
    required: ['v', 'steps'],
    properties: {
      v: { type: 'integer', const: 1, default: 1 },
      name: { type: 'string', default: '' },
      steps: {
        type: 'array',
        default: [],
        items: { type: 'object' },
      },
    },
    additionalProperties: true,
  };

  const META_FORM = {
    $schema: 'http://json-schema.org/draft-07/schema#',
    title: 'Form',
    type: 'object',
    required: ['v'],
    properties: {
      v: { type: 'integer', const: 1, default: 1 },
      title: { type: 'string', default: '' },
      schema: { type: 'string', default: '', description: 'ex: schema:_item' },
      btns: {
        type: 'array',
        default: [],
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            label: { type: 'string' },
            alg: { type: 'string', description: 'ex: alg:_save_item' },
            kind: { type: 'string', description: 'culoare buton Live: blue|red|green|yellow|white|gray|black' },
          },
        },
      },
    },
    additionalProperties: true,
  };

  const META_LIST = {
    $schema: 'http://json-schema.org/draft-07/schema#',
    title: 'List / table',
    type: 'object',
    required: ['v', 'source', 'columns'],
    properties: {
      v: { type: 'integer', const: 1, default: 1 },
      title: { type: 'string', default: '' },
      source: {
        type: 'object',
        default: { from: 'keys', pattern: '*' },
      },
      row: {
        type: 'string',
        enum: ['object', 'array'],
        default: 'object',
      },
      columns: {
        type: 'array',
        default: [{ id: 'c1', label: 'Col', path: 'value' }],
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            label: { type: 'string' },
            path: { type: 'string', description: '_key|_type|_json|câmp; sau omite dacă ai const' },
            const: { description: 'valoare statică pe coloană' },
          },
        },
      },
      pageSize: { type: 'integer', default: 20 },
      autoload: {
        type: 'boolean',
        default: true,
        description: 'false = nu încarcă source la open Live (doar la refresh)',
      },
      btns: { type: 'array', default: [], items: { type: 'object' } },
      rowBtns: { type: 'array', default: [], items: { type: 'object' } },
    },
    additionalProperties: true,
  };

  const META_UI = {
    $schema: 'http://json-schema.org/draft-07/schema#',
    title: 'UI page',
    type: 'object',
    required: ['v'],
    properties: {
      v: { type: 'integer', const: 1, default: 1 },
      title: { type: 'string', default: '' },
      tabs: {
        type: 'array',
        default: [],
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            label: { type: 'string' },
            forms: {
              type: 'array',
              items: { type: 'string' },
              description: 'legacy; prefer blocks',
            },
            blocks: {
              type: 'array',
              items: { type: 'object' },
              description: 'ex: {type,id,list|form}',
            },
          },
        },
      },
    },
    additionalProperties: true,
  };

  function seedAlg(name) {
    return { v: 1, name: name || '', steps: [] };
  }

  function seedForm(title) {
    return { v: 1, title: title || '', schema: '', btns: [] };
  }

  function seedList(title) {
    return {
      v: 1,
      title: title || '',
      source: { from: 'keys', pattern: '*' },
      row: 'object',
      columns: [
        { id: 'key', label: 'Cheie', path: '_key' },
        { id: 'val', label: 'Valoare', path: '_json' },
      ],
      pageSize: 20,
      btns: [],
      rowBtns: [],
    };
  }

  function seedUi(title) {
    return { v: 1, title: title || '', tabs: [] };
  }

  function seedPentruRol(role, displayName) {
    if (role === 'alg') return seedAlg(displayName || '');
    if (role === 'form') return seedForm(displayName || '');
    if (role === 'list') return seedList(displayName || '');
    if (role === 'ui') return seedUi(displayName || '');
    return { v: 1 };
  }

  function metaPentruRol(role) {
    if (role === 'alg') return META_ALG;
    if (role === 'form') return META_FORM;
    if (role === 'list') return META_LIST;
    if (role === 'ui') return META_UI;
    return null;
  }

  const api = {
    META_ALG,
    META_FORM,
    META_LIST,
    META_UI,
    seedAlg,
    seedForm,
    seedList,
    seedUi,
    seedPentruRol,
    metaPentruRol,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  root.SsideMeta = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
