/**
 * options.js — Cache Companion
 */

// ── DOM refs ──────────────────────────────────────────────────────────────────
const fileInput     = document.getElementById('gpx-file');
const importBtn     = document.getElementById('import-btn');
const logEl         = document.getElementById('log');
const staleWarning  = document.getElementById('stale-warning');
const staleCount    = document.getElementById('stale-count');
const importMeta    = document.getElementById('import-meta');
const lastUpdated   = document.getElementById('last-updated');
const totalFinds    = document.getElementById('total-finds');
const toggleJasmer  = document.getElementById('toggle-jasmer');
const toggleFizzy   = document.getElementById('toggle-fizzy');
const jasmerSection = document.getElementById('jasmer-section');
const fizzySection  = document.getElementById('fizzy-section');

// ── Helpers ───────────────────────────────────────────────────────────────────

function log(message) {
  logEl.style.display = 'block';
  logEl.textContent += message + '\n';
  logEl.scrollTop = logEl.scrollHeight;
}

function makeStatCard(value, label, highlight = false) {
  const card = document.createElement('div');
  card.className = 'stat-card' + (highlight ? ' stat-card-highlight' : '');
  card.innerHTML = `<div class="stat-value">${value}</div><div class="stat-label">${label}</div>`;
  return card;
}

// ── Import meta (last updated + total finds) ──────────────────────────────────

function updateImportMeta(jasmerData, updated) {
  if (!updated) return;
  let findCount = 0;
  Object.values(jasmerData || {}).forEach(v => { if (v !== '1+' && v > 0) findCount += v; });
  lastUpdated.textContent = `Last updated: ${updated}`;
  totalFinds.textContent  = `Total finds: ${findCount.toLocaleString()}`;
  importMeta.style.display = 'block';
}

// ── GPX Parsing ───────────────────────────────────────────────────────────────

function parseGPX(xmlString) {
  const parser = new DOMParser();
  const doc    = parser.parseFromString(xmlString, 'application/xml');

  if (doc.querySelector('parsererror')) {
    throw new Error('Invalid GPX file — could not parse XML.');
  }

  const wpts = doc.querySelectorAll('wpt');
  if (wpts.length === 0) throw new Error('No waypoints found. Is this a Geocaching GPX?');

  const jasmerCounts = {};
  const fizzyCounts  = {};

  wpts.forEach((wpt) => {
    // ── Jasmer: hidden date ────────────────────────────────────────────────
    const timeEl = wpt.querySelector('time');
    if (timeEl) {
      const m = timeEl.textContent.trim().match(/^(\d{4})-(\d{2})/);
      if (m) {
        const key = `${m[1]}-${m[2]}`;
        jasmerCounts[key] = (jasmerCounts[key] || 0) + 1;
      }
    }

    // ── Fizzy: difficulty + terrain ────────────────────────────────────────
    const diffEl = wpt.querySelector('difficulty');
    const terrEl = wpt.querySelector('terrain');
    if (diffEl && terrEl) {
      const key = `${diffEl.textContent.trim()}/${terrEl.textContent.trim()}`;
      fizzyCounts[key] = (fizzyCounts[key] || 0) + 1;
    }
  });

  return { jasmerCounts, fizzyCounts };
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
    const text = await file.text();
    const { jasmerCounts, fizzyCounts } = parseGPX(text);

    const jasmerTotal = Object.values(jasmerCounts).reduce((a, b) => a + b, 0);
    const fizzyTotal  = Object.values(fizzyCounts).reduce((a, b) => a + b, 0);

    if (jasmerTotal === 0 && fizzyTotal === 0) {
      throw new Error('No usable data found. Is this the right GPX?');
    }

    const now = new Date().toLocaleString();
    await browser.storage.local.set({
      jasmerData:        jasmerCounts,
      fizzyData:         fizzyCounts,
      lastUpdated:       now,
      autoDetectedCount: 0,
    });

    log(`Jasmer: ${jasmerTotal} finds across ${Object.keys(jasmerCounts).length} month(s).`);
    log(`Fizzy:  ${fizzyTotal} finds across ${Object.keys(fizzyCounts).length} D/T combination(s).`);
    log(`Last updated: ${now}`);

    staleWarning.style.display = 'none';
    renderAll(jasmerCounts, fizzyCounts, now);

  } catch (err) {
    log(`Error: ${err.message}`);
  } finally {
    importBtn.disabled = false;
  }
}

