# KAN-7 — Change Hero Font

## Goal

The hero heading "The sky, privately yours." must render in Georgia font.

**DONE WHEN:**
- `.hero__title` in `src/styles.css` has `font-family: Georgia, serif` set directly on the selector.
- The heading "The sky, privately yours." visually renders in Georgia (a serif typeface) in the browser.
- All other headings on the page (fleet, destinations, membership, CTA, footer) are unaffected and continue to render in Bricolage Grotesque via the `.serif` utility class.

---

## Summary of approach

Add a single `font-family: Georgia, serif` declaration to the existing `.hero__title` rule in `src/styles.css`. Because `.hero__title` is more specific than `.serif` (both are single-class selectors, but `.hero__title` appears later in the cascade and will be placed directly on the rule), adding the property directly to `.hero__title` is the cleanest, most targeted approach. No JavaScript, no HTML changes, no new files, no imports needed — Georgia is a web-safe system font available in all browsers.

---

## Related code

- `src/styles.css` — Contains the `.hero__title` rule (lines 259–264) and the `.serif` utility class (lines 91–96) that currently drives the heading font. The single-line change happens here.
- `src/App.jsx` — Renders the `<h1 className="serif hero__title">` element (line 113). Read to confirm class names. No changes needed.

---

## Current state

- **Relevant existing behavior:** The `<h1>` in the hero carries both `serif` and `hero__title` classes. The `.serif` rule sets `font-family: "Bricolage Grotesque", "Hanken Grotesk", sans-serif` (line 92). `.hero__title` has no `font-family` of its own, so it inherits from `.serif`. The heading therefore renders in Bricolage Grotesque today.
- **Existing patterns to follow:** Other component-level font overrides in the stylesheet use direct `font-family` declarations on the component rule rather than adding new utility classes (e.g., `.quote__route`, `.fleet__tab h3`, `.fleet__display h3`, `.fleet__specs b`, `.tier h3` all declare `font-family` inline on their own selectors).
- **Constraints from the current implementation:** The `.serif` class is shared across many headings and must not be changed. The `font-family` property must be set on `.hero__title` specifically so only the hero heading is affected.

---

## Structural considerations

- **Hierarchy:** The change is a leaf-level style override on a single component selector. No layer structure is disturbed.
- **Abstraction:** The correct level. A one-off visual divergence for a single element is best expressed directly on that element's rule, not by creating a new utility or modifying the shared `.serif` class.
- **Modularity:** `.hero__title` is already its own rule. Adding one property to it is the minimal, correctly scoped change.
- **Encapsulation:** The `.serif` class continues to work as a shared typographic utility across the rest of the page. The `.hero__title` override is self-contained.

---

## Refactoring

None required. The existing `.hero__title` rule is the correct place for this change.

---

## Implementation steps

- [ ] Step 1 — Open `src/styles.css` and locate the `.hero__title` rule (lines 259–264). Add `font-family: Georgia, serif;` as the first property inside the rule block → `.hero__title` now has an explicit font-family that overrides the inherited `.serif` value.

That is the complete implementation. One property, one rule.

---

## Impact assessment

- **Code paths affected:** CSS only. The `.hero__title` selector in `src/styles.css`.
- **Data or schema impact:** None.
- **Dependency or API impact:** None. Georgia is a web-safe system font; no Google Fonts import or additional asset is needed.

---

## Validation

- **Tests to write or update:** None — the project has no automated test suite. The change is a single CSS property; visual verification is sufficient.
- **Lint/format/typecheck commands:** Run the project dev server (`npm run dev` or equivalent per `package.json`) and inspect the hero heading in a browser to confirm it renders in Georgia.
- **Manual verification steps:**
  1. Start the dev server.
  2. Open the page in a browser.
  3. Inspect the `<h1 class="serif hero__title">` element with DevTools — confirm computed `font-family` resolves to `Georgia`.
  4. Verify all other headings (fleet section, destinations section, membership section, CTA section) still render in Bricolage Grotesque.

---

## Uncertainty flags

- None. The ticket's DoD is fully explicit ("Set `font-family: Georgia, serif` on `.hero__title` in `styles.css`"), the target selector exists, and the change is a single CSS property addition.

---

## Open questions

None. The DoD is unambiguous and the codebase exploration confirms the exact selector and file to modify.
