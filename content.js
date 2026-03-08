/**
 * content.js — Cache Companion
 *
 * Runs on geocaching.com/geocache/GC* pages.
 * 1. Finds the hidden date and injects a Jasmer label.
 * 2. If the page shows "Found It!" and the month is missing from storage,
 *    saves a "1+" sentinel so the options page can warn about a stale GPX.
 */

(async () => {

  const DATE_RE = /\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/;

  // ── 1. Find the hidden date ───────────────────────────────────────────────

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
        ? document.querySelector(candidate)
        : candidate;
      if (!el) continue;
      const match = el.textContent.match(DATE_RE);
      if (match) {
        const [, month, , year] = match;
        return { element: el, monthKey: `${year}-${String(month).padStart(2, '0')}` };
      }
    }

    // Fallback: text node scan
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      const text = node.textContent;
      if (/Hidden\s*:/i.test(text)) {
        const match = text.match(DATE_RE);
        if (match) {
          const [, month, , year] = match;
          return { element: node.parentElement, monthKey: `${year}-${String(month).padStart(2, '0')}` };
        }
      }
    }

    return null;
  }

  // ── 2. Check if this cache was found by the user ──────────────────────────

  function isFoundIt() {
    const logText = document.getElementById('ctl00_ContentBody_GeoNav_logText');
    return logText && logText.textContent.trim() === 'Found It!';
  }

  // ── 3. Load / update storage ──────────────────────────────────────────────

  async function loadJasmerData() {
    const result = await browser.storage.local.get('jasmerData');
    return result.jasmerData || {};
  }

  /**
   * If the user found this cache and the month isn't in storage yet,
   * save a "1+" sentinel and record that auto-detection has occurred.
   */
  async function maybeAutoUpdate(monthKey, jasmerData) {
    if (!(monthKey in jasmerData) && isFoundIt()) {
      jasmerData[monthKey] = '1+';
      const result = await browser.storage.local.get('autoDetectedCount');
      const count  = (result.autoDetectedCount || 0) + 1;
      await browser.storage.local.set({ jasmerData, autoDetectedCount: count });
    }
  }

  // ── 4. Build label ────────────────────────────────────────────────────────

  function buildLabel(monthKey, jasmerData) {
    const span = document.createElement('span');
    span.id = 'cache-companion-label';
    span.style.fontWeight = 'normal';
    span.style.fontSize   = 'inherit';

    const value = jasmerData[monthKey];

    if (value === '1+') {
      span.textContent  = ' — Jasmer: done (re-import GPX for count)';
      span.style.color  = '#888888';
    } else if (value) {
      span.textContent  = ` — Jasmer: done (${value})`;
      span.style.color  = '#888888';
    } else {
      span.textContent  = ' — Jasmer: needed';
      span.style.color  = '#22aa22';
    }

    return span;
  }

  // ── 5. Main ───────────────────────────────────────────────────────────────

  const found = findHiddenDate();
  if (!found) return;

  const jasmerData = await loadJasmerData();
  await maybeAutoUpdate(found.monthKey, jasmerData);

  const label = buildLabel(found.monthKey, jasmerData);
  found.element.appendChild(label);

})();
