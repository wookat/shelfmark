# R158: keyboard-only + assistive-semantics discovery (production worker de2b520d)

Discovery pass; conservative P0/P1/P2 with evidence. Code refs: skip link src/html.ts L62; typeahead ARIA app.js L300-346; coach tip role=status app.js L126/132; import statuses role=status (app.js L885, index.ts L1140); button-text-only feedback "Copied ✓"/"Link copied ✓" app.js L381/407/921 (no live region — candidate finding); up-next badge injection app.js L142-152 (no live region — candidate); checkboxes unnamed inputs inside <label> wrapping title link (index.ts L899-905).

## K1. Keyboard journey (fresh 1440 ctx, screenshots at each key stop)
- Home: first Tab = "Skip to content" visible; Enter jumps to #main (verify focus/scroll target).
- Search: focus header box ("/" shortcut + Tab), type "mist": listbox opens (aria-expanded=true); ArrowDown ×2 sets aria-activedescendant + visible highlight; Enter navigates to highlighted entry; back; Escape closes keeping text.
- Series /series/mistborn: Tab to book-1 checkbox (focus ring visible — screenshot), Space ticks; coach tip "First book tracked" appears (role=status per code); continue Tab to "Got it" button, Enter dismisses; Tab reaches "Find a copy" (accessible name "Find a copy of {title} on Bookshop.org"); Tab reaches "Save for later"; Shift+Tab reverse OK, no trap.
- /shelf (with data): Tab through Export JSON/CSV/Import/Clear/goal buttons — all reachable, focus visible; goal button opens prompt via Enter.
- /lists: Tab through cards — focus visible on card links.
- FAIL bar: any interactive element with no visible focus indicator (screenshot proof), illogical order, or trap.

## S2. Semantics (home, series, shelf, lists, search)
- Landmarks: exactly one <main>, <header>, <footer>, nav(s) labeled. Heading outline: single h1, no skipped levels (h1→h2→h3).
- Form labels: header search input labeled; email inputs labeled; shelf import file input labeled.
- Checkbox accessible names: via Playwright accessibility snapshot, book checkbox name includes the book title (e.g. "Mistborn: The Final Empire"). FAIL if name is empty/generic.
- Live regions: (a) coach tip role=status; (b) shelf import status; (c) "Copied ✓" copy-list button and "Link copied ✓" share buttons — flag if no aria-live/role=status ancestor; (d) up-next badge injection — flag if unannounced (may be acceptable as decorative, judge).

## A3. Typeahead ARIA detail
- input role=combobox, aria-expanded toggles, aria-controls/aria-autocomplete present?, listbox role, option roles + ids, aria-activedescendant follows ArrowDown/Up, aria-selected set. Flag missing attributes.

Output: prioritized P0/P1/P2 + pass list.
