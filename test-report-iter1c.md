# Shelfmark — Iteration 1c report: apex archive.org CSP fix (one check)

Live re-verify of `/series/discworld` covers on https://shelfmark.zalize.com after `img-src` gained the apex `https://archive.org` (recorded browser pass).

## ✅ Result: fix verified working

- Hard-reloaded `/series/discworld`: **46/46 cover imgs in DOM, all `naturalWidth > 0`, 0 broken, 0 removed** — including Mort and Wyrd Sisters, which were CSP-blocked before the apex fix.
- CSP violation probe: installed a `securitypolicyviolation` listener and loaded a cache-busted, previously-blocked cover (`14648805-M.jpg` — redirects to `https://archive.org/download/...`): **probe LOADED (180px), 0 img-src violation events**.
- Console clean (cloudflareinsights also loads without error).

| 🔴 Before apex fix (covers silently removed) | 🟢 After apex fix (all covers render) |
|---|---|
| ![Before: Mort/Wyrd Sisters missing](https://app.devin.ai/attachments/cd19e30b-e9f2-4fe7-a4d8-250ffb9b6da3/ss_zoom_be62cfce.png) | ![After: 46/46 covers](https://app.devin.ai/attachments/5f86b6e0-13b1-454e-a527-b6ad4b8c151f/ss_zoom_4b744b96.png) |

## Artifacts
- Recording: `/home/ubuntu/screencasts/rec-f7f2cd53-b8bd-44e6-b568-fd751d35fcaa/rec-f7f2cd53-b8bd-44e6-b568-fd751d35fcaa-edited.mp4`
- Plan: `/home/ubuntu/repos/shelfmark/test-plan-iter1c.md`
