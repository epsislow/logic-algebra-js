/**
 * Layout grid pentru JSONEditor (theme html): câmpuri pe rând, nu câte un .row full-width.
 */
(function (root) {
  'use strict';

  function markFormGridLayout(holderEl) {
    if (!holderEl || !holderEl.querySelectorAll) return;
    holderEl.querySelectorAll('.je-object__container > .je-indented-panel > div > div').forEach((el) => {
      el.classList.add('sside-form-grid-wrap');
    });
  }

  function bindEditorReady(editor, holderEl) {
    if (!editor || typeof editor.on !== 'function') return;
    const run = () => markFormGridLayout(holderEl || editor.element);
    editor.on('ready', run);
    editor.on('change', run);
  }

  const api = { markFormGridLayout, bindEditorReady };

  root.SsideSchemaFormGrid = api;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
