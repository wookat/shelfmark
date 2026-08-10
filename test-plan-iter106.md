# Shelfmark R106 book detail pages + mobile overflow fix re-test (deploy 79221be4, PR #15)

Code refs: src/index.ts:571-643 (book route: canonical 301 line 581, ordinal/prev-next 582-591, noindex:!description line 621, Book JSON-LD isPartOf+position 624-640); bookList line 655 title now `<a href="/book/{id}-{slug}">` inside the checkbox label.

Shell pre-check facts (workers.dev + cb): /book/134080-mistborn-the-final-empire 200 with h1, "Book 1 of 8 in", Next chip → /book/128212, bookshop link with nofollow noopener target=_blank; /book/134080-x → 301 to canonical; /book/99999999-nope → 404 "Page not found"; Book JSON-LD isPartOf BookSeries "Mistborn" position 1 + BreadcrumbList (Home/Mistborn/title); sitemap index has 11 chunks, /sitemaps/11.xml has 628 /book/ URLs; noindex example: /book/1000-v2 (no description) serves `noindex,follow`.

**Known failure to report:** mobile overflow at 360px NOT fully fixed — scrollWidth 363 vs 360 on /, /pricing, /series/mistborn (nav right=363, My Shelf pill) and homepage hero Search button right=372. 375/414 clean on all three. 320 exempt per brief.

## Recorded browser pass

1. Series → book navigation: /series/mistborn (hard reload), click the title text "Mistborn: The Final Empire" (not the checkbox) → lands on /book/134080-mistborn-the-final-empire. Page shows: h1 title, large cover, "by Brandon Sanderson · 2006" with author link, "Book 1 of 8 in Mistborn", description paragraph, "Full reading order" + "Find a copy" CTAs, "Next: Mistborn: The Well of Ascension" chip. Fail: title not a link, or 404/missing sections.
2. Prev/next: click Next chip → /book/128212-… shows "Book 2 of 8" with ← prev chip and Next chip; click ← → back to book 1. Fail: chips missing or wrong ordinal.
3. CTA: click "Full reading order" → /series/mistborn.
4. Checkbox regression (main profile): on /series/mistborn, click the CHECKBOX of book 7 The Lost Metal (not the title) → progress 7/8 (88%), page does NOT navigate; untick → 6/8 (75%). Fail: click navigates to book page or count wrong.
5. Mobile visual (Playwright 375×812 screenshots already; browser DevTools optional): book page renders sanely.

## Shell checks

6. Axe (bypass_csp, 4.10.2) light + dark on /book/134080-mistborn-the-final-empire → 0 violations. Save /tmp/axe_results_r106.json.
7. Mobile overflow re-probe results (already captured): 375/414 OK on /, /pricing, /series/mistborn; 360 FAIL (363px; hero button 372px on /). Screenshot /tmp/m360_home.png.
8. Captured: 301 canonicalization, 404, JSON-LD, sitemap 11 chunks + book URLs, noindex,follow on /book/1000-v2, bookshop attrs (served HTML only — bookshop IP-blocked).

Cleanup: main profile canonical (Mistborn 6/8, saved {}, no goal key).
Report → /home/ubuntu/repos/shelfmark/test-report-iter106.md
