## ✅ Rounds 91–95 live QA — export/import with saved list, pace chart, /popular, /api/hit all verified

Tested against production https://shelfmark.zalize.com, deploy 187823eb (recorded in Devin session).

**🟢 R91 export/import round-trip (disposable → fresh incognito profiles):** export JSON carries a top-level `_saved` key in `{slug:{name,t}}` shape plus book entries; importing into a completely fresh profile restores **both** the reading progress and the "Saved for later" grid on /shelf. Empty saved list → export has **no** `_saved` key (file inspected: 10 book keys only).

| 🔴 Fresh profile before import | 🟢 After import: progress + saved list + pace chart |
|---|---|
| ![Empty](/home/ubuntu/screenshots/ss_4fdd8029.png) | ![Restored](/home/ubuntu/screenshots/ss_78205f09.png) |

**🟢 R92 reading pace:** /shelf renders "Reading pace — last 12 months" with 12 labeled bars, Aug=**7** exactly matching the profile's dated Aug-2026 entries (legacy ≤1e12 timestamps and out-of-window entries excluded), `role="img"` + `aria-label="Books read per month over the last 12 months"`; card hidden when no dated entries.

![Pace chart Aug=7](/home/ubuntu/screenshots/ss_4f0a8520.png)

**🟢 R93 /popular:** homepage "Top 100 →" clicks through to /popular — 200, h1 "The 100 most popular book series", **100 cards**, breadcrumb + ItemList JSON-LD with 100 items; footer "Popular series"; sitemaps/1.xml includes /popular. (Tracked Discworld card even shows its filled progress bar.)

![/popular](/home/ubuntu/screenshots/ss_36e1f96d.png)

**🟢 R94 (shell):** `POST /api/hit` with `"/x\ngoogle.com"`-style body → **204** on workers.dev; page beacon still fires (`initiatorType: beacon`) with zero console errors. Referrer row increment in `referrers(day,host,count)` verified separately via D1 REST.

<details><summary>Regression (all green)</summary>

Tracker: tick → 7/8 (88%), untick → restore 6/8 (75%). Security headers unchanged (workers.dev + cache-bust). Axe 4.10.2: **0 violations** in light AND dark on / and /shelf (seeded).

| Ticked 7/8 | Restored 6/8 |
|---|---|
| ![Tick](/home/ubuntu/screenshots/ss_zoom_05ba2ecf.png) | ![Restore](/home/ubuntu/screenshots/ss_zoom_2f98e9b4.png) |
</details>

_R95 is log-only, no runtime surface._
