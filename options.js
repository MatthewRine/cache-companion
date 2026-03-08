/**
 * options.js — Cache Companion
 */

// ── DOM refs ──────────────────────────────────────────────────────────────────
const fileInput    = document.getElementById('gpx-file');
const importBtn    = document.getElementById('import-btn');
const logEl        = document.getElementById('log');
const statsSection = document.getElementById('stats-section');
const statsBody    = document.getElementById('stats-body');
const lastUpdated  = document.getElementById('last-updated');
const staleWarning = document.getElementById('stale-warning');
const staleCount   = document.getElementById('stale-count');

// ── Logging ───────────────────────────────────────────────────────────────────

function log(message) {
  logEl.style.display = 'block';
  logEl.textContent += message + '\n';
  logEl.scrollTop = logEl.scrollHeight;
}

// ── GPX Parsing ───────────────────────────────────────────────────────────────

function parseGPX(xmlString) {
  const parser = new DOMParser();
  const doc    = parser.parseFromString(xmlString, 'application/xml');

  if (doc.querySelector('parsererror')) {
    throw new Error('Invalid GPX file — could not parse XML.');
  }

  const monthCounts = {};
  const wpts = doc.querySelectorAll('wpt');

  if (wpts.length === 0) {
    throw new Error('No waypoints found. Make sure this is a Geocaching GPX file.');
  }

  wpts.forEach((wpt) => {
    const timeEl = wpt.querySelector('time');
    if (!timeEl) return;
    const isoMatch = timeEl.textContent.trim().match(/^(\d{4})-(\d{2})/);
    if (!isoMatch) return;
    const key = `${isoMatch[1]}-${isoMatch[2]}`;
    monthCounts[key] = (monthCounts[key] || 0) + 1;
  });

  return monthCounts;
}

// ── Import handler ────────────────────────────────────────────────────────────

async function handleImport() {
  const file = fileInput.files[0];
  if (!file) { log('Please choose a GPX file first.'); return; }

  logEl.textContent = '';
  logEl.style.display = 'block';
  importBtn.disabled = true;
  log(`Reading "${file.name}"...`);

  try {
    const text        = await file.text();
    const monthCounts = parseGPX(text);
    const total       = Object.values(monthCounts).reduce((a, b) => a + b, 0);

    if (total === 0) throw new Error('No dated caches found. Is this the right GPX?');

    const now = new Date().toLocaleString();

    // GPX always wins — clear sentinels and auto-detected count
    await browser.storage.local.set({
      jasmerData:        monthCounts,
      lastUpdated:       now,
      autoDetectedCount: 0,
    });

    log(`Imported ${total} finds across ${Object.keys(monthCounts).length} unique month(s).`);
    log(`Last updated: ${now}`);

    staleWarning.style.display = 'none';
    renderStats(monthCounts, now);

  } catch (err) {
    log(`Error: ${err.message}`);
  } finally {
    importBtn.disabled = false;
  }
}

// ── Dashboard stat card helper ────────────────────────────────────────────────

function makeStatCard(value, label, highlight = false) {
  const card = document.createElement('div');
  card.className = 'stat-card' + (highlight ? ' stat-card-highlight' : '');
  card.innerHTML = `<div class="stat-value">${value}</div><div class="stat-label">${label}</div>`;
  return card;
}

