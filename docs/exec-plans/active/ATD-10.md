# ATD-10 — Prefill Booking Form Destination Field from Destination Card

## Goal

**DONE WHEN:**

- Clicking any destination card populates the booking form's `to` (destination) select with
  the airport code for that card's destination.
- After card activation the viewport scrolls smoothly to the `#book` section so the form is
  visible without manual scrolling.
- The `to` select visually reflects the chosen destination — it is not blank or showing a stale
  value.
- Keyboard activation via Enter _or_ Space is functionally identical to a click (prefill + scroll).
- Clicking a second card overwrites the first prefill; the `to` field shows the latest card's value.
- Activating a card when the `to` field already has a user-entered value overwrites it.
- All other booking fields (`from`, `date`, `pax`) are unaffected — they retain whatever values
  the user entered before card activation.
- On a fresh page load with no card activated, the booking form's `to` field shows its default
  value (`LCY`) as before — no prefill is applied.
- Each destination card is keyboard-reachable and activatable (Enter and Space both fire).
- Prefilled values are not persisted across page loads.
- `npm run build` exits 0.

---

## Summary of approach

`Booking` currently owns all its form state locally, including `to`. `Destinations` currently
owns no state that affects `Booking`. The two components are siblings rendered by `App` with
no shared state channel.

The minimal change: **lift only `to` state from `Booking` to `App`** and pass a
`handleSelectDestination(code)` callback down to `Destinations`. `Booking` becomes a
partially-controlled component — `to` arrives as a prop, while `from`, `date`, `pax`,
`result`, and `error` remain local. This surgical lift:

- Keeps the `Booking` component small and self-contained (only one prop changes its external
  interface).
- Leaves all unrelated fields untouched, satisfying the "other fields must not reset" AC.
- Avoids Context or a global store — the data flow is one parent → two children, which React
  props handle cleanly.

The `handleSelectDestination` callback in `App` does two things in sequence:
1. Calls `setBookingTo(code)` — triggers a re-render that updates `Booking`'s controlled `to`
   select.
2. Calls `document.getElementById("book").scrollIntoView({ behavior: "smooth" })` —
   scrolls the form into view. The booking section already exists in the DOM and doesn't
   move, so there is no timing race with the state update.

For the destination cards, the existing `<a href="#book">` elements are already keyboard-
focusable and trigger `onClick` on Enter. Two targeted additions make them fully compliant:
- An `onClick` handler that calls `e.preventDefault()` (suppressing the native `href`
  jump, which would duplicate the scroll) and then calls `onSelectDestination(d.code)`.
- An `onKeyDown` handler that intercepts Space (`e.key === ' '`), prevents the default
  page-scroll, and calls `onSelectDestination(d.code)` — matching the Enter/click behaviour.

No CSS changes are required. No new components are needed.

---

## Related code

- `src/App.jsx` — All touch points.
  - `App` (lines 624–668) — parent component; gains `bookingTo` state + `handleSelectDestination`
    callback; passes props down to `Booking` and `Destinations`.
  - `Booking` (lines 181–268) — gains `to` and `onToChange` props; drops its own `to` local
    state; `to` select becomes controlled via prop.
  - `Destinations` (lines 321–395) — gains `onSelectDestination` prop; each card `<a>` gains
    `onClick` and `onKeyDown` handlers.
- `src/data.js` — Read-only reference. `DESTINATIONS[*].code` values (e.g. `"LSGG"`,
  `"OMDB"`) are the airport codes passed to `setBookingTo`. All nine codes exist in `AIRPORTS`,
  so the `to` select will always find a matching `<option>`.
- `src/styles.css` — No changes. The `<a>` cards already have hover/focus styles; the `to`
  select already has controlled-value styles; `html { scroll-behavior: smooth }` (line 70) is
  already set.

---

## Current state

- **`Destinations` cards** — `<a href="#book">` elements with no `onClick`, no state interaction.
  Clicking navigates to `#book` via the native anchor but does nothing to the booking form.
- **`Booking` component** — no props; `to` starts as `useState("LCY")` (line 183), is read by
  the `to` select (`value={to}`), and is updated only via the select's own `onChange`.
- **`App` render** — `<Booking />` and `<Destinations />` are sibling components with no props
  exchanged (lines 655–656).
- **Keyboard on `<a>`** — Enter triggers `onClick` natively. Space scrolls the page (default
  anchor behavior) without triggering `onClick` — this is the gap the `onKeyDown` handler
  closes.
- **`html { scroll-behavior: smooth }`** (styles.css line 70) — smooth scrolling is already
  globally enabled; `scrollIntoView({ behavior: 'smooth' })` will honor it.
