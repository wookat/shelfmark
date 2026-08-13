# R173 pass 2: 57 more academic series deleted (worker f49c1e0e, data-only)

Against https://shelfmark.wookat520.workers.dev, cache-busted. Same styled-404 markers as pass 1 (`Page not found` + 4 onward pills).

## T1. Deleted vs kept
- /series/ascl-working-papers, /series/research-reports, /series/communications-in-computer-and-information-science → HTTP 404 styled ("Page not found" + 4 pills); screenshot one.
- /series/massey-lectures → HTTP 200, h1 contains "Massey Lectures" (kept).

## T2. No academic leakage in 404 suggestions + search fallback
- The 404 suggestion list ("Were you looking for one of these?") on /series/communications-in-computer-and-information-science must NOT contain: Communications in Computer…, Advances in Intelligent Systems…, Statistics and Computing, Synthesis lectures, Research reports, Lectures and research (Massey Lectures allowed — kept). Record actual list; screenshot.
- /search?q=lecture+notes, /search?q=research+report, /search?q=similarity+search → results contain none of: "Lecture Notes", "Research Report(s)", "working papers", "Synthesis lectures", "British Museum Research", "Council for British Archaeology", "Antiquaries", "Advances in Intelligent", "Communications in Computer", "Statistics and Computing", "proceedings", "monograph" (case-insensitive; Massey Lectures / "Lectures and research"-style survivors flagged if present). Record actual results.

## T3. Author recount
- /authors/barry-cunliffe: if 200 — page renders, stats line "N books across M series" where visible book rows sum to N (assert internal consistency, record values); zero pageerrors. If 404 styled (author dropped after monograph deletion) — record as acceptable, verify styled.

## T4. Sitemaps spot-grep
- Grep all /sitemaps/1..11.xml for 4 deleted slugs: ascl-working-papers, research-reports, communications-in-computer-and-information-science, british-museum-research-publications → 0 occurrences; massey-lectures still present somewhere.
