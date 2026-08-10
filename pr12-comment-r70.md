## ✅ R61-fix + Rounds 66–70 live QA — autodiscovery fix confirmed; photos, avatars, title-casing, genre RSS all verified

Tested against production https://shelfmark.zalize.com, deploy a1133844 (recorded in Devin session).

**🟢 R61 fix confirmed** (workers.dev direct + cache-bust): `/new?genre=fantasy` head autodiscovery now points to **`/new.rss?genre=fantasy`** (the R61–65 failure), and `/new` still points to `/new.rss`.

**🟢 R67 author photos:** Brandon Sanderson's rounded Wikimedia photo (FilePath width=256) **renders in the browser** with zero console/CSP errors; Person JSON-LD carries `image` and `og:image` is the width=512 variant. CSP img-src now includes commons/upload.wikimedia.org. No-photo fallback verified on janci-patterson (no `<img>`, og:image `/og.png`) and lin-carter (book-cover og:image) — note randall-munroe now has a P18 photo so he no longer exercises the fallback.

| 🟢 Rendered rounded photo | 🟢 Homepage avatars + K/L placeholders |
|---|---|
| ![Photo](/home/ubuntu/screenshots/ss_zoom_f4fad8a7.png) | ![Home](/home/ubuntu/screenshots/ss_7f9201bb.png) |

**🟢 R66/R68/R69:** /genres cards + genre page title/h1/breadcrumb are title-cased ("Fantasy Book Series in Order (385 Series)", "Children's Literature …(73)") while sentence prose keeps "385 fantasy series"; /authors?letter=B renders round initial-letter placeholders; /genres/fantasy shows a visible **RSS** link → `/new.rss?genre=fantasy` whose feed returns 200 valid RSS 2.0 titled *Shelfmark — New & Upcoming Fantasy Series Books*.

| 🟢 /genres title-cased | 🟢 letter=B placeholders |
|---|---|
| ![Genres](/home/ubuntu/screenshots/ss_9d4e60d8.png) | ![B](/home/ubuntu/screenshots/ss_a22778b7.png) |

**♿ Axe** (4.10.2): **0 violations** on / and /authors/brandon-sanderson — photos/avatars introduce no a11y regressions. Security headers unchanged (only the intended wikimedia img-src additions). Tracker regression: tick → 7/8 (88%), untick → exact restore 6/8 (75%).

<details><summary>Cache note</summary>
Browsers holding the hour-cached pre-deploy styles.css briefly render the author photo un-floated (missing `.float-right`); server CSS is correct on both edge and origin and a hard reload fixes it. Expected R64 max-age=3600 behavior.
</details>
