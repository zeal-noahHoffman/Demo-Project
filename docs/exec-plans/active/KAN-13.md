# KAN-13 — Add Adventure Membership Tier

## Goal

Insert a new "Adventure" membership tier as the **last** entry in the `TIERS` array in
`src/App.jsx`, positioned after the existing Horizon card, at a price of $40k/year.

**DONE WHEN:**
- `src/App.jsx` — `TIERS[3]` is the Adventure tier object with name `"Adventure"`, price
  `"40k"`, period `"/ year"`, `feature: false`, and the four perks listed in the ticket.
- The Membership section renders an Adventure card as the fourth (last) card with heading
  "Adventure", price "$40k / year", and the correct four-perk list.
- The three existing tiers (Explorer, Voyager, Horizon) are unmodified and continue to
  render in their original order immediately before Adventure.

---

## Summary of approach

A single object insertion at the end of the `TIERS` array defined in `src/App.jsx`. No new
files, no new components, no data-layer changes. The `Membership` component iterates `TIERS`
generically (`TIERS.map(...)`) so the new entry is picked up automatically. The price
rendering logic (`t.price.startsWith("Bespoke") ? "" : "$"`) correctly prefixes `"$"` to
`"40k"` → displays `$40k`.

A companion CSS update to `.member__grid` is also in scope (see Uncertainty Flags /
Implementation Steps): the grid is currently `repeat(3, 1fr)`, and adding a fourth tier
causes the Adventure card to wrap to a second row in an unbalanced layout. Updating to
`repeat(4, 1fr)` (with a responsive fallback) keeps the grid correct without touching any
other style rules.

---

## AC / DoD note

The Acceptance Criteria contains a likely copy-paste error: it reads "Adventure card renders
as the **first** tier…" The Definition of Done is unambiguous: "Insert the Adventure tier as
the **last** entry in the TIERS array." This plan follows the DoD. The AC wording mirrors
KAN-8's language (which did insert a first-position tier) and should be read as "Adventure
card renders as a tier with correct price and perks."

---

## Related code

- `src/App.jsx` — Contains the `TIERS` constant (lines 310–337) and the `Membership`
  component (lines 339–372) that maps over it. **Primary change target.**
- `src/styles.css` — Line 435 defines `.member__grid { grid-template-columns: repeat(3,
  1fr); }`. Needs updating to `repeat(4, 1fr)` to accommodate the fourth card. Line 519
  defines the mobile override (`grid-template-columns: 1fr`) — no change needed there.
- `src/data.js` — Contains `FLEET`, `AIRPORTS`, `DESTINATIONS`, and the quote engine.
  **Not involved** in this ticket; membership tiers are kept in `App.jsx`.

---

## Current state

**TIERS array after KAN-8 (lines 310–337 of `src/App.jsx`):**

| Index | Name     | Price   | `feature` | Perks (count) |
|-------|----------|---------|-----------|---------------|
| 0     | Explorer | `"3k"`  | `false`   | 4 — 6 hours, light jet, 48-hr window, travel desk |
| 1     | Voyager  | `"12k"` | `false`   | 4 — 25 hours, light & midsize, 48-hr window, travel desk |
| 2     | Horizon  | `"20k"` | `true`    | 5 — 120 hours, full-fleet, 10-hr availability, fixed rates, empty-leg upgrades |

- **Feature flag:** Only Horizon carries `feature: true`; it renders with `tier--feature`
  class and a `btn--gold` CTA. Adventure is a standard non-featured tier → `feature: false`,
  `btn--ghost` CTA, no highlight ring.
- **Price rendering:** The `"$"` prefix is added unless `t.price.startsWith("Bespoke")`.
  `"40k"` does not start with `"Bespoke"`, so it renders as `$40k`.
- **Grid:** `.member__grid` is `repeat(3, 1fr)`. Currently 3 tiers → clean 3-column layout.
  Adding a 4th entry without changing the CSS causes Adventure to wrap to a second row alone.
- **Mobile breakpoint (line 519):** `.member__grid { grid-template-columns: 1fr; }` stacks
  all cards — no change needed for mobile.
- **No test suite:** The project has no automated tests. No test files to update.

---

## Structural considerations

- **Data pattern:** `TIERS` is defined inline in the component file as a module-level
  constant — the same pattern used for all existing tiers. Moving it to `data.js` is a valid
  refactor but explicitly out of scope here.
