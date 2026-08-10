# Shelfmark Rounds 56–60 — sitemap genre threshold, 301 merges, More-genre-authors, /genres JSON-LD, per-genre RSS (deploy 34bdbde6, PR #11)

Shell-verified setup facts (live): sitemap chunk 1 contains genres/fantasy and none of satire/autobiography/anthropomorphic-comic; /genres/{crime-literature,romance,fantasy-literature} → 301 → {crime-fiction,romance-novel,fantasy} (final 200); Brandon page has "More fantasy authors" + "All fantasy series" + 6 author hrefs (pratchett, anthony, lackey, holmes, hamilton, brooks); /genres emits BreadcrumbList + ItemList numberOfItems 59; /new.rss?genre=fantasy titled "Shelfmark — New & Upcoming Fantasy Series Books", unknown genre falls back to full feed title; /new?genre=fantasy has "RSS feed (fantasy)" → /new.rss?genre=fantasy.

## Recorded browser pass

1. R58: /authors/brandon-sanderson — scroll to "More fantasy authors" section: exactly 6 author chips (incl. Terry Pratchett) + "All fantasy series →" link. Fail: section missing, wrong count, or non-fantasy authors.
2. R58: click "Terry Pratchett" chip → lands on /authors/terry-pratchett. Back; click "All fantasy series →" → /genres/fantasy (385 series header). Fail: wrong navigation.
3. R58 print-hidden: verify section markup has print-hidden class in served HTML (shell, no print preview requested). R58 negative: find an author with no genred series (probe shell first, e.g. an author whose series lack genre) — section absent. Fail: section shown.
4. Regression: on /authors/brandon-sanderson tick an unticked book → progress % updates; untick → restored exactly. Fail: no state change or wrong restore.
5. R60: /new?genre=fantasy — RSS link labeled "RSS feed (fantasy)"; click → /new.rss?genre=fantasy renders RSS 2.0 XML with channel title "Shelfmark — New & Upcoming Fantasy Series Books" and only fantasy items. Fail: label/URL/title wrong.

## Shell checks

6. R56: curl /sitemaps/1.xml?v=cachebust — contains `genres/fantasy`; contains NONE of `genres/satire`, `genres/autobiography`, `genres/anthropomorphic-comic`. Fail: any excluded slug present or fantasy absent.
7. R57: curl -I on /genres/crime-literature, /genres/romance, /genres/fantasy-literature → 301 with Location = crime-fiction / romance-novel / fantasy respectively; followed request → 200. Fail: non-301 or wrong target.
8. R59: /genres JSON-LD — BreadcrumbList present + ItemList with numberOfItems 59 and 59 itemListElement entries. Fail: missing or wrong count.
9. R60 fallback: /new.rss?genre=zzz → full-feed title "Shelfmark — New & Upcoming Series Books" (no 5xx). Fail: error or filtered title.
10. Axe (Playwright + bypass_csp, axe-core 4.10.2): /authors/brandon-sanderson, /genres, /new?genre=fantasy → 0 violations each. Save /tmp/axe_results_r60.json.

Report → /home/ubuntu/repos/shelfmark/test-report-iter60.md
