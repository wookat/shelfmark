## ✅ Rounds 81–85 live QA — listing-page progress bars, CSV export, genre og:image, /llms.txt all verified

Tested against production https://shelfmark.zalize.com, deploy 3b56dfe2 (recorded in Devin session).

**🟢 R81 listing-page card bars (fixes the R76–80 behavior note):** with the test profile at Mistborn 6/8, the Mistborn card on /genres/fantasy now shows a **~75% filled amber bar** while untracked neighbors stay 0%; served markup carries `data-total="8"` and app.js fills from localStorage only when the page lacks that series' checkbox list. /series/mistborn itself is unchanged (75% → tick 88% → untick 75%).

![Mistborn card ~75%, untracked neighbors 0%](/home/ubuntu/screenshots/ss_zoom_4ad7a093.png)

**🟢 R82 CSV export:** new **Export CSV** button on /shelf downloads `shelfmark-export.csv` — header exactly `Title,Series,Date Read`, all fields quoted, ISO yyyy-mm-dd dates, CRLF endings, and the profile's legacy-timestamp entry correctly emits an empty date:

```
Title,Series,Date Read
"Mistborn: Shadows of Self","Mistborn","2026-08-06"
"Into the Wild","Warriors","2026-08-05"
"Mistborn: The Final Empire","Mistborn",""
```

| 🟢 Export CSV button | 🟢 Download |
|---|---|
| ![Shelf](/home/ubuntu/screenshots/ss_026002a3.png) | ![Download](/home/ubuntu/screenshots/ss_4b25e571.png) |

**🟢 R83/R84 (shell, workers.dev + cache-bust):** /genres/fantasy `og:image` = `covers.openlibrary.org/b/id/14648805-L.jpg` (OL large cover); `/llms.txt` → 200 text/plain, `cache-control: public, max-age=86400`, llmstxt.org format with site summary, Key pages, and both `/api/series/{slug}.json` + `/api/authors/{slug}.json`.

**♿ Axe** (4.10.2): **0 violations** on / and /shelf (with tracker state seeded so shelf sections render). Security headers unchanged.

<details><summary>Regression tracker (all green)</summary>

| Ticked 7/8 (88%) | Restored 6/8 (75%) |
|---|---|
| ![Tick](/home/ubuntu/screenshots/ss_zoom_e9908530.png) | ![Restore](/home/ubuntu/screenshots/ss_zoom_2a002f0f.png) |
</details>

_R80/R85 are log-only, no runtime surface._
