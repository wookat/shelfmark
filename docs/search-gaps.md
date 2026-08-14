# Zero-result search terms as pSEO topic input

Generated 2026-08-09 (UTC) from the production `searches` table (30-day window,
42 zero-result searches / 163 total, 30 distinct terms). Rerun with:

```sql
SELECT term, SUM(count) AS n, MAX(day) AS last
FROM searches WHERE results = 0
GROUP BY term ORDER BY n DESC;
```

## Classification of all 30 distinct zero-result terms

| Class | Terms | Action |
|---|---|---|
| QA probes: length/overflow strings (`x…`×50–100, `a…`×48–69), fuzz (`zzzqqq`, `zzxqy wvupt kkjhg`, `zzzznomatch`, `trisolaris zzzqqq`), injection (`' or 1=1--`), emoji (`📚`), cache-busted curation checks (`yearbook?cb=…`, `handbook?cb=…`, `encyclopedia?cb=…`) | 26 of 30 | None — QA noise. Collection-side QA exclusion now prevents these from being recorded at all. |
| Curation-audit vocabulary (`publications`, `proceedings`, `seminars`, `outline`, `bulletin`) | 5 terms | Correctly zero-result: these academic imprints were deliberately removed from the catalog (R173–177). Not a gap. |
| CJK title (`三体`) | 1 term | Known limitation: catalog is English-language (Wikidata English labels). The Three-Body series is findable in English ("three body problem" matches since R167). Non-Latin title aliases would need a new data ingestion layer — deferred, logged as a topic candidate if CJK queries recur organically. |
| Resolved by prior fixes (`"mistborn"`) | 1 term | Quote normalization shipped in R149; this query now returns results. |

## Conclusion

No actionable pSEO topics derivable yet: every legitimate-looking zero-result
term is either already fixed, deliberately absent, or blocked on non-English
aliases. The pipeline (query above + this classification format) is the
standing process; it becomes useful once organic search volume arrives
(pending GSC/Bing Webmaster registration). QA traffic is now excluded at
collection time (headless/`DevinQA` UAs and `shelfmark_qa=1` sessions), so
future windows will reflect real users only.
