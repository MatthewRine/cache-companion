/**
 * content.js — Cache Companion
 *
 * Runs on geocaching.com/geocache/GC* pages.
 * Injects Jasmer and/or Fizzy labels based on enabled challenges.
 * If "Found It!" and month is missing from Jasmer data, saves a "1+" sentinel.
 */

(async () => {

  const DATE_RE = /\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/;

  // ── Load settings and data ────────────────────────────────────────────────

  const stored = await browser.storage.local.get([
    'jasmerData', 'fizzyData', 'autoDetectedCount',
    'enableJasmer', 'enableFizzy'
  ]);

  const enableJasmer = stored.enableJasmer !== false; // default on
  const enableFizzy  = stored.enableFizzy  !== false; // default on
  const jasmerData   = stored.jasmerData || {};
  const fizzyData    = stored.fizzyData  || {};

  // ── Find the hidden date ──────────────────────────────────────────────────

  function findHiddenDate() {
    const SELECTORS = [
      '[data-find="hidden-date"]',
      '.HiddenDate',
      ...Array.from(document.querySelectorAll('span, td, dd, li')).filter(
        (el) => /^\s*Hidden\s*:/i.test(el.textContent)
      ),
    ];

    for (const candidate of SELECTORS) {
      const el = typeof candidate === 'string'
        ? document.querySelector(candidate) : candidate;
      if (!el) continue;
      const match = el.textContent.match(DATE_RE);
      if (match) {
        return { element: el, monthKey: `${match[3]}-${String(match[1]).padStart(2, '0')}` };
      }
    }

    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      const text = node.textContent;
      if (/Hidden\s*:/i.test(text)) {
        const match = text.match(DATE_RE);
        if (match) {
          return { element: node.parentElement, monthKey: `${match[3]}-${String(match[1]).padStart(2, '0')}` };
        }
      }
    }
    return null;
  }

  // ── Find D/T rating on the page ───────────────────────────────────────────

  function findDiffTerrain() {
    // D/T values are in the alt text of star images inside #ctl00_ContentBody_diffTerr
    // e.g. <img alt="2.5 out of 5"> and <img alt="1.5 out of 5">
    const container = document.getElementById('ctl00_ContentBody_diffTerr');
    if (!container) return null;

    const imgs = container.querySelectorAll('img[alt]');
    const vals = [];
    imgs.forEach(img => {
      const m = img.alt.match(/^(\d+\.?\d*)\s+out of/i);
      if (m) vals.push(m[1]);
    });

    // First img = difficulty, second = terrain
    if (vals.length >= 2) {
      return { diff: vals[0], terr: vals[1], container };
    }
    return null;
  }

  // ── Check "Found It!" ─────────────────────────────────────────────────────

  function isFoundIt() {
    const logText = document.getElementById('ctl00_ContentBody_GeoNav_logText');
    return logText && logText.textContent.trim() === 'Found It!';
  }

  // ── Auto-update sentinel for Jasmer ───────────────────────────────────────

  async function maybeAutoUpdate(monthKey) {
    if (!(monthKey in jasmerData) && isFoundIt()) {
      jasmerData[monthKey] = '1+';
      const count = (stored.autoDetectedCount || 0) + 1;
      await browser.storage.local.set({ jasmerData, autoDetectedCount: count });
    }
  }

  // ── Build a label span ────────────────────────────────────────────────────

  function buildLabel(id, text, color) {
    const span = document.createElement('span');
    span.id = id;
    span.style.cssText = `font-weight:normal;font-size:0.85rem;color:${color};`;
    span.textContent = text;
    return span;
  }

  // ── Main ──────────────────────────────────────────────────────────────────

  const foundDate = findHiddenDate();

  if (enableJasmer && foundDate) {
    await maybeAutoUpdate(foundDate.monthKey);

    const value = jasmerData[foundDate.monthKey];
    let text, color;
    if (value === '1+') {
      text  = ' — Jasmer: done (re-import GPX for count)';
      color = '#888';
    } else if (value) {
      text  = ` — Jasmer: done (${value})`;
      color = '#888';
    } else {
      text  = ' — Jasmer: needed';
      color = '#22aa22';
    }
    foundDate.element.appendChild(buildLabel('cc-jasmer-label', text, color));
  }

  if (enableFizzy) {
    const dt = findDiffTerrain();
    if (dt) {
      const key   = `${dt.diff}/${dt.terr}`;
      const value = fizzyData[key];
      let text, color;
      if (value > 0) {
        text  = `— Fizzy: done (${value})`;
        color = '#888';
      } else {
        text  = '— Fizzy: needed';
        color = '#22aa22';
      }

      const label = buildLabel('cc-fizzy-label', text, color);
      label.style.display = 'block';
      label.style.marginTop = '0.4rem';
      label.style.fontSize = '0.85rem';
      // Append inside the D/T container after the last <dl> (Terrain)
      const dls = dt.container.querySelectorAll('dl');
      const anchor = dls[dls.length - 1] || dt.container;
      anchor.insertAdjacentElement('afterend', label);
    }
  }

})();
