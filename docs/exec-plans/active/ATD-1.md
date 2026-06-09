# ATD-1 — Add "Hello World" Navbar Item

## Goal

The navbar contains a new item that displays the text **"Hello World"**.

**DONE WHEN:**
- `src/App.jsx` — the `LINKS` array includes a `["Hello World", "#"]` entry (or equivalent).
- The rendered navbar visually shows a "Hello World" link/button alongside the existing Fleet,
  Destinations, and Membership items.
- The new item receives the same hover/underline styling as the other nav links automatically
  (it inherits `.nav__links a` styles — no new CSS is required).
- No existing nav items are removed or reordered.

---

## Summary of approach

The `Nav` component in `src/App.jsx` renders its links by mapping over the `LINKS` constant
array (lines 28–32). Each entry is a `[label, href]` tuple rendered as an `<a>` inside the
`.nav__links` container. Adding a new navbar item is a one-line change: append
`["Hello World", "#"]` to `LINKS`. The `.nav__links a` CSS rules in `src/styles.css` apply
automatically — no stylesheet change is needed.

No alternative (e.g. a `<button>` element or a new entry in `nav__cta`) is warranted: the
AC does not specify interactive behavior beyond display, and the `LINKS` array is the
established pattern for navbar text items.

---

## Related code

- `src/App.jsx` — The `LINKS` constant (lines 28–32) and the `Nav` component (lines 45–112)
  are the only touch points. `LINKS` is the single source of truth for nav link items; `Nav`
  maps over it to produce `<a>` elements inside `.nav__links`.
- `src/styles.css` — `.nav__links a` (lines 184–199) styles all anchor children of
  `.nav__links`, including the underline animation on hover. No changes required here; the
  new item inherits these rules for free.

---

## Current state

- **Existing nav links:** `["Fleet", "#fleet"]`, `["Destinations", "#destinations"]`,
  `["Membership", "#membership"]` — all rendered via `LINKS.map()` inside `.nav__links`.
- **`nav__cta` area:** Contains the dark/light theme toggle `<button>` and a
  `btn btn--gold` "Request Access" anchor. This area is separate from `nav__links` and is
  not the target for this change.
- **Responsive behavior:** At ≤980 px, `.nav__links` is hidden until the hamburger is
  toggled (`nav.open`). The new item will appear in the mobile dropdown automatically
  because it is part of `LINKS`.
- **No test suite** exists in the project; no tests to write or update.
- **No external data dependency:** the new item is a static label string with no connection
  to `src/data.js`.

---

## Structural considerations

- **Hierarchy:** Change lives entirely in the presentation layer (`src/App.jsx`); data layer
  (`src/data.js`) is untouched. No layer violations.
- **Abstraction:** `LINKS` is already the right abstraction for this — it is the declared
  list of nav items. Adding an entry is the intended extension point.
- **Modularity:** `Nav` is self-contained in `App.jsx`. No God-module risk; the change does
  not expand its responsibilities.
- **Encapsulation:** No private internals are exposed. The `LINKS` array is module-scoped
  and consumed only by `Nav`.

---

## Refactoring

None required. The existing `LINKS` array pattern cleanly absorbs a new entry.

---

## Implementation steps

- [ ] Step 1 — In `src/App.jsx`, add `["Hello World", "#"]` to the `LINKS` array →
  the new nav item is declared at its single source of truth.

  **Before:**
  ```js
  const LINKS = [
    ["Fleet", "#fleet"],
    ["Destinations", "#destinations"],
    ["Membership", "#membership"],
  ];
  ```

  **After:**
  ```js
  const LINKS = [
    ["Fleet", "#fleet"],
    ["Destinations", "#destinations"],
    ["Membership", "#membership"],
    ["Hello World", "#"],
  ];
  ```

That is the complete implementation. One file, one line added.

---

## Impact assessment

- **Code paths affected:** `Nav` render path only — `LINKS.map()` produces one additional
  `<a>` element. No logic changes.
- **Data or schema impact:** None. `src/data.js` is not touched.
- **Dependency or API impact:** None. No imports, exports, or external consumers change.
- **Responsive behavior:** The new link automatically participates in the mobile dropdown
  (`.nav.open .nav__links`) because it is part of `LINKS` — no extra responsive CSS needed.

---

## Validation

- **Manual verification:** Run `npm run dev`, open the app, confirm "Hello World" appears in
  the navbar alongside Fleet, Destinations, and Membership. Verify hover underline animation
  applies. Resize to ≤980 px, open the hamburger menu, confirm "Hello World" appears in the
  mobile nav. Click the link — it should be a no-op anchor (`#`).
- **Lint/format/typecheck:** The project has no lint/typecheck scripts (`package.json` only
  defines `dev`, `build`, `preview`). No additional checks required.
- **Tests to write or update:** No test suite exists. No tests to update.

---

## Uncertainty flags

- **Link target (`href`):** The ticket does not specify what "Hello World" should link to or
  do. Using `"#"` (no-op anchor) is the safest placeholder — it satisfies the AC (visible
  button with the correct label) without navigating the user anywhere unexpected. If a real
  destination or action is later specified, only this one field changes.
- **Placement:** The AC does not specify position within the navbar. Appending to `LINKS`
  places it after "Membership" (last before the CTA area). If ordering matters, the plan
  step is the same — just reorder the array entry accordingly.

---

## Open questions

None that block implementation. The AC is fully satisfied by the one-line `LINKS` addition.
The two uncertainty flags above are documented for awareness; neither requires engineer
input before proceeding.
