# ATD-6 — Add a Search/Filter Box to the Destinations Section

## Goal

**DONE WHEN:**

- A text input appears above the Destinations card grid.
- Typing in the input filters the visible destination cards in real time, matching
  case-insensitively against each card's `city`, `country`, or `code` field.
- Clearing the input restores the full list of 9 destination cards.
- When no card matches the current query, a "No destinations found." message is shown
  in place of the grid.
- `npm run build` exits 0 with no errors.
- No other sections (Booking, Fleet, Membership, CTA, Footer) are affected.
- `src/data.js` is not modified.

---

## Summary of approach

`Destinations` in `src/App.jsx` is currently a stateless component that maps directly
over the imported `DESTINATIONS` array. The change converts it to a stateful component
with a single `query` string state, derives a `filtered` array from it, and renders
the search input + filtered grid.

All three parts of the work stay within `Destinations` (filter state, derived list,
empty-state message) — no prop threading and no changes to the `App` root or any
sibling component.

CSS is extended with three new rule blocks: a search-input wrapper (`.dest__search`),
the input itself (`.dest__search input`), and the empty-state message (`.dest__empty`).
All new rules consume the existing CSS custom properties so light/dark themes work for
free.

The one non-trivial consideration is the existing `reveal`/`IntersectionObserver`
scroll animation already applied to destination cards. The mitigation strategy is
documented in detail under Structural Considerations and reflected in Step 2.

---

## Related code

- `src/App.jsx` lines 1 — `useState` is already in the import; `useRef` is also imported
  and available for the filter-clear fix.
- `src/App.jsx` lines 321–349 — `Destinations` component, the only function being changed.
  Currently stateless; maps over `DESTINATIONS` verbatim.
- `src/App.jsx` lines 7–24 — `useScrollReveal` hook. Runs once at mount via `useEffect(fn, [])`.
  Uses `document.querySelectorAll(".reveal")` once; new `.reveal` nodes added after mount are
  not automatically observed. Relevant to the filter-clear behaviour (see Structural Considerations).
- `src/data.js` lines 18–28 — `DESTINATIONS` array (9 entries). Each entry shape:
  `{ code, city, country, from, hours, price }`. Filter targets `city`, `country`, `code`.
  **No changes here.**
- `src/styles.css` lines 453–480 — Destinations section styles (`.dest__grid`, `.dest__card`,
  child spans). New CSS blocks are appended here.
- `src/styles.css` lines 648–664 — Theme-switch transition block. New elements that use
  `background`/`color`/`border` should be added here so they animate smoothly on theme toggle.
- `src/styles.css` lines 9–43 — `:root` custom properties. All new styles consume these;
  no new hard-coded colour values should be introduced.

---

## Current state

- **`Destinations`**: Stateless functional component. Renders a static
  `DESTINATIONS.map(...)` with no filter logic. Each card has
  `className="dest__card reveal"` and a staggered `transitionDelay` based on `i % 4`.
- **`DESTINATIONS` data**: 9 entries — `LSGG`, `OMDB`, `LAX`, `MIA`, `LIML`, `RJTT`,
  `YSSY`, `LCY`, `LFPB`. Fields: `code`, `city`, `country`, `from`, `hours`, `price`.
- **`useState` / `useRef`**: Already imported in `App.jsx` (line 1); no new imports needed.
- **CSS custom properties available**: `--paper-2` (input background), `--line` (border),
  `--line-soft`, `--blue` (focus colour / label colour), `--ink`, `--ink-soft`, `--ink-faint`
  (placeholder / empty-state text), `--ease`, `--shadow`.
- **No test suite**: `package.json` defines only `dev`, `build`, `preview`.
- **Responsive breakpoints**: `@media (max-width: 980px)` collapses `.dest__grid` to 2
  columns; `@media (max-width: 560px)` collapses to 1 column. The search input is full-width
  inside `.wrap` so it adapts automatically.

---

## Structural considerations

- **Hierarchy**: Change is presentation-layer only — `Destinations` component + stylesheet.
  `data.js` untouched. No layer violations.
- **Abstraction**: Filter state belongs in `Destinations`; nothing outside the component
  reads it. No need to lift state to `App`.
- **Modularity**: Keeping the search input, filtered list, and empty-state message all inside
  `Destinations` keeps the concern self-contained. The component grows from ~15 lines to ~35
  lines — still straightforward.
- **Encapsulation**: `DESTINATIONS` is imported directly in `App.jsx` and used as a constant
  inside `Destinations`. The filter derives a new local array; the source data is never mutated.
