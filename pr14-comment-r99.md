## ✅ Rounds 96–99 live QA — all green after R97 hoisting fix (deploys ce428952 → ca9e334c)

Tested against production https://shelfmark.zalize.com (recorded in Devin session).

**🟢 R96:** /popular `og:image` + `twitter:image` = `covers.openlibrary.org/b/id/15150725-L.jpg`; /llms.txt Key pages lists /popular.

**🔴→🟢 R97 saved-list homepage fallback:** first pass FAILED — the continue-reading block called `loadSaved()` before `var SAVED_KEY` was initialized (`var` hoisting → `localStorage.getItem(undefined)` → `{}` → nothing rendered). Fixed in eb03008 by moving `SAVED_KEY`/`loadSaved`/`storeSaved` above the block. Re-test in a fresh profile: saving a series with no progress renders **"From your saved list"** with the card; ticking a book elsewhere switches to **"Continue reading"** and removes the fallback.

| 🟢 Fallback renders after fix | 🟢 Progress takes over |
|---|---|
| ![Fallback](/home/ubuntu/screenshots/ss_1576b9b3.png) | ![Continue reading](/home/ubuntu/screenshots/ss_2a68e4b2.png) |

**🟢 R98 Clear all data (disposable profile):** confirm dialog → Cancel leaves everything intact; OK wipes `shelfmark_read_v1`/`shelfmark_saved_v1` and reloads to the empty shelf. (`shelfmark_mig_v2` re-created on load — intended, holds no user data.)

| Confirm dialog | 🟢 Empty shelf after OK |
|---|---|
| ![Dialog](/home/ubuntu/screenshots/ss_1ad6d19b.png) | ![Empty](/home/ubuntu/screenshots/ss_41301092.png) |

**🟢 R99:** /privacy Analytics paragraph discloses "the referring site's hostname (e.g. "google.com" — never the full URL, page, or search query)".

![Privacy disclosure](/home/ubuntu/screenshots/ss_774bfc15.png)

<details><summary>Regression (all green)</summary>

Tracker: tick → 7/8 (88%), untick → restore 6/8 (75%); main profile left canonical. Security headers unchanged (workers.dev + cache-bust). Axe 4.10.2: **0 violations** light+dark on /, /shelf, /privacy (6 runs).
</details>

Heads-up: `/app.js` is edge-cached 1h, so visitors may briefly see the pre-fix asset after deploy.
