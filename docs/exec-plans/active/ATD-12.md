# ATD-12 — Per-Aircraft Detail Pages with Gallery, Full Specs, and Prefilled Booking CTA

## Goal

**DONE WHEN:**

- Every fleet entry has a dedicated detail page reachable from the fleet tab listing via a
  "View details" link. The existing tab navigation and summary cards continue to render
  and behave as before.
- Each detail page has a stable, deep-linkable URL (`#/fleet/light`, `#/fleet/mid`,
  `#/fleet/heavy`). Direct browser load or page reload of that URL renders the correct
  aircraft page without requiring prior in-page navigation.
- The detail page shows a browsable image gallery. At least the first image is visible
  without user interaction. Prev/next controls and dot indicators appear only when more
  than one image exists. When zero images are available, a graceful placeholder region
  is shown instead of a broken gallery.
- The detail page shows the full specification set for that aircraft — all spec fields
  stored against the fleet entry — not just the four-field summary shown in the fleet tab.
- A "Book this aircraft" CTA on the detail page navigates back to the main page, scrolls
  to the booking form, and pre-populates the booking form's jet selector field with that
  aircraft — requiring no manual aircraft selection.
- A URL constructed with a non-existent aircraft ID (e.g. `#/fleet/unknown`) renders a
  clear 404-style "not found" state rather than a blank or broken page.
- If no valid FLEET entry can be resolved from the URL, a recoverable error state is
  shown with an option to return to the fleet listing. No partially-rendered spec table
  is left visible.
- All interactive elements on the detail page (gallery prev/next, dot selectors, back
  link, booking CTA) are keyboard-reachable, have visible focus indicators, and are
  announced meaningfully by screen readers.
- Gallery, specification table, and booking CTA are fully usable on mobile (no horizontal
  scroll, no overlapping elements at ≤ 560 px).
- `npm run build` exits 0.

---

## Summary of approach

### Routing

The app is a static SPA with no router. Rather than adding `react-router-dom` (a new
runtime dependency), we implement a **minimal custom hash router** directly in `App`.
A `parseHash()` pure function maps `window.location.hash` to a route descriptor
`{ view: 'home' }` or `{ view: 'fleet-detail', id: string }`. A `useHashRoute()` hook
wraps `useState` + a `hashchange` listener + mount-time read so that:

- Direct URL loads (`window.location.hash` on mount) are resolved immediately.
- `hashchange` events (forward/back, programmatic hash writes) update the React route state.
- A `navigate(hash)` helper is returned so components can drive navigation without
  touching `window.location` directly.

`App` reads the route and renders either the full existing main-page composition or the
new `FleetDetailPage` component. The existing page scroll, `useScrollReveal`, and all
existing state (`darkMode`, `settingsOpen`, `bookingTo`, new `bookingJet`) live in `App`
regardless of which view is active.

### Data model expansion

`src/data.js` FLEET entries gain two new fields:
- `images`: `string[]` — array of image paths under `public/fleet/` (or empty array if
  no images are available). The gallery handles 0, 1, and N images distinctly.
- Additional `specs` entries: the existing 4-field `specs` array is expanded with
  supplementary fields (crew, baggage, range with reserves, ceiling, cabin width, cabin
  length). A `FLEET_SUMMARY_SPEC_COUNT = 4` constant marks how many the fleet tab
  listing shows; the detail page shows all.

### New components (all added to `src/App.jsx` following single-file convention)

| Component | Purpose |
|---|---|
| `Gallery` | Browsable image gallery with 0/1/N edge-case handling and ARIA labels |
| `SpecTable` | Renders all spec entries in a two-column definition grid |
| `FleetDetailPage` | Full detail page layout: back nav, gallery, spec table, booking CTA |
| `FleetNotFound` | 404 state with "Back to fleet" recovery link |

### Booking jet prefill

