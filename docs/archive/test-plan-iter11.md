# Shelfmark Round 11 — did-you-mean 404 suggestions (deploy f6d7fa75, PR #6 commit d9d5b4e)

Code refs: src/index.ts — `notFound(c, suggestions, query)` renders "Were you looking for one of these?" + up to 5 links + "Try searching" pre-filled with `?q=` (slug with dashes→spaces); `slugWords()` takes first 3 tokens >2 chars, first 5 chars each, `%tok%` OR LIKE, ordered by book_count DESC LIMIT 5; wired only into /series/:slug and /authors/:slug misses; `app.notFound` keeps plain notFound (no suggestions) for everything else. Live curl pre-check: statuses and links confirmed.

1. /series/mistborn-trilogy: HTTP 404 (verify via curl alongside browser); page shows "Page not found", "Were you looking for one of these?" with **Mistborn by Brandon Sanderson first** of 5 suggestions; clicking it lands on /series/mistborn with the Mistborn book list. Fail: no suggestions block, Mistborn absent, dead link.
2. Back on the 404, "searching" link href = `/search?q=mistborn%20trilogy`; clicking it opens /search with the query pre-filled ("mistborn trilogy" in the search input / results context). Fail: plain /search with empty q.
3. /authors/brandon-sandersen: 404 with **Brandon Sanderson first**; search link `/search?q=brandon%20sandersen`. Click Brandon Sanderson → /authors/brandon-sanderson author page. Fail: wrong first suggestion, broken link.
4. Garbage slug /series/zzzz-qqqq: 404 renders plain "Page not found" + "Try searching" only — NO "Were you looking" block, no broken/empty list markup. Fail: empty <ul>, JS/render error.
5. Regression: /series/mistborn still renders normally (200, H1 + book list, tracker state intact).
6. Mobile ~375px on /series/mistborn-trilogy 404: suggestion list stacks, scrollWidth <= innerWidth, no overflow.
