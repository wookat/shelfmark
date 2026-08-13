# R136 fix re-verify (worker c82d9ab4, commit 04a2b51, PR #21) — no recording

Deployed CSS confirmed (cache-busted, 30,373 B): `header nav a:not(.rounded-full),footer ul a{margin-block:-.75rem;padding-block:.75rem}` and `@media (prefers-reduced-motion:reduce){[data-progress-bar],[role=progressbar]>div{transition:none}}`.

All checks via Playwright (shell), cache-busted URLs (?cb=), fresh contexts. Main profile untouched.

1. **Tap targets @1440 on homepage**: for every `header nav a:not(.rounded-full)` and `footer ul a`, elementFromPoint scan (1px steps vertically at element center-x) → effective clickable height. PASS: all ≥44px (prev fail: 38 / 34.6px). Also computed padding-block = 12px, margin-block = -12px.
2. **Layout invariants**: header row (`header > div`) height exactly 56px; My Shelf pill (`a.rounded-full`) height 32px & padding-block 6px, same as prior run. FAIL if any differs.
3. **Reduced motion**: context with `reduced_motion="reduce"`, fresh storage; /series/mistborn?cb=…, tick book 1 → `[data-progress-bar]` exists; computed `transition-property` = `none` (prev fail: `all 0.15s`). Also sanity: normal-motion context still shows `width 0.4s`.
4. **375px overflow**: homepage at 375×812, cache-busted → `document.documentElement.scrollWidth === 375`. FAIL if >375.
