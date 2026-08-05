# Shelfmark v1 — Live Site Test Report (QA + UX walkthrough)

Target: **https://shelfmark.zalize.com** (production Cloudflare Worker, seeded D1). PR: https://github.com/wookat/shelfmark/pull/1
Recording: full browser run (desktop + 375px mobile pass).

## Results summary

| # | Test | Result |
|---|------|--------|
| 1 | Home page: hero, search form, Popular series, Prolific authors | ✅ Pass |
| 2 | Search: "sanderson" → author link, "jack reacher" → series link, "discworld" → `/series/discworld` (curl), "zzzqqq" → no-results message, empty query → prompt page | ✅ Pass |
| 3 | Author page `/authors/brandon-sanderson`: 5 series sections with numbered book checklists | ✅ Pass |
| 4 | Series tracker `/series/mistborn`: 2 ticks → "2 of 9 read (22%)" + progress bar; persists after reload | ✅ Pass |
| 5 | `/shelf`: 2 Mistborn books grouped; Export JSON downloads valid JSON; reading card downloads valid 1080×1350 PNG | ✅ Pass |
| 6 | Footer email capture → button changes to "Subscribed ✓" | ✅ Pass |
| 7 | Mobile ~375px: header/nav/search usable, series list readable, no horizontal overflow | ✅ Pass |
| 8 | SEO: robots.txt, sitemap index (2 files), /sitemaps/1.xml valid urlset; series page has title/meta description/canonical/OG/JSON-LD (BookSeries + BreadcrumbList) | ✅ Pass |
| 9 | Footer cross-links to astrosage/subsleuth/cv/watchdeck/mealloop.zalize.com | ✅ Pass |
| 10 | `/series/nonexistent-slug` → HTTP 404 + styled "Page not found" page | ✅ Pass |

## Evidence

### 1. Home page (desktop)
![Home](https://app.devin.ai/attachments/5fb3c31c-7f18-4ebd-9ec2-64e876be74d3/ss_6254fd70.png)

### 2. Search
| 🟢 "sanderson" → author result | 🟢 "zzzqqq" → no-results state |
|---|---|
| ![sanderson](https://app.devin.ai/attachments/ed733901-5cf6-49ee-941c-f839fb3370ec/ss_140ed606.png) | ![no results](https://app.devin.ai/attachments/1f9cd3e2-febf-4156-b895-2c20fff5d781/ss_6fef3d92.png) |

### 3. Author page
![Author page](https://app.devin.ai/attachments/d0decda0-59ef-411c-b11e-2fa8498ec014/ss_7c704469.png)

### 4. Series tracker + persistence
| 🟢 After ticking 2 books ("2 of 9 read (22%)") | 🟢 After full page reload (state persisted) |
|---|---|
| ![ticked](https://app.devin.ai/attachments/de1d7acb-39a3-40e3-8f7f-04a0d428051f/ss_bae0e1f0.png) | ![reload](https://app.devin.ai/attachments/0fb53006-daf8-4b30-90be-d82c8e5a143b/ss_2f12805d.png) |

### 5. My Shelf + exports
| 🟢 /shelf grouped by series | 🟢 Downloaded reading card PNG (1080×1350) |
|---|---|
| ![shelf](https://app.devin.ai/attachments/fba06d3b-a103-4490-922c-a82dc16c1d58/ss_8c956909.png) | ![card](https://app.devin.ai/attachments/764853d8-b515-4b76-9177-cebaf4ed6974/ss_1db9e87f.png) |

Export JSON content (`~/Downloads/shelfmark-export.json`) contained both ticked books with title/series/slug/timestamp. PNG magic bytes verified (`\x89PNG`), 1080×1350 sRGB.

### 6. Email capture
![Subscribed ✓](https://app.devin.ai/attachments/3d3100cc-a206-469a-9cd8-6818d552bc44/ss_zoom_e83bfd42.png)

### 7. Mobile 375px
| 🟢 Home | 🟢 Series page (checkboxes + progress) |
|---|---|
| ![mobile home](https://app.devin.ai/attachments/028fee0c-c937-4682-9975-c7572729f225/ss_01e0965a.png) | ![mobile series](https://app.devin.ai/attachments/0f5552d6-4d8f-4653-94b6-2e46cb364c7f/ss_4b5985d3.png) |

### 8. SEO view-source (series page)
![view-source](https://app.devin.ai/attachments/8950cf77-3de0-4037-9fab-52cd397bf598/ss_0d102d81.png)

Shell checks: `/robots.txt` 200 with sitemap ref; `/sitemap.xml` = sitemapindex referencing `/sitemaps/1.xml` and `/sitemaps/2.xml`; `/sitemaps/1.xml` = valid `<urlset>` with home/series/authors/shelf/about + author URLs.

### 9–10. Cross-links & 404
| 🟢 About page + footer cross-links | 🟢 404 page (HTTP 404 confirmed via curl) |
|---|---|
| ![about/footer](https://app.devin.ai/attachments/4c95e34a-9ee5-4980-8aa5-e1fb8fd02957/ss_7a8a105d.png) | ![404](https://app.devin.ai/attachments/c0443d00-06c5-4c6d-8310-680f8c712fd2/ss_1ba6fa75.png) |

## UX / visual issues noted

- **P2 (data quality, not UI):** "Popular series" on home is dominated by non-fiction/dataset series (xkcd 3255 "books", Lecture Notes in Computer Science, "Fauna of Russia…") because popularity = book count. First impression is odd for a fiction-reader audience; consider curating or weighting popular series.
- **P2 (data quality):** Mistborn book 9 is "Wax and Wayne" with no year — this is a sub-series/edition artifact from Wikidata, listed as a book.
- **P2:** After email subscribe, the input clears but no inline confirmation text besides the button change; acceptable but a small toast/message would be clearer.
- No P0/P1 issues found.
