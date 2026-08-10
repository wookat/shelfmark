# Shelfmark Rounds 96–99 — Live Production QA Report

- **Site:** https://shelfmark.zalize.com (authoritative origin checks via shelfmark.wookat520.workers.dev + cache-bust)
- **Deploy:** ce428952 · branch `devin/1786031667-iter95` · PR #14
- **Method:** recorded browser pass (disposable incognito for R97/R98, main profile for regression) + shell checks (curl, Playwright + axe-core 4.10.2)
- **Plan:** /home/ubuntu/repos/shelfmark/test-plan-iter99.md · **Raw axe:** /tmp/axe_results_r99.json
- **Recording:** /home/ubuntu/screencasts/rec-8c2105db-3a62-4722-8cdc-f950c132f1e2/rec-8c2105db-3a62-4722-8cdc-f950c132f1e2-edited.mp4

## Summary

| Round | Check | Result |
|---|---|---|
| R96 | /popular og:image + twitter:image = OL -L.jpg cover | ✅ pass |
| R96 | /llms.txt Key pages lists /popular | ✅ pass |
| R97 | Homepage "From your saved list" fallback (saved only, no progress) | ❌ **FAIL** |
| R97 | "Continue reading" with progress present | ✅ pass |
| R98 | Clear all data: Cancel leaves data intact | ✅ pass |
| R98 | Clear all data: OK wipes shelfmark* keys + reloads to empty shelf | ✅ pass (note: `shelfmark_mig_v2` re-created on reload) |
| R99 | /privacy referrer-hostname disclosure | ✅ pass |
| Regression | Tracker tick/untick (main profile, canonical restore) | ✅ pass |
| Regression | Security headers unchanged | ✅ pass |
| Regression | Axe light+dark on /, /shelf, /privacy | ✅ pass (0 violations ×6) |

## ❌ R97 fallback failure — root cause

In a fresh incognito profile with NO reading progress, clicking "☆ Save for later" on /series/discworld correctly wrote `shelfmark_saved_v1 = {"discworld":{"name":"Discworld","t":…}}`, but the homepage rendered **no section at all** — `#continue-reading` stayed empty (hero flows straight into "Popular series"):

