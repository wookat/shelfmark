# Shelfmark Rounds 43–45 — Production QA Report

- **Site:** https://shelfmark.zalize.com · **Deploy:** 7256351c · **PR:** #9
- **Scope:** R43 genre-page "New & upcoming" link, R44 security headers (HSTS + Permissions-Policy), R45 author-page Copy list buttons, axe regression, mobile wrap check
- **Method:** Recorded browser pass (Chromium) for all UI checks; system clipboard verified with `xclip`; headers via `curl -sI`; headless Playwright + axe-core 4.10.2 (bypass_csp) for accessibility.
- **Result: 8/8 checks passed, 0 failed, 0 untested.**

## R43 — Genre page "New & upcoming" link

**1. /genres/science-fiction shows link with count — ✅ passed**
Subtitle renders `New & upcoming in science fiction (4)` as an underlined amber link → `/new?genre=science%20fiction` (lowercase param, as specified).

![Sci-fi genre page with New & upcoming link (4)](https://app.devin.ai/attachments/2b5949c0-a14f-497d-ba62-519d228cc62c/ss_9ee5c344.png)

**2. Click-through lands on filtered /new — ✅ passed**
URL `/new?genre=science%20fiction`; exactly **4** items (Platform Decay, 2× Lily Starling, Dark Agent); the **Science Fiction 4** chip is dark/selected, All chip unselected.

![Filtered /new: 4 sci-fi items, chip highlighted](https://app.devin.ai/attachments/007581c4-ead4-45b0-953a-13d493e5e9fc/ss_547b7494.png)

**3. Negative: /genres/fantasy has no link — ✅ passed**
Subtitle reads only "272 fantasy series with complete reading orders." — no "New & upcoming" link anywhere on the page (0 new fantasy items). Print concern: the link is a normal inline anchor with no special print styles, per spec — no issue.

![Fantasy genre page: no New & upcoming link](https://app.devin.ai/attachments/f50abdb1-6d79-4149-b9bf-3f6669df5451/ss_zoom_177dc8bc.png)

## R44 — Security headers (shell, curl -sI)

**4. HSTS + Permissions-Policy on / and /series/mistborn; existing headers unchanged — ✅ passed**

Both pages return identically:

```
strict-transport-security: max-age=31536000; includeSubDomains
permissions-policy: camera=(), microphone=(), geolocation=(), payment=()
content-security-policy: default-src 'self'; img-src 'self' https://covers.openlibrary.org https://archive.org https://*.archive.org data:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; script-src 'self' https://static.cloudflareinsights.com; connect-src 'self' https://cloudflareinsights.com; base-uri 'self'; form-action 'self'; frame-ancestors 'none'
referrer-policy: strict-origin-when-cross-origin
x-content-type-options: nosniff
x-frame-options: DENY
```

New values exactly as specified; CSP/XCTO/XFO/Referrer byte-identical to prior rounds.

## R45 — Author-page Copy list buttons

**5. Brandon Sanderson: 6 buttons, Copy works — ✅ passed**
All 6 series section headers (Mistborn, Alcatraz, Secret Projects, Skyward, The Reckoners, Legion) carry a "Copy list" button; the Standalone books section has none. Clicking the Mistborn button flips it to **"Copied ✓"**, and the system clipboard (`xclip -selection clipboard -o`) contains:

```
Mistborn — reading order

1. Mistborn: The Final Empire
2. Mistborn: The Well of Ascension
3. Mistborn: The Hero of Ages
4. Mistborn: The Alloy of Law
5. Mistborn: Shadows of Self
6. Mistborn: The Bands of Mourning
7. Mistborn: The Lost Metal
8. Mistborn: Secret History

via https://shelfmark.zalize.com/series/mistborn
```

| Copy list in section header | "Copied ✓" feedback after click |
|---|---|
| ![Mistborn header with Copy list](https://app.devin.ai/attachments/1891e6c9-0932-434f-9465-ede41ba89ed9/ss_b4cdca56.png) | ![Copied ✓](https://app.devin.ai/attachments/b5ac0631-ef99-4249-8f45-00705bc426f6/ss_zoom_bb387623.png) |

**6. Martha Wells negative case — ✅ passed**
Exactly **1** Copy list button (The Murderbot Diaries section); the **Standalone books** header (15 books) has **no** button.

![Martha Wells Standalone books section: no Copy list button](https://app.devin.ai/attachments/64c322e7-48dc-494b-a4c0-afad16d159b9/ss_6a0682c6.png)

## Mobile

**7. Author header row wraps at ~500px — ✅ passed**
At 508 CSS px, the Mistborn header wraps cleanly — title + meta + progress on one row, Copy list button on the next, fully readable/clickable. No horizontal overflow: `scrollWidth 493 ≤ innerWidth 508`.

![Mobile 508px: header wraps, Copy list on own row](https://app.devin.ai/attachments/71a09002-27c5-44aa-a4da-cf3cb2255cb7/ss_6be2216f.png)

## Accessibility regression

**8. Axe (axe-core 4.10.2) — ✅ passed**

| Page | Violations |
|---|---|
| /genres/science-fiction (with new link) | **0** |
| /authors/brandon-sanderson (with 6 Copy list buttons) | **0** |

Zero-violation baseline holds. Raw output: `/tmp/axe_results_r45.json`.

## Artifacts
- Recording: `/home/ubuntu/screencasts/rec-638595bc-47b5-49a3-8e97-8bda85b90c4b/rec-638595bc-47b5-49a3-8e97-8bda85b90c4b-edited.mp4`
- Plan: `/home/ubuntu/repos/shelfmark/test-plan-iter45.md`
- Raw axe: `/tmp/axe_results_r45.json` (script `/tmp/axe_r45.py`)

## Notes / honesty
- Clipboard verified via system `xclip` (browser clipboard API not used).
- Brandon Sanderson's 6-button count was verified in served HTML + visible header screenshots; only the Mistborn button was click-driven (representative, shared `data-copylist` handler).
- No product source was modified; tracker state untouched (only Copy interaction, no ticks this round).
