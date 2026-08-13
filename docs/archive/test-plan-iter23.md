# Shelfmark Round 23 — bulk "Mark all read" / "Clear progress" buttons (deploy 018cc8ac, PR #7 commit 87cbdb7)

Code refs: public/app.js diff — after each series list, if `list.querySelectorAll("input[data-book]").length > 1`, a `div.mt-3.flex.gap-2.text-xs.print:hidden` with two pill buttons is inserted `afterend`; "Mark all read" sets all boxes checked and adds entries (keeping existing entries' timestamps via `if (!d[id])`); "Clear progress" deletes all entries for the list. R22 already curl-verified (?page=99 → 404; /search has `noindex,follow`).

State safety: back up `shelfmark_read_v1` (console copy) before testing; restore verbatim afterwards and confirm /shelf stats back to 10/3/7/Mistborn.

## Recorded browser pass

1. /series/discworld (starting 1/55): two pill buttons "Mark all read" and "Clear progress" render directly below book #55, styled like other pill buttons. Fail: absent, above list, or unstyled.
2. Click "Mark all read": all 55 checkboxes ticked, header shows "55 of 55 read (100%)", full progress bar, **no Up next badge** anywhere. Then /shelf: Discworld group shows 55 read; stats update accordingly.
3. Back on /series/discworld click "Clear progress": all boxes unticked, progress label empty/0, no badge. /shelf: Discworld group gone.
4. Partial interplay: tick books 1+2 manually (note their entries), click "Mark all read" → 55/55, no console errors; verify via console that the 2 pre-ticked ids kept their earlier `t` (allowed: shell/console verification since timestamps are invisible).
5. Print preview (Ctrl+P) on discworld with buttons visible on page: buttons NOT in the print dialog preview.
6. ~375px: buttons fit below the list, no horizontal overflow (scrollWidth ≤ innerWidth).
7. /authors/brandon-sanderson: each multi-book list gets exactly ONE pair of buttons; clicking "Mark all read" under one list affects only that list (others' counts unchanged).
8. Optional: a 1-book series shows no buttons (skip if none found quickly).
9. Restore localStorage backup; /shelf stats 10/3/7/Mistborn again.