![FAIL: no "From your saved list" section despite saved item](https://app.devin.ai/attachments/4f87ee85-4645-457b-b132-2cf282b97ad7/ss_5788307a.png)

**Root cause (deployed app.js, md5 `1edd40ee…` identical on zalize.com and workers.dev, so NOT a cache issue):** the continue-reading block (~line 161) calls `loadSaved()` during the same top-to-bottom IIFE pass, but `var SAVED_KEY = "shelfmark_saved_v1"` is declared at line 595 — hoisted as `undefined` at call time. `loadSaved()` therefore reads `localStorage.getItem(undefined)` → `null` → `{}` → `recent.length === 0` → nothing renders. Verified live: `localStorage.getItem(undefined)` returns `null` while `shelfmark_saved_v1` is present. **Fix:** move the `SAVED_KEY`/`loadSaved` definitions above the continue-reading block (or inline the key string in `loadSaved`).

The progress branch works: after ticking Mistborn book 1 in the same profile, homepage shows heading "Continue reading" with a Mistborn card "1 read · pick up where you left off →":

![PASS: "Continue reading" with progress present](https://app.devin.ai/attachments/6037ec9a-6a92-426d-b4ca-df444eed7911/ss_b653b984.png)

## R98 Clear all data (disposable profile)

/shelf shows the "Clear all data" button after Import JSON, with the updated helper text ("Clear all data erases every Shelfmark record from this browser (progress, saved list, goals) — export first if you want a backup."):

![Shelf with Clear all data button + helper text](https://app.devin.ai/attachments/7b9e5e27-2ab8-4476-a443-ba28a302f4b6/ss_c2417aec.png)

Click → native confirm "Erase all Shelfmark data from this browser (reading progress, saved list, goals)? This cannot be undone.":

![Confirm dialog](https://app.devin.ai/attachments/d481b9eb-fafa-428f-9c32-439438bc551d/ss_1ad6d19b.png)

- **Cancel:** data intact — Mistborn 1 read + Saved-for-later Discworld still rendered; keys `shelfmark_mig_v2, shelfmark_read_v1, shelfmark_saved_v1` all present.
- **OK:** page reloaded to "Your shelf is empty"; `shelfmark_read_v1`/`shelfmark_saved_v1` gone. Minor note: `shelfmark_mig_v2=1` reappears because the migration flag is re-set by app.js on the fresh load — it contains no user data, so the wipe intent holds.

![Empty shelf after clear + reload](https://app.devin.ai/attachments/f12f31e9-1d03-418a-a026-7a4462ce49d7/ss_41301092.png)

## R99 privacy disclosure

/privacy Analytics paragraph now reads: "When you arrive from another website we also count the referring site's hostname (e.g. "google.com" — never the full URL, page, or search query)."

![Privacy referrer disclosure](https://app.devin.ai/attachments/92fcaf9d-492b-4185-8218-3e2478e40da3/ss_774bfc15.png)

## R96 (shell, workers.dev + cache-bust)

```
<meta property="og:image" content="https://covers.openlibrary.org/b/id/15150725-L.jpg">
<meta name="twitter:image" content="https://covers.openlibrary.org/b/id/15150725-L.jpg">
llms.txt: - [100 most popular series](https://shelfmark.zalize.com/popular): the biggest, best-documented series.
```

## Regression (main profile)

Precondition canonical 6/8 (75%); tick The Lost Metal → 7/8 (88%); untick → 6/8 (75%). Main profile ends canonical: 10 books, saved `{}`, no goal key. Clear all data was never clicked in the main profile.

| Ticked 7/8 (88%) | Restored 6/8 (75%) |
|---|---|
| ![Tick](https://app.devin.ai/attachments/8aa07bcb-b500-4978-8f74-716f1b79ce16/ss_zoom_3720c010.png) | ![Restore](https://app.devin.ai/attachments/1097c5a6-40fe-4ba5-8bcf-88e42ddab901/ss_zoom_d7b9683f.png) |

Security headers (workers.dev + cb): HSTS, full CSP, Permissions-Policy, X-Frame-Options DENY, nosniff, Referrer-Policy — all unchanged.

Axe-core 4.10.2 (Playwright bypass_csp, /shelf seeded): light and dark on `/`, `/shelf`, `/privacy` → **0 violations in all 6 runs** (/tmp/axe_results_r99.json).

---

## ✅ R97 fix re-test (deploy ca9e334c, commit eb03008) — PASSED

Cache-busted `/app.js` now declares `var SAVED_KEY = "shelfmark_saved_v1"` at line 144, **above** the continue-reading fallback block (line 172) — hoisting bug fixed. Note: the plain `/app.js` URL was still an edge-cache HIT of the pre-fix asset (1h TTL), so a hard reload (Ctrl+Shift+R) was required in the disposable profile before testing.

Recorded browser pass (fresh incognito, no progress):

1. Saved Discworld (☆→★) → homepage now renders heading **"From your saved list"** with a Discworld card and meta "saved for later · start reading →" — ✅ passed (previously failed):

![From your saved list fallback renders after fix](https://app.devin.ai/attachments/91bb7ae4-67dd-4057-880b-cc8a45171780/ss_1576b9b3.png)

2. Ticked Mistborn book 1 → homepage heading switches to **"Continue reading"** (Mistborn "1 read · pick up where you left off →"); the fallback section is gone — ✅ passed:

![Continue reading takes over once progress exists](https://app.devin.ai/attachments/fc22eab2-4a63-4e58-b01b-cfd3c1e77e49/ss_2a68e4b2.png)

Incognito discarded; main profile untouched and canonical (Mistborn 6/8, 75%). `shelfmark_mig_v2` reappearance after Clear all data is accepted as intended per the user.

Re-test recording: /home/ubuntu/screencasts/rec-e58c8cfb-c43e-48e4-b4e1-3800fda54adc/rec-e58c8cfb-c43e-48e4-b4e1-3800fda54adc-edited.mp4