- **No test suite, no lint/typecheck scripts** — `package.json` defines only `dev`, `build`,
  `preview`.

---

## Structural considerations

- **Hierarchy** — `to` state moves one level up, from `Booking` to `App`. Both `Booking`
  (consumer) and `Destinations` (producer via callback) are direct children of `App`, so `App`
  is the correct owner: it is the lowest common ancestor of the two components that share the
  value.
- **Abstraction** — The lifted state stays typed as a plain `string` (airport code). `App`
  does not need to understand the booking domain — it just stores and forwards. This is the
  right abstraction level: the airport code is a primitive value, not a domain object.
- **Modularity** — Responsibility is cleanly split: `Destinations` produces a code on
  activation; `App` routes it; `Booking` consumes it. No component takes on a role outside
  its existing domain.
- **Encapsulation** — `from`, `date`, `pax`, `result`, `error` remain private to `Booking`.
  Only `to` crosses the boundary, because only `to` needs to be. Passing the full booking
  state up would be over-lifting.

---

## Refactoring

None required before the feature work. The state-lift is purely additive: one new `useState`
and one new function in `App`, two new props on `Booking`, one new prop on `Destinations`.
No existing logic is restructured first.

---

## Implementation steps

- [ ] **Step 1 — Lift `to` state to `App` and define `handleSelectDestination`**
  → `App` gains ownership of `bookingTo`; the callback wires state update + smooth scroll.

  In `App` (after the existing `settingsOpen` state declaration):
  ```jsx
  const [bookingTo, setBookingTo] = useState("LCY");

  function handleSelectDestination(code) {
    setBookingTo(code);
    document.getElementById("book")?.scrollIntoView({ behavior: "smooth" });
  }
  ```

  In the `App` JSX, pass props to both components:
  ```jsx
  <Booking to={bookingTo} onToChange={setBookingTo} />
  // ...
  <Destinations onSelectDestination={handleSelectDestination} />
  ```

- [ ] **Step 2 — Update `Booking` to accept `to` and `onToChange` as props**
  → `Booking` drops its own `to` state; the `to` select becomes controlled via prop.

  Change the component signature:
  ```jsx
  // Before
  function Booking() {
    // ...
    const [to, setTo] = useState("LCY");

  // After
  function Booking({ to, onToChange }) {
    // (remove the `const [to, setTo] = useState("LCY")` line entirely)
  ```

  Update the `to` select's `onChange`:
  ```jsx
  // Before
  onChange={(e) => setTo(e.target.value)}

  // After
  onChange={(e) => onToChange(e.target.value)}
  ```

  All other state (`from`, `date`, `pax`, `result`, `error`) and all other JSX in
  `Booking` are unchanged.

- [ ] **Step 3 — Update `Destinations` to accept `onSelectDestination` prop**
  → Component signature gains one new prop.

  ```jsx
  // Before
  function Destinations() {

  // After
  function Destinations({ onSelectDestination }) {
  ```

- [ ] **Step 4 — Wire card activation: `onClick` + `onKeyDown` on each `<a>` card**
  → Click and Enter already work via native `<a>` behaviour (with `preventDefault`);
  Space is added explicitly via `onKeyDown`.

  Inside the `filtered.map()` in `Destinations`, change the `<a>` element:
  ```jsx
  // Before
  <a
    key={d.code}
    className={query ? "dest__card" : "dest__card reveal"}
    href="#book"
    style={query ? undefined : { transitionDelay: `${(i % 4) * 80}ms` }}
  >

  // After
  <a
    key={d.code}
    className={query ? "dest__card" : "dest__card reveal"}
    href="#book"
    style={query ? undefined : { transitionDelay: `${(i % 4) * 80}ms` }}
    onClick={(e) => { e.preventDefault(); onSelectDestination(d.code); }}
    onKeyDown={(e) => {
      if (e.key === " ") { e.preventDefault(); onSelectDestination(d.code); }
    }}
  >
  ```

  Notes:
  - `e.preventDefault()` in `onClick` suppresses the native `href="#book"` hash-jump so
    only the programmatic `scrollIntoView` (in `handleSelectDestination`) controls scroll.
  - `onKeyDown` for Space is needed because `<a href>` elements do not fire `onClick` on
    Space — they page-scroll instead. Enter fires `onClick` natively, so no extra Enter
    handling is needed.
  - `href="#book"` is retained as a progressive-enhancement fallback (no-JS browsers still
    navigate to the booking section).
  - The `<a>` element already has `role="link"` and is tab-focusable natively; no `tabIndex`
    or explicit ARIA role additions are needed to satisfy the keyboard-reachability AC.

