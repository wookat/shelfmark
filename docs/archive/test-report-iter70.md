# Shelfmark R61-fix + Rounds 66–70 — Production QA Report

**Target:** https://shelfmark.zalize.com — deploy `a1133844`, branch `devin/1786024515-iter66`, PR #12
**Method:** Recorded browser pass (author photo/CSP, avatars, genre title-casing, per-genre RSS link, tracker regression) + shell verification via curl/python against zalize.com and the direct origin https://shelfmark.wookat520.workers.dev with cache-busting; headless axe-core 4.10.2 audit.
**Verdict:** All requested checks passed. Two honesty notes below.

## Honesty notes
1. **Brief deviation — Randall Munroe now HAS a photo.** The brief suggested randall-munroe as the "no photo" fallback example, but production now serves him a Wikimedia photo (`og:image = …Special:FilePath/Randall_Munroe_2016.jpg?width=512`). The fallback paths were instead verified on **janci-patterson** (no wikimedia `<img>`, `og:image = https://shelfmark.zalize.com/og.png`) and **lin-carter** (`og:image = https://covers.openlibrary.org/b/isbn/0722147163-L.jpg` book cover). Both fallback branches proven; only the example author changed.
2. **Stale browser CSS on first load.** On the first (non-hard) load of /authors/brandon-sanderson, the browser used a locally cached styles.css from before this deploy (Cache-Control max-age=3600 per R64), so the photo rendered un-floated at top-left. The server-side styles.css (edge and workers.dev origin byte-identical, md5 363b7dcd…) contains `.float-right{float:right}`; after a hard reload the photo renders correctly top-right. This is expected cache behavior, not a product bug — but users who visited within the last hour may see the un-floated layout until their CSS cache expires.

## Results

### R61 fix — filtered autodiscovery (shell, workers.dev + cache-bust) ✅
- `/new?genre=fantasy` head: `<link rel="alternate" type="application/rss+xml" … href="https://shelfmark.zalize.com/new.rss?genre=fantasy">` — **the R65 failure is fixed**
- `/new` unfiltered head still points to `https://shelfmark.zalize.com/new.rss` ✅

### R66 — title-cased genre names ✅
- `<title>`: `Fantasy Book Series in Order (385 Series) | Shelfmark`, `Science Fiction … (290 Series)`, `Children's Literature … (73 Series)` (slug children-s-literature)
- /genres/fantasy h1 = **"Fantasy Series in Order"**, breadcrumb `Home / Genres / Fantasy`
- /genres index cards: Fantasy, Science Fiction, Children's Literature, Historical Fiction… all title-cased
- In-sentence lowercase kept: subtitle reads "385 **fantasy** series with complete reading orders."

| 🟢 /genres cards title-cased | 🟢 Fantasy page h1/breadcrumb + RSS link |
|---|---|
| ![Genres](https://app.devin.ai/attachments/2e2e830f-1e55-47e8-b3b0-add2aa5b9e04/ss_9d4e60d8.png) | ![Fantasy](https://app.devin.ai/attachments/71831610-7791-4c00-a9a5-eba4b95116bc/ss_b54bd448.png) |

### R67 — author photos ✅
- /authors/brandon-sanderson: rounded Wikimedia photo **renders in the browser** top-right (after hard reload; see honesty note 2)
- `<img src="https://commons.wikimedia.org/wiki/Special:FilePath/Brandon_Sanderson_-_Lucca_Comics_%26_Games_2016.jpg?width=256">`
- Person JSON-LD `image` = same FilePath URL (width=256); `og:image` = same at **width=512**
- Browser console: **no CSP violations**; CSP `img-src` includes `https://commons.wikimedia.org https://upload.wikimedia.org`
- No-photo fallback: janci-patterson → no `<img>`, og:image `/og.png`; lin-carter → og:image OL book cover

| 🟢 Rendered rounded photo (zoom) | 🟢 Full page |
|---|---|
| ![Photo](https://app.devin.ai/attachments/5443eb75-3e1b-44fb-9829-01f2e4ed1d53/ss_zoom_f4fad8a7.png) | ![Page](https://app.devin.ai/attachments/0ccc1e9d-eb73-401f-82f3-e0b120417e43/ss_11dfe6e7.png) |

### R68 — author avatars ✅
- Homepage "Prolific authors": 10/12 cards show 48px round photos (R.L. Stine, Asimov, Roberts, Christie, Doyle, Dick, Turtledove, Clarke, Le Guin, Card); Kenneth Bulmer & Lin Carter show round "K"/"L" initial placeholders
- /authors?letter=B: page-1 cards all show round initial-"B" placeholder circles (no photos among these authors); letter=S serves photos (S. M. Stirling etc., shell-verified); layout intact, no overflow

| 🟢 Homepage grid: photos + K/L placeholders | 🟢 letter=B initial placeholders |
|---|---|
| ![Home](https://app.devin.ai/attachments/d36ba9ec-a4e5-441f-8513-25290b17514e/ss_7f9201bb.png) | ![B](https://app.devin.ai/attachments/7748f344-1613-41aa-8804-2fadc084ae8a/ss_a22778b7.png) |

### R69 — genre-page RSS link ✅
- /genres/fantasy subtitle shows visible **RSS** link → `/new.rss?genre=fantasy`; head autodiscovery points to the same filtered feed
- Clicking it serves HTTP 200 valid RSS 2.0 titled **"Shelfmark — New & Upcoming Fantasy Series Books"** (1 fantasy item, matching the "(1)" chip)

![Filtered feed XML](https://app.devin.ai/attachments/d31ad8ac-481a-4cbb-bf50-3a017b113be2/ss_af17aaed.png)

### Regression ✅
- **Tracker** on /series/mistborn: tick The Lost Metal → **7 of 8 read (88%)**, Up next → Secret History; untick → exact restore **6 of 8 (75%)**, Up next → The Lost Metal

| 🟢 Ticked 7/8 (88%) | 🟢 Restored 6/8, Up next back |
|---|---|
| ![Tick](https://app.devin.ai/attachments/4bd1ba14-a947-41c9-a12c-61126ca1ea55/ss_5e4ac659.png) | ![Restore](https://app.devin.ai/attachments/c9f8adc7-dc62-4c76-9804-a4ae13e7c741/ss_zoom_d694a3c9.png) |

- **Security headers** on / unchanged: HSTS `max-age=31536000; includeSubDomains`; CSP (now with the two wikimedia img-src hosts — the only intended change); Permissions-Policy `camera=(), microphone=(), geolocation=(), payment=()`; X-Frame-Options DENY; nosniff; Referrer-Policy strict-origin-when-cross-origin
- **Axe 4.10.2** (Playwright, bypass_csp): `/` → **0 violations**, `/authors/brandon-sanderson` → **0 violations**. Raw: `/tmp/axe_results_r70.json`

## Artifacts
- Recording: `/home/ubuntu/screencasts/rec-5791b64a-6c78-41ae-81e4-4d44896d82ed/rec-5791b64a-6c78-41ae-81e4-4d44896d82ed-edited.mp4`
- Plan: `/home/ubuntu/repos/shelfmark/test-plan-iter70.md`
- Raw axe output: `/tmp/axe_results_r70.json`