- **IntersectionObserver / scroll-reveal interaction** (the main structural concern):

  `useScrollReveal` runs once at mount. It queries _all_ `.reveal` elements at that point,
  observes them, adds `.in` on intersection, then `unobserve`s each one. It does **not**
  pick up new `.reveal` nodes added to the DOM after mount.

  This creates two problems if we naively filter the rendered list:

  1. **During filtering** — filtered-in cards that match would normally use
     `className="dest__card reveal"`. If those nodes were never observed (because they
     were absent from the DOM at mount), they'd sit at `opacity: 0` forever.
  2. **After clearing the filter** — cards that were filtered _out_ (unmounted) and then
     return (remounted) are new DOM nodes. React reconciles by `key={d.code}` so cards
     _present during filtering_ keep their nodes and their `.in` class. Cards _absent during
     filtering_ are remounted fresh, with `reveal` but without `.in`, making them invisible.

  **Mitigation strategy** (implemented in Step 2):

  - When `query` is **non-empty**: render matching cards with `className="dest__card"` (no
    `reveal` class). They are visible immediately — correct UX for live filtering.
  - When `query` is **empty**: render all 9 cards with `className="dest__card reveal"` and
    the original `transitionDelay` — identical to the current behaviour, preserving the
    initial page-load scroll animation.
  - **Filter-clear fix**: add a `useRef` flag inside `Destinations` that tracks whether a
    non-empty query has ever been set. When `query` transitions back to empty _and_ the flag
    is set, immediately call `.classList.add("in")` on every `.dest__card.reveal` inside
    `#destinations`. This makes freshly-remounted cards visible without waiting for an
    observer that will never fire.

  The flag ensures the effect is a no-op on the initial mount (preserving the scroll
  animation for first-time visitors) and only activates on explicit filter-clear.

---

## Refactoring

None required. The change is purely additive inside `Destinations` — no existing logic needs
restructuring before the feature work.

---

## Implementation steps

- [ ] **Step 1 — Add `query` state and `filtered` derivation to `Destinations`**

  Convert the stateless component to stateful. Add `query` state and derive `filtered`
  from it. The filter is case-insensitive and matches any of the three fields.

  ```jsx
  function Destinations() {
    const [query, setQuery] = useState("");
    const filterRef = useRef(false);   // tracks whether filter was ever active

    const q = query.trim().toLowerCase();
    const filtered = q
      ? DESTINATIONS.filter(
          (d) =>
            d.city.toLowerCase().includes(q) ||
            d.country.toLowerCase().includes(q) ||
            d.code.toLowerCase().includes(q)
        )
      : DESTINATIONS;

    // ... render (Steps 2–3)
  }
  ```

  → Outcome: filter logic is in place; component still renders the full grid
  (render is updated in Step 2).

- [ ] **Step 2 — Update the render: add input, render filtered grid, handle scroll-reveal**

  Replace the existing `return` block with the updated version that includes the search
  input above the grid, maps over `filtered` instead of `DESTINATIONS`, adjusts card
  `className` per the IntersectionObserver strategy (see Structural Considerations), and
  applies the filter-clear fix via `useEffect`.

  ```jsx
  // Add INSIDE Destinations, after the filtered derivation:
  useEffect(() => {
    if (query) {
      filterRef.current = true;
    } else if (filterRef.current) {
      // query just cleared — add .in to any reveal cards that lack it
      document
        .querySelectorAll("#destinations .dest__card.reveal")
        .forEach((el) => el.classList.add("in"));
    }
  }, [query]);

  return (
    <section className="section-pad" id="destinations">
      <div className="wrap">
        <div className="section-head reveal">
          <h2 className="serif">
            Where the weekend{" "}
            <em style={{ color: "var(--brass-bright)" }}>begins</em>.
          </h2>
          <p>
            A living network of private terminals across the cities our
            members ask for most.
          </p>
        </div>

        {/* Search input */}
        <div className="dest__search">
          <input
            type="search"
            placeholder="Search destinations…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Filter destinations"
          />
        </div>

        {/* Card grid or empty state */}
        {filtered.length === 0 ? (
          <p className="dest__empty">No destinations found.</p>
        ) : (
          <div className="dest__grid">
            {filtered.map((d, i) => (
              <a
                key={d.code}
                className={query ? "dest__card" : "dest__card reveal"}
                href="#book"
                style={query ? undefined : { transitionDelay: `${(i % 4) * 80}ms` }}
              >
                <span className="time">{d.hours}h from {d.from}</span>
                <span className="code">{d.code}</span>
                <span className="city">{d.city}</span>
                <span className="country">{d.country}</span>
                <span className="price">{d.price}</span>
              </a>
            ))}
          </div>
        )}
      </div>
    </section>
  );
  ```

  → Outcome: typing filters cards in real time; empty state message shows when no match;
  scroll-reveal animation preserved for initial page load and after filter clear.

