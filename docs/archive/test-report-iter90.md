# Shelfmark Rounds 86–90 live QA — production deploy 4b729b6c (branch devin/1786028086-iter80, PR #13)

Tested live against https://shelfmark.zalize.com with authoritative header/asset checks against the direct origin https://shelfmark.wookat520.workers.dev + cache-bust params. Browser pass recorded; axe-core 4.10.2 run headlessly via Playwright (bypass_csp) in both light and dark color-scheme emulation.

## ⚠️ Escalation — 1 failure

**R86 dark-mode axe on / found 1 serious color-contrast violation.** In dark mode the inverted `bg-ink-900` section ("Your shelf lives in your browser.") renders with light background `#f2efe6`, and its amber link override `.bg-ink-900 .text-amber-accent{color:#9a6414}` gives the **"My Shelf" link a contrast of 4.34:1 — below the 4.5:1 WCAG AA threshold** (16px normal weight). Light mode on / is clean (0 violations). A slightly darker amber (e.g. `#8f5d12` ≈ 4.9:1) in that dark-mode override would fix it. Raw axe output: `/tmp/axe_results_r90.json`.

All other requested checks passed.

## R86 dark mode

- styles.css (workers.dev + cb) contains the `@media (prefers-color-scheme:dark)` block remapping `--color-ink-50:#16140f`, `--color-white:#1e1c16`, `--color-amber-accent:#e8b05f`, plus `.bg-ink-900 .text-amber-accent{color:#9a6414}`, year-chip `#e8c186/#3b301c`, up-next-badge `#16140f`, `img{filter:brightness(.92)}` — ✅
- Head has `<meta name="color-scheme" content="light dark">` + dual theme-color metas (`#f7f6f3` light / `#16140f` dark) — ✅
- Homepage renders correctly in dark emulation: dark page bg, distinct dark cards, readable light text, amber links, cover thumbnails visible, "surprise me" link legible — ✅

