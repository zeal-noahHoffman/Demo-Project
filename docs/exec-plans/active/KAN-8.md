# KAN-8 — Add Explorer Tier

## Goal

Insert a new "Explorer" membership tier as the first entry in the `TIERS` array in
`src/App.jsx`, positioned before the existing Voyager tier.

**DONE WHEN:**
- `src/App.jsx` — `TIERS[0]` is the Explorer tier object with name `"Explorer"`, price
  `"3k"`, period `"/ year"`, `feature: false`, and the four perks listed in the ticket.
- The Membership section renders an Explorer card as the first (leftmost) card on the page
  with the heading "Explorer", price "$3k / year", and the correct perk list.
- The three existing tiers (Voyager, Horizon, Sovereign) are unmodified and continue to
  render in their original order immediately after Explorer.

---

## Summary of approach

A single object insertion at index 0 of the `TIERS` array defined in `src/App.jsx`. No new
files, no new components, no style changes, no data-layer changes. The `Membership`
component already iterates `TIERS` generically (`TIERS.map(...)`) so the new entry is
picked up automatically. The price rendering logic (`t.price.startsWith("Bespoke") ? "" :
"$"`) already handles a numeric-string price like `"3k"` correctly — the Explorer card will
display `$3k`.

---

## Related code

- `src/App.jsx` — Contains the `TIERS` constant (lines ~286–310) and the `Membership`
  component that maps over it. **This is the only file that needs to change.** The `TIERS`
  array is defined inline in the component file (data-as-code pattern), consistent with how
  the project is structured.
- `src/styles.css` — Defines `.member__grid` (line 435: `grid-template-columns: repeat(3,
  1fr)`), `.tier`, `.tier--feature`, and associated rules. No changes are in scope for this
  ticket, but see Uncertainty Flags below for a layout side-effect.
- `src/data.js` — Contains `FLEET`, `AIRPORTS`, `DESTINATIONS`, and the quote engine. Not
  involved in this ticket; membership tiers are intentionally kept in `App.jsx`.

---

## Current state

- **Existing TIERS array (3 entries, lines ~286–310 of `src/App.jsx`):**

  | Index | Name      | Price    | `feature` | Perks                                                         |
  |-------|-----------|----------|-----------|---------------------------------------------------------------|
  | 0     | Voyager   | `"12k"`  | `false`   | 25 flight hours, light & midsize access, 48-hr window, travel desk |
  | 1     | Horizon   | `"48k"`  | `true`    | 120 hours, full-fleet, 10-hr availability, fixed rates, empty-leg upgrades |
  | 2     | Sovereign | `"Bespoke"` | `false` | Unlimited hours, dedicated aircraft, 1-hr availability, global concierge, family accounts |

- **Price rendering:** The `Membership` component prefixes `"$"` unless the price string
  starts with `"Bespoke"`. A price value of `"3k"` will correctly render as `"$3k"`.

- **Feature flag:** Only Horizon carries `feature: true`. Explorer is a standard
  (non-featured) tier → `feature: false`, rendered with `btn--ghost` CTA, no highlight ring.

- **No test suite:** The project has no automated tests. No test files to update.

- **No CLAUDE.md:** No repo-level guardrails are active. [PROVISIONAL — needs human review]

---

## Structural considerations

- **Hierarchy:** The `TIERS` constant is data-layer state defined in the component layer
  (App.jsx). This is the existing pattern — mirroring it is correct. Moving tiers to
  `data.js` would be a valid refactor but is explicitly out of scope.
- **Abstraction:** The insertion is at the correct level. The `Membership` component is
  generic over the array and requires no changes to absorb a fourth entry.
- **Modularity:** The `TIERS` array is the single source of truth for tier display. There is
  no duplication to audit.
- **Encapsulation:** The new entry uses only the existing tier object shape
  (`name`, `price`, `period`, `feature`, `perks`). No new fields, no contract change.

---

## Refactoring

None required. The existing structure cleanly absorbs the new entry.

---

## Implementation steps

- [ ] Step 1 — In `src/App.jsx`, locate the `TIERS` array constant (search for
  `const TIERS = [`). Insert the following object as the **first** element (index 0),
  before the existing Voyager entry:

  ```js
  {
    name: "Explorer",
    price: "3k",
    period: "/ year",
    feature: false,
    perks: [
      "6 flight hours included",
      "Light jet access",
      "48-hour booking window",
      "Dedicated travel desk",
    ],
  },
  ```

  The resulting array order is: Explorer → Voyager → Horizon → Sovereign.

  That is the complete implementation. One file, one insertion.

---

## Impact assessment

- **Code paths affected:** The `Membership` component render path in `App.jsx`. Adding an
  element at index 0 shifts the `transitionDelay` stagger values for all subsequent cards
  by one step (100 ms per step), which is a cosmetically acceptable side-effect.
- **Data or schema impact:** None. The new entry conforms to the existing tier object shape.
- **Dependency or API impact:** None. The membership section is purely presentational with
  no backend calls.

---

## Validation

- **Tests to write or update:** No test suite exists. No automated tests to update.
- **Lint/format/typecheck commands:** Run `npm run build` (or `npm run dev`) to confirm the
  project compiles without errors after the insertion.
- **Manual verification steps:**
  1. Start the dev server: `npm run dev`.
  2. Open the page and scroll to the Membership section.
  3. Confirm the first card heading reads "Explorer".
  4. Confirm the price displays as "$3k / year".
  5. Confirm the four perks are listed: "6 flight hours included", "Light jet access",
     "48-hour booking window", "Dedicated travel desk".
  6. Confirm Explorer does **not** have the featured highlight ring (no `tier--feature`
     class, uses `btn--ghost` CTA).
  7. Confirm Voyager, Horizon, and Sovereign follow in their original order and are
     visually unchanged.

---

## Uncertainty flags

- **Grid layout — four cards in a three-column grid:** `src/styles.css` line 435 sets
  `.member__grid { grid-template-columns: repeat(3, 1fr); }`. Adding a fourth tier causes
  Sovereign to wrap to a second row, left-aligned, which looks visually unbalanced. The
  ticket DoD is explicit ("insert in TIERS array only") and the AC does not mention grid
  layout, so a CSS change is out of scope for this ticket. However, this side-effect should
  be reviewed before merging — a follow-on ticket or a quick `repeat(4, 1fr)` / `auto-fit`
  change may be warranted. Flagged here for engineer awareness; not blocking.

---

## Open questions

- **Grid update in scope?** The DoD is "insert in TIERS array only", but rendering four
  items in a three-column grid produces a broken layout (Sovereign wraps to a second row
  alone). Should the CSS grid column definition be updated to `repeat(4, 1fr)` (or
  `repeat(auto-fit, minmax(240px, 1fr))`) as part of this ticket, or filed as a separate
  follow-on? Recommend confirming with the ticket author before implementation begins.
