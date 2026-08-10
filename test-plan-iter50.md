# Shelfmark Rounds 46–50 — series newest-book banner, shelf/search empty states, about follow section (deploy 5b4bb009, PR #9)

Shell-verified setup facts (live):
- /series/the-murderbot-diaries: `.year-chip !ml-0` pill "New in 2026" + text «"Platform Decay" is the newest The Murderbot Diaries book — it's in the list below.»; /series/discworld: 0 banner matches.
- /search?q=zzzzqqqq: "Popular series" heading present + /genres link; /search?q=discworld: 0 "Popular series".
- /about: "Ways to follow new releases" section with new.rss, opensearch.xml (×2), Add to Home Screen.
- R47 /shelf empty state is client-rendered from localStorage — use an incognito window (clean localStorage) so the main profile's seeded tracker state stays intact.
- R50: no code change; user states health check + IndexNow already shell-verified — include as reported, nothing to run.

## Recorded browser pass

1. R46: /series/the-murderbot-diaries — banner under H1: pill "New in 2026" + «"Platform Decay" is the newest The Murderbot Diaries book — it's in the list below». Scroll list: Platform Decay is row 8 (claim true). Fail: banner missing, wrong chip text, or Platform Decay absent from list.
2. R46 negative: /series/discworld — no banner between H1 and the pill row/list (latest book 2015). Fail: any newest-book banner present.
3. R46 mobile (~508px): murderbot banner wraps, no horizontal overflow (scrollWidth ≤ innerWidth), chip+text readable. Fail: overflow or clipped text.
4. R47 (incognito window, clean localStorage): /shelf shows empty state with "Popular starts:" line + 4 links (Discworld, Mistborn, The Murderbot Diaries, New releases) under Browse series button. Click "The Murderbot Diaries" → lands on /series/the-murderbot-diaries. Fail: line/links missing or wrong target.
5. R47 regression (still incognito): tick book 1 on the series page, open /shelf → normal non-empty state (stats cards, series section, Up next), no Popular starts line. Close incognito (state discarded; main profile untouched). Fail: empty-state UI leaking into non-empty shelf or broken shelf render.
6. R48: /search?q=zzzzqqqq — zero-result message + genres link + "Popular series" section with exactly 6 series cards. Fail: block missing or wrong count.
7. R48 negative: /search?q=discworld — normal results (Discworld first), NO "Popular series" block. Fail: block present.
8. R49: /about — "Ways to follow new releases" section with 4 bullets; click RSS link → /new.rss renders feed XML; open /opensearch.xml → valid XML 200. Fail: section missing or a link 404s.

## Shell checks

9. Axe (Playwright + bypass_csp, axe-core 4.10.2): /series/the-murderbot-diaries, /shelf (empty state — fresh context, no localStorage), /search?q=zzzzqqqq, /about → 0 violations each. Save /tmp/axe_results_r50.json.

Report → /home/ubuntu/repos/shelfmark/test-report-iter50.md
