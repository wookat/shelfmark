# Competitor Teardown — Multi-Competitor Deep Dive (2026-08)

Scope: expanded from the original 3 head-to-head competitors to 10+ products in the
book-series / reading-order / reading-tracker space. Method: real page visits,
screenshots (research/comp/*.png), raw source capture (research/comp/*.html),
and technical reverse-engineering of publicly observable behavior (HTML structure,
structured data, caching, rendering stack). Red lines respected: no anti-bot
bypassing — sites behind Cloudflare Turnstile are marked as blocked and analyzed
only from previously documented secondary sources.

## Access matrix

| Competitor | Access | Stack (observed) |
|---|---|---|
| bookseriesinorder.com (BSIO) | ✅ full source | WordPress (wp-content), server-rendered, JSON-LD |
| orderofbooks.com | ✅ full source | WordPress + partial Next.js assets, newsletter-centric |
| readingorderlist.com | ✅ full source | Next.js/React SSG, JSON-LD |
| booksinorder.io | ✅ full source | Next.js/React, heavy JSON-LD (BookSeries + ItemList + Breadcrumb), Tailwind-style utility classes |
| bookseries.org | ✅ full source | huge server-rendered index pages (7 MB home!), author interviews |
| goodreads.com | ✅ full source | React SSR hybrid; shelving UI everywhere (1,056 "shelf" refs on a series page) |
| thestorygraph.com | ⛔ Turnstile | (secondary sources only) |
| hardcover.app | ⛔ Turnstile | (secondary sources only) |
| fictiondb.com | ⛔ Turnstile | — |
| librarything.com | ⛔ Turnstile | — |
| fantasticfiction.com | ⛔ human verification | — |

## Per-competitor findings

### booksinorder.io — the modern benchmark
The closest modern competitor. Key patterns worth adopting:
- **"Quick Order Summary / Start with X" hero box** on every series page: instantly
  answers the core query ("start with The Colour of Magic and continue in
  publication order… tracks 41 books") before the full list. Great for
  featured-snippet SEO and instant user value.
- **Per-book "Buy" outbound links** (41 on Discworld page) — monetization surface.
- **Book detail pages** (`/book/the-colour-of-magic`) — an entire extra pSEO layer;
  each book in the ItemList links to its own page with ISBN data.
- **4-level breadcrumb JSON-LD**: Home / Series / Author / Series-name (ours is 2-level
  on series pages — no author level).
- **"Helpful paths" and "More Comic Fantasy Series"** cross-linking modules.
- **FAQ sections** (we have these), "perfect for Audible" angle-copy.
- Rendering: Next.js prerendered; BookSeries + ItemList + BreadcrumbList JSON-LD —
  same trio we emit, plus per-book `Book` nodes with ISBN.

### bookseriesinorder.com (BSIO) — traffic leader, dated UX
- Multiple per-character/sub-series "Publication Order of X Books" tables per author
  page — deep intra-page segmentation.
- Both **Publication Order and Chronological Order** tables where they differ
  (e.g. Rogue Lawyer) — we can only do this where source data provides it.
- 149 Amazon links per page (heavy affiliate monetization), print list feature
  (we have print).
- WordPress, table-based layout, no tracking features at all.

### orderofbooks.com — community/newsletter engine
- **Monthly newsletter + "Reader Mailbag"** blog posts (24 newsletter references on
  home) — retention via email/community, exactly the surface our double-opt-in
  intent capture was built for (still gated on Resend key).
- "Order of {recent author} Books" fresh-content stream on the homepage —
  freshness signal for crawlers.

### readingorderlist.com
- Clean genre browse + "Reading Order Guides" + blog; static Next.js. Popular
  Authors module on home. Nothing we lack.

### bookseries.org
- 7 MB homepage listing enormous A–Z author/series indexes on one page (bad CWV —
  anti-pattern), but **author interviews** are a unique content moat.

### goodreads.com (series pages)
- Every book row has cover, avg rating, ratings count, blurb, and a
  **"Want to Read" shelving button** — shelving is the core interaction loop.
- "X primary works • Y total works" summary line at top of series page.
- Our no-signup tracker remains the differentiator; Goodreads requires an account.

### StoryGraph / Hardcover (secondary, unchanged from earlier rounds)
- Stats/pace charts (we shipped R92), mood/pace tags, buddy reads, yearly goals
  (we shipped R73). Both are account-based apps, not SEO plays.

## Synthesis — integration backlog (P0/P1/P2)

**P0 (boss directive)**
1. Pricing repositioning: stop presenting the product as "free". New `/pricing`
   page with real paid tiers; all features currently unlocked as **Beta free
   trial** (no actual payment collection). Update all "free / no-signup" copy,
   CTAs, footer, about, FAQ, JSON-LD `offers` where present.

**P1 (adopt from competitors)**
2. Series-page "Where to start" quick-summary box (booksinorder.io) — pure
   catalog-data derivation, no fabrication.
3. 3-level breadcrumbs on series pages incl. author level (booksinorder.io).
4. Per-book "Find a copy" outbound links (Bookshop.org + Amazon **search** URLs —
   honest search links, no affiliate codes yet).
5. Series-page "at a glance" stat chips (book count, year span, genre, author) —
   mirrors Goodreads' "primary works" summary.

**P2**
6. Book detail pages (`/book/{slug}`) — massive pSEO layer; needs quality gate
   (only books with blurb+year+cover) to avoid thin pages.
7. Newsletter/mailbag-style content stream (blocked on Resend key for send; the
   capture side already exists).
8. Chronological-order variants — still no reliable source data; do not fabricate.

## Tech-stack assessment (task 3)

Current: Cloudflare Workers + Hono 4 + D1 + KV + Tailwind v4 + vanilla JS client.
- Versus competitors: BSIO/OrderOfBooks are WordPress (slower, dated); the modern
  ones are Next.js prerendered. Our edge-SSR Worker already beats both on TTFB
  (no origin hop, no React hydration payload) and we ship ~0 JS framework bytes.
- Next.js/Astro on Cloudflare Pages would add build complexity and hydration
  weight without user-visible benefit for content pages; not adopted.
- Tailwind v4 is current-latest; Hono is the de-facto standard Workers framework;
  D1/KV are the platform-native choices. **Verdict: stack is appropriate and
  modern — keep, maintain via dependency bumps (wrangler kept current).**

Evidence: raw captures in `research/comp/` (HTML + PNG per site).

## R147 复访（2026-08）：booksinorder.io 新动向
新增面：/books-like（readalikes pSEO）、/box-sets、/compare、/gift-guides、/methodology、/studies、/videos。BSIO 无结构变化（/recommendations、/book-clubs 既有）。
采纳：readalikes 层 → 我方 /similar/{slug}「Series like X」页（同流派目录推导，ItemList JSON-LD，<6 结果 noindex，834 页入 sitemap+IndexNow）。
不采纳：/box-sets、/gift-guides（联盟商品数据我方无合规来源）；/videos（无视频资产）；/compare、/studies 列中期候选；/methodology 我方 /about 已覆盖数据来源披露。

## R150 deep revisit + new competitor scan (2026-08)
New competitors scanned (public pages only):
- rightreadingorder.com — editorial layer: per-series "recommended order + why" and "best starting point"; small hand-curated catalog (~50 series). Adopted (data-derived, no fabricated editorial): visible "Start here" chip on the first book of every multi-book series list — matches our existing FAQ answer and gives new readers an instant entry point.
- bookseriesorder.com / orderedbooks.com — both offer "browse by character" (books a character appears in, in order). Declined for now: no compliant character-appearance data source at our scale (Wikidata character coverage is sparse); listed as mid-term candidate if a defensible dataset emerges.
- bookbinge.app / storyjog.com / boundapp.co.uk — series-tracker apps (iOS/paid). Validate our free no-signup tracker positioning; BookBinge's "no account required" messaging mirrors ours. No page patterns worth adopting beyond what we have (streaks/AI recaps out of scope — no compliant recap source, and streak mechanics conflict with our quiet-paper brand).
Benchmark revisit: booksinorder.io unchanged since R147 (readalikes layer already matched by /similar). BSIO unchanged.

## R160 deep revisit (2026-08-05)
Fetched fresh homepages: bookseriesinorder.com (nav now: authors/characters/book-clubs/book-release-calendar/recommendations), booksinorder.io (nav grew since R150: + /compare, /box-sets, /gift-guides, /methodology, /studies, /videos, /books-like), bookseriesorder.com (unchanged minimal: authors/characters/search). rightreadingorder.com and orderedbooks.com timed out (no bypass attempted).

Adopted: **/studies data-study layer** (BIO pattern — original, verifiable catalog research as linkable pSEO assets). Shipped /studies index + two studies derived purely from our own D1 catalog: longest-series (top 50 by book_count) and series-length-by-genre (avg/max per genre, n>=10). Every number links to underlying reading-order pages; no fabricated data.

Declined with reasons: /methodology (already covered by /about#methodology), /compare & /gift-guides (editorial-heavy, no compliant data to answer "which first" beyond our existing Start here chip), /box-sets (affiliate commerce, out of scope), /videos (no video assets), /characters & /book-release-calendar (unchanged: no compliant character dataset; only year-granularity dates).
