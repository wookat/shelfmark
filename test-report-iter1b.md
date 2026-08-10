# Shelfmark — Iteration 1b re-verify report (Round-1 fixes)

Quick live re-verify on https://shelfmark.zalize.com (Chrome, recorded), plus curl/console instrumentation for the CSP/covers root cause.

## 🔴 Covers fix does NOT work — CSP still blocks 37/46 Discworld covers

The intended fixes are both deployed and *partially* effective:
- The CSP header now includes `https://*.archive.org` in img-src (verified via curl and `fetch().headers`).
- The inline `onerror` is gone; the new document-level capturing `error` listener correctly removes failed covers — **no broken-image icons remain** (0 broken imgs in DOM).

But the covers themselves still don't load. Root cause: `covers.openlibrary.org` now 302-redirects to the **apex domain**:

```
location: https://archive.org/download/m_covers_0014/m_covers_0014_64.zip/0014648805-M.jpg
```

Per CSP host matching, `*.archive.org` matches subdomains only — **not the apex `archive.org`** — so the redirect target is still blocked. Runtime proof: a `securitypolicyviolation` event fired for the cover URL (`violatedDirective: img-src`) even though the active policy (read from the event's `originalPolicy`) contains `https://*.archive.org`. Result: only 9/46 covers render on Discworld; the other 37 are silently removed (visually clean, but data lost).

**Fix: add the apex too — `img-src ... https://archive.org https://*.archive.org`** (redirect targets observed both on `archive.org/download/...` and `ia*.us.archive.org`, so keep both).

| 🔴 Iteration 1: broken icons | 🟡 Now: icons gone, but most covers missing (Mort, Wyrd Sisters have none) |
|---|---|
| ![Before: broken icons](https://app.devin.ai/attachments/ea78b3be-c3ae-4675-9980-0257f1d94caa/ss_zoom_138f57c6.png) | ![After: silently removed](https://app.devin.ai/attachments/a90f9112-ffe5-42ae-a7bc-8f02fa3713fc/ss_zoom_be62cfce.png) |

## Results

| Check | Result |
|---|---|
| Discworld covers render without broken icons | 🟡 partial — **no broken icons** (new error listener works), but **37/46 covers still CSP-blocked** (apex archive.org redirect, see above) |
| No CSP console violations | 🔴 fail — `securitypolicyviolation` (img-src) still fires for each redirected cover; cloudflareinsights script is now allowed and loads (that part fixed) |
| Home Prolific authors curated | ✅ pass — Randall Munroe / Emily Dickinson / 0-series entries gone; cards now R. L. Stine (7 series · 353), Asimov, Nora Roberts, Christie… all ≥2 series, 145–353 books |
| /shelf epoch dates hidden | ✅ pass — migrated Mistborn entry shows no date; genuine dates (8/5/2026, 8/6/2026) still shown |
| Tab focus ring | ✅ pass — amber outline visible on nav link when tabbing; footer email input now has `aria-label="Email for new-release alerts"` |

| 🟢 Prolific authors curated | 🟢 Epoch date hidden on /shelf |
|---|---|
| ![Curated authors](https://app.devin.ai/attachments/ec7cf453-c13f-4df5-8069-a24ddfceadc7/ss_ca5445a4.png) | ![No 1/1/1970](https://app.devin.ai/attachments/ce4c6b9f-3a57-41c3-9575-c2e957b3148a/ss_zoom_d9575b43.png) |

🟢 Focus ring: ![Amber focus ring on Series nav link](https://app.devin.ai/attachments/8f68cf64-6656-4c04-a5ba-12d85c7e0c2c/ss_zoom_dcb0fb8a.png)

## Artifacts
- Recording: `/home/ubuntu/screencasts/rec-322fb0d2-b44b-4f48-9c4d-3b879e083b8b/rec-322fb0d2-b44b-4f48-9c4d-3b879e083b8b-edited.mp4`
- Plan: `/home/ubuntu/repos/shelfmark/test-plan-iter1b.md`