`App` gains `bookingJet` state (`null` or a FLEET entry). A new `handleBookJet(jet)`
callback sets `bookingJet`, writes `#` to the hash (triggering a route transition back
to the main page), then scrolls to `#book` with `setTimeout(0)` after the DOM is
ready. `Booking` gains a `jet` and `onJetChange` prop. The form gains a jet selector
field that defaults to auto-selection-by-pax when `null`, otherwise shows the prefilled
aircraft. The selector is rendered between the `pax` field and the submit button.

### Why no react-router-dom

Hash-based routing requires zero server configuration (critical for `npm run preview` and
direct file:// opens) and zero new npm dependencies. The custom router is ~25 lines of
code. This approach is consistent with the existing hash-anchor navigation pattern the
app already uses.

---

## Related code

- `src/data.js` — Add `images` array and expanded `specs` entries to all three FLEET
  objects. Add `FLEET_SUMMARY_SPEC_COUNT = 4` export. No other data logic changes.
- `src/App.jsx` — All changes live here (single-file convention):
  - `parseHash()` — pure hash-to-route function (new)
  - `useHashRoute()` — routing hook (new)
  - `Gallery` — gallery component (new)
  - `SpecTable` — full spec renderer (new)
  - `FleetDetailPage` — detail page (new)
  - `FleetNotFound` — 404 state (new)
  - `Fleet` — each tab button gains a "View details" link alongside existing content
  - `Booking` — gains `jet` / `onJetChange` props; adds jet selector field
  - `App` — gains `bookingJet` state + `handleBookJet` callback; routing logic replaces
    the existing flat render
- `src/styles.css` — New sections appended: `.fleet-detail`, `.gallery`, `.spec-table`,
  `.fleet-not-found`, responsive rules, dark-mode overrides for new components.
- `public/fleet/` — New directory. Placeholder image files (`light-1.jpg`, `mid-1.jpg`,
  etc.) are placed here. The gallery renders these paths. If images are absent at build
  time the gallery empty-state renders instead (AC: graceful fallback).

---

## Current state

- **Fleet component** (App.jsx lines 272–316): Tab-based with local `active` state.
  Each tab renders name + klass; the display panel renders glyph, badge, name, blurb,
  and the 4-field `specs` grid. No links to any detail view.
- **FLEET data** (data.js lines 30–76): Three entries with `id`, `name`, `klass`,
  `glyph`, `blurb`, `rate`, and `specs[4]`. No `images` field.
- **Routing**: None. `App` renders a flat component tree unconditionally. Hash anchors
  (`#fleet`, `#book`, etc.) are native browser scroll targets only.
- **Booking component** (App.jsx lines 181–268): Jet auto-selected from pax count on
  submit. No jet selector UI. No `jet` prop.
- **No images**: `public/` contains only `favicon.svg`. No aircraft photography assets.
- **No tests, no lint** (`package.json` has only `dev`, `build`, `preview`).

---

## Structural considerations

- **Hierarchy**: `App` becomes the route dispatcher. The existing main-page component
  tree and the new `FleetDetailPage` are peers at the same level, both direct children
  of `App`'s render output. This is the correct layer: routing decisions belong at the
  application root.
- **Abstraction**: `useHashRoute` encapsulates all hash parsing and event subscription.
  Components navigate by calling `navigate(hash)` or writing to `window.location.hash`
  — they never parse the hash themselves.
- **Modularity**: `Gallery` is self-contained and reusable (takes `images[]` + optional
  `alt` prefix). `SpecTable` is a pure renderer for `[label, value][]`. Neither reaches
  outside its props. `FleetDetailPage` composes them.
- **Encapsulation**: The FLEET summary spec count (`FLEET_SUMMARY_SPEC_COUNT = 4`) is a
  single exported constant — the fleet listing reads it as a slice limit, the detail page
  ignores it and renders all. The spec array is not split into two arrays; only the
  display layer slices it.
- **App.jsx size**: This file will grow significantly (est. 250–300 new lines). This is
  acceptable for the demo's single-file convention, but future tickets should consider
  splitting components into `src/components/`.

---

## Refactoring

No structural refactoring is required before the feature work. The Booking jet-selector
addition is a contained prop addition (not a state restructure) — the same lift-to-App
pattern already established by ATD-10 applies directly.

---

## Implementation steps

- [ ] **Step 1 — Expand FLEET data in `src/data.js`**
  → Each fleet entry gains `images: string[]` and additional `specs` entries. Export
  `FLEET_SUMMARY_SPEC_COUNT`.

  Add to data.js after `FLEET`:
  ```js
  // Number of specs shown in the fleet tab summary; detail page shows all.
  export const FLEET_SUMMARY_SPEC_COUNT = 4;
  ```

  Update each FLEET entry to add `images` and extend `specs`:
  ```js
  {
    id: "light",
    name: "The Meridian",
    // ... existing fields ...
    images: ["/fleet/light-1.jpg", "/fleet/light-2.jpg"],
    specs: [
      ["Passengers", "6"],
      ["Range", "1,800 nm"],
      ["Cruise", "470 kts"],
      ["Cabin height", "4.9 ft"],
      // extended:
      ["Cabin width", "5.1 ft"],
      ["Baggage", "60 cu ft"],
      ["Max altitude", "45,000 ft"],
      ["Crew", "2 pilots"],
    ],
  },
  ```
  Apply equivalent expanded specs to `mid` and `heavy` entries. Keep existing 4 fields
  first so the fleet listing slice (`specs.slice(0, FLEET_SUMMARY_SPEC_COUNT)`) is
  backward-compatible.

  **Note on images**: Add placeholder files to `public/fleet/` for each aircraft. If no
  real photographs are available, placeholder SVGs (solid gradient fills using brand
  colors) suffice; the gallery empty-state fallback handles the `images: []` case.

- [ ] **Step 2 — Add hash routing utilities to `src/App.jsx`**
  → Pure `parseHash()` function and `useHashRoute()` hook.

  ```jsx
  // Returns { view: 'home' } or { view: 'fleet-detail', id: string }
  function parseHash(hash) {
    const m = hash.match(/^#\/fleet\/([\w-]+)$/);
    if (m) return { view: 'fleet-detail', id: m[1] };
    return { view: 'home' };
  }

  function useHashRoute() {
    const [route, setRoute] = useState(() => parseHash(window.location.hash));

    useEffect(() => {
      const handler = () => setRoute(parseHash(window.location.hash));
      window.addEventListener('hashchange', handler);
      return () => window.removeEventListener('hashchange', handler);
    }, []);

    const navigate = useCallback((hash) => {
      window.location.hash = hash;
    }, []);

    return { route, navigate };
  }
  ```

  Import `useCallback` from React at the top of the file.

- [ ] **Step 3 — Build `Gallery` component**
  → Handles 0 images (placeholder), 1 image (no controls), N images (prev/next + dots).

  ```jsx
  function Gallery({ images = [], altPrefix = "Aircraft" }) {
    const [idx, setIdx] = useState(0);
    const count = images.length;

    // Reset index when images array identity changes (different aircraft)
    useEffect(() => { setIdx(0); }, [images]);

    if (count === 0) {
      return (
        <div className="gallery gallery--empty" role="img" aria-label="No images available">
          <div className="gallery__placeholder">
            <span aria-hidden="true">✦</span>
            <p>No images available</p>
          </div>
        </div>
      );
    }

    const prev = () => setIdx((i) => (i - 1 + count) % count);
    const next = () => setIdx((i) => (i + 1) % count);

    return (
      <div className="gallery" role="region" aria-label="Aircraft gallery">
        <div className="gallery__stage">
          <img
            className="gallery__img"
            src={images[idx]}
            alt={`${altPrefix} — image ${idx + 1} of ${count}`}
          />
          {count > 1 && (
            <>
              <button
                className="gallery__nav gallery__nav--prev"
                onClick={prev}
                aria-label="Previous image"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none"
                     stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M13 4l-6 6 6 6" />
                </svg>
              </button>
              <button
                className="gallery__nav gallery__nav--next"
                onClick={next}
                aria-label="Next image"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none"
                     stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M7 4l6 6-6 6" />
                </svg>
              </button>
            </>
          )}
        </div>
        {count > 1 && (
          <div className="gallery__dots" role="tablist" aria-label="Gallery images">
            {images.map((_, i) => (
              <button
                key={i}
                role="tab"
                className={`gallery__dot ${i === idx ? 'active' : ''}`}
                aria-label={`Image ${i + 1}`}
                aria-selected={i === idx}
                onClick={() => setIdx(i)}
              />
            ))}
          </div>
        )}
      </div>
    );
  }
  ```

- [ ] **Step 4 — Build `SpecTable` component**
  → Renders all `[label, value]` pairs from specs in a two-column grid.

  ```jsx
  function SpecTable({ specs }) {
    return (
      <div className="spec-table" role="table" aria-label="Aircraft specifications">
        {specs.map(([label, value]) => (
          <div key={label} className="spec-table__row" role="row">
            <span className="spec-table__label" role="rowheader">{label}</span>
            <b className="spec-table__value" role="cell">{value}</b>
          </div>
        ))}
      </div>
    );
  }
  ```

- [ ] **Step 5 — Build `FleetNotFound` component**
  → 404 state for unknown aircraft IDs.

  ```jsx
  function FleetNotFound({ onBack }) {
    return (
      <div className="fleet-not-found wrap">
        <button className="fleet-detail__back" onClick={onBack}>
          ← Back to fleet
        </button>
        <div className="fleet-not-found__body">
          <span className="fleet-not-found__glyph" aria-hidden="true">✦</span>
          <h2 className="serif">Aircraft not found</h2>
          <p>We couldn't find an aircraft matching that identifier.</p>
          <button className="btn btn--gold" onClick={onBack}>View all aircraft</button>
        </div>
      </div>
    );
  }
  ```

- [ ] **Step 6 — Build `FleetDetailPage` component**
  → Full detail page layout. Receives `jet` (FLEET entry or undefined), `onBack`,
  `onBookJet`. Handles the not-found/error case internally.

  ```jsx
  function FleetDetailPage({ jet, onBack, onBookJet }) {
    // Not found / error state
    if (!jet) {
      return <FleetNotFound onBack={onBack} />;
    }

    return (
      <div className="fleet-detail">
        {/* Reuse existing Nav for consistent header */}
        {/* Nav is rendered at App level; detail page gets a back link instead */}
        <div className="fleet-detail__back-bar wrap">
          <button className="fleet-detail__back" onClick={onBack}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none"
                 stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M11 4L6 9l5 5" />
            </svg>
            Back to fleet
          </button>
        </div>

        <div className="fleet-detail__body wrap">
          {/* Header */}
          <header className="fleet-detail__header">
            <span className="badge">{jet.klass}</span>
            <h1 className="serif fleet-detail__title">{jet.name}</h1>
            <p className="fleet-detail__blurb">{jet.blurb}</p>
          </header>

          {/* Gallery */}
          <section className="fleet-detail__gallery" aria-label="Gallery">
            <Gallery images={jet.images ?? []} altPrefix={jet.name} />
          </section>

          {/* Full specifications */}
          <section className="fleet-detail__specs-section">
            <h2 className="serif fleet-detail__section-title">Specifications</h2>
            <SpecTable specs={jet.specs} />
          </section>

          {/* Book CTA */}
          <div className="fleet-detail__cta">
            <button
              className="btn btn--gold"
              onClick={() => onBookJet(jet)}
            >
              Book {jet.name} <span className="arrow">→</span>
            </button>
          </div>
        </div>
      </div>
    );
  }
  ```

- [ ] **Step 7 — Update `Fleet` component to add "View details" links**
  → Each fleet tab gains a detail page link. Existing tab behavior and summary display
  are unchanged.

  Pass `onViewDetail` prop to `Fleet`. Add a link inside each tab button:

  ```jsx
  function Fleet({ onViewDetail }) {
    // ... existing state ...

    return (
      // ... existing section/wrap/section-head ...
          <div className="fleet__tabs">
            {FLEET.map((j) => (
              <div key={j.id} className="fleet__tab-group">
                <button
                  className={`fleet__tab ${j.id === active ? "active" : ""}`}
                  onClick={() => setActive(j.id)}
                >
                  <h3>{j.name}</h3>
                  <span>{j.klass}</span>
                </button>
                <a
                  className="fleet__tab-detail-link"
                  href={`#/fleet/${j.id}`}
                  onClick={(e) => { e.preventDefault(); onViewDetail(j.id); }}
                >
                  View details →
                </a>
              </div>
            ))}
          </div>

          <div className="fleet__display" key={jet.id}>
            {/* ... existing display content unchanged ... */}
            {/* Add view details link in display panel too */}
            <div className="fleet__display-actions">
              <a
                className="btn btn--ghost"
                href={`#/fleet/${jet.id}`}
                onClick={(e) => { e.preventDefault(); onViewDetail(jet.id); }}
              >
                Full specifications →
              </a>
            </div>
          </div>
      // ...
    );
  }
  ```

  Import `FLEET_SUMMARY_SPEC_COUNT` and slice specs in the fleet display:
  ```jsx
  {jet.specs.slice(0, FLEET_SUMMARY_SPEC_COUNT).map(([label, value]) => (
    // ... unchanged rendering ...
  ))}
  ```

- [ ] **Step 8 — Update `Booking` to accept and display jet prefill**
  → Gains `jet` and `onJetChange` props. Adds a jet selector field to the form.
  Auto-selection logic falls back to pax-based when `jet` is null.

  ```jsx
  function Booking({ to, onToChange, jet: propJet, onJetChange }) {
    // ... existing state ...

    const onSubmit = (e) => {
      e.preventDefault();
      // If a jet is prefilled via prop, use it; otherwise auto-select by pax
      const jet = propJet ?? (pax <= 6 ? FLEET[0] : pax <= 9 ? FLEET[1] : FLEET[2]);
      const q = quote(from, to, Number(pax), jet);
      // ... rest unchanged ...
    };

    return (
      <section className="wrap booking" id="book">
        <div className="booking__card">
          <form className="booking__form" onSubmit={onSubmit}>
            {/* ... existing from, to, date, pax fields unchanged ... */}
            <div className="field">
              <label htmlFor="jet">Aircraft</label>
              <select
                id="jet"
                value={propJet?.id ?? "auto"}
                onChange={(e) => {
                  const selected = FLEET.find((j) => j.id === e.target.value);
                  onJetChange(selected ?? null);
                }}
              >
                <option value="auto">Recommended by guests</option>
                {FLEET.map((j) => (
                  <option key={j.id} value={j.id}>{j.name} ({j.klass})</option>
                ))}
              </select>
            </div>
            {/* ... submit button unchanged ... */}
          </form>
          {/* ... quote result unchanged ... */}
        </div>
      </section>
    );
  }
  ```

  Update `booking__form` grid in CSS: `grid-template-columns: repeat(5, 1fr) auto` (adds
  jet column). Responsive breakpoint adjustment as needed.

- [ ] **Step 9 — Update `App` to wire routing, bookingJet state, and new callbacks**
  → Integrates all new pieces.

  ```jsx
  export default function App() {
    const root = useRef(null);
    useScrollReveal();

    const { route, navigate } = useHashRoute();

    const [darkMode, setDarkMode] = useState(
      () => localStorage.getItem("theme") === "dark"
    );
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [bookingTo, setBookingTo] = useState("LCY");
    const [bookingJet, setBookingJet] = useState(null);

    function handleSelectDestination(code) {
      setBookingTo(code);
      document.getElementById("book")?.scrollIntoView({ behavior: "smooth" });
    }

    function handleViewDetail(id) {
      navigate(`#/fleet/${id}`);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }

    function handleBookJet(jet) {
      setBookingJet(jet);
      navigate("#");
      setTimeout(() => {
        document.getElementById("book")?.scrollIntoView({ behavior: "smooth" });
      }, 50);
    }

    // ... existing darkMode and loaded effects unchanged ...

    // --- Route: fleet detail page ---
    if (route.view === 'fleet-detail') {
      const jet = FLEET.find((j) => j.id === route.id);
      return (
        <div ref={root}>
          <Nav
            darkMode={darkMode}
            onToggleTheme={() => setDarkMode((d) => !d)}
            onToggleSettings={() => setSettingsOpen((s) => !s)}
          />
          <FleetDetailPage
            jet={jet}
            onBack={() => { navigate("#fleet"); }}
            onBookJet={handleBookJet}
          />
          <SettingsPanel
            open={settingsOpen}
            onClose={() => setSettingsOpen(false)}
          />
          <BackToTop />
        </div>
      );
    }

    // --- Route: home (default) ---
    return (
      <div ref={root}>
        <Nav
          darkMode={darkMode}
          onToggleTheme={() => setDarkMode((d) => !d)}
          onToggleSettings={() => setSettingsOpen((s) => !s)}
        />
        <Hero />
        <Booking
          to={bookingTo}
          onToChange={setBookingTo}
          jet={bookingJet}
          onJetChange={setBookingJet}
        />
        <Fleet onViewDetail={handleViewDetail} />
        <Destinations onSelectDestination={handleSelectDestination} />
        <Membership />
        <CTA />
        <Footer />
        <SettingsPanel
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
        />
        <BackToTop />
      </div>
    );
  }
  ```

- [ ] **Step 10 — Add styles for new components in `src/styles.css`**
  → New sections appended after existing rules.

  **Gallery** (`.gallery`):
  - `.gallery` — relative container, `border-radius: 18px`, `overflow: hidden`
  - `.gallery__stage` — relative, aspect-ratio 16/9 or fixed height ~320px
  - `.gallery__img` — `width: 100%; height: 100%; object-fit: cover`
  - `.gallery__nav` — absolute positioned prev/next, circular button, glass effect
  - `.gallery__dots` — flex row, centered, gap 8px, below stage
  - `.gallery__dot` — 8px circle; `.active` filled with `var(--blue)`
  - `.gallery--empty` — centered placeholder with `var(--paper-2)` background, `var(--teal)` glyph
  - Focus styles: `:focus-visible` outline on nav buttons and dots using `var(--blue)`

  **Fleet detail page** (`.fleet-detail`):
  - `.fleet-detail` — full viewport min-height, `var(--paper)` background, padding-top
    equal to nav height (76px) to avoid nav overlap
  - `.fleet-detail__back-bar` — padding 24px 0 16px; back button as ghost styled link
  - `.fleet-detail__back` — flex, gap 6px, font 0.86rem, opacity 0.7 → 1 on hover
  - `.fleet-detail__body` — `display: grid; grid-template-columns: 1fr; gap: 56px;`
  - `.fleet-detail__header` — heading + badge + blurb; serif title clamp(2rem, 5vw, 4rem)
  - `.fleet-detail__section-title` — section headings (h2), font-size 1.8rem, margin-bottom 24px
  - `.fleet-detail__cta` — margin-top 8px, padding-bottom 80px
  - `.fleet-detail__display-actions` — margin-top 28px

  **Spec table** (`.spec-table`):
  - `display: grid; grid-template-columns: repeat(2, 1fr); gap: 0;`
  - `.spec-table__row` — `border-top: 1px solid var(--line); padding: 16px 0; display: contents`
    (or `display: grid` sub-grid pattern — use simple flex per row for compatibility)
  - Actually: `display: flex; justify-content: space-between; border-top: ...`
  - `.spec-table__label` — font-size 0.72rem, uppercase, letter-spacing, `var(--ink-faint)`
  - `.spec-table__value` — font-family Bricolage, font-size 1.1rem, font-weight 700

  **Not found** (`.fleet-not-found`):
  - `text-align: center; padding: 120px 0; display: flex; flex-direction: column`
  - `.fleet-not-found__glyph` — font-size 3rem, color `var(--teal)`, margin-bottom 16px
  - `.fleet-not-found__body` — flex column, align-items center, gap 16px

  **Responsive additions**:
  - `@media (max-width: 980px)`: gallery aspect-ratio relaxes, booking form gains a new
    row for the jet selector (5→3 column grid or 1-column stack)
  - `@media (max-width: 560px)`: gallery height 220px; spec-table single-column display;
    detail back-bar smaller padding

  **Dark mode additions**:
  - `.gallery__nav` glass effect uses `rgba(8, 19, 51, 0.55)` in light / `rgba(0,0,0,0.5)`
    in dark — can be driven by CSS variables already defined

- [ ] **Step 11 — Add placeholder images to `public/fleet/`**
  → Create the directory and add at least one placeholder image per aircraft.

  If real photographs are unavailable, create SVG placeholders:
  ```
  public/fleet/light-1.jpg   (or .svg)
  public/fleet/light-2.jpg
  public/fleet/mid-1.jpg
  public/fleet/mid-2.jpg
  public/fleet/heavy-1.jpg
  public/fleet/heavy-2.jpg
  ```

  Minimum: one image per aircraft so the gallery single-image path is testable. Leave
  an aircraft at `images: []` to verify the empty-state fallback.

- [ ] **Step 12 — Verify accessibility and responsive behavior**
  → Manual checklist (no automated test tooling is available):

  - Keyboard: Tab to "View details" link in fleet tab → Enter → detail page loads.
    Tab through gallery prev/next and dot buttons; each should receive focus, have
    visible `:focus-visible` ring, and fire on Enter/Space.
  - Screen reader: `role="region" aria-label="Aircraft gallery"` on gallery wraps it as
    a landmark. `aria-label="Previous image"` / `"Next image"` on nav buttons. Dots use
    `role="tab" aria-selected`.
  - Responsive: At 360px width, all three detail page sections (gallery, spec table, CTA)
    should be visible without horizontal scroll. Spec table collapses to single column
    at 560px.
  - Direct URL load: Navigate to `http://localhost:5173/#/fleet/heavy` directly → correct
    aircraft detail page loads.
  - Reload: Press ⌘R on a detail page → same aircraft detail page loads.
  - Invalid ID: Navigate to `#/fleet/unknown` → not-found state shows.
  - Back navigation: Click "Back to fleet" → main page scrolls to `#fleet`.
  - Fleet listing regression: All three tabs still render and switch correctly. Summary
    specs (4 fields) are still shown. New "View details" and "Full specifications" links
    appear without breaking layout.
  - Booking prefill: On detail page, click "Book The Sovereign" → main page, booking
    form scrolls into view, Aircraft selector shows "The Sovereign (Ultra-Long-Range)".

