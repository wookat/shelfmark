# Shelfmark Round 15 — paginated genre pages (deploy 40f91fb3, PR #7 commit 234ea60)

Code refs: src/index.ts /genres/:slug — COUNT(*) total, PAGE_SIZE 60 with LIMIT/OFFSET popularity-ranked, H1 "— Page N" for page>1, intro "{total} {genre} series with complete reading orders.", `paginationQ('/genres/{slug}?', page, pages)` Previous/Next, canonical bare on page 1 and `?page=N` beyond. Old behavior: hard LIMIT 200, intro showed results.length (max 200). Curl pre-check: fantasy total 279, page 1 = 60 cards + Next only, page 2 = 60 cards + Prev+Next, page 5 = 39 cards + Prev only, detective-fiction (19) has no controls; canonicals as specced.

1. /genres/fantasy: intro "279 fantasy series with complete reading orders." (not 200), 60 series cards, Next control, no Previous, H1 without page suffix. Fail: 200 cards/old count.
2. Page through via Next clicks to page 5: H1 "fantasy Series in Order — Page 5", 39 cards, Previous but NO Next; on an intermediate page (2) both Previous and Next present; canonical `…/genres/fantasy?page=5` (view-source/curl); page-1 canonical bare. Cards on page 5 have lower book counts than page 1 (popularity order continues). Fail: Next on last page, wrong count, canonical missing page.
3. Series card click from page 2: click a card → correct /series/:slug page renders. Fail: dead link.
4. Small genre /genres/detective-fiction (19 series): all 19 cards, no Previous/Next controls, H1 without suffix. Fail: stray pagination.
5. ~375px on /genres/fantasy?page=5: cards stack single-column, pagination controls visible, scrollWidth <= innerWidth.
6. Regression (Round 14 badge after deploy): on any series page tick one box → "Up next" pill appears on next unread instantly; untick to restore. Fail: badge missing.
