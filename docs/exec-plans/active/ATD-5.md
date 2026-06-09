# ATD-5 — Add a Settings Panel Reachable from the Navbar

## Goal

**DONE WHEN:**

- The `["Hello World", "#"]` entry in the `LINKS` array is gone and "Hello World" no longer
  appears anywhere in the rendered app.
- A "Settings" entry appears in the navbar in its place; clicking it opens an in-page settings
  panel.
- The panel displays at least two new preference controls — "Preferred currency"
  (USD / EUR / GBP) and "Distance units" (km / miles) — neither of which existed before.
- The panel is styled with the site's existing CSS custom properties and looks consistent with
  the rest of the UI.
- The existing theme toggle and the other nav links (Fleet, Destinations, Membership) continue
  to work without modification.
- `npm run build` succeeds and all existing sections render normally.
- State is local (no persistence required).

---

## Summary of approach

`App.jsx` holds all components in a single file. The `LINKS` array drives `Nav`'s link
rendering via a `.map()`. The cleanest extension:

1. Replace `["Hello World", "#"]` with `["Settings", null]` — a `null` href acts as a
   sentinel meaning "action, not navigation," keeping the array homogeneous in shape while
   distinguishing interactive triggers from scroll anchors.
2. The `Nav` render loop conditionally outputs a `<button>` (styled to match `.nav__links a`)
   for entries with a `null` href, and the usual `<a>` for all others. A single new prop
   `onToggleSettings` is threaded from `App` through to `Nav`.
3. A new `SettingsPanel` component — a modal overlay — is added to `App.jsx` and rendered
   inside `App`. Its two preference controls (`currency`, `distanceUnit`) hold local state
   inside the component. `settingsOpen` state lives in `App` so that both `Nav` (which fires
   the toggle) and `App` (which renders the panel) stay in sync.
4. `styles.css` gains a `.nav__link-btn` rule (mirrors `.nav__links a`) plus the panel and
   overlay styles, all built from existing CSS custom properties.

Alternative considered and rejected: keeping Settings in a separate `<button>` appended after
the `LINKS.map()` (rather than inside it). Rejected because the ticket explicitly says to
replace the `LINKS` entry — the conditional render inside the map honors that while remaining
readable.

---

## Related code

- `src/App.jsx` — All touch points live here.
  - `LINKS` (lines 28–33) — the array to update.
  - `Nav` (lines 46–113) — receives new `onToggleSettings` prop; render loop gains a
    conditional branch; key changes from `href` to `label`.
  - `App` (lines 480–514) — gains `settingsOpen` state, passes `onToggleSettings` to `Nav`,
    renders new `<SettingsPanel>` at the bottom of the JSX tree (before the closing `</div>`).
  - New `SettingsPanel` component — added between `Footer` and the `App` export.
- `src/styles.css` — Stylesheet to extend.
  - `.nav__links a` / `.nav__cta` (lines 183–226) — reference for nav button styling.
  - `:root` custom properties (lines 9–43) — all panel styles should consume these rather
    than hard-coded values.
  - `[data-theme="dark"]` block (lines 45–67) — panel styles must work under both themes
    automatically; using the custom properties achieves this for free.
  - Responsive breakpoint at 980 px (line 549) — panel must be usable at mobile widths.

---

## Current state

- **`LINKS` array:** `["Fleet", "#fleet"]`, `["Destinations", "#destinations"]`,
  `["Membership", "#membership"]`, `["Hello World", "#"]`. The last entry is the placeholder
  being replaced.
- **`Nav` render loop:** `LINKS.map(([label, href]) => <a key={href} href={href} ...>)`.
  Currently all entries are rendered as anchors; the `key` uses `href`. With a `null` href
  for Settings, the key must switch to `label` to avoid a null-key React warning.
- **`App` state:** `darkMode` + `setDarkMode` only. No settings panel state yet.
- **Existing theme toggle:** Lives in `nav__cta` (lines 71–98), receives `darkMode` /
  `onToggleTheme` from `App`. Must not be touched.
- **No test suite:** `package.json` defines only `dev`, `build`, `preview`.
- **CSS custom properties in play:** `--paper`, `--paper-2`, `--line`, `--line-soft`,
  `--shadow`, `--ink`, `--ink-soft`, `--ink-faint`, `--blue`, `--teal`, `--ease` — all
  available for the panel styles.

