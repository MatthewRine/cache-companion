/**
 * map.js — Cache Companion
 *
 * Runs on geocaching.com/play/map.
 * Watches for the cache preview panel and injects a Cache Companion row
 * below the "Placed on" date showing Jasmer and Fizzy status together.
 */

(async () => {

  const DATE_RE = /\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/;
  const ROW_ID  = 'cc-map-row';

  async function loadData() {
    return browser.storage.local.get([
      'jasmerData', 'fizzyData', 'enableJasmer', 'enableFizzy'
    ]);
  }

  // ── Inject a row below "Placed on" with Jasmer · Fizzy ───────────────────

  async function injectLabels() {
    document.getElementById(ROW_ID)?.remove();

    const dateEl = document.querySelector('[data-testid="placed-on-value"]');
    if (!dateEl) return;

    const stored       = await loadData();
    const enableJasmer = stored.enableJasmer !== false;
    const enableFizzy  = stored.enableFizzy  !== false;
    const jasmerData   = stored.jasmerData || {};
    const fizzyData    = stored.fizzyData  || {};

    const parts = [];

    // ── Jasmer ──────────────────────────────────────────────────────────────
    if (enableJasmer) {
      const match = dateEl.textContent.trim().match(DATE_RE);
      if (match) {
        const monthKey = `${match[3]}-${String(match[1]).padStart(2, '0')}`;
        const value    = jasmerData[monthKey];
        if (value === '1+') {
          parts.push({ text: 'Jasmer: done (re-import GPX)', color: '#888' });
        } else if (value) {
          parts.push({ text: `Jasmer: done (${value})`, color: '#888' });
        } else {
          parts.push({ text: 'Jasmer: needed', color: '#22aa22' });
        }
      }
    }

    // ── Fizzy ────────────────────────────────────────────────────────────────
    if (enableFizzy) {
      const attrGroups = document.querySelectorAll('.attributes > div');
      let diff = null, terr = null;

      attrGroups.forEach(group => {
        const label = group.querySelector('.attribute-label');
        const val   = group.querySelector('.attribute-val');
        if (!label || !val) return;
        const labelText = label.textContent.trim().toLowerCase();
        if (labelText === 'difficulty') diff = val.textContent.trim();
        if (labelText === 'terrain')    terr = val.textContent.trim();
      });

      if (diff && terr) {
        const key   = `${diff}/${terr}`;
        const value = fizzyData[key];
        if (value > 0) {
          parts.push({ text: `Fizzy: done (${value})`, color: '#888' });
        } else {
          parts.push({ text: 'Fizzy: needed', color: '#22aa22' });
        }
      }
    }

    if (parts.length === 0) return;

    // ── Build the row ─────────────────────────────────────────────────────────
    // Sits below the "Placed on" line, matching its centered layout
    const row = document.createElement('div');
    row.id = ROW_ID;
    row.style.cssText = 'display:flex;justify-content:center;gap:0.75em;flex-wrap:wrap;font-size:inherit;margin-top:0.25em;';

    parts.forEach((part, i) => {
      if (i > 0) {
        const sep = document.createElement('span');
        sep.textContent = '·';
        sep.style.color = '#ccc';
        row.appendChild(sep);
      }
      const span = document.createElement('span');
      span.textContent = part.text;
      span.style.color = part.color;
      row.appendChild(span);
    });

    // Insert after the placed-on line's parent flex row
    const placedOnRow = dateEl.closest('.geocache-placed-date') || dateEl.parentElement;
    placedOnRow.insertAdjacentElement('afterend', row);
  }

  // ── MutationObserver ──────────────────────────────────────────────────────

  const observer = new MutationObserver(() => {
    const dateEl = document.querySelector('[data-testid="placed-on-value"]');
    if (dateEl && !document.getElementById(ROW_ID)) {
      injectLabels();
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
  injectLabels();

})();
