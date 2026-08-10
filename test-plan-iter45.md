# Shelfmark Rounds 43–45 — genre "New & upcoming" link, security headers, author Copy list (deploy 7256351c, PR #9)

Shell-verified setup facts (live, no cache lag):
- /genres/science-fiction subtitle contains `<a class="text-amber-accent underline" href="/new?genre=science%20fiction">New & upcoming in science fiction (4)</a>`; /genres/fantasy has 0 such links.
- Headers on / and /series/mistborn: `strict-transport-security: max-age=31536000; includeSubDomains`, `permissions-policy: camera=(), microphone=(), geolocation=(), payment=()`, plus unchanged CSP / x-content-type-options nosniff / x-frame-options DENY / referrer-policy strict-origin-when-cross-origin.
- /authors/brandon-sanderson: 6 `data-copylist` buttons (mistborn, alcatraz…, secret-projects, skyward-series, the-reckoners, legion-series); martha-wells: 1; Standalone books sections have none.

## Recorded browser pass

1. R43: /genres/science-fiction — visible underlined link "New & upcoming in science fiction (4)" in subtitle. Fail: absent, wrong count, or no styling.
2. Click it → lands on /new?genre=science%20fiction: exactly 4 items, Science Fiction chip dark/selected. Fail: item count ≠ 4 or chip not highlighted.
3. Negative: /genres/fantasy — no "New & upcoming" link in subtitle (0 new fantasy items). Fail: link present.
4. R45: /authors/brandon-sanderson — each of the 6 series section headers shows a "Copy list" button; Standalone books section shows none. Click the Mistborn header's Copy list → button flips to "Copied ✓"; system clipboard (via `xclip -selection clipboard -o`) contains a numbered reading order (1. Mistborn: The Final Empire … 8.) ending with "via https://shelfmark.zalize.com/series/mistborn". Fail: no feedback, wrong slug, or unnumbered/empty clipboard.
5. Negative: /authors/martha-wells — exactly 1 Copy list button (Murderbot series section); Standalone books section has no button. Fail otherwise.
6. Mobile (~508px CSS): Sanderson series section header row (title + book count + progress + Copy list button) wraps cleanly, no horizontal overflow (scrollWidth ≤ innerWidth), button clickable/readable. Fail: overflow or clipped button.

## Shell checks

7. R44: `curl -sI` on / and /series/mistborn — HSTS `max-age=31536000; includeSubDomains` and Permissions-Policy `camera=(), microphone=(), geolocation=(), payment=()` present; CSP, x-content-type-options, x-frame-options, referrer-policy unchanged from prior rounds. Fail: any missing/altered. (Already captured in setup; re-capture for report evidence.)
8. Axe (Playwright + bypass_csp, axe-core 4.10.2): /genres/science-fiction and /authors/brandon-sanderson → 0 violations each. Save /tmp/axe_results_r45.json.

Report → /home/ubuntu/repos/shelfmark/test-report-iter45.md