---

## Structural considerations

- **Hierarchy:** The change is presentation-layer only (`App.jsx` + `styles.css`). `data.js`
  is untouched. No layer violations.
- **Abstraction:** `LINKS` is already the correct abstraction for nav items; extending it
  with a `null`-href sentinel is the minimal change that preserves the pattern. Alternatively,
  the entry could be extracted entirely to a dedicated "actions" collection, but that would be
  over-engineering for a one-off case.
- **Modularity:** `SettingsPanel` as its own named function keeps the concern self-contained
  within the file. It holds its own preference state (`currency`, `distanceUnit`), which is
  appropriate since those values are not consumed anywhere else in the current codebase.
- **Encapsulation:** `settingsOpen` must live in `App` (not inside `Nav`) because `Nav`
  triggers the open and `App` renders the panel — they are siblings in the component tree.
  Lifting state to `App` is the correct boundary. Preference state (`currency`,
  `distanceUnit`) stays inside `SettingsPanel` since nothing outside the panel reads it.

---

## Refactoring

None required before the feature work. The `LINKS` sentinel approach and the conditional
render are additive changes — no existing logic needs restructuring first.

---

## Implementation steps

- [ ] **Step 1 — Update `LINKS` in `src/App.jsx`** → replaces placeholder, removes "Hello World"

  ```js
  // Before
  const LINKS = [
    ["Fleet", "#fleet"],
    ["Destinations", "#destinations"],
    ["Membership", "#membership"],
    ["Hello World", "#"],
  ];

  // After
  const LINKS = [
    ["Fleet", "#fleet"],
    ["Destinations", "#destinations"],
    ["Membership", "#membership"],
    ["Settings", null],   // null href = action trigger (renders as button)
  ];
  ```

- [ ] **Step 2 — Add `onToggleSettings` prop to `Nav` and update the render loop** →
  Settings renders as a styled button; other links unchanged; React key switches to `label`

  ```jsx
  // Nav signature — add onToggleSettings
  function Nav({ darkMode, onToggleTheme, onToggleSettings }) { ... }

  // Replace the LINKS map inside .nav__links
  {LINKS.map(([label, href]) =>
    href ? (
      <a key={label} href={href} onClick={() => setOpen(false)}>{label}</a>
    ) : (
      <button
        key={label}
        className="nav__link-btn"
        onClick={() => { onToggleSettings(); setOpen(false); }}
      >
        {label}
      </button>
    )
  )}
  ```

  Note: `key` changes from `{href}` to `{label}` across all items to avoid a null-key
  warning now that one entry has `href === null`. Labels are unique in the array.

- [ ] **Step 3 — Add `SettingsPanel` component to `src/App.jsx`** → self-contained modal
  with two preference controls; placed between the `Footer` function and the `App` export

  ```jsx
  function SettingsPanel({ open, onClose }) {
    const [currency, setCurrency]         = useState("USD");
    const [distanceUnit, setDistanceUnit] = useState("km");

    if (!open) return null;

    return (
      <div className="settings-overlay" onClick={onClose}>
        <div className="settings-panel" onClick={(e) => e.stopPropagation()}>
          <div className="settings-panel__header">
            <h2 className="serif">Settings</h2>
            <button
              className="settings-panel__close"
              aria-label="Close settings"
              onClick={onClose}
            >
              ✕
            </button>
          </div>

          <div className="settings-panel__body">
            {/* Control 1: Preferred currency */}
            <div className="settings-control">
              <label className="settings-control__label" htmlFor="sp-currency">
                Preferred currency
              </label>
              <select
                id="sp-currency"
                className="settings-control__select"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
              >
                <option value="USD">USD — US Dollar</option>
                <option value="EUR">EUR — Euro</option>
                <option value="GBP">GBP — British Pound</option>
              </select>
            </div>

            {/* Control 2: Distance units */}
            <div className="settings-control">
              <span className="settings-control__label">Distance units</span>
              <div className="settings-control__toggle" role="group">
                {["km", "mi"].map((unit) => (
                  <button
                    key={unit}
                    className={`toggle-btn ${distanceUnit === unit ? "active" : ""}`}
                    onClick={() => setDistanceUnit(unit)}
                  >
                    {unit}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  ```

