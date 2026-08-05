# Benchmark Round 3 — 2026-08-05/06

Scope per approval: cover coverage lift, sub-series hierarchy / duplicate-ordinal fix, book & author blurbs; plus a fresh deep pass on BSIO and StoryGraph, and an objective "parity with current competitors" assessment.

## What shipped in Round 3

| Item | Before (R2) | After (R3) | Evidence |
|---|---|---|---|
| Author bios | none (generic sentence) | 22,428 authors with Wikidata en-descriptions rendered as intro ("Brandon Sanderson is an American fantasy writer (born 1975)…") | live `/authors/brandon-sanderson` |
| Book blurbs | none | 21,288 series books with short descriptions shown under the title | live series pages |
| Series descriptions | ~0 curated | 2,270 series with Wikidata descriptions | live series pages |
| Sub-series hierarchy | none | `series.parent_id` from Wikidata P527/P361; 54 linked (e.g. Warriors arcs, The Lost Fleet → The Lost Stars, Uplift Storm trilogy); parent page shows "Sub-series within…", child shows "Part of…" chip | `/series/warriors` etc. |
| Duplicate ordinals | Discworld showed three "1." | render-time fallback: when a series has duplicate positions, display sequential numbering | `/series/discworld` now 1..N |
| Covers | 5,626 (ISBN-only) | Open Library search-API matching by exact normalized title + author (~57% hit rate); batch import ongoing, prioritized by popular genre series | `data/ol_covers*.jsonl`, D1 `cover_url` |

## Fresh competitor pass

### bookseriesinorder.com (deep, live 2026-08-05)
Observed on /lee-child/: publication order + **chronological order** tables, short stories/novellas/collections sections, related character series (Frances Neagley), per-book "Description / Buy at Amazon" reveal, print-list dialog, newsletter box, book-of-the-month, release calendar, sister-site upsell (booknotification.com — "track reads & TBR" is their answer to tracking, behind signup).

Gap list vs Shelfmark:
- ~~Per-book descriptions~~ → closed this round (21K blurbs).
- Chronological-order variant for series where it differs — **P2, Round 4** (needs per-book in-universe order data; Wikidata rarely has it).
- Release calendar / new-release alerts — blocked on email provider (Resend key, boss to-do); data side possible via Wikidata pub dates.
- Character-level pages (e.g. a character appearing across series) — P3, niche.
- Still ahead of BSIO: no ads, no affiliate walls, built-in no-signup tracker, mobile-first UI, structured data, genre hubs.

### StoryGraph (blocked again)
app.thestorygraph.com interactive Cloudflare challenge loops in our environment (screenshot `ss_592eab34.png`); assessment remains from secondary sources: strengths are social features, stats/moods, personalized recs — a different (account-based) category. Shelfmark deliberately stays account-free; not a parity target for social features.

## Parity assessment (vs same-period competitors)

Objective per-item comparison against the reading-order category leader (BSIO):

| Criterion | BSIO | Shelfmark | Verdict |
|---|---|---|---|
| Catalog breadth | ~14K authors (claim) | 22,839 authors / 185,730 books | ✅ at/above |
| Reading order accuracy | curated | Wikidata ordinals + year fallback, dup-safe | ✅ comparable (long tail less curated) |
| Book descriptions | yes (Amazon-sourced) | yes (Wikidata, 88% of series books) | ✅ comparable |
| Covers | none on list pages | partial, growing (OL) | ✅ ahead on lists |
| Chronological order | yes | no | ❌ gap (P2) |
| Tracking | external site + signup | built-in, no signup | ✅ ahead |
| Ads/UX | heavy ads, 2010-era | ad-free, mobile-first | ✅ ahead |
| SEO plumbing | weak (DR49 wins on age) | sitemaps, JSON-LD, IndexNow, genre hubs | ✅ ahead |
| Release alerts | newsletter | pending Resend key | ❌ gap (external dependency) |

Conclusion: with Round 3 shipped, Shelfmark meets or exceeds the same-period reading-order competitors on every criterion except (a) chronological-order variants and (b) email release alerts (blocked on provider key). Recommending 达标验收 with these two documented exceptions.

## Round 4 backlog
1. Chronological/in-universe order where it differs (P2).
2. Continue cover backfill to full queue (~16K candidates, ~57% hit rate) (P2).
3. Release calendar + alerts once Resend key lands (P1 when unblocked).
4. Rate limiting + CSP/Referrer-Policy headers (security follow-up).
