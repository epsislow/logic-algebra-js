/**
 * Meta-editor scheme: mapare string input ↔ format JSON Schema (JSONEditor).
 */
(function (root) {
  'use strict';

  const STRING_UI_INPUT = 'input';
  const STRING_UI_TEXTAREA = 'textarea';

  function applyStringUiToSchema(node, schemaNode) {
    if (!schemaNode || schemaNode.type !== 'string' || !node) return schemaNode;
    const ui = node.string_format == null ? STRING_UI_INPUT : String(node.string_format);
    if (ui === STRING_UI_TEXTAREA) {
      schemaNode.format = 'textarea';
      const h = String(node.string_format_height == null ? '' : node.string_format_height).trim();
      if (h) {
        schemaNode.options = { input_height: h };
      }
    }
    return schemaNode;
  }

  function readStringUiFromSchema(schemaNod, nodConfig) {
    if (!nodConfig || schemaNod.type !== 'string') return nodConfig;
    if (schemaNod.format === 'textarea') {
      nodConfig.string_format = STRING_UI_TEXTAREA;
      if (schemaNod.options && schemaNod.options.input_height) {
        nodConfig.string_format_height = String(schemaNod.options.input_height);
      }
    } else {
      nodConfig.string_format = STRING_UI_INPUT;
    }
    return nodConfig;
  }

  const api = {
    STRING_UI_INPUT,
    STRING_UI_TEXTAREA,
    applyStringUiToSchema,
    readStringUiFromSchema,
  };

  root.SsideSchemaMeta = api;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
