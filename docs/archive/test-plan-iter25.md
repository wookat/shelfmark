# Shelfmark Round 25 — search typeahead (deploy 291c2160, PR #8 commit ed36577)

Code refs: public/app.js — every `form[action="/search"]` gets an absolute-positioned `div[role=listbox]` (`z-50`, hidden by default); 200ms debounce fetch of `/api/suggest?q=`, stale guard (`input.value.trim() !== lastQ`); items are `a[role=option]`; ArrowDown/Up toggle `bg-ink-100`, Enter with active ≥0 → `location.href`, Escape closes, document click outside form closes. src/index.ts — GET /api/suggest: min 2 chars, prefix LIKE, 5 series (book_count>0, by size) + 3 authors, Cache-Control max-age=3600.

Already curl-verified: `/api/suggest?q=disc` → 200, cache header, results Discworld → Discovery → Discrete Mathematics… (all series); `q=d` → `{"results":[]}`; deployed app.js contains suggest code.

## Recorded browser pass

1. Header search (desktop, any page): type "disc" → dropdown appears below the input with **Discworld · series** as first item. Click Discworld → lands on /series/discworld. Fail: no dropdown, wrong order, wrong nav.
2. Homepage hero form: type "disc" → same dropdown appears attached to the hero form (screenshot proof). Fail: dropdown missing on hero form.
3. Keyboard nav (hero or header): type "disc", press ArrowDown twice → 2nd item (**Discovery**) visibly highlighted (bg-ink-100), press Enter → lands on /series/discovery (NOT /search?q=disc). Then back, type "disc", press Escape → dropdown closes (input keeps text). Then type a query and press Enter with no highlight → normal /search results page loads.
4. ~375px narrow window: the mobile header form (<640px) shows the dropdown on typing "disc" without clipping; no horizontal overflow (scrollWidth ≤ innerWidth).
5. Click outside the form (e.g. page background) with dropdown open → dropdown closes.
6. Console after all typeahead interactions: no errors/CSP violations/failed fetches.
7. Regression smoke: tick/untick one book on /series/discworld (progress count updates); /shelf still 10/3/7/Mistborn with Up next slots.
