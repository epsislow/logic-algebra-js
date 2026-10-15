/**
 * Meta-editor scheme: mapare string input ↔ format JSON Schema (JSONEditor).
 */
(function (root) {
  'use strict';

  const STRING_UI_INPUT = 'input';
  const STRING_UI_TEXTAREA = 'textarea';

  /** Valori format JSON Schema suportate în meta-editor (aliniat JSONEditor). */
  const STRING_UI_DATE = 'date';
  const STRING_UI_TIME = 'time';
  const STRING_UI_DATE_TIME = 'date-time';
  const STRING_UI_DATETIME_LOCAL = 'datetime-local';

  const JSONEDITOR_STRING_FORMATS = [
    STRING_UI_DATE,
    STRING_UI_TIME,
    STRING_UI_DATE_TIME,
    STRING_UI_DATETIME_LOCAL,
    STRING_UI_TEXTAREA,
  ];

  function isJsonEditorStringFormat(fmt) {
    return JSONEDITOR_STRING_FORMATS.indexOf(fmt) !== -1;
  }

  function applyStringUiToSchema(node, schemaNode) {
    if (!schemaNode || schemaNode.type !== 'string' || !node) return schemaNode;
    const ui = node.string_format == null ? STRING_UI_INPUT : String(node.string_format);

    if (ui === STRING_UI_INPUT) {
      return schemaNode;
    }

    if (ui === STRING_UI_TEXTAREA) {
      schemaNode.format = 'textarea';
      const h = String(node.string_format_height == null ? '' : node.string_format_height).trim();
      if (h) {
        schemaNode.options = { input_height: h };
      }
      return schemaNode;
    }

    if (isJsonEditorStringFormat(ui)) {
      schemaNode.format = ui;
    }
    return schemaNode;
  }

  /**
   * JSONEditor (vendor) recunoaște doar date | time | datetime-local, nu date-time (JSON Schema).
   * Mută schema in-place pentru randare formular; în Redis rămâne formatul original.
   */
  function prepareSchemaForJsonEditor(node) {
    if (!node || typeof node !== 'object') return node;
    if (Array.isArray(node)) {
      node.forEach(prepareSchemaForJsonEditor);
      return node;
    }
    if (node.type === 'string' && node.format === STRING_UI_DATE_TIME) {
      node.format = STRING_UI_DATETIME_LOCAL;
    }
    if (node.properties && typeof node.properties === 'object') {
      Object.keys(node.properties).forEach((k) => prepareSchemaForJsonEditor(node.properties[k]));
    }
    if (node.patternProperties && typeof node.patternProperties === 'object') {
      Object.keys(node.patternProperties).forEach((k) =>
        prepareSchemaForJsonEditor(node.patternProperties[k])
      );
    }
    if (node.items) {
      if (Array.isArray(node.items)) node.items.forEach(prepareSchemaForJsonEditor);
      else prepareSchemaForJsonEditor(node.items);
    }
    if (node.additionalProperties && typeof node.additionalProperties === 'object') {
      prepareSchemaForJsonEditor(node.additionalProperties);
    }
    ['definitions', '$defs'].forEach((key) => {
      if (node[key] && typeof node[key] === 'object') {
        Object.keys(node[key]).forEach((k) => prepareSchemaForJsonEditor(node[key][k]));
      }
    });
    ['allOf', 'anyOf', 'oneOf'].forEach((key) => {
      if (Array.isArray(node[key])) node[key].forEach(prepareSchemaForJsonEditor);
    });
    return node;
  }

  function readStringUiFromSchema(schemaNod, nodConfig) {
    if (!nodConfig || schemaNod.type !== 'string') return nodConfig;
    const fmt = schemaNod.format == null ? '' : String(schemaNod.format);

    if (fmt === 'textarea') {
      nodConfig.string_format = STRING_UI_TEXTAREA;
      if (schemaNod.options && schemaNod.options.input_height) {
        nodConfig.string_format_height = String(schemaNod.options.input_height);
      }
      return nodConfig;
    }

    if (fmt && isJsonEditorStringFormat(fmt)) {
      nodConfig.string_format = fmt;
      return nodConfig;
    }

    nodConfig.string_format = STRING_UI_INPUT;
    return nodConfig;
  }

  const api = {
    STRING_UI_INPUT,
    STRING_UI_TEXTAREA,
    STRING_UI_DATE,
    STRING_UI_TIME,
    STRING_UI_DATE_TIME,
    STRING_UI_DATETIME_LOCAL,
    JSONEDITOR_STRING_FORMATS,
    isJsonEditorStringFormat,
    applyStringUiToSchema,
    prepareSchemaForJsonEditor,
    readStringUiFromSchema,
  };

  root.SsideSchemaMeta = api;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