// ── Jasmer renderer ───────────────────────────────────────────────────────────

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function renderJasmer(jasmerData) {
  const currentYear   = new Date().getFullYear();
  const currentMonth  = new Date().getMonth() + 1;
  const totalPossible = (currentYear - 2000) * 12 + (currentMonth - 5 + 1);

  let completedMonths = 0, findCount = 0;
  Object.entries(jasmerData).forEach(([, v]) => {
    if (v === '1+') { completedMonths++; }
    else if (v > 0) { completedMonths++; findCount += v; }
  });

  const pct = Math.round((completedMonths / totalPossible) * 100);

  // Dashboard
  const dashboard = document.getElementById('jasmer-dashboard');
  dashboard.innerHTML = '';
  const cards = document.createElement('div');
  cards.className = 'stat-cards';
  cards.appendChild(makeStatCard(completedMonths, 'completed', true));
  cards.appendChild(makeStatCard(totalPossible, 'possible'));
  cards.appendChild(makeStatCard(pct + '%', 'progress'));
  dashboard.appendChild(cards);

  // Grid
  const years = [...new Set(Object.keys(jasmerData).map(k => k.slice(0, 4)))].sort();
  const table = document.createElement('table');
  table.className = 'grid-table';

  const thead = table.createTHead();
  const hRow  = thead.insertRow();
  const yTh   = document.createElement('th');
  yTh.className = 'row-header';
  yTh.textContent = 'Year';
  hRow.appendChild(yTh);
  MONTH_NAMES.forEach(name => {
    const th = document.createElement('th');
    th.textContent = name;
    hRow.appendChild(th);
  });

  const tbody = table.createTBody();
  years.forEach(year => {
    const row = tbody.insertRow();
    const yCell = row.insertCell();
    yCell.className = 'row-label';
    yCell.textContent = year;

    for (let m = 1; m <= 12; m++) {
      const key      = `${year}-${String(m).padStart(2, '0')}`;
      const value    = jasmerData[key];
      const cell     = row.insertCell();
      const isFuture = parseInt(year) > currentYear ||
                       (parseInt(year) === currentYear && m > currentMonth);
      const isNA     = parseInt(year) === 2000 && m < 5;

      if (isNA) {
        cell.className = 'na'; cell.textContent = 'n/a';
      } else if (isFuture) {
        cell.className = 'future'; cell.textContent = '';
      } else if (value === '1+') {
        cell.className = 'has-finds sentinel'; cell.textContent = '1+';
        cell.title = 'Auto-detected — re-import GPX for exact count';
      } else if (value > 0) {
        cell.className = 'has-finds'; cell.textContent = value;
      } else {
        cell.className = 'no-finds'; cell.textContent = '0';
        const mm = String(m).padStart(2, '0');
        const lastDay = new Date(parseInt(year), m, 0).getDate();
        const ped = `${year}-${mm}-${String(lastDay).padStart(2, '0')}`;
        cell.title = `Find a cache hidden in ${MONTH_NAMES[m-1]} ${year}`;
        cell.addEventListener('click', () => {
          window.open(`https://www.geocaching.com/play/map?sort=distance&asc=true&ped=${ped}&psd=${year}-${mm}-01`, '_blank');
        });
      }
    }
  });

  const grid = document.getElementById('jasmer-grid');
  grid.innerHTML = '';
  grid.appendChild(table);
}

// ── Fizzy renderer ────────────────────────────────────────────────────────────

