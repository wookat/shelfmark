# Shelfmark Rounds 31–32 — JSON-LD hasPart + shelf recency ordering (deploy d0c25dfd, PR #8)

Code refs: deployed app.js shelf rendering (~line 309–313): `Object.keys(bySeries).map(...)` now per-group sorts items by `t` desc, then `.sort((a,b) => (b.items[0].t||0) - (a.items[0].t||0))` orders the sections by most recent tick. R31 hasPart shell-verified already: /series/discworld BookSeries JSON-LD has 50 Book items, positions 1–50, names match rendered order (The Light Fantastic, Mort, Equal Rites…); /series/mistborn 8 items.

Baseline seeded state: shelf sections currently Mistborn (6 read, most ticked 8/6/2026), Warriors (1 read, 8/5/2026), Discworld (3 read, 8/6/2026+8/6/2025). Backup exists at /tmp/shelf_backup_r23.json.

## Recorded browser pass

1. /shelf precondition: screenshot current section order (expected top section = whichever has most recent tick; note exact order). Stats 10/3/7/Mistborn.
2. Go to /series/warriors-2, tick book 2 "Fire and Ice" (currently unread, the Up next). Progress flips 1/35 → 2/35.
3. Reload /shelf: **Warriors section must now be FIRST** (it has the newest tick), above Mistborn and Discworld. Fail: order unchanged (old arbitrary key order) or Warriors not first. Stats now 11/3/8; Warriors Up next advances to next unread (Forest of Secrets); Mistborn/Discworld Up next slots unchanged (The Lost Metal / Mort).
4. Restore: untick Fire and Ice on /series/warriors-2, reload /shelf → order returns to previous, stats back to 10/3/7/Mistborn, Warriors Up next back to Fire and Ice.
5. Regression: Export JSON / Import JSON / Download my reading card buttons all still rendered at bottom of /shelf (screenshot).
6. Axe (shell, Playwright + bypass_csp, seeded localStorage before scan) on /shelf: expect zero violations. Save /tmp/axe_results_r32.json.

R31 (shell-only, include in report): BookSeries JSON-LD hasPart on /series/discworld = 50 Book items with sequential position 1–50, name/datePublished/image/author present, first three names match rendered order; /series/mistborn = 8 items.
