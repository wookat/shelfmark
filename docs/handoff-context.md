# Shelfmark — Handoff Context

Last updated: 2026-08-06 (Round 63)

## What this is
Shelfmark answers "In what order should I read this series?" and provides a no-signup, localStorage-only reading tracker. pSEO engine product for the Zalize line (#6).

## URLs & infra
- Production: https://shelfmark.zalize.com (Cloudflare Worker `shelfmark`, account `ddff52d24ee44e21a021c15eaffcc86d`)
- Worker direct: https://shelfmark.wookat520.workers.dev
- Repo: https://github.com/wookat/shelfmark
- D1 database `shelfmark` (id `199bce20-bde4-4875-b8e1-fbc339b020b5`); KV namespace binding `CACHE` (rate limiting)
- Deploy: `CLOUDFLARE_API_TOKEN=$CLOUDFLARE_WORKERS_API_TOKEN npx wrangler deploy` (token provisioned as a Devin secret; remote Wrangler D1 commands are NOT authorized — use the D1 REST API instead)
- Domain DNS: `shelfmark.zalize.com` routed via Cloudflare custom domain on the worker

## Stack
Cloudflare Workers + Hono (SSR string templates in `src/index.ts`, layout in `src/html.ts`), TypeScript strict, Tailwind CSS v4 (`npm run css` regenerates `public/styles.css` — run after class changes), client tracker in `public/app.js` (localStorage only). `npm run typecheck` before deploy.

## Data
- Catalog: ~22,839 authors / ~185,730 books / ~2,590 series with books. Sources: Wikidata (series/ordinals/genres P136/descriptions/ISBNs), Open Library (covers).
- Seed pipeline: `scripts/fetch_*.py` → `data/*.jsonl` → `scripts/build_seed.py` → `data/seed.sql` → D1. Book/series IDs are stable across re-imports (`id_migrations` table maps legacy ids; client migrates localStorage once).
- Genre governance: only verifiable Wikidata P136 majorities are written (see `scripts/backfill_genres_books.py`, `scripts/normalize_genres.py`); ~1,145 series intentionally remain NULL.
- Covers: ISBN-based from Wikidata + OL search matches (`scripts/fetch_ol_covers.py`). Core-series coverage ~41%; OL search API is heavily throttled — backfill runs as a long background job.

## Analytics
First-party, cookie-less: D1 table `hits(day, path, count)` via `/api/hit` beacon (no IPs). No `search_terms`/`page_views` tables. Traffic so far is mostly self-testing; no organic signal yet.

## Known gaps / blocked items
- Email new-release alerts: blocked on Resend (or other provider) API key; double opt-in flow exists but no sending. Do NOT send email without completed double opt-in.
- No chronological/narrative order variants (Wikidata lacks the data — do not fabricate).
- Little/no >2026 release data, so "Upcoming" badges rarely trigger.
- No real payments (boss rule: free mode until instructed).

## Process
- 100-round iteration loop in progress; log every round in `docs/iteration-log.md`; SOP-04 batch report to the boss every 5 rounds.
- Quality gates: QA regression + live UX walkthrough + axe (0-violation baseline) + security audit (`docs/compliance-security-audit.md`).
- Testing procedure and gotchas: `.agents/skills/testing-shelfmark/SKILL.md`.
- PRs: builtin git tools, QA evidence as PR comments; production deploys from the working branch (boss merges PRs).
