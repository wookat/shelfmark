# Shelfmark — Continuous-iteration Round 1 test report (security headers / CSP, rate limiting, search beacon)

Live production QA against https://shelfmark.zalize.com (Chrome desktop + 375px window, recorded), plus curl checks for headers and JSON-LD. No local setup.

## 🔴 P1 — CSP breaks most book cover images

On /series/discworld only **9 of 46** cover images load; **37 render as broken-image icons**.

Root cause (two compounding CSP issues):

1. `covers.openlibrary.org` serves many covers as a **302 redirect to `ia*.us.archive.org`** (verified: `curl -I https://covers.openlibrary.org/b/id/14648805-M.jpg` → 302 → `https://ia601601.us.archive.org/view_archive.php?...`). CSP checks the **redirect target** against `img-src`, and `*.archive.org` is not in `img-src 'self' https://covers.openlibrary.org data:`, so the image load is blocked. Covers served directly with 200 (e.g. id 6531015) still load.
2. The graceful-degradation fallback `onerror="this.remove()"` is an **inline event handler**, which `script-src 'self'` blocks (verified at runtime: an injected test img with an inline onerror handler never ran it). So instead of silently disappearing, broken covers now show browser broken-image placeholders.

| 🔴 Discworld covers broken under CSP | 🟢 Same page: tracker still works, tick persists |
|---|---|
| ![Broken covers](https://app.devin.ai/attachments/5cb066f5-3aec-4647-9bce-237249040be5/ss_zoom_138f57c6.png) | ![Tick persists after reload](https://app.devin.ai/attachments/d1cf1451-351f-45ec-b231-311eda9f01ec/ss_zoom_2e3955ab.png) |

Suggested fix: add `https://*.archive.org` (or `https:` for images) to `img-src`, and replace the inline `onerror` with an addEventListener-based handler in app.js (inline handlers are dead under `script-src 'self'`).

## 🟡 P2 — CSP blocks Cloudflare Web Analytics (RUM beacon)

Cloudflare auto-injects `static.cloudflareinsights.com/beacon.min.js`; it is blocked by `script-src 'self'` (red blocked row in DevTools Network, 1 console error on every page). If Cloudflare Web Analytics matters, add the host to `script-src`/`connect-src`; if not, disable the auto-injection to avoid a console error on every page load.

![Network panel: hit beacon 204, blocked cloudflareinsights script (red)](https://app.devin.ai/attachments/5994cf9f-4b0a-458f-9032-3d4c6ee10c44/ss_8f6358f8.png)

## Test results

| # | Check | Result |
|---|---|---|
| 1 | Security headers present (curl): CSP on HTML; X-Content-Type-Options, Referrer-Policy, X-Frame-Options on all responses | ✅ pass |
| 2 | Home renders under CSP: Fraunces/Google fonts render, layout intact, console clean | ✅ pass |
| 3 | Covers load under CSP | 🔴 **fail** (37/46 blocked on Discworld — P1 above) |
| 4 | Tracker under CSP: tick The Light Fantastic → "1 of 55 read (2%)", persists after reload | ✅ pass |
| 5 | JSON-LD present on series page (BookSeries + BreadcrumbList via curl) | ✅ pass |
| 6 | Search works: header search "discworld" → results page with /series/discworld link | ✅ pass |
| 7 | /api/hit beacon includes query: DevTools payload = `/search?q=discworld`, status 204, initiator app.js | ✅ pass |
| 8 | Footer subscribe (iter1-test@example.com) → "Subscribed ✓" + thanks message; not rate-limited on single request | ✅ pass |
| 9 | /shelf regression: 3 books across 3 series, grouped, series links work | ✅ pass |
| 10 | /genres regression: genre cards render (fantasy 279, sci-fi 199) | ✅ pass |
| 11 | Mobile 375px: genres + Discworld usable, scrollWidth 485 ≤ innerWidth 500, no horizontal overflow | ✅ pass |
| 12 | Rate-limit exhaustion (5/min subscribe, 10/min migrate, 60/min hit) | ⚪ untested (light pass; normal single requests work, limits not exercised to avoid polluting KV/subscriber data) |

| 🟢 Search beacon payload includes query | 🟢 Subscribe confirmation |
|---|---|
| ![Payload /search?q=discworld](https://app.devin.ai/attachments/24958f99-88fd-4829-9992-7d03fa885b47/ss_zoom_b28a6212.png) | ![Subscribed ✓](https://app.devin.ai/attachments/8e347e45-458c-41d3-8053-879e7c77122b/ss_zoom_763076e0.png) |

| 🟢 /shelf (3 series) | 🟢 Mobile 375px Discworld |
|---|---|
| ![Shelf](https://app.devin.ai/attachments/772e9222-b963-4ac3-84e3-24fa371bb443/ss_8b8ce1fd.png) | ![Mobile](https://app.devin.ai/attachments/c03858bc-608c-4cb2-9f0f-a180a093ac82/ss_zoom_4e88c409.png) |

Incidental observations (data, not this round's changes):
- Discworld now shows **55 books** and the pill matches the list (previous "sub-series rows" + stale "61 books" pill P2s appear fixed by a data refresh).
- Home "Prolific authors" again surfaces dataset-style entries (Randall Munroe "3260 books", Emily Dickinson "0 series · 1804 books", "Atharva Inamdar") — same curation smell previously flagged for Popular series. ![Home](https://app.devin.ai/attachments/a269416b-d099-469d-8623-eb2060a04d4d/ss_85de65d5.png)
- /shelf shows "1/1/1970" as the read date for migrated entries (migration stores `t:1`); cosmetic.

## UX / a11y improvement candidates for next round

- **Checkbox focus/keyboard**: series checkboxes have no visible focus ring; add `:focus-visible` styles for keyboard users.
- **Touch targets**: checkboxes are small (~18px); pad the label hit area to ≥44px (mostly OK since the whole row is a label — verify).
- **Skip link**: no "skip to content" link; header nav is retabbed on every page.
- **Contrast**: gray blurb text (`Discworld novel by Terry Pratchett`) and footer link gray look near/below WCAG AA 4.5:1 on the cream background — worth an audit.
- **Broken-cover fallback**: once CSP is fixed, replace inline onerror with a JS listener or a CSS-styled placeholder (nice modern touch: title-initial placeholder).
- **Subscribe form**: has no `<label>` (placeholder-only); add aria-label; announce the success message via `aria-live`.
- **Shelf dates**: "1/1/1970" for migrated ticks; store real migration timestamp or hide epoch dates.
- **Prolific authors curation**: apply the same curation used for Popular series.

## Artifacts
- Recording: `/home/ubuntu/screencasts/rec-743c043a-be98-42d4-a44c-26ec6cfc7814/rec-743c043a-be98-42d4-a44c-26ec6cfc7814-edited.mp4`
- Plan: `/home/ubuntu/repos/shelfmark/test-plan-iter1.md`
