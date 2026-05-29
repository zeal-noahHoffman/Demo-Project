# KAN-6 — Atlantic Cruise Speed Correction

## Goal

The Atlantic fleet card (id: `mid`) displays the correct cruise speed of **505 kts** under the
"Cruise" spec label. The previously incorrect value of "513 kts" is no longer shown anywhere
in the application.

**DONE WHEN:**
- `src/data.js` — `FLEET[1].specs` Cruise entry reads `["Cruise", "505 kts"]`
- The Fleet section of the UI renders "505 kts" for The Atlantic card
- No other files reference the old value "513 kts"

---

## Summary of approach

A one-line string replacement in the static data file `src/data.js`. The `specs` array for
the `mid` fleet entry is the single source of truth for all displayed spec values; no
transformation or derivation occurs between data and render. The quote engine's speed
calculation uses an independent constant (`cruiseKmh = 880`) and is unaffected.

---

## Related code

- `src/data.js` — Defines the `FLEET` array. The `mid` entry (index 1, id `"mid"`, name
  "The Atlantic") contains the `specs` array where `["Cruise", "513 kts"]` must become
  `["Cruise", "505 kts"]`. This is the **only** file that needs to change.
- `src/App.jsx` — `Fleet` component iterates `jet.specs` and renders each `[label, value]`
  pair verbatim with `<span>{label}</span><b>{value}</b>`. No formatting or mapping —
  confirms the raw string in `data.js` is what the user sees.

---

## Current state

- **Existing incorrect value:** `["Cruise", "513 kts"]` at `FLEET[1].specs[2]` in
  `src/data.js` (line ~57).
- **Quote engine** uses `const cruiseKmh = 880;` — completely independent of the specs
  display strings. Changing the display label has zero effect on price/duration calculations.
- **No tests** are present in the project; there is no test suite to update.
- **No CLAUDE.md** exists; no repo-level guardrails are active. [PROVISIONAL — needs human review]

---

## Structural considerations

- **Hierarchy:** The change is entirely within the data layer (`src/data.js`). No component
  or utility code is touched.
- **Abstraction:** The spec value is a plain display string — no abstraction mismatch.
- **Modularity:** `FLEET` is the single source of truth. No duplication to audit elsewhere.
- **Encapsulation:** The `specs` array is read-only from the component's perspective; this
  edit stays behind the data boundary.

---

## Refactoring

None required. The existing structure cleanly separates data from rendering.

---

## Implementation steps

- [ ] Step 1 — In `src/data.js`, locate the `mid` fleet entry (`id: "mid"`, name
  `"The Atlantic"`) and change `["Cruise", "513 kts"]` to `["Cruise", "505 kts"]` →
  the display value is corrected at its single source of truth.

That is the complete implementation. One file, one line.

---

## Impact assessment

- **Code paths affected:** `Fleet` component render path in `App.jsx` — the displayed string
  changes; no logic path is altered.
- **Data or schema impact:** None. The `specs` field is `string[][]`; the shape is unchanged.
- **Dependency or API impact:** None. The quote engine (`quote()`, `distanceKm()`) is
  unaffected — it does not read from `specs`.

---

## Validation

- **Manual verification:** Start the dev server (`npm run dev` / `vite`), navigate to the
  Fleet section, select "The Atlantic" tab, confirm the Cruise spec reads "505 kts".
- **Lint/format/typecheck:** Run the project's lint command if configured (check
  `package.json` scripts for `lint` / `typecheck`). For this single string change, no
  type errors are expected.
- **Tests to write or update:** No test suite exists in the project. No tests to update.
  Optionally add a snapshot or data-integrity unit test for `FLEET` specs as a follow-on
  improvement, but that is out of scope for this ticket.
- **Grep check (pre-merge):** Confirm `"513 kts"` no longer appears anywhere in the
  repository (`grep -r "513 kts" src/`).

---

## Uncertainty flags

- **Quote engine alignment:** The quote engine uses `cruiseKmh = 880` (~475 kts), which is
  lower than either the old or new spec value. This is a pre-existing inconsistency between
  display specs and the calculation model. It is not introduced by this change and is out of
  scope — flagged for awareness only.

---

## Open questions

None. The ticket is fully specified: change `"513 kts"` → `"505 kts"` in the `mid` fleet
entry in `src/data.js`.
