# Shelfmark Rounds 46–50 — Production QA Report

- **Site:** https://shelfmark.zalize.com · **Deploy:** 5b4bb009 · **PR:** #9
- **Scope:** R46 series newest-book banner, R47 shelf empty-state Popular starts, R48 search zero-result Popular series, R49 /about "Ways to follow new releases", R50 (no code change — health check/IndexNow, shell-verified per brief), axe regression.
- **Method:** Recorded browser pass (Chromium) for all UI checks; incognito window for the clean-localStorage /shelf tests (seeded tracker state in the main profile untouched); headless Playwright + axe-core 4.10.2 (bypass_csp) for accessibility.
- **Result: 9/9 checks passed, 0 failed, 0 untested.**

## R46 — Series newest-book banner

**1. /series/the-murderbot-diaries banner — ✅ passed**
Under the H1: `.year-chip` pill **"New in 2026"** + «"Platform Decay" is the newest The Murderbot Diaries book — it's in the list below.» Platform Decay (2026) is indeed book #8 in the rendered list (claim true).

| Banner under H1 | Platform Decay #8 in the list |
|---|---|
| ![Banner](https://app.devin.ai/attachments/44cf48ee-8b74-4133-bcf2-d23654d587a1/ss_b2140df3.png) | ![List](https://app.devin.ai/attachments/b1da7a64-a0fb-49e1-a6b7-3c89d480bfe9/ss_0a99f4b9.png) |

**2. Negative: /series/discworld — ✅ passed**
Latest book 2015 → no banner; subtitle sits directly under the H1.

![Discworld: no banner](https://app.devin.ai/attachments/7c957d9c-39d6-4a96-b14b-f00766e70c26/ss_zoom_953cc5b2.png)

**3. Mobile (~508px CSS) — ✅ passed**
Banner wraps to two lines inside its card, chip + text readable; no horizontal overflow (`scrollWidth 493 ≤ innerWidth 508`).

![Mobile banner wraps](https://app.devin.ai/attachments/31f49dfd-1e50-4d80-ba22-ea0e7c24796e/ss_6bb5e2a0.png)

## R47 — Shelf empty state (incognito, clean localStorage)

**4. Popular starts links — ✅ passed**
Empty /shelf shows "Your shelf is empty" + Browse series button + **"Popular starts: Discworld · Mistborn · The Murderbot Diaries · New releases"** (4 links). Clicking "The Murderbot Diaries" navigates to /series/the-murderbot-diaries (with unticked checkboxes, confirming the clean profile).

![Empty shelf with Popular starts](https://app.devin.ai/attachments/ac40d6c2-046a-47e6-aefa-d386e3e17b22/ss_3d479ded.png)

**5. Regression: non-empty state — ✅ passed**
After ticking All Systems Red on the series page, /shelf renders the normal non-empty state: stats cards 1 read / 1 series / 1 in 2026 / most-read Murderbot, series section with Up next (The Future of Work: Compulsory) — and no Popular starts line. Incognito closed afterward; main-profile seeded state untouched.

![Non-empty shelf after tick](https://app.devin.ai/attachments/0c77c0c9-0396-4617-bed1-535ceda4c9d8/ss_423dbf87.png)

## R48 — Search zero-result state

**6. /search?q=zzzzqqqq — ✅ passed**
"Nothing found. Try a different spelling, or browse all authors and **genres**." + **Popular series** section with exactly **6** cards (Discworld, Animorphs, Oz, Fighting Fantasy, Sune, Yona of the Dawn).

![Zero-result Popular series](https://app.devin.ai/attachments/2a409d1d-83b8-4379-a327-8c898d06621a/ss_dae9e5d6.png)

**7. Negative: /search?q=discworld — ✅ passed**
Normal Series + Books results (Discworld first); **no** Popular series block.

![Normal results, no block](https://app.devin.ai/attachments/40ff9d52-a5c4-4618-b5a7-b84e3b7d6336/ss_edf23804.png)

## R49 — /about "Ways to follow new releases"

**8. Section + links — ✅ passed**
Section renders with the 4 bullets (New & upcoming page + chips, RSS feed, OpenSearch description, Add to Home Screen). Clicking **RSS feed** loads valid RSS 2.0 at /new.rss (2026 items incl. Platform Decay). Clicking **OpenSearch description** downloads opensearch.xml (649 B); the file parses as valid OpenSearch 1.1 XML and the URL serves 200 `application/opensearchdescription+xml`.

| Section on /about | opensearch.xml link resolves (download) |
|---|---|
| ![About section](https://app.devin.ai/attachments/80b2ff9c-66a7-4ae5-81fb-452b24a84ebb/ss_49a6100f.png) | ![Download](https://app.devin.ai/attachments/af99e976-6b3a-463e-9251-be55d4edc5e3/ss_e2c8966c.png) |

## Accessibility regression

**9. Axe (axe-core 4.10.2) — ✅ passed**

| Page | Violations |
|---|---|
| /series/the-murderbot-diaries (with banner) | **0** |
| /shelf (empty state, Popular starts rendered — asserted before scan) | **0** |
| /search?q=zzzzqqqq (Popular series block) | **0** |
| /about (new section) | **0** |

Zero-violation baseline holds. Raw output: `/tmp/axe_results_r50.json`.

## R50
No code change. Health check (16 endpoints 200) and IndexNow resubmission (25,647 URLs) were shell-verified by the requester before handoff; not re-run here.

## Artifacts
- Recording: `/home/ubuntu/screencasts/rec-ecb488ee-3b5d-486a-a342-1f4dca668c07/rec-ecb488ee-3b5d-486a-a342-1f4dca668c07-edited.mp4`
- Plan: `/home/ubuntu/repos/shelfmark/test-plan-iter50.md`
- Raw axe: `/tmp/axe_results_r50.json` (script `/tmp/axe_r50.py`)

## Notes / honesty
- Chrome downloads /opensearch.xml instead of rendering it (correct `application/opensearchdescription+xml` content type) — link functionality proven via the completed download + shell XML parse, not an in-browser render.
- The clean-localStorage tests ran in an incognito window; the main profile's seeded tracker state was never modified.
- No product source was modified.
