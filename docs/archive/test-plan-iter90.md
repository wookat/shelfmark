# Shelfmark Rounds 86–90 — dark mode, /random, "/" hotkey + manifest shortcuts, Save for later (deploy 4b729b6c, PR #13)

Shell pre-check facts (workers.dev + cache-bust): styles.css has `@media (prefers-color-scheme:dark)` remapping `--color-ink-50:#16140f`, `--color-white:#1e1c16`, `--color-amber-accent:#e8b05f`, plus `.bg-ink-900 .text-amber-accent{color:#9a6414}`, year-chip `#e8c186/#3b301c`, up-next-badge `#16140f`, `img{filter:brightness(.92)}`. Head has `<meta name="color-scheme" content="light dark">` + dual theme-color metas (#f7f6f3 light / #16140f dark). /random → 302 location:/series/helliconia, `cache-control: no-store`, `x-robots-tag: noindex`; robots.txt `Disallow: /random`; homepage has amber underlined "surprise me with a series" → /random. manifest.json shortcuts urls = [/shelf, /new, /random]. app.js: document keydown "/" → focuses `header input[name="q"]` unless target is INPUT/TEXTAREA/contentEditable or modifier held. Save for later: `[data-save-series]` button ("☆ Save for later" ↔ "★ Saved for later", aria-pressed), key `shelfmark_saved_v1` `{slug:{name,t}}`; /shelf `#saved-root` renders "Saved for later" grid sorted by t desc with per-item Remove (aria-label), clears section when last removed; no section when key empty.

## Recorded browser pass

1. R86 dark mode (emulate prefers-color-scheme: dark via DevTools rendering emulation — no OS toggle available; hard reload): `/` renders dark page bg (#16140f), distinct card surfaces (#1e1c16), readable light text, amber (#e8b05f) links; inverted bg-ink-900 CTA section still legible. `/series/mistborn` dark: year chips + Up next badge legible variants. Fail: white page, invisible text, unreadable amber-on-dark.
2. R87 UI: homepage (light mode restored) shows "surprise me with a series" link under the search form; click → lands on some /series/{slug} page; click /random again from address bar → (very likely) different series. Fail: 404/no link.
3. R88 hotkey: on /genres (no input focused) press "/" → header search box gains focus (caret visible, no "/" typed). Then on /series/mistborn focus the footer email input, press "/" → a literal "/" is typed into that input and search does NOT steal focus. Fail: no focus, or hotkey fires while typing.
4. R89 Save for later (keep main profile clean — save then fully remove): /series/helliconia (untracked) shows "☆ Save for later"; click → "★ Saved for later" + aria-pressed=true; localStorage `shelfmark_saved_v1` has helliconia entry. Save a 2nd series (e.g. /series/discworld) then open /shelf → "Saved for later" grid with 2 items, most-recent first (Discworld before Helliconia); click Remove on each → items disappear, section fully gone after last. Reload /shelf → no Saved section; key empty/{} . Fail: button doesn't toggle, wrong order, Remove leaves stale item/section, state persists after cleanup.
5. Regression tracker: /series/mistborn tick The Lost Metal → 7/8 (88%); untick → restore 6/8 (75%).

## Shell checks

6. R87 headers: 3× GET /random (workers.dev + cb) → each 302 to /series/{slug} with `cache-control: no-store` + `x-robots-tag: noindex`; robots.txt contains `Disallow: /random` (captured).
7. R88 manifest: shortcuts = [/shelf, /new, /random] with names (captured).
8. Regression security headers on / unchanged (workers.dev + cb).
9. Axe (Playwright bypass_csp, 4.10.2): light mode / and /shelf (seeded) → 0 violations; dark mode (emulate media prefers-color-scheme: dark) / → 0 violations (contrast). Save /tmp/axe_results_r90.json.

Cleanup: shelfmark_saved_v1 left empty, tracker restored 6/8, light emulation reset.
Report → /home/ubuntu/repos/shelfmark/test-report-iter90.md
