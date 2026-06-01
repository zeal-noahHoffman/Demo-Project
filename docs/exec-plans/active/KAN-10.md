# KAN-10 — Sydney Destination

## Goal

Add Sydney, Australia as a destination card in the destinations grid so it appears showing
**"9.5h from Tokyo"**.

**DONE WHEN:**
- `src/data.js` — `DESTINATIONS` contains a Sydney entry:
  `{ code: "YSSY", city: "Sydney", country: "Australia", from: "Tokyo", hours: 9.5 }`
- The Destinations section of the UI renders a card with "9.5h from Tokyo", airport code
  "YSSY", city "Sydney", and country "Australia".
- All existing destination cards are unmodified.

---

## Summary of approach

A single object insertion into the `DESTINATIONS` array in `src/data.js`. No new files, no
component changes, no style changes. The `Destinations` component in `App.jsx` already
iterates `DESTINATIONS` generically and renders each entry verbatim — the new card is picked
up automatically with no further work.

---

## Related code

- `src/data.js` — Defines the `DESTINATIONS` array (lines 18–27). **This is the only file
  that needs to change.** Each entry has the shape
  `{ code, city, country, from, hours }` where `from` and `hours` are **display-only** —
  they are not derived from the `AIRPORTS` table or the quote engine.
- `src/App.jsx` — The `Destinations` component (lines 279–306) maps over `DESTINATIONS` and
  renders each entry as an `<a href="#book">` card using:
  ```jsx
  <span className="time">{d.hours}h from {d.from}</span>
  <span className="code">{d.code}</span>
  <span className="city">{d.city}</span>
  <span className="country">{d.country}</span>
  ```
  No transformation occurs between data and render. Confirms that `hours: 9.5` and
  `from: "Tokyo"` will display as "9.5h from Tokyo" exactly as the AC requires.

---

## Current state

- **`AIRPORTS` already includes Sydney** (`{ code: "YSSY", city: "Sydney", country:
  "Australia", lat: -33.95, lng: 151.18 }`) so the airport code `"YSSY"` is already valid
  for the booking widget dropdowns. No airport data change is needed.

- **`DESTINATIONS` (current 8 entries):**

  | code  | city         | from          | hours |
  |-------|--------------|---------------|-------|
  | LCY   | London       | New York      | 6.8   |
  | LFPB  | Paris        | New York      | 7.1   |
  | LSGG  | Geneva       | London        | 1.4   |
  | OMDB  | Dubai        | Paris         | 6.5   |
  | LAX   | Los Angeles  | New York      | 5.4   |
  | MIA   | Miami        | New York      | 2.9   |
  | LIML  | Milan        | London        | 1.8   |
  | RJTT  | Tokyo        | Los Angeles   | 11.2  |

- **No test suite:** The project has no automated tests. No test files to update.

---

## Structural considerations

- **`from` and `hours` are display strings/numbers, not computed.** The quote engine
  (`quote()`) uses a separate constant (`cruiseKmh = 880`) and is entirely unrelated to the
  `hours` field in `DESTINATIONS`. The value `9.5` is taken directly from the AC and should
  be stored as-is.
- **Placement in array:** The ticket does not specify a position. Appending at the end (index
  8) is the simplest approach and consistent with how previous destinations have been added.
  The `Destinations` component applies a CSS stagger based on `i % 4`, so position affects
  only the animation timing slightly — no visual concern.
- **`hours` type:** All existing entries use a JavaScript `number` (float literal, e.g.
  `6.8`, `11.2`). Use `9.5` (number), not `"9.5"` (string), to match the pattern.

---

## Refactoring

None required. The existing structure cleanly absorbs the new entry.

---

## Implementation steps

- [ ] Step 1 — In `src/data.js`, locate the `DESTINATIONS` array (search for
  `export const DESTINATIONS = [`). Append the following object as the **last** element,
  after the existing Tokyo entry:

  ```js
  { code: "YSSY", city: "Sydney",  country: "Australia",    from: "Tokyo",      hours: 9.5 },
  ```

  That is the complete implementation. One file, one line.

---

## Impact assessment

- **Code paths affected:** The `Destinations` component render path in `App.jsx`. The grid
  grows from 8 to 9 cards. The CSS grid uses `auto-fill` / responsive columns (check
  `src/styles.css` for `.dest__grid`) so the extra card flows in naturally with no layout
  breakage.
- **Data or schema impact:** None. The new entry conforms exactly to the existing
  `DESTINATIONS` object shape.
- **Dependency or API impact:** None. `DESTINATIONS` is consumed only by the `Destinations`
  component for display; the booking widget and quote engine use `AIRPORTS` independently.

---

## Validation

- **Tests to write or update:** No test suite exists. No automated tests to update.
- **Build check:** Run `npm run build` to confirm the project compiles without errors after
  the insertion.
- **Manual verification steps:**
  1. Start the dev server: `npm run dev`.
  2. Open the page and scroll to the Destinations section.
  3. Confirm a Sydney card is visible in the grid.
  4. Confirm the time line reads exactly **"9.5h from Tokyo"**.
  5. Confirm the airport code reads **"YSSY"**, city **"Sydney"**, country **"Australia"**.
  6. Confirm all existing 8 destination cards are present and unmodified.
  7. Confirm clicking the Sydney card scrolls to the booking widget (`#book`).

---

## Uncertainty flags

- **`hours` display precision:** JavaScript renders `9.5` as `"9.5"` in JSX template
  literals, which matches the AC exactly. No formatting concern.
- **Quote engine vs. display hours:** The actual Tokyo → Sydney flight time computed by
  `quote("RJTT", "YSSY", ...)` (haversine + 0.55 h overhead) will differ from the display
  value of `9.5`. This is an existing pattern across all DESTINATIONS entries — display hours
  are editorial/marketing values, not live calculations. No inconsistency introduced.

---

## Open questions

None. The ticket is fully specified: append a Sydney object to `DESTINATIONS` in
`src/data.js` with `from: "Tokyo"` and `hours: 9.5`.
