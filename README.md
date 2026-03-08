# 🧭 Cache Companion

A Manifest V3 browser extension for **Chrome** and **Firefox** that helps you track geocaching challenge progress.

Currently supported challenges:
- **Jasmer** — find a cache hidden in each month of every year since May 2000

More challenges (Fizzy, etc.) coming soon.

---

## Features

### Jasmer Challenge
- **Cache detail pages** (`geocaching.com/geocache/GC*`) — displays `— Jasmer: needed` or `— Jasmer: done (N)` next to the hidden date
- **Map preview** (`geocaching.com/play/map`) — same label appears in the cache info panel
- **Progress dashboard** — a year × month grid showing your completion status, with clickable empty cells that open the map filtered to caches hidden that month
- **Auto-detection** — if you visit a cache detail page showing "Found It!" for a month not in your data, it's automatically noted and you're prompted to re-import your GPX

### Data Import
- Import your **My Finds Pocket Query** GPX file to populate your data
- All parsing happens locally in your browser — nothing is uploaded anywhere
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
- Browse any `geocaching.com/geocache/GC*` page — the Jasmer label appears next to the hidden date
- Open the map at `geocaching.com/play/map` — the label appears in cache preview panels
- Click any **0** cell in the progress grid to open the map filtered to caches hidden that month
- Re-import your GPX after logging new finds to keep counts accurate

---

## File Structure

```
cache-companion/
├── manifest.json   — Extension manifest (MV3, Chrome + Firefox)
├── content.js      — Cache detail page injection + auto-detection
├── map.js          — Map preview panel injection
├── options.html    — Options page UI
├── options.js      — GPX import + progress dashboard
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

## Roadmap
- [ ] Fizzy challenge (D/T grid)
- [ ] Per-challenge toggle (enable/disable individual challenges)
- [ ] Chrome Web Store / Firefox Add-ons listing
