# ATD-9 — Add a Search/Filter Bar to the Destinations Grid

## Goal

A live text-filter input sits above the `.dest__grid` in the `Destinations` component.
Typing narrows the displayed cards by matching city, country, or airport code
(case-insensitive). An empty state is shown when nothing matches. Clearing the input
restores all nine cards and their staggered reveal animations.

**DONE WHEN:**
- A controlled `<input type="search">` is rendered above `.dest__grid`.
- Typing filters the grid in real time (case-insensitive match against `city`, `country`,
  and `code`).
- Clearing the input restores all cards; staggered reveal animations are re-applied.
- An empty state message ("No destinations match …") is shown when all cards are filtered
  out.
- Input is styled to match the site aesthetic (`.dest__search` class, using existing design
  tokens).
- `src/data.js` (`DESTINATIONS`) is not modified. Booking, Fleet, and Membership sections
  are untouched.
- `npm run build` exits cleanly.

---

## ⚠️ Pre-implementation note

**Exploration reveals that all ATD-9 work is already present in the worktree.**

Every feature bullet and acceptance criterion is implemented in the current state of
`src/App.jsx` and `src/styles.css`. The implementation steps below are written as
verification/review tasks rather than build tasks.

One minor discrepancy from the ticket spec is flagged in the Open questions section:
the empty-state copy reads "No destinations found." instead of the ticket's "No
destinations match …".

---

## Summary of approach

State (`query`) is held locally inside `Destinations`. The filtered list is derived
synchronously on each render. Cards gain the `.reveal` class only when `query` is empty
(so scroll-reveal animations fire on initial load but not on each keystroke). A `useRef`
sentinel (`filterRef`) tracks whether the filter was ever engaged; when the user clears the
input the `useEffect` manually adds `.in` to all `.dest__card.reveal` elements in the
section — bypassing the IntersectionObserver (which is anchored to `route.view`, not query
state) — so cleared cards are immediately visible rather than waiting to scroll back into
view.

The input is an `<input type="search">` (renders a native clear button on most platforms)
wrapped in a `<div className="dest__search">`. The empty state is a centered
`<p className="dest__empty">`. Both classes are defined in `src/styles.css`.

---

## Related code

- `src/App.jsx` (lines 512–590) — The `Destinations` component; entire feature lives here.
- `src/App.jsx` (lines 8–25) — `useScrollReveal` hook; its `dep` argument is `route.view`,
  not query state. Understanding why reveal is handled manually in the component is key to
  reviewing the filter-clear logic.
- `src/styles.css` (lines 453–516) — Destinations section CSS; includes `.dest__grid`,
  `.dest__card`, `.dest__search`, `.dest__search input`, `.dest__search input:focus`,
  `.dest__search input::placeholder`, and `.dest__empty`.
- `src/styles.css` (lines 685–701) — Theme-switch transition multi-selector block;
  `.dest__search input` is listed here so background/color transitions fire on dark-mode
  toggle.
- `src/data.js` (lines 18–28) — `DESTINATIONS` array; the filter reads `.city`,
  `.country`, and `.code` from each entry. These fields are present on all nine records.

---

## Current state

**All features are implemented. Relevant behavior as found:**

- **`query` state & filtering:** `useState("")` drives a derived `filtered` array.
  When `q` (trimmed, lowercased query) is non-empty, `DESTINATIONS` is filtered against
  `city`, `country`, and `code`. When empty, `filtered === DESTINATIONS` (reference, no
  copy).
- **Search input:** `<div className="dest__search"><input type="search" … /></div>` is
  rendered above `.dest__grid`. The input is controlled (`value={query}`,
  `onChange={(e) => setQuery(e.target.value)}`), has placeholder "Search destinations…",
  and carries `aria-label="Filter destinations"`.
- **Empty state:** `<p className="dest__empty">No destinations found.</p>` is rendered when
  `filtered.length === 0`. *(See Open questions — wording differs from ticket spec.)*
- **Reveal animation handling:** Cards receive `className="dest__card reveal"` and a
  `transitionDelay` style only when `query` is empty. When `query` is non-empty, cards
  receive `className="dest__card"` (no `reveal` class, no delay) so they appear instantly.
  A `useEffect` watching `query` re-adds `.in` to lingering `.dest__card.reveal` elements
  when the user clears the input.