- **Object shape:** Adventure uses the identical tier object shape
  (`name`, `price`, `period`, `feature`, `perks: string[]`). No new fields needed.
- **Scroll-reveal stagger:** The `transitionDelay` is `i * 100ms`. Adventure at index 3
  gets a 300 ms delay — one step further than Horizon, which is cosmetically fine.
- **`key` prop:** The map uses `t.name` as the React key. "Adventure" is unique among tier
  names, so no collision.

---

## Refactoring

None required. The existing structure cleanly absorbs a fourth entry.

---

## Implementation steps

- [ ] **Step 1 — `src/App.jsx`: Insert Adventure as the last TIERS entry**

  Locate the `TIERS` array (line 310). Append the following object immediately before the
  closing `];` (currently line 337), after the Horizon entry:

  ```js
  {
    name: "Adventure",
    price: "40k",
    period: "/ year",
    feature: false,
    perks: [
      "24 flight hours included",
      "Full jet access",
      "8-hour booking window",
      "Complimentary free checked bags",
    ],
  },
  ```

  Resulting array order: Explorer → Voyager → Horizon → **Adventure**.

- [ ] **Step 2 — `src/styles.css`: Update `.member__grid` to 4 columns**

  Locate line 435:
  ```css
  .member__grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 22px; }
  ```
  Change `repeat(3, 1fr)` to `repeat(4, 1fr)`:
  ```css
  .member__grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 22px; }
  ```
  The mobile override at line 519 (`grid-template-columns: 1fr`) is unaffected and requires
  no change.

---

## Impact assessment

- **Code paths affected:** The `Membership` component render path in `App.jsx`. The grid
  layout in `styles.css`.
- **Data or schema impact:** None. The new entry conforms to the existing tier object shape.
- **Dependency or API impact:** None. The membership section is purely presentational with
  no backend calls.
- **Side-effects:** The `transitionDelay` stagger for existing cards is unchanged (they keep
  indices 0–2). Adventure at index 3 gets 300 ms delay. No visual regression on existing
  cards.

---

## Validation

- **Tests to write or update:** No test suite exists. No automated tests to update.
- **Build check:** Run `npm run build` to confirm the project compiles without errors.
- **Manual verification steps:**
  1. Start the dev server: `npm run dev`.
  2. Open the page and scroll to the Membership section.
  3. Confirm **four** cards render side-by-side in a single row (desktop).
  4. Confirm the last card heading reads **"Adventure"**.
  5. Confirm the price displays as **"$40k / year"**.
  6. Confirm the four perks:
     - "24 flight hours included"
     - "Full jet access"
     - "8-hour booking window"
     - "Complimentary free checked bags"
  7. Confirm Adventure does **not** have the featured highlight ring (no `tier--feature`
     class; CTA button uses `btn--ghost`).
  8. Confirm Explorer, Voyager, and Horizon precede it in their original order and are
     visually unchanged.
  9. Resize to mobile — confirm all four cards stack to a single column.

---

## Uncertainty flags

- **`feature` flag for Adventure:** The ticket does not specify whether Adventure should be
  featured. Horizon at $20k carries `feature: true`; Adventure at $40k is more expensive but
  the ticket makes no mention of highlighting it. This plan sets `feature: false` to avoid
  any unspecified visual promotion and to keep Horizon as the single featured tier. If the
  intent is for Adventure to become the new featured card, `feature: true` should be set on
  Adventure and `feature: false` on Horizon — confirm with ticket author if needed.

- **Grid column count:** The DoD only mentions `TIERS` in `App.jsx`, but without the CSS
  update the card layout is broken (4th card wraps to a second row alone). This plan includes
  the `repeat(4, 1fr)` fix as a necessary companion change. If the intent is a responsive
  `auto-fit` grid instead, `repeat(auto-fit, minmax(220px, 1fr))` is a valid alternative and
  would be future-proof for further tier additions.

- **AC wording ("first tier"):** Treated as a copy-paste error; DoD takes precedence. No
  action required beyond noting it.

---

## Open questions

1. Should Adventure carry `feature: true` (highlighted/gold CTA), displacing Horizon as the
   featured tier, or remain a standard `feature: false` card?
2. Is a `repeat(4, 1fr)` hard-coded column count acceptable, or should the grid use
   `auto-fit` / `auto-fill` to be robust against future tier additions?