function renderFizzy(fizzyData) {
  // D and T both go 1.0, 1.5, 2.0 ... 5.0 = 9 values each
  const ratings = ['1.0','1.5','2.0','2.5','3.0','3.5','4.0','4.5','5.0'];

  const completed = Object.values(fizzyData).filter(v => v > 0).length;
  const pct       = Math.round((completed / 81) * 100);

  // Dashboard
  const dashboard = document.getElementById('fizzy-dashboard');
  dashboard.innerHTML = '';
  const cards = document.createElement('div');
  cards.className = 'stat-cards';
  cards.appendChild(makeStatCard(completed, 'completed', true));
  cards.appendChild(makeStatCard(81, 'possible'));
  cards.appendChild(makeStatCard(pct + '%', 'progress'));
  dashboard.appendChild(cards);

  // Grid — rows = Difficulty, cols = Terrain
  const table = document.createElement('table');
  table.className = 'grid-table';

  const thead = table.createTHead();
  const hRow  = thead.insertRow();
  const dTh   = document.createElement('th');
  dTh.className = 'row-header';
  dTh.innerHTML = '<small>D↓ T→</small>';
  hRow.appendChild(dTh);
  ratings.forEach(t => {
    const th = document.createElement('th');
    th.textContent = t;
    hRow.appendChild(th);
  });

  const tbody = table.createTBody();
  ratings.forEach(d => {
    const row   = tbody.insertRow();
    const dCell = row.insertCell();
    dCell.className = 'row-label';
    dCell.textContent = d;

    ratings.forEach(t => {
      const key   = `${d}/${t}`;
      const value = fizzyData[key] || 0;
      const cell  = row.insertCell();

      if (value > 0) {
        cell.className   = 'has-finds';
        cell.textContent = value;
      } else {
        cell.className   = 'no-finds';
        cell.textContent = '0';
        cell.title       = `Find a D${d}/T${t} cache`;
        cell.addEventListener('click', () => {
          window.open(`https://www.geocaching.com/play/map?sort=distance&asc=true&d=${d}&t=${t}`, '_blank');
        });
      }
    });
  });

  const grid = document.getElementById('fizzy-grid');
  grid.innerHTML = '';
  grid.appendChild(table);
}

// ── Render both challenges ────────────────────────────────────────────────────

function renderAll(jasmerData, fizzyData, updated) {
  const enableJasmer = toggleJasmer.checked;
  const enableFizzy  = toggleFizzy.checked;

  updateImportMeta(jasmerData, updated);

  jasmerSection.style.display = (enableJasmer && Object.keys(jasmerData).length > 0) ? 'block' : 'none';
  fizzySection.style.display  = (enableFizzy  && Object.keys(fizzyData).length  > 0) ? 'block' : 'none';

  if (enableJasmer && Object.keys(jasmerData).length > 0) renderJasmer(jasmerData);
  if (enableFizzy  && Object.keys(fizzyData).length  > 0) renderFizzy(fizzyData);
}

// ── Toggle handlers ───────────────────────────────────────────────────────────

async function handleToggle() {
  await browser.storage.local.set({
    enableJasmer: toggleJasmer.checked,
    enableFizzy:  toggleFizzy.checked,
  });

  const result = await browser.storage.local.get(['jasmerData', 'fizzyData', 'lastUpdated']);
  renderAll(result.jasmerData || {}, result.fizzyData || {}, result.lastUpdated);
}

// ── Init ──────────────────────────────────────────────────────────────────────

async function init() {
  const result = await browser.storage.local.get([
    'jasmerData', 'fizzyData', 'lastUpdated',
    'enableJasmer', 'enableFizzy', 'autoDetectedCount'
  ]);

  // Apply saved toggle states
  toggleJasmer.checked = result.enableJasmer !== false;
  toggleFizzy.checked  = result.enableFizzy  !== false;

  // Stale warning
  const autoCount = result.autoDetectedCount || 0;
  if (autoCount > 0) {
    staleWarning.style.display = 'block';
    staleCount.textContent     = autoCount;
  }

  renderAll(result.jasmerData || {}, result.fizzyData || {}, result.lastUpdated);
}

// ── Wire up ───────────────────────────────────────────────────────────────────

importBtn.addEventListener('click', handleImport);
toggleJasmer.addEventListener('change', handleToggle);
toggleFizzy.addEventListener('change', handleToggle);
init();