---

## Impact assessment

- **Code paths affected:** `App` render path (one new state, one new function, two prop
  additions); `Booking` render path (prop signature only — select `value`/`onChange` wiring
  is a one-line swap); `Destinations` render path (prop signature + two new event handlers on
  each card element). No logic outside `App.jsx` is touched.
- **Data or schema impact:** None. `src/data.js` is not modified. `DESTINATIONS[*].code`
  values are already valid `AIRPORTS` codes — the `to` select will always have a matching
  `<option>` for any prefilled value.
- **Dependency or API impact:** None. No new imports, no new npm packages.
- **Other form fields:** `from`, `date`, `pax`, `result`, `error` remain local to `Booking`
  and are never touched by the card activation path. The AC requirement that "other fields
  retain their values" is structurally guaranteed.
- **Stale quote result:** If the user has already submitted the booking form and has a quote
  displayed, activating a destination card changes `to` but does not clear `result`. The
  quote shown will be stale until the user re-submits. This is acceptable — the AC does not
  require clearing the result on destination change, and the form's submit flow will produce
  an updated quote naturally.
- **Persistence:** `bookingTo` lives in React state (`useState`), not `localStorage`. It
  resets to `"LCY"` on every page load. The AC "not persisted on fresh page load" is
  structurally satisfied.
- **Mobile scroll:** `scrollIntoView({ behavior: 'smooth' })` works across all viewport
  sizes. The booking section has a fixed `id="book"` on its `<section>` element; it is
  always in the DOM regardless of viewport width.

---

## Validation

- **Build check:** `npm run build` — must exit 0 with no errors or warnings. This is the
  only CI-equivalent gate.
- **Manual verification — desktop:**
  1. `npm run dev` → open app.
  2. Scroll to the Destinations section; click any card (e.g. Dubai) — page scrolls to
     the Booking form; the `to` select shows "Dubai (OMDB)".
  3. Set the `from` select to "Miami", change Guests to 3, then click a different card
     (e.g. Tokyo) — `to` updates to Tokyo; `from` remains Miami; Guests remains 3.
  4. Click another card after clicking the first — `to` shows the second card's destination.
  5. Manually change `to` in the select to "Sydney", then click a card — the card's value
     overwrites Sydney.
  6. Tab to a destination card, press Enter — same prefill + scroll behaviour as click.
  7. Tab to a destination card, press Space — same prefill + scroll behaviour as click
     (no unwanted page scroll).
  8. Submit the booking form to get a quote, then click a destination card — `to` updates,
     quote result remains visible (stale, but not reset).
  9. Reload the page — booking form shows `to = "London (LCY)"` (the default); no prefill
     from a previous card activation.
  10. Confirm all other sections (Nav, Hero, Fleet, Membership, Footer, Settings panel,
      theme toggle) continue to function normally.
- **Manual verification — mobile (≤980 px):**
  1. Resize to ≤600 px; scroll to destinations; tap a card — form scrolls into view and
     `to` is prefilled. The form should not be obscured by the nav (the nav has `z-index:100`
     and the scroll target is the `#book` section, not the top of the page, so it lands
     correctly).
- **Lint/typecheck:** No lint or typecheck scripts in `package.json`. None to run.
- **Tests:** No test suite. None to write or update.

---

## Uncertainty flags

- **Stale quote display after prefill:** When the user has a quote showing and then activates a
  card, the quote result for the old origin/destination pair remains visible. This is not
  addressed by the AC; leaving it as-is avoids scope creep. If this becomes a UX concern, a
  `useEffect` in `Booking` that clears `result` when `to` changes would be a minimal fix —
  but that should be a separate ticket.
- **`scrollIntoView` vs `window.scrollTo`:** `scrollIntoView` is used because it targets the
  element directly without needing to compute `offsetTop`. Cross-browser support is universal
  for modern browsers. On iOS Safari, `{ behavior: 'smooth' }` may silently degrade to instant
  scroll on older versions (pre-15.4); this is acceptable for a demo app.
- **`href="#book"` kept on cards:** Retaining the `href` is a conscious choice (progressive
  enhancement). If a future ticket converts the cards to `<button>` elements for stricter
  semantic alignment with their "action" role, the `href` and its `preventDefault` pattern
  would be replaced with a plain `onClick` on the `<button>`. That change is out of scope here.

---

## Open questions

None that block implementation. All AC points are resolvable from the existing codebase
without further clarification.