- [ ] **Step 4 — Add `settingsOpen` state to `App` and wire everything up** →
  Nav receives toggle handler; SettingsPanel is rendered in the tree

  ```jsx
  export default function App() {
    const root = useRef(null);
    useScrollReveal();

    const [darkMode, setDarkMode] = useState(
      () => localStorage.getItem("theme") === "dark"
    );
    const [settingsOpen, setSettingsOpen] = useState(false);  // NEW

    // ... existing useEffects unchanged ...

    return (
      <div ref={root}>
        <Nav
          darkMode={darkMode}
          onToggleTheme={() => setDarkMode((d) => !d)}
          onToggleSettings={() => setSettingsOpen((s) => !s)}  // NEW
        />
        <Hero />
        <Booking />
        <Fleet />
        <Destinations />
        <Membership />
        <CTA />
        <Footer />
        <SettingsPanel                                          // NEW
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
        />
      </div>
    );
  }
  ```

- [ ] **Step 5 — Add styles to `src/styles.css`** → panel and button styles; append at end
  of file (before or after the `@media (prefers-reduced-motion)` block)

  ```css
  /* ============================ SETTINGS NAV BUTTON ============================ */
  /* Visually matches .nav__links a — same font, opacity, hover underline */
  .nav__link-btn {
    background: none;
    border: 0;
    padding: 0;
    font-size: 0.86rem;
    letter-spacing: 0.02em;
    font-weight: 500;
    color: currentColor;
    opacity: 0.82;
    position: relative;
    transition: opacity 0.3s;
    cursor: pointer;
  }
  .nav__link-btn::after {
    content: ""; position: absolute; left: 0; bottom: -6px;
    width: 0; height: 2px; border-radius: 2px; background: var(--teal);
    transition: width 0.35s var(--ease);
  }
  .nav__link-btn:hover { opacity: 1; }
  .nav__link-btn:hover::after { width: 100%; }

  /* ============================ SETTINGS PANEL ============================ */
  .settings-overlay {
    position: fixed;
    inset: 0;
    z-index: 200;
    background: rgba(8, 19, 51, 0.55);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    animation: fadeIn 0.25s var(--ease);
  }
  .settings-panel {
    background: var(--paper);
    border: 1px solid var(--line);
    border-radius: 20px;
    box-shadow: var(--shadow);
    width: min(480px, 90vw);
    padding: 36px 36px 40px;
    animation: quoteIn 0.35s var(--ease);
  }
  .settings-panel__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 32px;
  }
  .settings-panel__header h2 {
    font-size: 1.6rem;
    font-weight: 700;
  }
  .settings-panel__close {
    background: none;
    border: 1.5px solid var(--line);
    border-radius: 50%;
    width: 34px;
    height: 34px;
    display: grid;
    place-items: center;
    font-size: 0.8rem;
    color: var(--ink-soft);
    cursor: pointer;
    transition: border-color 0.25s, color 0.25s;
    flex-shrink: 0;
  }
  .settings-panel__close:hover { border-color: var(--blue); color: var(--blue); }

  .settings-panel__body { display: flex; flex-direction: column; gap: 28px; }

  .settings-control { display: flex; flex-direction: column; gap: 10px; }
  .settings-control__label {
    font-size: 0.64rem;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--blue);
    font-weight: 700;
  }
  .settings-control__select {
    background: var(--paper-2);
    border: 1px solid var(--line);
    border-radius: 10px;
    color: var(--ink);
    font-family: inherit;
    font-size: 0.96rem;
    font-weight: 600;
    padding: 11px 14px;
    outline: none;
    cursor: pointer;
    transition: border-color 0.25s;
    width: 100%;
  }
  .settings-control__select:focus { border-color: var(--blue); }
  .settings-control__select option { background: var(--paper); color: var(--ink); }

  .settings-control__toggle {
    display: flex;
    gap: 6px;
    background: var(--paper-2);
    border: 1px solid var(--line);
    border-radius: 10px;
    padding: 4px;
    width: fit-content;
  }
  .toggle-btn {
    background: none;
    border: 0;
    border-radius: 7px;
    padding: 8px 22px;
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--ink-soft);
    cursor: pointer;
    transition: background 0.25s var(--ease), color 0.25s;
  }
  .toggle-btn.active {
    background: var(--paper);
    color: var(--ink);
    box-shadow: 0 2px 8px -4px rgba(13, 32, 80, 0.25);
  }
  .toggle-btn:not(.active):hover { color: var(--ink); }
  ```

  Also add the new elements to the theme-transition block so they animate smoothly on
  theme switch:

  ```css
  /* append to the existing theme-switch transition rule */
  .settings-panel,
  .settings-control__select,
  .toggle-btn {
    transition: background-color 0.45s var(--ease),
                color 0.45s var(--ease),
                border-color 0.45s var(--ease),
                box-shadow 0.45s var(--ease);
  }
  ```

