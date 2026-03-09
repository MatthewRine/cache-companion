/**
 * popup.js — Cache Companion
 */

const statusEl   = document.getElementById('status');
const optionsBtn = document.getElementById('options-btn');

async function init() {
  const stored = await browser.storage.local.get([
    'jasmerData', 'fizzyData', 'lastUpdated',
    'enableJasmer', 'enableFizzy'
  ]);

  const enableJasmer = stored.enableJasmer !== false;
  const enableFizzy  = stored.enableFizzy  !== false;
  const jasmerData   = stored.jasmerData || {};
  const fizzyData    = stored.fizzyData  || {};
  const updated      = stored.lastUpdated || null;

  const now          = new Date();
  const currentYear  = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const totalPossible = (currentYear - 2000) * 12 + (currentMonth - 5 + 1);

  let html = '';

  if (!enableJasmer && !enableFizzy) {
    statusEl.textContent = 'All challenges disabled. Enable them in settings.';
    return;
  }

  if (Object.keys(jasmerData).length === 0 && Object.keys(fizzyData).length === 0) {
    statusEl.textContent = 'No data yet — import a GPX file to get started.';
    return;
  }

  if (enableJasmer) {
    const completed = Object.values(jasmerData).filter(v => v === '1+' || v > 0).length;
    const pct       = Math.round((completed / totalPossible) * 100);
    html += `<div class="stat-row">
      <span class="stat-label">Jasmer</span>
      <span class="stat-value">${completed} / ${totalPossible}</span>
      <span class="stat-pct">${pct}%</span>
    </div>`;
  }

  if (enableFizzy) {
    const completed = Object.values(fizzyData).filter(v => v > 0).length;
    const pct       = Math.round((completed / 81) * 100);
    html += `<div class="stat-row">
      <span class="stat-label">Fizzy</span>
      <span class="stat-value">${completed} / 81</span>
      <span class="stat-pct">${pct}%</span>
    </div>`;
  }

  if (updated) {
    html += `<div class="updated">Updated: ${updated}</div>`;
  }

  statusEl.innerHTML = html;
}

optionsBtn.addEventListener('click', () => {
  browser.tabs.create({ url: browser.runtime.getURL('options.html') });
});

init();
