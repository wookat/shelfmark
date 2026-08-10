# Shelfmark R61-fix + Rounds 66–69 — autodiscovery fix, title-cased genres, author photos, avatars, per-genre RSS link (deploy a1133844, PR #12)

Shell pre-check facts (live, cache-busted, workers.dev where noted): R61 fix verified — /new?genre=fantasy autodiscovery href = /new.rss?genre=fantasy, /new = /new.rss (workers.dev). R66: `<title>Fantasy Book Series in Order (385 Series)`, Science Fiction (290), Children's Literature (73, slug children-s-literature); breadcrumb "Fantasy", h1 "Fantasy Series in Order"; /genres cards ">Fantasy<" ">Science Fiction<". R67: sanderson `<img src=commons.wikimedia…Brandon_Sanderson…?width=256 class=…rounded-2xl…>`, Person JSON-LD image (width=256), og:image width=512; CSP img-src includes commons.wikimedia.org + upload.wikimedia.org. ⚠️ randall-munroe now HAS a P18 photo (og:image Randall_Munroe_2016.jpg) — no-photo fallback verified instead on janci-patterson (no img, og:image /og.png) and lin-carter (og:image = OL book cover). R68: homepage Prolific authors 48px wikimedia avatars; /authors?letter=B all initial "B" placeholder circles; letter=S has photos. R69: /genres/fantasy visible `href="/new.rss?genre=fantasy">RSS` + per-genre autodiscovery; feed 200.

## Recorded browser pass

1. R67: /authors/brandon-sanderson — rounded photo visibly renders top-right (pixels, not just markup); browser console shows no CSP violations for wikimedia images. Fail: broken image icon or CSP error.
2. R68: homepage "Prolific authors" grid — 48px round photos visibly rendered; /authors?letter=B — round initial-letter "B" placeholder circles visible. Fail: broken images or missing circles.
3. R66: /genres index cards show "Fantasy", "Science Fiction", "Children's Literature" title-cased; /genres/fantasy h1 = "Fantasy Series in Order", breadcrumb "Fantasy". Fail: lowercase anywhere in title/h1/cards.
4. R69: on /genres/fantasy click the visible "RSS" link → /new.rss?genre=fantasy renders valid RSS 2.0 with the fantasy-filtered title. Fail: wrong target/feed.
5. Regression tracker: /series/mistborn tick The Lost Metal → 7/8 (88%); untick → restore 6/8 (75%). Fail: no change/wrong restore.

## Shell checks

6. R61 fix (workers.dev + cb): /new?genre=fantasy alternate href = /new.rss?genre=fantasy; /new = /new.rss. (Captured.)
7. R66: titles for fantasy (385), science-fiction (290), children-s-literature (73) title-cased; in-sentence lowercase retained ("385 fantasy series…" subtitle). Fail: mismatch.
8. R67: sanderson og:image = commons FilePath …width=512; Person JSON-LD image present; no-photo fallback: janci-patterson no wikimedia <img> + og:image /og.png; lin-carter og:image = OL cover. CSP img-src includes both wikimedia hosts. Fail: any mismatch.
9. Regression: security headers on / unchanged (HSTS, CSP, Permissions-Policy, XFO, nosniff, referrer).
10. Axe (Playwright bypass_csp, 4.10.2): / and /authors/brandon-sanderson → 0 violations. Save /tmp/axe_results_r70.json.

Report → /home/ubuntu/repos/shelfmark/test-report-iter70.md