---

## Impact assessment

- **Code paths affected:** `Nav` render path (one conditional branch added); `App` render
  path (one new state, one new prop passed, one new component rendered). No existing
  component logic changes other than the `Nav` prop signature extension.
- **Data or schema impact:** None. `src/data.js` is not modified.
- **Dependency or API impact:** None. No new imports, no new npm packages.
- **Responsive behaviour:** `.settings-panel` uses `min(480px, 90vw)` so it stays readable
  at mobile widths. The `.nav__link-btn` sits inside `.nav__links`, which the existing
  responsive CSS already hides on ≤980 px and shows in the mobile dropdown when `nav.open`
  is true — the button participates in that dropdown automatically.
- **`z-index` layering:** `nav` is at `z-index: 100`; overlay is at `z-index: 200` —
  the panel renders above the nav without conflict.
- **Accessibility:** The overlay close-on-backdrop-click and the explicit close button
  together provide two dismissal paths. The close button has an `aria-label`. The toggle
  button group has `role="group"`. Screen reader order is logical (header → controls → close).

---

## Validation

- **Build check:** `npm run build` — must exit 0 with no errors. This is the only
  CI-equivalent gate available in the project.
- **Manual verification — desktop (>980 px):**
  1. `npm run dev` → open app.
  2. Confirm "Hello World" no longer appears anywhere in the navbar or page.
  3. Confirm "Settings" appears in the nav alongside Fleet, Destinations, Membership.
  4. Hover over "Settings" — teal underline animation should appear (matches other links).
  5. Click "Settings" — modal overlay appears with the two preference controls.
  6. Change currency to EUR — no crash, dropdown updates.
  7. Toggle distance unit to "mi" — active pill moves to "mi".
  8. Click the ✕ button — panel closes.
  9. Click the backdrop — panel closes.
  10. Open settings again; verify state resets to defaults (USD / km) on next open
      (since `useState` initializers run fresh each mount when component re-mounts; if
      `if (!open) return null` causes unmount, state resets — this is acceptable per AC).
  11. Click Fleet / Destinations / Membership — still scroll to the correct section.
  12. Theme toggle (sun/moon icon) — still works; dark mode applies correctly to the panel.
- **Manual verification — mobile (≤980 px):**
  1. Resize to ≤980 px — hamburger appears.
  2. Open hamburger — mobile nav shows Fleet, Destinations, Membership, Settings.
  3. Click Settings — panel opens; hamburger menu closes.
  4. Panel is usable at narrow width (≤480 px uses 90vw).
- **Lint/typecheck:** No lint or typecheck scripts in `package.json`. None to run.
- **Tests:** No test suite exists. None to write or update.

---

## Uncertainty flags

- **Settings state reset on close:** Using `if (!open) return null` causes the panel to
  unmount when closed, resetting `currency` and `distanceUnit` to their defaults on next
  open. The ticket says "State can be local; persistence is not required," so this is
  acceptable. If retention-across-opens were desired, the state would need to live in `App`
  or in `localStorage` — but that is out of scope per the ticket.
- **Panel type (modal vs. drawer vs. section):** The ticket allows any form. A modal
  overlay was chosen because it: (a) matches the `booking__card` visual language
  (rounded card, shadow, border), (b) requires no scroll-position management, and (c)
  works cleanly at all viewport sizes. If a side-drawer or inline section is preferred,
  only the overlay CSS and the panel's `position` strategy need to change — the component
  structure remains the same.
- **LINKS key change:** Switching `key={href}` to `key={label}` is necessary to avoid a
  React null-key warning with the `["Settings", null]` entry. All four labels in `LINKS`
  are unique, so this is safe. If future entries duplicate a label, the key strategy would
  need to change (e.g., index or an explicit `id` field).

---

## Open questions

None that block implementation. The ticket's AC is fully specified and all ambiguities
(panel form, state lifetime, control choices) are resolved above.
