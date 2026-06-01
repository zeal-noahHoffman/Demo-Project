# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # start Vite dev server (hot-reload)
npm run build     # production build → dist/
npm run preview   # serve the production build locally
```

There is no lint, typecheck, or test script — `package.json` defines only the three above.

## Architecture

**Skyline Airways** is a static single-page React demo (no backend, no auth, no router).

### Data layer — `src/data.js`

All application data lives here as plain exported arrays/constants:

| Export | Purpose |
|---|---|
| `AIRPORTS` | Master list of airports with `{ code, city, country, lat, lng }`. Used to populate booking dropdowns and as inputs to the quote engine. |
| `DESTINATIONS` | Curated set of destination cards for the grid: `{ code, city, country, from, hours }`. `from` and `hours` are **display strings only** — they are not derived from `AIRPORTS` or the quote engine. |
| `FLEET` | Three jet tiers (`light`, `mid`, `heavy`) with display specs and a `rate` (USD/hr) used by the quote engine. |
| `quote(fromCode, toCode, passengers, jet)` | Haversine distance → flight hours (adds 0.55 h overhead) → price (rounded to $500). Returns `null` for invalid/identical pair. |
| `distanceKm(a, b)` | Pure haversine helper; `a` and `b` are `AIRPORTS` entries. |

The quote engine uses its own `cruiseKmh = 880` constant — independent of the `specs` display strings in `FLEET`.

### UI layer — `src/App.jsx`

All components live in a single file, rendered top-to-bottom in `App`:

```
Nav → Hero → Booking → Fleet → Destinations → Membership → CTA → Footer
```

- **`Destinations`** maps over `DESTINATIONS` and renders each entry as an `<a href="#book">` card, displaying `d.hours`, `d.from`, `d.code`, `d.city`, `d.country` verbatim — no transformation.
- **`Booking`** consumes `AIRPORTS` for selects and calls `quote()` on submit.
- **`Fleet`** renders the active `FLEET` entry; tab state is local.
- Scroll-reveal animations use the `.reveal` CSS class wired to an `IntersectionObserver` via the `useScrollReveal` hook at the top of `App.jsx`.

### Styles — `src/styles.css`

Single flat stylesheet using CSS custom properties (defined on `:root`). Key aliases: `--brass-bright` maps to `--blue-bright`; `--horizon` is the error/accent red.