---

## Impact assessment

- **Code paths affected**:
  - `App` render path: gains route guard at top of render, new state, new callbacks.
  - `Fleet` render path: tabs gain extra links; display panel gains CTA link; specs
    array sliced to first 4.
  - `Booking` render path: form gains jet selector field; submit logic uses propJet when
    set; one new column in the booking form grid.
  - All new component render paths are isolated within their own functions.
- **Data or schema impact**:
  - `FLEET` entries gain `images: string[]` and extended `specs` rows. The `rate` field
    and existing 4 specs entries are untouched — `quote()` and the fleet listing both
    continue to function without change.
  - `FLEET_SUMMARY_SPEC_COUNT = 4` is a new export; nothing imports it yet (Fleet
    component will import it).
- **Dependency or API impact**:
  - No new npm packages.
  - No new external API calls.
  - Image files added to `public/fleet/` are served as static assets by Vite — no config
    changes needed.
- **Booking form layout**: The jet selector adds a fifth field. The existing
  `grid-template-columns: repeat(4, 1fr) auto` CSS rule must become
  `grid-template-columns: repeat(5, 1fr) auto`. The responsive 980px breakpoint already
  collapses to a 2-column grid; adjust to `repeat(3, 1fr)` or `1fr 1fr` as appropriate.