- [ ] **Step 3 — Add CSS for search input and empty state to `src/styles.css`**

  Append new rule blocks after the existing `/* ---------- Destinations ---------- */`
  section (after line 480 in the current file). All values use existing CSS custom
  properties — no hard-coded colours.

  ```css
  /* ---------- Destinations: search ---------- */
  .dest__search {
    margin-bottom: 28px;
  }
  .dest__search input {
    width: 100%;
    max-width: 420px;
    background: var(--paper-2);
    border: 1px solid var(--line);
    border-radius: 12px;
    color: var(--ink);
    font-family: inherit;
    font-size: 0.96rem;
    font-weight: 500;
    padding: 11px 16px;
    outline: none;
    transition: border-color 0.25s var(--ease), background 0.25s var(--ease);
    display: block;
  }
  .dest__search input:focus {
    border-color: var(--blue);
    background: var(--paper);
  }
  .dest__search input::placeholder {
    color: var(--ink-faint);
    font-weight: 400;
  }

  /* ---------- Destinations: empty state ---------- */
  .dest__empty {
    color: var(--ink-soft);
    font-size: 1rem;
    padding: 48px 0;
    text-align: center;
  }
  ```

  Also add `.dest__search input` to the existing theme-switch transition block (around
  line 649) so the input background/border animates on theme toggle:

  ```css
  /* append to the existing selector list in the theme-switch transition block */
  .dest__search input,
  ```

  → Outcome: search input is visually consistent with the site's aesthetic; adapts to
  light/dark themes; full-width on mobile due to `width: 100%`.

---

## Impact assessment

- **Code paths affected**: Only `Destinations` in `App.jsx`. All other components
  (`Nav`, `Hero`, `Booking`, `Fleet`, `Membership`, `CTA`, `Footer`, `SettingsPanel`,
  `BackToTop`) are untouched.
- **Data or schema impact**: None. `DESTINATIONS` in `src/data.js` is read-only here;
  no fields added or removed.
- **Dependency or API impact**: None. No new imports; no new npm packages.
- **Responsive behaviour**: The search input uses `width: 100%` with a `max-width: 420px`
  cap — it stays contained at desktop widths and expands to fill the column on mobile.
  The `.dest__grid` responsive breakpoints (2-col at ≤980 px, 1-col at ≤560 px) are
  unchanged and unaffected.
- **Accessibility**: The `<input>` has `aria-label="Filter destinations"` (since there
  is no visible `<label>` element in the design). `type="search"` provides a native
  clear (×) button in most browsers, reinforcing the "clearing restores the full list"
  AC. The empty-state is a plain `<p>` in document flow — announced naturally by screen
  readers.
- **Theme compatibility**: All new CSS consumes `--paper`, `--paper-2`, `--line`,
  `--ink`, `--ink-soft`, `--ink-faint`, `--blue`, `--ease` — properties that already
  have both light and dark values. No extra dark-mode overrides needed.

---

## Validation

- **Build check**: `npm run build` → must exit 0 with no errors or warnings. This is
  the only CI-equivalent gate in the project.
- **Manual verification — desktop:**
  1. `npm run dev` → scroll to the Destinations section.
  2. Confirm a search input appears above the card grid.
  3. Type "gen" → only the Geneva card remains visible.
  4. Type "united states" → Los Angeles and Miami cards remain.
  5. Type "RJTT" → only the Tokyo card remains (code match, case-insensitive).
  6. Type "zzz" → all cards hidden; "No destinations found." message appears.
  7. Clear the input → all 9 cards return; no card is missing or invisible.
  8. Scroll away from the Destinations section on a fresh load (empty query) → confirm
     destination cards still animate in on scroll via the `.reveal` mechanism.
  9. Confirm Fleet, Booking, Membership, CTA, and Footer sections are visually unchanged.
  10. Toggle dark mode → search input and empty-state text adapt correctly.
- **Manual verification — mobile (≤980 px):**
  1. Confirm search input is full-width and usable at narrow viewports.
  2. Confirm filtering works identically.
- **Lint/typecheck**: No lint or typecheck scripts in `package.json`. None to run.
- **Tests**: No test suite exists. None to write or update.

---

## Uncertainty flags

- **`type="search"` vs `type="text"`**: `type="search"` was chosen because it provides
  a native clear button (×) in Chromium/Safari, which satisfies the "clearing restores
  the full list" AC without extra UI work. Firefox renders it identically to `type="text"`
  — the clear button appears via the controlled `value`/`onChange` pair in either case.
  If the native search-clear styling conflicts with the site's aesthetic at QA, switch to
  `type="text"` — no logic changes required.
- **Scroll-reveal after filter-clear**: The `useEffect` + `filterRef` approach described
  in Step 2 adds `.in` programmatically when the filter clears. This bypasses the
  `IntersectionObserver` for cards that were filtered out. The outcome is that
  freshly-remounted cards appear instantly (no scroll-reveal animation) on filter clear.
  This is intentional and a reasonable UX trade-off: the user is already scrolled to this
  section while filtering, so snapping cards back immediately is less jarring than having
  them sit hidden. If a future ticket requires animated re-entry, re-initialising the
  observer (or using a CSS animation on re-mount) would be the path.
- **`max-width: 420px` on the input**: Chosen to avoid a very wide input on large
  viewports (the 4-column grid spans up to ~1240 px). If the design calls for the input
  to span a specific fraction of the section width, adjust the `max-width` accordingly.

---

## Open questions

None that block implementation. All acceptance criteria are explicit and fully
addressed above.
