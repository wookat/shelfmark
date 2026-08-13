# Test Report — Rounds 29–30: RSS feed (/new.rss) + Copy list button (deploy df0aef7a, PR #8)

**Target:** production https://shelfmark.zalize.com, deploy df0aef7a
**Method:** recorded live browser pass (RSS link on /new, /new.rss in-browser, Copy list on /series/discworld, tracker/typeahead/shelf regression) + shell verification of feed headers/XML/clipboard + headless axe-core 4.10.2 audit (Playwright, bypass_csp, add_script_tag).
**Plan:** `test-plan-iter30.md` · Raw axe output: `/tmp/axe_results_r30.json` (re-run after fix: `/tmp/axe_results_r30b.json`)

> **Update (deploy 2e850f87):** the RSS-link axe violation below was fixed by adding a persistent `underline` class. Re-audit confirms **zero violations on both /new and /series/discworld** — check #13 is now resolved.
**Recording:** `/home/ubuntu/screencasts/rec-01da9b08-85ed-42b4-9c95-b46db62b9e9c/rec-01da9b08-85ed-42b4-9c95-b46db62b9e9c-edited.mp4`

## Summary

| # | Check | Result |
|---|---|---|
| 1 | /new: visible "RSS feed" link in intro paragraph | ✅ passed |
| 2 | /new head: RSS autodiscovery `<link rel="alternate" type="application/rss+xml">` → /new.rss | ✅ passed |
| 3 | Clicking RSS feed link lands on /new.rss showing the feed | ✅ passed |
| 4 | /new.rss: 200, `application/rss+xml; charset=utf-8`, RSS 2.0, valid XML, 31 items, all links → /series/… | ✅ passed |
| 5 | Copy list pill renders next to Share/Print list on /series/discworld | ✅ passed |
| 6 | Click → button flips to "Copied ✓", reverts to "Copy list" after ~2s | ✅ passed |
| 7 | Clipboard: header, 55 numbered titles in page order, "via" URL | ✅ passed |
| 8 | Copy list button has `print:hidden` class | ✅ passed |
| 9 | Regression: tracker tick persists across reload; untick restores | ✅ passed |
| 10 | Regression: typeahead "disc" → dropdown, Discworld first | ✅ passed |
| 11 | Regression: /shelf stats 10/3/7/Mistborn + Up next slots | ✅ passed |
| 12 | Axe /series/discworld: zero violations | ✅ passed |
| 13 | Axe /new: zero violations | ❌ failed on df0aef7a → ✅ **fixed & re-verified on 2e850f87** |

## ❌→✅ Axe regression on /new (R29-introduced, fixed in deploy 2e850f87)

The new "RSS feed" link introduces **1 serious `link-in-text-block` violation** — the R21 zero-violation baseline is broken on /new:

```
link-in-text-block (serious): Links must be distinguishable without relying on color
html: <a class="text-amber-accent hover:underline whitespace-nowrap" href="/new.rss">RSS feed</a>
- insufficient color contrast of 2.27:1 with the surrounding text (min 3:1; link #9a6414, surrounding #3d3a33)
- no styling (such as underline) to distinguish it from surrounding text
```

Fix suggestion: add a persistent `underline` class (not only `hover:underline`) to the RSS feed link. (Series-name links elsewhere on /new did not flag — only this new in-paragraph link.)

**Fix verified (deploy 2e850f87):** served HTML now reads `<a class="text-amber-accent underline whitespace-nowrap" href="/new.rss">RSS feed</a>`; axe re-audit (same Playwright + bypass_csp setup) returns `[]` for both /new and /series/discworld — zero-violation baseline restored.

## R29 — RSS feed

Visible link in intro paragraph + autodiscovery tag (`https://shelfmark.zalize.com/new.rss`, title "Shelfmark — new series books", verified in live head):

![/new with RSS feed link](https://app.devin.ai/attachments/ffdd7dc3-fdbd-4f8c-8561-09ef0baa3260/ss_8ea68e1b.png)

Clicking the link lands on /new.rss — URL bar shows /new.rss, valid RSS 2.0 XML rendered:

![/new.rss in browser](https://app.devin.ai/attachments/8a60abda-4322-4a59-9722-4603b6ad60d4/ss_c4ea1ce9.png)

Shell verification: `HTTP/2 200`, `content-type: application/rss+xml; charset=utf-8`, `cache-control: public, max-age=3600`, `<rss version="2.0">`, XML parses cleanly (python minidom), **31 `<item>`s**, every `<link>` points at `https://shelfmark.zalize.com/series/<slug>` (first: yona-of-the-dawn).

## R30 — Copy list

| 🔴 Before click: Copy list in pill row | 🟢 After click: Copied ✓ |
|---|---|
| ![Pill row before](https://app.devin.ai/attachments/a09c6095-7860-4853-9091-43b3c832bebe/ss_zoom_982a3e7b.png) | ![Copied feedback](https://app.devin.ai/attachments/a7ff82b8-edeb-49b6-9c64-a08d00788725/ss_zoom_2bd066b8.png) |

Reverted to "Copy list" after ~2s: ![Reverted](https://app.devin.ai/attachments/725e3877-5bba-474c-9aa1-7cf2854648f6/ss_zoom_0ffac838.png)

Clipboard contents (read via system clipboard `xclip` — the browser-console `readText` path fails with "Document is not focused" when devtools-driven):

```
Discworld — reading order

1. The Light Fantastic
2. Mort
3. Equal Rites
4. Sourcery
...
55. Raising Taxes

via https://shelfmark.zalize.com/series/discworld
```

- Header line exact: `Discworld — reading order` ✅
- 55 numbered lines (grep count = 55), matching the rendered order (1. The Light Fantastic, 2. Mort, 3. Equal Rites …) ✅
- Final line `via https://shelfmark.zalize.com/series/discworld` ✅
- Live DOM: button `classList.contains('print:hidden') === true` ✅ (full print preview not re-run; R28 proved the print CSS pipeline)

Note: my console `readText` attempt triggered a Chrome clipboard-permission prompt visible briefly in the recording; I dismissed it — it is an artifact of my verification method, not the feature.

## Regression (quick)

| Tick Equal Rites → 2/55 persists after reload | Typeahead "disc" → Discworld first |
|---|---|
| ![Tick persisted](https://app.devin.ai/attachments/1f426481-a04c-458c-b735-c99fccc529cd/ss_zoom_96e9065f.png) | ![Typeahead](https://app.devin.ai/attachments/cda9cdfa-bd1e-4917-ad29-2faf0e86abf1/ss_7a7c39e0.png) |

Untick restored 1/55; /shelf intact — 10 books read / 3 series followed / 7 read in 2026 / Mistborn, Up next: Mistborn → The Lost Metal, Warriors → Fire and Ice, Discworld → Mort:

![Shelf restored](https://app.devin.ai/attachments/999ba806-189a-47fe-b4ec-59cb1f78df1e/ss_f08333a4.png)

## Axe results (axe-core 4.10.2)

| Page | Violations |
|---|---|
| /series/discworld | **0** ✅ |
| /new (deploy df0aef7a) | **1** ❌ (`link-in-text-block`, serious, 1 node — the new RSS feed link) |
| /new (deploy 2e850f87, after fix) | **0** ✅ |

## Repo note

Only the R29 commit (`b35d2f7`) is on the PR #8 branch; the R30 Copy list code is live in production app.js/HTML but was **not found on the fetched branch head** — the lead may want to confirm the R30 commit gets pushed to the PR.