- **`useScrollReveal` hook**: The hook queries `.reveal` elements globally on mount. On
  the detail page, if any new elements carry `.reveal`, they will be picked up
  automatically. The fleet detail page layout does not use `.reveal` for content sections
  (detail pages load directly, not via scroll). This is fine.

---

## Validation

- **Build check**: `npm run build` — must exit 0 with no errors.
- **Preview check**: `npm run preview` — navigate to `http://localhost:4173/#/fleet/mid`
  directly; confirm the detail page loads without prior navigation.
- **Manual verification checklist** (see Step 12 above for detailed steps).
- **No lint or typecheck scripts** — none to run.
- **No test suite** — none to write or update.

---

## Uncertainty flags

- **Image assets**: No aircraft images exist in the repo. The plan requires adding files
  to `public/fleet/`. If real photos are unavailable, placeholder SVGs will satisfy the
  gallery ACs but will not represent the intended end-state. The implementer should either
  source aviation stock photos or note that images are a pending content task.
- **Booking form width at 980px breakpoint**: Adding a fifth booking form field may
  stress the 980px responsive breakpoint. The exact column arrangement (3-column vs
  2-column vs 1-column) should be validated visually during implementation.
- **`handleBookJet` timing**: The `setTimeout(0)` pattern used to scroll to `#book` after
  navigating home is a pragmatic workaround for the hash-change → re-render → DOM-ready
  sequence. On slow devices this may occasionally produce a scroll before the booking
  section is in its final position. A `useEffect` watching `route.view` transitioning to
  `'home'` with a pending bookingJet flag is a more robust alternative if the setTimeout
  approach is unreliable in testing.
