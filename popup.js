/**
 * popup.js — Cache Companion
 * Shows a summary of stored data and links to options / finds page.
 */

const statusEl  = document.getElementById('status');
const optionsBtn = document.getElementById('options-btn');

async function init() {
  const result = await browser.storage.local.get(['jasmerData', 'lastUpdated']);
  const data   = result.jasmerData || {};

  if (Object.keys(data).length === 0) {
    statusEl.textContent = 'No data yet — import a GPX file to get started.';
    return;
  }

  // Calculate completed vs possible (May 2000 → now)
  const now          = new Date();
  const currentYear  = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const totalPossible = (currentYear - 2000) * 12 + (currentMonth - 5 + 1);

  const completed = Object.values(data).filter(v => v === '1+' || v > 0).length;
  const pct       = Math.round((completed / totalPossible) * 100);
  const updated   = result.lastUpdated || 'unknown';

  statusEl.innerHTML = `
    <span style="font-size:1rem;font-weight:600;color:#1a5f1a">${completed} / ${totalPossible}</span>
    <span style="color:#555"> months &nbsp; </span>
    <span style="font-size:1rem;font-weight:600;color:#1a5f1a">${pct}%</span>
    <br><span style="color:#aaa;font-size:0.75rem">Updated: ${updated}</span>
  `;
}

optionsBtn.addEventListener('click', () => {
  browser.tabs.create({ url: browser.runtime.getURL('options.html') });
});

init();
