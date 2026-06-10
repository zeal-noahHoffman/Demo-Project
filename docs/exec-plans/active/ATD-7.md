# ATD-7 — Add a "Back to top" Floating Button

## Goal

A fixed-position "back to top" button that:
- Is invisible / inert when the page is near the top (scroll offset ≤ 400 px)
- Fades/slides into view after scrolling past 400 px
- Smooth-scrolls the page back to `#top` on click
- Is styled with the existing CSS custom properties and does not break layout at any
  mobile width

**DONE WHEN:**
- Button is hidden at the top and visible after scrolling > 400 px.
- Click smooth-scrolls to the top of the page.
- Styled consistently (uses existing design tokens; reuses the site's primary blue palette).
- Does not overlap the footer awkwardly (shadow + blue-on-navy contrast addressed).
- Renders cleanly at all responsive breakpoints (≥ 360 px wide).
- `npm run build` exits cleanly; no existing section or component is modified.

---

## Summary of approach

Add a single self-contained `BackToTop` component to `src/App.jsx` (one new function, no
new file). Mount it once at the bottom of `App()`'s return tree, after `SettingsPanel`.
Wire show/hide via `useState` + a passive `scroll` listener (identical pattern to `Nav`'s
`scrolled` state). Click handler calls `window.scrollTo({ top: 0, behavior: 'smooth' })`
— no reliance on `href="#top"` so the button stays a semantic `<button>` (action) rather
than an anchor (navigation).

CSS is appended to `src/styles.css` as a new `/* Back to top */` block. Two rules cover
all cases:
- `.back-to-top` — base fixed-position, hidden state (opacity 0, pointer-events none,
  slight downward translate)
- `.back-to-top--visible` — shown state (opacity 1, pointer-events auto, translate 0)

One minor addition to the existing `@media (max-width: 560px)` block adjusts the bottom/
right offset for narrow viewports. The `@media (prefers-reduced-motion: reduce)` block
already disables all transitions globally — no extra work needed there.

The `BackToTop` component is appended to the `App` return and does not touch any existing
component. The build, scroll-reveal hook, nav, footer, and settings panel are unchanged.

---

## Related code

- `src/App.jsx` — All application components and hooks live here. `BackToTop` is added as
  a new function component (following the existing single-file convention). It is mounted
  once inside `App()`'s return block alongside `SettingsPanel`. The `Nav` component
  (lines 46–123) is the closest prior art for the scroll-listener pattern.
- `src/styles.css` — Single flat stylesheet. A new `/* Back to top */` section is appended
  after the settings panel rules. The `@media (max-width: 560px)` block (line 570+) gains
  one rule for mobile positioning.

---

## Current state

- **Scroll listener pattern:** `Nav` uses `window.addEventListener("scroll", handler,
  { passive: true })` with `useEffect` cleanup — identical pattern applies to `BackToTop`.
- **CSS custom properties available:** `--blue`, `--blue-bright`, `--ease`, `--shadow`,
  `--paper`, `--ink`, `--line` are all defined on `:root` and override in
  `[data-theme="dark"]`. The button uses `--blue` (background) + `#fff` (icon), matching
  the `btn--gold` style used for primary CTAs throughout the page.
- **`html { scroll-behavior: smooth; }`** is declared (line 70 of styles.css), so
  `window.scrollTo({ top: 0, behavior: 'smooth' })` is consistent with native scroll
  behavior.
- **Z-index landscape:** `.nav` = 100; `.settings-overlay` = 200; `.booking` = 5. The
  back-to-top button at `z-index: 150` sits above the nav but below the settings overlay.
- **`prefers-reduced-motion` block** (line 665) sets `animation: none !important;
  transition: none !important` on all elements — the show/hide transition is automatically
  suppressed; the button will simply snap to visible/hidden with no motion.
- **Footer background:** `var(--navy)` (#081333 dark blue). A `--blue` button over this
  background has modest contrast. Adding `box-shadow: 0 0 0 3px rgba(255,255,255,0.15)`
  (a soft white halo) creates separation without changing the color story. In dark mode
  `--navy` stays unchanged so the halo remains effective.
- **No test suite** — `package.json` has only `dev`, `build`, `preview`.
- **No existing section is modified** — `BackToTop` is fully additive.

---

## Structural considerations

- **Hierarchy:** Change lives entirely in the presentation layer (`src/App.jsx` +
  `src/styles.css`). The data layer (`src/data.js`) is untouched, as are all existing
  components.
- **Abstraction:** The component encapsulates its own visibility state and scroll
  listener — no prop drilling, no context. Correct level of abstraction for a leaf UI
  element.
- **Modularity:** Self-contained; could be extracted to its own file with zero changes
  to its API if the project grows. No new cross-component responsibilities introduced.
- **Encapsulation:** No internals of existing components are read or mutated. The
  button is appended as a sibling to `SettingsPanel` inside the root `<div>`.

---

## Refactoring

None required. The existing component structure cleanly absorbs a new leaf component.

---

## Implementation steps

- [ ] **Step 1 — Add `BackToTop` component in `src/App.jsx`**

  Insert the new function component directly above the `/* app */` comment (around
  line 549), following the existing section-header convention.

  ```jsx
  /* --------------------------------------------------------- back to top */

  function BackToTop() {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
      const onScroll = () => setVisible(window.scrollY > 400);
      onScroll(); // set initial state on mount
      window.addEventListener("scroll", onScroll, { passive: true });
      return () => window.removeEventListener("scroll", onScroll);
    }, []);

    return (
      <button
        className={`back-to-top${visible ? " back-to-top--visible" : ""}`}
        aria-label="Back to top"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
             strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
             aria-hidden="true">
          <polyline points="18 15 12 9 6 15" />
        </svg>
      </button>
    );
  }
  ```

  → `BackToTop` is now declared and ready to be mounted.

- [ ] **Step 2 — Mount `<BackToTop />` in `App()`'s return**

  In `src/App.jsx`, locate the `App` return block (line 574). Add `<BackToTop />` after
  `<SettingsPanel … />` and before the closing `</div>`:

  ```jsx
  return (
    <div ref={root}>
      <Nav … />
      <Hero />
      <Booking />
      <Fleet />
      <Destinations />
      <Membership />
      <CTA />
      <Footer />
      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <BackToTop />       {/* ← add this line */}
    </div>
  );
  ```

  → Button is now rendered in the DOM on every page load.

- [ ] **Step 3 — Add CSS to `src/styles.css`**

  Append a new section after the `/* Toggle Theme-switch transitions */` block (after
  line 663):

  ```css
  /* ============================ BACK TO TOP ============================ */
  .back-to-top {
    position: fixed;
    bottom: 32px;
    right: 32px;
    z-index: 150;
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: var(--blue);
    color: #fff;
    border: none;
    display: grid;
    place-items: center;
    box-shadow: 0 8px 24px -10px rgba(31, 95, 208, 0.55),
                0 0 0 3px rgba(255, 255, 255, 0.12); /* halo for contrast on dark footer */
    opacity: 0;
    pointer-events: none;
    transform: translateY(10px);
    transition: opacity 0.35s var(--ease), transform 0.35s var(--ease),
                background 0.3s var(--ease), box-shadow 0.3s var(--ease);
    cursor: pointer;
  }
  .back-to-top svg {
    width: 20px;
    height: 20px;
    display: block;
  }
  .back-to-top--visible {
    opacity: 1;
    pointer-events: auto;
    transform: translateY(0);
  }
  .back-to-top:hover {
    background: var(--blue-bright);
    transform: translateY(-3px);
    box-shadow: 0 14px 30px -10px rgba(31, 95, 208, 0.75),
                0 0 0 3px rgba(255, 255, 255, 0.18);
  }
  ```

  Then, inside the existing `@media (max-width: 560px)` block, add a mobile-specific
  offset so the button doesn't crowd the edge at narrow widths:

  ```css
  @media (max-width: 560px) {
    /* … existing rules … */
    .back-to-top { bottom: 20px; right: 20px; }
  }
  ```

  → Button is styled, transitions correctly, and is visually separated from the dark
  footer via the soft white halo ring.

- [ ] **Step 4 — (Optional) Add to theme-switch transition list**

  The existing multi-selector rule (lines 648–663) transitions `background-color`,
  `color`, `border-color`, `box-shadow` on key elements to smooth theme switches. The
  back-to-top button uses `var(--blue)` which does not change between light/dark themes,
  so this step is a no-op — **skip it**.

---

## Impact assessment

- **Code paths affected:** `BackToTop` render path only. Passive scroll listener added;
  no interaction with any existing component's state or event chain.
- **Data or schema impact:** None. `src/data.js` untouched.
- **Dependency or API impact:** None. No new imports; `useState` and `useEffect` are
  already imported at the top of `App.jsx` (line 1).
- **Z-index:** 150 — above nav (100), below settings overlay (200). Button remains
  accessible when the settings panel is closed; hidden behind the modal overlay when open.
- **Responsive behavior:** Button appears in the lower-right at all breakpoints. The
  `@media (max-width: 560px)` rule tightens the offset to 20 px to avoid crowding the
  20 px page padding.
- **`prefers-reduced-motion`:** The global `* { transition: none !important }` rule
  already covers this — no additional work needed. The button snaps to visible/hidden
  without motion.

---

## Validation

- **Build check:** `npm run build` — must exit cleanly with no errors or warnings.
- **Manual — desktop:**
  1. `npm run dev`, open in browser.
  2. Confirm button is not visible at page load (scroll position 0).
  3. Scroll past 400 px — button should fade + rise into view in the bottom-right corner.
  4. Scroll back to near the top (< 400 px) — button should fade out.
  5. Click the button — page smooth-scrolls to the hero.
  6. Verify button renders correctly over the dark footer section when scrolled to the
     bottom.
  7. Toggle dark mode via the nav — button should remain visible/blue with white icon.
- **Manual — mobile (≤ 560 px):**
  1. Resize to a narrow viewport (e.g. 375 px).
  2. Confirm button appears at `bottom: 20px; right: 20px`.
  3. Confirm button does not overflow the viewport edge or overlap the mobile nav.
- **Reduced motion:**
  1. Enable "Prefers Reduced Motion" in the OS/browser.
  2. Scroll past 400 px — button should appear instantly (no fade/slide transition).
- **No existing section modified:** Inspect the rendered DOM to confirm `Nav`, `Hero`,
  `Booking`, `Fleet`, `Destinations`, `Membership`, `CTA`, `Footer`, and `SettingsPanel`
  are unchanged.
- **Lint/typecheck:** Project has no lint or typecheck scripts — no additional steps.

---

## Uncertainty flags

- **Scroll threshold (400 px):** The ticket says "> 400 px (e.g. > 400 px)". Treating
  this as `window.scrollY > 400` which hides at or below 400 and shows above. If the
  team prefers a different threshold, only the numeric constant in the `useEffect`
  changes.
- **Button shape (circle vs. pill):** Circle (`border-radius: 50%`) is chosen as the
  most compact, conventional shape for this pattern and avoids layout interference.
  A pill-shaped button with a text label is an alternative but would require more
  horizontal space.
- **`window.scrollTo` vs. `href="#top"`:** `window.scrollTo({ top: 0, behavior: 'smooth' })`
  is used because the element is a `<button>` (action semantics, not navigation). Both
  paths produce identical smooth-scroll behavior since `html { scroll-behavior: smooth; }`
  is already set. If an `<a>` is preferred for accessibility tooling, substitute
  `<a href="#top" role="button">` with the same CSS class — the CSS and visibility logic
  are unchanged.

---

## Open questions

None that block implementation. The AC is fully specified and all decisions above are
derivable from the existing codebase conventions.