- **`useScrollReveal` on detail page**: The hook (`els = document.querySelectorAll('.reveal')`)
  runs once on App mount. When navigating to the detail page (which is a conditional render
  replacement, not a DOM mount/unmount of `App` itself), the hook does not re-run. If any
  `.reveal` elements are added inside `FleetDetailPage`, they will never receive the `in`
  class. Either avoid `.reveal` in the detail page, or extend the hook to accept a trigger
  dependency.
- **`Back to fleet` hash target**: `navigate("#fleet")` writes `#fleet` to the hash,
  which triggers a native scroll to `id="fleet"`. This works because the `Fleet` section
  has `id="fleet"` (App.jsx line 277). The `hashchange` handler will fire, `parseHash`
  will return `{ view: 'home' }` (the `#fleet` pattern doesn't match `/^#\/fleet\/`), and
  the app will render the home view. This is correct behavior — but worth verifying that
  the native scroll to `#fleet` isn't suppressed by React's re-render timing.

---

## Open questions

None that block implementation. All AC points have been resolved against the codebase.
Assumptions made:
1. Hash-based routing (`#/fleet/{id}`) is preferred over adding `react-router-dom`.
2. "Full specifications" means expanding `specs[]` beyond the current 4 fields — the
   detail page shows all; the fleet listing continues to show the first 4 via slice.
3. "Data fails to load" AC maps to invalid/unknown aircraft ID (no async data in this app).
4. Images are provided as static assets in `public/fleet/`; an empty `images: []` triggers
   the graceful empty-state fallback.
5. Components continue to be added to `src/App.jsx` (single-file convention).
