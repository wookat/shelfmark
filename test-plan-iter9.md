# Shelfmark Round 9 — /shelf Import JSON (deploy 5deb4cb7, PR #6 commit d622d0f)

Code refs: src/index.ts /shelf buttons row — new `#import-btn` "Import JSON", hidden `#import-file` (accept="application/json,.json", aria-label "Import shelf backup file"), `#import-status` role="status", helper copy "Export downloads a backup… Import merges a backup into this browser…". Logic public/app.js:166-197: parse JSON; reject non-object/array → "That file doesn't look like a Shelfmark export."; else merge entries with string title into shelfmark_read_v1 (only-new counted in `added`), status "Imported N new book(s) ✓ Reloading…", reload after 800ms.

Test files (prepared in setup, /home/ubuntu/):
- backup.json — real Export JSON download of current shelf (existing ticks from prior rounds).
- merge.json — object with 1 key overlapping current shelf + 2 new entries `{t,title,series,slug}` for real books.
- invalid-array.json — `[1,2,3]`.

1. Precondition: /shelf shows current entries (Mistborn group, N books read) and the new "Import JSON" button next to "Export JSON" + helper copy. Fail: button/copy missing.
2. Round-trip: click "Export JSON" (file downloads); via console `localStorage.removeItem('shelfmark_read_v1')` then reload → shelf empty state; click "Import JSON" → file picker → select downloaded backup → status shows "Imported N new books ✓ Reloading…" with N = previous entry count; after reload shelf shows the same series grouping and same tick dates as before. Fail: entries missing, dates lost/changed to today for pre-existing t values, wrong N, no reload.
3. Merge: with the restored shelf, import merge.json (1 overlap + 2 new) → status "Imported 2 new books ✓ Reloading…" (overlap not counted); after reload total = previous + 2, previous entries intact. Fail: N=3, entries lost, duplicates.
4. Invalid file: import invalid-array.json → status "That file doesn't look like a Shelfmark export."; no reload; shelf content unchanged (localStorage entry count unchanged). Fail: crash, import happening, wrong copy.
5. Mobile ~375px: /shelf buttons row (Download card / Export / Import + status) wraps without horizontal overflow (scrollWidth <= innerWidth), buttons fully visible.
6. Smoke: click "Download my reading card" → a PNG downloads (check ~/Downloads for shelfmark card file).
