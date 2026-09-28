/**
 * Viewer Docs (F5d): TOC + MD → HTML simplu.
 * Depinde de window.SsideDocData (doc-data_generated.js).
 */
(function (root) {
  'use strict';

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function inlineFormat(text) {
    let s = escapeHtml(text);
    s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
    s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, function (_, label, href) {
      const h = escapeHtml(href);
      if (h.charAt(0) === '#') {
        return '<a href="' + h + '" data-doc-hash="' + h.slice(1) + '">' + label + '</a>';
      }
      return '<a href="' + h + '" target="_blank" rel="noopener">' + label + '</a>';
    });
    return s;
  }

  function mdToHtml(md) {
    const lines = String(md || '').replace(/\r\n/g, '\n').split('\n');
    const html = [];
    let i = 0;
    let inCode = false;
    let codeBuf = [];
    let listType = null;

    function closeList() {
      if (listType) {
        html.push(listType === 'ul' ? '</ul>' : '</ol>');
        listType = null;
      }
    }

    while (i < lines.length) {
      const line = lines[i];

      if (inCode) {
        if (/^```/.test(line)) {
          html.push('<pre><code>' + escapeHtml(codeBuf.join('\n')) + '</code></pre>');
          codeBuf = [];
          inCode = false;
        } else {
          codeBuf.push(line);
        }
        i++;
        continue;
      }

      if (/^```/.test(line)) {
        closeList();
        inCode = true;
        codeBuf = [];
        i++;
        continue;
      }

      const hm = line.match(/^(#{1,3})\s+(.+)$/);
      if (hm) {
        closeList();
        const level = hm[1].length;
        const title = hm[2].trim();
        const id = title
          .toLowerCase()
          .replace(/[^\w\u00C0-\u024f]+/g, '-')
          .replace(/^-|-$/g, '');
        html.push('<h' + level + ' id="doc-' + id + '">' + inlineFormat(title) + '</h' + level + '>');
        i++;
        continue;
      }

      const ul = line.match(/^\s*[-*]\s+(.+)$/);
      if (ul) {
        if (listType !== 'ul') {
          closeList();
          html.push('<ul>');
          listType = 'ul';
        }
        html.push('<li>' + inlineFormat(ul[1]) + '</li>');
        i++;
        continue;
      }

      // GFM table: | a | b |
      if (/^\s*\|/.test(line) && i + 1 < lines.length && /^\s*\|?\s*:?-+:?\s*\|/.test(lines[i + 1])) {
        closeList();
        const parseRow = (row) =>
          row
            .replace(/^\s*\|/, '')
            .replace(/\|\s*$/, '')
            .split('|')
            .map((c) => c.trim());
        const headers = parseRow(line);
        i += 2; // skip header + separator
        const rows = [];
        while (i < lines.length && /^\s*\|/.test(lines[i])) {
          rows.push(parseRow(lines[i]));
          i++;
        }
        html.push('<table><thead><tr>' + headers.map((h) => '<th>' + inlineFormat(h) + '</th>').join('') + '</tr></thead><tbody>');
        rows.forEach((r) => {
          html.push('<tr>' + r.map((c) => '<td>' + inlineFormat(c) + '</td>').join('') + '</tr>');
        });
        html.push('</tbody></table>');
        continue;
      }

      const ol = line.match(/^\s*\d+\.\s+(.+)$/);
      if (ol) {
        if (listType !== 'ol') {
          closeList();
          html.push('<ol>');
          listType = 'ol';
        }
        html.push('<li>' + inlineFormat(ol[1]) + '</li>');
        i++;
        continue;
      }

      if (/^\s*$/.test(line)) {
        closeList();
        i++;
        continue;
      }

      closeList();
      html.push('<p>' + inlineFormat(line) + '</p>');
      i++;
    }
    closeList();
    if (inCode) {
      html.push('<pre><code>' + escapeHtml(codeBuf.join('\n')) + '</code></pre>');
    }
    return html.join('\n');
  }

  function getData() {
    return root.SsideDocData || { title: 'Docs', sections: [] };
  }

  function ensurePanel() {
    let panel = document.getElementById('ecran-docs');
    if (panel) return panel;
    panel = document.createElement('div');
    panel.id = 'ecran-docs';
    panel.style.display = 'none';
    panel.innerHTML =
      '<div class="box docs-box">' +
      '<div class="docs-toolbar">' +
      '<button type="button" class="btn-gri btn-inline" id="btn-docs-inapoi">← Înapoi</button>' +
      '<h3 id="docs-title" style="margin:0 0 0 12px;flex:1;">Docs</h3>' +
      '</div>' +
      '<div class="docs-layout">' +
      '<nav class="docs-toc" id="docs-toc"></nav>' +
      '<article class="docs-content" id="docs-content"></article>' +
      '</div>' +
      '</div>';
    const app = document.getElementById('panou-aplicatie');
    if (app) app.appendChild(panel);
    else document.body.appendChild(panel);

    panel.querySelector('#btn-docs-inapoi').onclick = function () {
      ascunde();
    };
    return panel;
  }

  function hideOtherScreens() {
    ['ecran-lista', 'ecran-detaliu', 'ecran-cautari-salvate'].forEach(function (id) {
      const el = document.getElementById(id);
      if (el) el.style.display = 'none';
    });
  }

  function showSection(id) {
    const data = getData();
    const sec = (data.sections || []).find(function (s) {
      return s.id === id;
    }) || (data.sections || [])[0];
    const toc = document.getElementById('docs-toc');
    const content = document.getElementById('docs-content');
    if (!toc || !content) return;

    toc.querySelectorAll('button').forEach(function (b) {
      b.classList.toggle('active', sec && b.getAttribute('data-id') === sec.id);
    });

    if (!sec) {
      content.innerHTML = '<p class="prog-live-stub">Nicio secțiune. Rulează <code>node node/gen_doc_data.js</code>.</p>';
      return;
    }
    content.innerHTML = mdToHtml(sec.markdown);
    content.scrollTop = 0;

    content.querySelectorAll('a[data-doc-hash]').forEach(function (a) {
      a.addEventListener('click', function (ev) {
        ev.preventDefault();
        const targetId = a.getAttribute('data-doc-hash');
        const el = document.getElementById('doc-' + targetId) || document.getElementById(targetId);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  }

  function randeazaToc() {
    const data = getData();
    const toc = document.getElementById('docs-toc');
    const title = document.getElementById('docs-title');
    if (title) title.textContent = data.title || 'Docs';
    if (!toc) return;
    toc.innerHTML = '';
    (data.sections || []).forEach(function (sec) {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = sec.label || sec.id;
      b.setAttribute('data-id', sec.id);
      b.onclick = function () {
        showSection(sec.id);
      };
      toc.appendChild(b);
    });
  }

  function arata(sectionId) {
    ensurePanel();
    hideOtherScreens();
    const panel = document.getElementById('ecran-docs');
    panel.style.display = 'block';
    randeazaToc();
    const data = getData();
    const first = sectionId || ((data.sections || [])[0] && data.sections[0].id);
    showSection(first);
  }

  function ascunde() {
    const panel = document.getElementById('ecran-docs');
    if (panel) panel.style.display = 'none';
    const lista = document.getElementById('ecran-lista');
    if (lista) lista.style.display = 'block';
  }

  function esteDeschis() {
    const panel = document.getElementById('ecran-docs');
    return !!(panel && panel.style.display !== 'none');
  }

  root.SsideDocs = {
    arata,
    ascunde,
    esteDeschis,
    mdToHtml,
  };

  root.deschideDocs = function () {
    root.SsideDocs.arata();
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { mdToHtml };
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
