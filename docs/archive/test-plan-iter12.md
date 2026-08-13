# Shelfmark Round 12 — search close-match fallback (deploy 57758c55, PR #6 commit 2809d7f)

Code refs: src/index.ts /search route — after exact-phrase LIKE queries, if `!series.length && !authors.length && !bookHits.length && tokens.length > 1` (tokens = words >2 chars), rerun with token-OR LIKE (`%tok%` each), popularity-ranked, LIMIT 12 series + 12 authors, `closeMatches=true` renders "No exact match — showing close matches instead." under the H1. Exact/single-word queries and true zero-hit "Nothing found." unchanged. Live curl pre-check confirms all four behaviors. Cache-buster param available if edge serves stale results.

1. /search?q=mistborn trilogy (typed in the site search box from the homepage): H1 "Results for “mistborn trilogy”", visible notice "No exact match — showing close matches instead.", Series grid with **Mistborn (Brandon Sanderson)** first card; click it → /series/mistborn book list. Fail: old "Nothing found", no notice, Mistborn absent/dead link.
2. Round 11 recovery flow end-to-end: visit /series/mistborn-trilogy (404) → click "searching" link → lands on /search?q=mistborn%20trilogy showing the close-match notice + Mistborn card (previously "Nothing found"). Fail: search link still yields zero results.
3. /search?q=brandon sandersen: notice shown, Authors grid includes **Brandon Sanderson first**. Fail: absent or no notice.
4. Control /search?q=discworld: normal exact results (Series incl. Discworld, Books section), **no** close-match notice. Fail: notice appears on exact match.
5. Garbage /search?q=zzqqxx wwyyzz: "Nothing found. Try a different spelling…" with **no** notice and no result grids. Fail: fallback fires on nonsense tokens.
6. Mobile ~375px on the mistborn trilogy results: notice + cards stack single-column, scrollWidth <= innerWidth, no overflow.