// ── Stats renderer ────────────────────────────────────────────────────────────

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function renderStats(jasmerData, updated) {
  statsSection.style.display = 'block';

  if (updated) lastUpdated.textContent = `Last updated: ${updated}`;

  if (Object.keys(jasmerData).length === 0) {
    statsBody.innerHTML = '<p style="color:#888">No data yet.</p>';
    return;
  }

  const currentYear  = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  // ── Dashboard ─────────────────────────────────────────────────────────────
  const GEOCACHING_START_YEAR  = 2000;
  const GEOCACHING_START_MONTH = 5;
  const totalPossible = (currentYear - GEOCACHING_START_YEAR) * 12
    + (currentMonth - GEOCACHING_START_MONTH + 1);

  // Count completed months (any truthy value = has finds)
  let completedMonths = 0;
  let totalFinds      = 0;
  Object.entries(jasmerData).forEach(([, v]) => {
    if (v === '1+') {
      completedMonths++;
      // Don't add to totalFinds — we don't know the real count
    } else if (v > 0) {
      completedMonths++;
      totalFinds += v;
    }
  });

  const pct = Math.round((completedMonths / totalPossible) * 100);

  const dashboard = document.getElementById('jasmer-dashboard');
  dashboard.innerHTML = '';

  // Total finds — global stat above the challenge row
  const findsRow = document.createElement('div');
  findsRow.className = 'dashboard-total';
  findsRow.innerHTML = `Total finds: <strong>${totalFinds.toLocaleString()}</strong>`;
  dashboard.appendChild(findsRow);

  // Challenge stat cards
  const cardsRow = document.createElement('div');
  cardsRow.className = 'stat-cards';
  cardsRow.appendChild(makeStatCard(completedMonths, 'completed', true));
  cardsRow.appendChild(makeStatCard(totalPossible, 'possible'));
  cardsRow.appendChild(makeStatCard(pct + '%', 'progress'));
  dashboard.appendChild(cardsRow);

  // ── Year × month table ────────────────────────────────────────────────────
  const years = [...new Set(Object.keys(jasmerData).map(k => k.slice(0, 4)))].sort();

  const table = document.createElement('table');
  table.className = 'jasmer-table';

  const thead = table.createTHead();
  const headerRow = thead.insertRow();
  const yearTh = document.createElement('th');
  yearTh.className = 'year-header';
  yearTh.textContent = 'Year';
  headerRow.appendChild(yearTh);
  MONTH_NAMES.forEach(name => {
    const th = document.createElement('th');
    th.textContent = name;
    headerRow.appendChild(th);
  });

  const tbody = table.createTBody();

  years.forEach(year => {
    const row = tbody.insertRow();
    const yearCell = row.insertCell();
    yearCell.className = 'year-label';
    yearCell.textContent = year;

    for (let m = 1; m <= 12; m++) {
      const key      = `${year}-${String(m).padStart(2, '0')}`;
      const value    = jasmerData[key];
      const cell     = row.insertCell();
      const isFuture = parseInt(year) > currentYear ||
                       (parseInt(year) === currentYear && m > currentMonth);
      const isNA     = parseInt(year) === 2000 && m < 5;

      if (isNA) {
        cell.className   = 'na';
        cell.textContent = 'n/a';
      } else if (isFuture) {
        cell.className   = 'future';
        cell.textContent = '';
      } else if (value === '1+') {
        cell.className   = 'has-finds sentinel';
        cell.textContent = '1+';
        cell.title       = 'Auto-detected — re-import GPX for exact count';
      } else if (value > 0) {
        cell.className   = 'has-finds';
        cell.textContent = value;
      } else {
        cell.className   = 'no-finds';
        cell.textContent = '0';
        cell.style.cursor = 'pointer';
        const mm      = String(m).padStart(2, '0');
        const lastDay = new Date(parseInt(year), m, 0).getDate();
        const psd     = `${year}-${mm}-01`;
        const ped     = `${year}-${mm}-${String(lastDay).padStart(2, '0')}`;
        cell.title    = `Find a cache hidden in ${MONTH_NAMES[m-1]} ${year}`;
        cell.addEventListener('click', () => {
          window.open(
            `https://www.geocaching.com/play/map?sort=distance&asc=true&ped=${ped}&psd=${psd}`,
            '_blank'
          );
        });
      }
    }
  });

  statsBody.innerHTML = '';
  statsBody.appendChild(table);
}

// ── Init ──────────────────────────────────────────────────────────────────────

async function init() {
  const result = await browser.storage.local.get(['jasmerData', 'lastUpdated', 'autoDetectedCount']);

  // Show stale warning if auto-detected months exist
  const autoCount = result.autoDetectedCount || 0;
  if (autoCount > 0) {
    staleWarning.style.display = 'block';
    staleCount.textContent     = autoCount;
  }

  if (result.jasmerData && Object.keys(result.jasmerData).length > 0) {
    renderStats(result.jasmerData, result.lastUpdated);
  }
}

importBtn.addEventListener('click', handleImport);
init();
