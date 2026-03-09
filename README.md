# 🧭 Cache Companion

A Manifest V3 browser extension for **Chrome** and **Firefox** that helps you track geocaching challenge progress.

> **Formerly known as Jasmer Helper** — renamed and expanded in v2.0.0 to support multiple challenges.

Currently supported challenges:
- **Jasmer** — find a cache hidden in each month of every year since May 2000
- **Fizzy** — find a cache for every Difficulty / Terrain combination (9×9 grid)

---

## Features

### Per-challenge toggles
Enable or disable individual challenges from the options page. When a challenge is off, its dashboard section is hidden and nothing is injected into geocaching.com pages.

### Jasmer Challenge
- **Cache detail pages** (`geocaching.com/geocache/GC*`) — displays `— Jasmer: done (N)` or `— Jasmer: needed` next to the hidden date
- **Map preview** (`geocaching.com/play/map`) — a combined Cache Companion row below "Placed on" shows Jasmer and Fizzy status together
- **Progress dashboard** — a year × month grid showing completion, with clickable empty cells that open the map filtered to caches hidden that month
- **Auto-detection** — if you visit a "Found It!" cache page for a missing month, it's noted and you're prompted to re-import your GPX

### Fizzy Challenge
- **Cache detail pages** — displays `— Fizzy: done (N)` or `— Fizzy: needed` below the Difficulty / Terrain section
- **Map preview** — shown alongside Jasmer in the combined row below "Placed on"
- **Progress dashboard** — a 9×9 D/T grid with clickable empty cells that open the map filtered to that difficulty and terrain

### Data Import
- Import your **My Finds Pocket Query** GPX file to populate all challenge data at once
- All parsing happens locally in your browser — nothing is uploaded anywhere
- Last updated date and total find count are shown in the import card
- A stale data warning appears if auto-detection has run since your last import

---

## Installation

### Chrome / Edge (Developer Mode)
1. Clone or download this repo
2. Open `chrome://extensions`
3. Enable **Developer mode** (top-right toggle)
4. Click **Load unpacked** and select the repo folder

### Firefox (Temporary)
1. Open `about:debugging#/runtime/this-firefox`
2. Click **Load Temporary Add-on…**
3. Select `manifest.json` from the repo folder

> For permanent Firefox installation the extension must be signed. See [Firefox signing docs](https://extensionworkshop.com/documentation/publish/signing-and-distribution-overview/).

---

## Getting Started

### Import your finds
1. Log in to [geocaching.com](https://www.geocaching.com)
2. Go to [Pocket Queries](https://www.geocaching.com/pocket/)
3. Under **"My Finds"** click **"Add to Queue"**
4. Wait for the pocket query to process (you'll get an email)
5. Download the ZIP from the same page
6. Unzip it to get the `.gpx` file inside
7. Click the extension icon → **Import GPX / View Stats**
8. Load the `.gpx` file and click **Import**

### Using the extension
- Browse any `geocaching.com/geocache/GC*` page — Jasmer and Fizzy labels appear inline
- Open the map at `geocaching.com/play/map` — a combined status row appears below "Placed on" in the cache preview panel
- Click any **0** cell in the progress grids to open the map filtered to that month or D/T combo
- Re-import your GPX after logging new finds to keep counts accurate

---

## File Structure

```
cache-companion/
├── manifest.json   — Extension manifest (MV3, Chrome + Firefox)
├── content.js      — Cache detail page injection + Jasmer auto-detection
├── map.js          — Map preview panel injection
├── options.html    — Options page UI
├── options.js      — GPX import + progress dashboards
├── popup.html      — Toolbar popup UI
├── popup.js        — Popup summary stats
└── README.md
```

---

## Creating a Release

To build the `.xpi` for distribution:

```bash
zip -r cache-companion.xpi manifest.json content.js map.js options.html options.js popup.html popup.js
```

Upload `cache-companion.xpi` as an asset on the [GitHub Releases](../../releases) page.

---

## Changelog

### v2.0.0
- Renamed from **Jasmer Helper** to **Cache Companion**
- Added **Fizzy challenge** tracking (9×9 D/T grid)
- Added **per-challenge toggles** — enable/disable challenges independently
- GPX import now populates both Jasmer and Fizzy data simultaneously
- Map panel now shows a combined Jasmer · Fizzy row below "Placed on"
- Moved "Last updated" and "Total finds" to the import card (global stats)
- Fizzy label injected next to Difficulty/Terrain on cache detail pages

### v1.0.0
- Initial release with Jasmer challenge support

---

## Roadmap
- [ ] Per-challenge toggle (enable/disable individual challenges) ✅ done in v2.0.0
- [ ] Fizzy challenge (D/T grid) ✅ done in v2.0.0
- [ ] Chrome Web Store / Firefox Add-ons listing
