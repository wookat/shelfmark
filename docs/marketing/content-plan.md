# Content marketing plan — high-value guides + internal-link strategy

## Already-live content assets (link these from everything)

- /popular — Top 100 series (linkable "best of" asset)
- /lists — curated lists (trilogies, long-running epics, 2020s series, classics)
- /new — new & upcoming (+ per-genre RSS)
- /about — methodology (cite-able), open API docs
- /press — boilerplate + assets for anyone writing about us
- /year-in-books — shareable personal report (organic share loop)
- /saved share links — TBR-sharing loop (fragment-encoded)

## Next guide pages (article briefs, in priority order)

Each should be an SSR page under /guides/<slug>, data-driven where possible, with FAQ JSON-LD and internal links to series pages:

1. **Publication order vs. chronological order — which to read?** Uses Narnia/Star Wars examples; links to affected series pages. Target query: "publication order vs chronological".
2. **How to start Discworld (all entry points explained)** — the canonical hard case; links every sub-arc first book. Target: "where to start discworld".
3. **The longest book series ever (ranked, with data)** — straight from `book_count`; auto-updatable. Target: "longest book series".
4. **Best completed fantasy series to binge** — derived from genre+last_year<now-2; links /lists/trilogies etc.
5. **How to track your reading without Goodreads** — privacy angle, honest comparison table. Target: "goodreads alternative no account".

**Internal-link rules:** every guide links ≥5 series pages + one list page; every series page in a covered genre eventually links back to a relevant guide (footer of the series page or genre page). Guides go in sitemap + llms.txt.

## Cadence

One guide per iteration batch max (quality gate: must be genuinely more useful than the current #1 result for its target query, else don't publish).