- **Styling:** `.dest__search` provides `margin-bottom: 28px`. `.dest__search input` has
  `max-width: 420px`, `background: var(--paper-2)`, `border: 1px solid var(--line)`,
  `border-radius: 12px`, `padding: 11px 16px`, focus border `var(--blue)`, placeholder
  color `var(--ink-faint)`. `.dest__empty` is centered, `color: var(--ink-soft)`.
- **Dark mode transitions:** `.dest__search input` is listed in the theme-switch
  transition block so background/border/color animate smoothly on dark-mode toggle.
- **`data.js` untouched:** `DESTINATIONS` array is read-only within this feature.

**Existing patterns followed:**
- Controlled input wired with `useState` (same as `Booking`'s form fields).
- CSS custom properties only — no hardcoded hex values.
- Component state is entirely local — no prop drilling, no context changes.
- Section guard comment `{/* Search input */}` and `{/* Card grid or empty state */}`
  follow the inline comment convention already used throughout `App.jsx`.

---

## Structural considerations

- **Hierarchy:** Change is contained to the `Destinations` function component and its CSS.
  The data layer (`data.js`), parent `App`, and all sibling sections are untouched.
- **Abstraction:** Filter state and DOM-patching logic live inside `Destinations`. The
  `filterRef` / DOM imperative patch is an intentional workaround for the fact that
  `useScrollReveal` is keyed to `route.view`, not query state. It is a contained hack with
  a clear code comment; no abstraction boundary is violated.
- **Modularity:** `Destinations` remains a single-responsibility component. The search
  feature adds local state and a `useEffect` — it does not introduce cross-component
  concerns.
- **Encapsulation:** `DESTINATIONS` is read but never mutated. No internal state from any
  other component is read or modified.

---

## Refactoring

None required or performed. The existing structure cleanly absorbed the feature.

---

## Implementation steps

> **All steps are already complete in the worktree. Each step is a verification checkpoint.**

- [ ] **Step 1 — Verify `query` state, `filterRef`, and filtering logic**
  (`src/App.jsx` lines 512–524)

  Confirm:
  - `useState("")` declared for `query`.
  - `useRef(false)` declared for `filterRef`.
  - `q = query.trim().toLowerCase()`.
  - `filtered` is derived via `DESTINATIONS.filter(…)` matching `.city`, `.country`,
    `.code` when `q` is non-empty; falls back to raw `DESTINATIONS` otherwise.

  → Logic is complete.

- [ ] **Step 2 — Verify reveal-animation `useEffect`**
  (`src/App.jsx` lines 526–535)

  Confirm:
  - Effect dependency is `[query]`.
  - When `query` is truthy: `filterRef.current = true`.
  - When `query` is falsy and `filterRef.current` is true: DOM query
    `#destinations .dest__card.reveal` → `classList.add("in")` is called on each match.

  → Reveal-on-clear is complete.

- [ ] **Step 3 — Verify JSX: search input**
  (`src/App.jsx` lines 551–559)

  Confirm:
  - `<div className="dest__search">` wraps the input.
  - `<input type="search" placeholder="Search destinations…" value={query} onChange=… aria-label="Filter destinations" />`.

  → Input markup is complete.

- [ ] **Step 4 — Verify JSX: empty state and conditional grid**
  (`src/App.jsx` lines 562–588)

  Confirm:
  - `filtered.length === 0` → renders `<p className="dest__empty">No destinations found.</p>`.
  - Otherwise renders `<div className="dest__grid">` with cards.
  - Cards get `className="dest__card reveal"` + `transitionDelay` when `query` is empty;
    `className="dest__card"` with no delay when `query` is non-empty.

  → Grid / empty-state conditional is complete (see Open questions for wording).

- [ ] **Step 5 — Verify CSS: `.dest__search` and `.dest__empty`**
  (`src/styles.css` lines 482–516)

  Confirm presence of:
  - `.dest__search { margin-bottom: 28px; }`
  - `.dest__search input { max-width: 420px; background: var(--paper-2); border: 1px solid var(--line); … }`
  - `.dest__search input:focus { border-color: var(--blue); background: var(--paper); }`
  - `.dest__search input::placeholder { color: var(--ink-faint); font-weight: 400; }`
  - `.dest__empty { color: var(--ink-soft); font-size: 1rem; padding: 48px 0; text-align: center; }`

  → Styles are complete.

- [ ] **Step 6 — Verify `.dest__search input` in theme-switch transition block**
  (`src/styles.css` lines 685–701)

  Confirm `.dest__search input` appears in the multi-selector transition rule.

  → Dark-mode transition coverage is complete.

- [ ] **Step 7 — (If warranted) Fix empty-state copy**

  If the team requires the ticket's exact wording "No destinations match …" (see Open
  questions), update `src/App.jsx` line 564:

  ```jsx
  // Before
  <p className="dest__empty">No destinations found.</p>
  // After
  <p className="dest__empty">No destinations match your search.</p>
  ```

  → Single-line change; no CSS update required.