| 🟢 Dark homepage | 🟢 Dark inverted bg-ink-900 section (visually legible) |
|---|---|
| ![Dark homepage](https://app.devin.ai/attachments/1733c4a8-e334-4770-ab1b-abd99c9b9a9e/ss_7dd46879.png) | ![Dark inverted section](https://app.devin.ai/attachments/73c8a6a3-d7fa-4f54-a1d4-10297a71f998/ss_dcd56d02.png) |

- /series/mistborn dark: readable list rows, year chips in amber-on-dark variant, "Up next" badge amber with dark text, amber progress bar and "6 of 8 read (75%)" legible — ✅

| 🟢 Dark series header + chips | 🟢 Dark "Up next" badge |
|---|---|
| ![Dark series header](https://app.devin.ai/attachments/ec36f0a5-563a-445a-a087-57b278ae9398/ss_zoom_cec52832.png) | ![Up next badge](https://app.devin.ai/attachments/89b0213d-3a08-4c1d-823a-780cfd4c0c95/ss_zoom_74fb1153.png) |

![Dark /series/mistborn full page](https://app.devin.ai/attachments/83e98bb1-9a80-4b03-a14a-e66d80ad2139/ss_ace8680e.png)

- Axe dark mode on /: ❌ **1 serious color-contrast violation** (see escalation above).

## R87 /random

- 3× GET /random (workers.dev + cb): `302` → `/series/three-californias-trilogy`, `/series/the-traitor-spy-trilogy`, `/series/the-inheritance-cycle`; each with `cache-control: no-store` + `x-robots-tag: noindex` — ✅
- robots.txt contains `Disallow: /random` — ✅
- Homepage shows "surprise me with a series" amber underlined link under the search form; clicking it landed on /series/langdon-st-ives — ✅

| 🟢 Homepage link under search form | 🟢 Landed on random series page |
|---|---|
| ![Homepage link](https://app.devin.ai/attachments/87728e16-23ae-4bbe-982f-5e4cdaa745bf/ss_bd5a5ca9.png) | ![Random series](https://app.devin.ai/attachments/b5e87812-23da-48d0-80fb-a24da1c7c712/ss_4d76fb56.png) |

## R88 manifest + "/" hotkey

- manifest.json shortcuts = `[('My Shelf','/shelf'), ('New & upcoming','/new'), ('Surprise me','/random')]` — ✅
- Pressing "/" with no field focused → header search box gains focus (amber focus ring), no "/" typed — ✅
- With the footer email input focused and "test" typed, pressing "/" typed a literal `test/` into that input and did NOT steal focus — ✅

| 🟢 "/" focuses header search | 🟢 Literal "/" typed while in input |
|---|---|
| ![Search focused](https://app.devin.ai/attachments/4e1bcd61-26e8-4ae9-95f9-1a60742acb3c/ss_zoom_57775f10.png) | ![test/ in email input](https://app.devin.ai/attachments/eafc571f-ad57-439e-9110-f066ec33690e/ss_zoom_ee557277.png) |

## R89 Save for later

- /series/mistborn: "☆ Save for later" → click → "★ Saved for later", `aria-pressed` false→true, `shelfmark_saved_v1` = `{"mistborn":{"name":"Mistborn","t":1786030701516}}` — ✅
- Saved Discworld second; /shelf "Saved for later" grid renders 2 items in recency order (Discworld first, Mistborn second) with Remove buttons carrying descriptive aria-labels — ✅
- Remove Discworld → item disappears, Mistborn remains; Remove Mistborn → section fully gone; reload of /shelf → no Saved section; `shelfmark_saved_v1` = `{}` — ✅ (main profile left clean)

| 🟢 Toggled ★ Saved for later | 🟢 /shelf grid, recency order |
|---|---|
| ![Saved toggle](https://app.devin.ai/attachments/a21ade66-9a88-4a17-a03d-f89e53e4d169/ss_zoom_a9e04a22.png) | ![Saved grid](https://app.devin.ai/attachments/9ba7c969-dd71-4a74-848a-1b00d16aa522/ss_157d5ae3.png) |

| 🟢 After 1 Remove | 🟢 Empty after last Remove + reload |
|---|---|
| ![One removed](https://app.devin.ai/attachments/16c8ffa1-1a1f-49ad-8925-a9038cfcc39e/ss_aecc1ebe.png) | ![Section gone](https://app.devin.ai/attachments/deb39b1a-f662-489e-b9f9-d9a801cdb444/ss_1777975a.png) |

## Regression

- Tracker on /series/mistborn: tick The Lost Metal → 7/8 (88%), Up next moved to Secret History; untick → exact restore 6/8 (75%) — ✅

| 🟢 Ticked 7/8 (88%) | 🟢 Restored 6/8 (75%) |
|---|---|
| ![Tick](https://app.devin.ai/attachments/64e8c7e6-1027-424b-bd76-23a6dc767276/ss_zoom_d3951082.png) | ![Restore](https://app.devin.ai/attachments/3f94f5a2-ec5e-4383-9e2c-33fbc645f422/ss_zoom_fc84baec.png) |

- Security headers on / (workers.dev + cb): HSTS, CSP (unchanged directives), Permissions-Policy, X-Frame-Options DENY, nosniff, referrer-policy — all unchanged — ✅
- Axe light mode: / → **0 violations**, /shelf (tracker state seeded so all sections render) → **0 violations** — ✅
- R85/R90: log-only per brief, no runtime surface — not tested.

## Honesty notes

- Dark-mode testing used Chrome DevTools "Emulate CSS prefers-color-scheme: dark" (no OS-level toggle available); the axe dark run used Playwright's `color_scheme="dark"` context — both are standard media-query emulation, not an OS dark theme.
- The recording briefly shows DevTools open (needed for the emulation toggle) and an initial mis-navigation to an author page before dark emulation was set.
- The saved-for-later flow was run in the main profile but save/remove was fully cycled and verified restored to `{}`; tracker restored to the canonical 6/8 state.

## Re-check after fix (deploy 99ce72c3)

The R86 contrast failure was fixed and redeployed: workers.dev styles.css now serves `.bg-ink-900 .text-amber-accent{color:#8f5d12}` inside the dark-mode block. Re-ran axe-core 4.10.2 on / with Playwright `color_scheme="dark"`:

- Axe dark mode on /: **0 violations** — ✅ (was 1 serious color-contrast)
- "My Shelf" link in the inverted `bg-ink-900` section computes to `rgb(143,93,18)` on `rgb(242,239,230)` = **4.88:1 contrast** (≥ 4.5:1 AA) — ✅

Raw before/after results appended to `/tmp/axe_results_r90.json` under `dark_home_after_fix_99ce72c3`.

## Artifacts

- Recording: `/home/ubuntu/screencasts/rec-dc15358d-e1c2-4023-a011-ad537b4f3317/rec-dc15358d-e1c2-4023-a011-ad537b4f3317-edited.mp4`
- Plan: `/home/ubuntu/repos/shelfmark/test-plan-iter90.md`
- Raw axe output: `/tmp/axe_results_r90.json`
