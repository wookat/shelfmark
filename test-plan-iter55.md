# Shelfmark Rounds 51–55 — report-it mailto, genre data backfill/normalization, small-genre noindex (deploy 4783d03e, PR #9)

Shell-verified setup facts (live): mailto href present on discworld; fantasy 385; crime-fiction 38; crime-literature 404; fitz-and-the-fool has fantasy chip; cozy-mystery has robots noindex,follow; fantasy has no robots meta; /genres has no "Gunilla Bergström". R55: no code — user shell-verified IndexNow + health, include as reported.

## Recorded browser pass

1. R51: /series/discworld — tracker note ends «Spotted a wrong or missing book? Report it»; "Report it" anchor href = `mailto:contact@zalize.com?subject=Shelfmark%20data%20issue%3A%20Discworld` (inspect href via status bar/zoom + served HTML; do NOT open a mail client). Fail: link missing or wrong subject.
2. R52/53: /genres/fantasy header shows **385 fantasy series** (was 272). Fail: 272 or other count.
3. R53: /genres/crime-fiction shows **38 crime fiction series**; /genres/crime-literature returns the styled 404/not-found page (site header + not-found copy, not a bare error). Fail: crime-literature still renders a genre page.
4. R52: /series/fitz-and-the-fool pill row has capitalized **Fantasy** chip; click → /genres/fantasy. Fail: chip absent or wrong target.
5. Sanity: /genres index renders, fantasy at top (385), no bogus entries (e.g. "Gunilla Bergström", "crime literature"). Fail: bogus entry visible.

## Shell checks

6. R54: curl /genres/cozy-mystery head → `<meta name="robots" content="noindex,follow">` present (genre total < 3); /genres/fantasy → no robots meta. Fail: reversed/missing.
7. Axe (Playwright + bypass_csp, axe-core 4.10.2): /genres, /genres/fantasy, /series/fitz-and-the-fool → 0 violations each. Save /tmp/axe_results_r55.json.

Report → /home/ubuntu/repos/shelfmark/test-report-iter55.md
