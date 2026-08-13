# Shelfmark Rounds 26–28 — genres counts, Print list, ARIA combobox, mobile New link (deploy 01918a89, PR #8 commits 74ddb0b/ea3d827/3d3a118)

Code refs: src/index.ts /genres query now `AND book_count > 0`; series pill row gains `<button data-print class="... print:hidden">Print list</button>` next to Share; public/app.js adds `[data-print] → window.print()`, and typeahead input gets `role=combobox`, `aria-expanded`, `aria-autocomplete=list`, `aria-controls=suggest-box-N`; options get ids + `aria-selected`; highlight() syncs `aria-activedescendant`; close() resets both. src/html.ts: New link lost `hidden sm:inline`.

Already shell-verified live: /genres fantasy card 272; "Print list" in served /series/discworld HTML; app.js contains aria-activedescendant + data-print; header New link unhidden.

## Recorded browser pass

1. /genres: fantasy card shows **272** (was 279); spot-check two other counts (e.g. science fiction 196, horror fiction 12) match the intro number on their genre pages exactly. Fail: any mismatch.
2. /series/discworld: "Print list" pill renders next to Share in the pill row. Click → print preview opens showing the clean numbered book list (nav/forms/checkboxes hidden) and NO "Print list"/"Share" buttons in the printout. Cancel dialog.
3. Typeahead post-ARIA functional recheck (header form): before typing, input has `aria-expanded="false"`. Type "disc" → dropdown appears (Discworld first), `aria-expanded="true"`. ArrowDown → 1st option highlighted AND `aria-activedescendant="suggest-box-N-opt-0"`, option `aria-selected="true"`. ArrowDown again → opt-1. Enter → navigates to highlighted item (/series/discovery). DOM checks via console (invisible state), visible highlight via screenshot.
4. ~375px window: header nav shows Series/Authors/Genres/**New**/My Shelf with New visible, no wrap breaking layout, no horizontal overflow (scrollWidth ≤ innerWidth).
5. Axe rerun (Playwright + bypass_csp, headless — shell only) on `/` and `/search?q=discworld`, with the combobox forced open on both (type "disc" before scan): expect zero violations; specifically no new aria-* rules (aria-valid-attr-value, aria-allowed-attr, aria-input-field-name, color-contrast) from combobox markup.
6. Regression smoke: tick/untick a Discworld book (progress 1/55→2/55→1/55); /shelf stats 10/3/7/Mistborn with Up next slots intact.
