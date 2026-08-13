# Shelfmark Rounds 56–60 — Production Test Report

**Target:** https://shelfmark.zalize.com · deploy 34bdbde6 · branch devin/1786020857-iter53 · PR #11
**Method:** recorded browser pass for the R58 author section, tracker regression, and R60 RSS link; shell (curl/python) for sitemap, redirects, JSON-LD, RSS fallback, print-hidden markup; headless Playwright + axe-core 4.10.2 for accessibility.
**Result: 10/10 checks passed, 0 failed, 0 untested.**

## R56 — sitemap genre threshold

`curl https://shelfmark.zalize.com/sitemaps/1.xml?v=r60check` (cache-busted):

```
genres/satire: 0
genres/autobiography: 0
genres/anthropomorphic-comic: 0
genres/fantasy: 1
```

✅ Small genres (<3 with-books series) excluded; fantasy still present.

## R57 — merged-slug 301 redirects

```
/genres/crime-literature  → 301 → /genres/crime-fiction  (final 200)
/genres/romance           → 301 → /genres/romance-novel  (final 200)
/genres/fantasy-literature→ 301 → /genres/fantasy        (final 200)
```

✅ All three representative merged slugs 301 to the correct canonical page which returns 200. (Prior to R57, /genres/crime-literature was a 404 — now a redirect.)

## R58 — "More {genre} authors" section

/authors/brandon-sanderson shows **More fantasy authors** with exactly 6 chips — Terry Pratchett, Piers Anthony, Mercedes Lackey, Victoria Holmes, Laurell K. Hamilton, Terry Brooks — plus **All fantasy series →**:

![More fantasy authors section on Brandon Sanderson](https://app.devin.ai/attachments/0f5c35ea-6225-4f7f-b0a4-6f5e25b5a607/ss_1c58774b.png)

| 🟢 Terry Pratchett chip → /authors/terry-pratchett | 🟢 All fantasy series → /genres/fantasy (385 series) |
|---|---|
| ![Pratchett](https://app.devin.ai/attachments/69c14ff1-6c9c-4616-94d8-c6d0003dec4f/ss_2a469e07.png) | ![Fantasy genre](https://app.devin.ai/attachments/b329a24a-eef8-4f16-a58e-b939a25cbf00/ss_210b3551.png) |

Print-hidden: the section's served markup is `<section class="mt-12 print:hidden">` (verified via curl; no print preview driven this round).

Negative case — /authors/randall-munroe (xkcd, no genred series) ends with Standalone books then the footer, **no** "More … authors" section:

![No section for randall-munroe](https://app.devin.ai/attachments/ba8ec849-9f01-4b87-bf33-5d28dd897ed5/ss_b62322d0.png)

✅ All R58 checks passed.

## R59 — /genres JSON-LD

Parsed from served HTML:

```
BreadcrumbList  (2 elements)
ItemList  numberOfItems=59  itemListElement count=59
```

✅ Both blocks present, count exactly 59 and consistent with the element list.

## R60 — per-genre RSS

- /new?genre=fantasy visibly shows the link **"RSS feed (fantasy)"** with href `/new.rss?genre=fantasy`; clicking it renders the feed.
- Feed: valid RSS 2.0, channel title exactly **"Shelfmark — New & Upcoming Fantasy Series Books"**, 1 item (A Long and Speaking Silence — The Singing Hills Cycle) matching the fantasy-filtered page (fantasy chip count = 1).
- Fallback: `/new.rss?genre=zzz` → valid RSS 2.0 with the full-feed title "Shelfmark — New & Upcoming Series Books" and 33 items, no error.

| 🟢 /new?genre=fantasy with RSS feed (fantasy) link | 🟢 Filtered feed with correct title |
|---|---|
| ![New page](https://app.devin.ai/attachments/c0172c56-7786-424a-8e1f-2b2f8a604618/ss_73a8bf45.png) | ![Feed](https://app.devin.ai/attachments/1dff54d9-9359-44e9-9e9f-d21332ba1e18/ss_42a4c275.png) |

✅ All R60 checks passed.

## Regression — tracker on the author page

On /authors/brandon-sanderson, ticked Mistborn: The Lost Metal → header changed 6 of 8 read (75%) → **7 of 8 read (88%)**, Up next moved to Secret History; unticked → exact restore to 6/8 (75%), Up next back on The Lost Metal.

| 🟢 Tick → 7/8 (88%) | 🟢 Untick → restored 6/8 (75%) |
|---|---|
| ![Ticked](https://app.devin.ai/attachments/94c5c1f7-994e-482d-b86f-30b52768ca32/ss_zoom_85e7e595.png) | ![Restored](https://app.devin.ai/attachments/d1bcab84-2d2f-45d0-bee2-7dd196fcd5fd/ss_zoom_6aa5cb39.png) |

✅ Passed; localStorage state restored to baseline.

## Accessibility — axe-core 4.10.2 (Playwright, bypass_csp)

```
https://shelfmark.zalize.com/authors/brandon-sanderson violations: 0
https://shelfmark.zalize.com/genres violations: 0
https://shelfmark.zalize.com/new?genre=fantasy violations: 0
```

✅ Zero-violation baseline holds. Raw output: /tmp/axe_results_r60.json

## Artifacts

- Recording: /home/ubuntu/screencasts/rec-fb270bf8-4fe9-4d61-9c2b-06a35a72655e/rec-fb270bf8-4fe9-4d61-9c2b-06a35a72655e-edited.mp4
- Plan: /home/ubuntu/repos/shelfmark/test-plan-iter60.md
- Raw axe: /tmp/axe_results_r60.json

## Caveats

- Print hiding of the R58 section was verified via the `print:hidden` class in served markup, not a rendered print preview.
- Only 3 of the 24 merged genre slugs (the brief's examples) were redirect-tested.
- The fantasy feed currently has only 1 new/upcoming item, so "filtered items" is proven on a small sample (matches the page's fantasy chip count of 1).
