# Benchmark Round 2 — 2026-08-05

Round 1 gaps addressed this round. Reference competitors: BookSeriesInOrder (BSIO), ReadingOrderList, BooksInOrder.io.

## Changes shipped in Round 2

| Round-1 gap | Status | Evidence |
|---|---|---|
| Data coverage (1.7K authors vs BSIO ~10K+ author pages) | **Fixed** — 22,839 authors / 185,730 books / 2,680 series now live | Wikidata literary-work pipeline (`scripts/fetch_by_author.py`, batched VALUES queries over 37,628 authors with ≥2 works); D1 counts verified post-import |
| No standalone (non-series) books on author pages | **Fixed** — "Standalone books" section with tracker | `/authors/:slug` now renders standalone works; progress key `standalone-<author-slug>` |
| No cover images | **Partially fixed** — 5,626 books have Open Library covers (ISBN-matched via Wikidata P212/P957) | `cover_url` column + lazy-loaded 38×57 thumbs with `onerror` removal; coverage ~3%, backlog: OL search-API matching in Round 3 |
| No genre navigation (BSIO has category pages) | **Fixed** — `/genres` + `/genres/:slug` (1,372 series genre-tagged via Wikidata P136, 60+ genre pages in sitemap) | e.g. `/genres/fantasy` → 200 fantasy series |
| Single opt-in email capture | **Flow implemented** — `token` + `confirmed` columns, `/confirm?t=` endpoint | Actual confirmation email requires an email provider (Resend/Brevo API key) — escalated to boss; until then no emails are sent, so risk is nil |

## Parity check vs competitors (evidence-based)

- **Author page count**: BSIO ~10K+ authors; Shelfmark now 22,839 author pages — at/above parity on breadth (depth of per-book metadata still lower: no synopses).
- **Genre browsing**: BSIO has genre indexes; Shelfmark now has 60+ genre pages — parity.
- **Covers**: BSIO shows covers on most listings; Shelfmark ~3% — still behind (P1 for Round 3).
- **Tracker**: no competitor has a no-signup tracker — Shelfmark still uniquely ahead.
- **Sub-series hierarchy** (e.g. Wax & Wayne inside Mistborn): still flat — carried to Round 3 (P2).

## Round 3 priorities
1. Cover coverage: Open Library search-API batch matching (title+author) for top series/authors (P1).
2. Sub-series hierarchy via Wikidata P527/P361 (P2).
3. Book synopses / author bios from Wikipedia extracts (P2).
4. Email provider decision + double opt-in send (blocked on boss for provider/API key).
