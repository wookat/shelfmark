# R139 nit-fix re-verify (worker 9d213355)

Setup verified deployed CSS (cache-busted): `scroll-margin-top:72px` present; `@keyframes up-next-pulse{0%{...amber-accent) 10%,...}}` (was 18%).

1. Anchor visibility after jump (Playwright, fresh ctx): goto /authors/brandon-sanderson, click nav link "The Reckoners" → h2 of #the-reckoners boundingRect.top ≥ header bottom (57px) and < viewport height; screenshot shows heading visible below header. Same for /shelf: click "export a backup" → #backup row top ≥ 57px and Export JSON visible in screenshot. FAIL if heading top < header height (occluded).
2. Mid-pulse axe (dark, /series/mistborn): tick book 1, wait 300ms, inject axe (bypass_csp) → 0 color-contrast violations (previously 1). Repeat at ~600ms for safety.
3. Pulse perceptibility: normal-motion light context, tick book 1, sample li #2 backgroundColor at ~80ms — must differ from steady-state white/base (non-equal rgb) proving the 10% pulse still paints; plus visual screenshot within first ~300ms showing amber tint.
