/**
 * map.js — Cache Companion
 *
 * Runs on geocaching.com/play/map.
 * Watches for the cache preview panel to appear/change, finds the
 * "Placed on" date via [data-testid="placed-on-value"], and injects
 * a Jasmer label after it.
 */

(async () => {

  const DATE_RE = /\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/;
  const LABEL_ID = 'jasmer-map-label';

  // ── Load storage once; re-read on each panel change ──────────────────────

  async function loadJasmerData() {
    const result = await browser.storage.local.get('jasmerData');
    return result.jasmerData || {};
  }

  // ── Build the label span ──────────────────────────────────────────────────

  function buildLabel(monthKey, jasmerData) {
    const span = document.createElement('span');
    span.id = LABEL_ID;
    span.style.cssText = 'margin-left:0.4em;font-size:inherit;font-weight:normal;';

    if (monthKey in jasmerData) {
      const count = jasmerData[monthKey];
      span.textContent = `— Jasmer: done (${count})`;
      span.style.color = '#888';
    } else {
      span.textContent = '— Jasmer: needed';
      span.style.color = '#22aa22';
    }

    return span;
  }

  // ── Inject label next to the placed-on date ───────────────────────────────

  async function injectLabel() {
    // Remove any previous label first
    document.getElementById(LABEL_ID)?.remove();

    const dateEl = document.querySelector('[data-testid="placed-on-value"]');
    if (!dateEl) return;

    const match = dateEl.textContent.trim().match(DATE_RE);
    if (!match) return;

    const monthKey = `${match[3]}-${String(match[1]).padStart(2, '0')}`;
    const jasmerData = await loadJasmerData();
    const label = buildLabel(monthKey, jasmerData);

    dateEl.parentElement.appendChild(label);
  }

  // ── Watch for panel open / cache change via MutationObserver ─────────────

  const observer = new MutationObserver(() => {
    // Only act if a placed-on-value element is present and unlabelled
    const dateEl = document.querySelector('[data-testid="placed-on-value"]');
    if (dateEl && !document.getElementById(LABEL_ID)) {
      injectLabel();
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });

  // Also try immediately in case panel is already open
  injectLabel();

})();