- [ ] **Step 8 — Run build**

  ```bash
  npm run build
  ```

  Must exit without errors or warnings.

---

## Impact assessment

- **Code paths affected:** `Destinations` component only. No other component, hook,
  or data export is modified.
- **Data or schema impact:** None. `DESTINATIONS` entries are read-only. No new fields
  consumed from `data.js`.
- **Dependency or API impact:** None. Uses only `useState`, `useEffect`, `useRef` —
  all already imported in `App.jsx`.
- **Responsive behavior:** `.dest__search input` has `width: 100%; max-width: 420px` so
  it flows correctly at all breakpoints. The existing `@media` blocks for `.dest__grid`
  (`repeat(2, 1fr)` at ≤ 980 px, `1fr` at ≤ 560 px) are unchanged; the search input
  sits outside the grid and is unaffected.

---

## Validation

**Build:**
```bash
npm run build    # must exit cleanly
```

**Manual — desktop (`npm run dev`):**
1. Scroll to the Destinations section. Confirm nine cards are visible with staggered
   reveal animations.
2. Type "lon" in the search input. Confirm only London (LCY) remains, appearing
   instantly (no reveal animation flash).
3. Type "united" — confirm Los Angeles (LAX), Miami (MIA), and London (LCY) are shown.
4. Type "lsgg" (lowercase airport code) — confirm only Geneva appears.
5. Type "zzz" (no match) — confirm the empty state paragraph is displayed and the grid
   is gone.
6. Clear the input (click the native × or select-all delete). Confirm all nine cards
   are restored and visible without requiring a scroll.
7. Toggle dark mode via the nav. Confirm the search input background and border
   transition smoothly.

**Manual — mobile (≤ 560 px):**
1. Resize viewport to 375 px.
2. Confirm input fills the available width (100% of `.wrap` padding).
3. Filter to one card, clear — confirm restore works at narrow width.

**Reduced motion:**
1. Enable "Prefers Reduced Motion" in OS/browser dev tools.
2. Confirm cards appear/disappear without animation (global rule in `styles.css`
   disables all transitions/animations).

**Out-of-scope guard:**
- Confirm `src/data.js` is unmodified.
- Confirm Booking, Fleet, Membership, CTA, Footer, and Nav are visually and
  functionally unchanged.

---

## Uncertainty flags

- **`filterRef` / DOM imperative patch:** When `query` is cleared, the `useEffect`
  calls `classList.add("in")` on `.reveal` cards after React has re-rendered them
  (effects run post-paint). Cards briefly exist with `opacity: 0; transform:
  translateY(30px)` until the effect fires. In practice this is imperceptible (sub-
  frame), but it is a pattern to be aware of. An alternative is to pass the filter
  state as a dependency to `useScrollReveal` and let the IntersectionObserver handle
  it — but that would mean the IO fires for every keystroke, which is heavier. The
  current approach is a reasonable trade-off.

- **`query` vs `q` for the effect dependency:** The `useEffect` depends on `query`
  (the raw state string), not `q` (the trimmed/lowercased version). This means clearing
  trailing spaces also triggers the restore path. This is correct behavior and matches
  user intent.

---

## Open questions

1. **Empty-state copy:** The ticket specifies `"No destinations match …"` but the
   current implementation reads `"No destinations found."`. Confirm with the team
   whether the wording should be updated (Step 7 in the implementation steps above).
   If the exact phrase matters, the fix is a one-line change.

   No other implementation work is blocked by this question.
