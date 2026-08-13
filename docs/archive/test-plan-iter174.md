# R174: recorded desktop discovery walkthrough + polish audit (worker f49c1e0e)

Fresh-eyes new-user UX round; deliverable = P0–P3 findings + recording + report file. Against https://shelfmark.wookat520.workers.dev, fresh browser profile, 1440x900 light. Recording annotated per journey stage. Fixtures verified: genre slug is mystery-fiction (note: /genres/mystery 404s — candidate finding), series /series/agatha-raisin (mid-popularity, M. C. Beaton), list /lists/long-running-mystery-series.

## J1. Journey (recorded, all UI clicks, maximized browser)
1. Home: hero copy, genre chips, popular cards — judge copy/spacing/alignment.
2. Header "Genres" → /genres: chip grid readability, ordering, label quality (raw-looking slugs/labels are findings).
3. Click "Mystery Fiction" chip → /genres/mystery-fiction: card grid, cover placeholders ratio, pagination/footer CTA, copy.
4. Click Agatha Raisin card → series page: byline/pills coherence, Where-to-start box, coach mark, list quality (missing years? dirty titles? per-book stub grammar).
5. Tick books 1+2: coach status text, Up next badge (should point at book 3), progress label "2 of N read".
6. Click book 1 title → /book detail: byline, sibling strip, author card, Readers-also-enjoyed; judge redundancy/polish.
7. Back to series → "See all series like…" (or /similar/agatha-raisin direct if no link): card quality, onward pills.
8. Header → /lists: index card copy/consistency.
9. Click "Long-running mystery series": list rows sane (counts, year spans, no dirty titles).
10. Footer "Data studies" → /studies/longest-gaps: sanity view as a visitor.
11. Header "My Shelf": stats reflect 2 read / 1 series (Agatha Raisin), goal CTA, saved section empty-state copy.

## J2. 1024px spot-check (fresh viewport, non-recorded probes OK for measurement, screenshots)
- Home, genre page, series page, shelf at 1024x768: scrollingElement.scrollWidth == 1024, no cramped/overlapping header or pill rows (pixel review).

## Judging bar / assertion style
- Every page: no NaN/undefined/null, no raw slugs in visible copy, no dead-end pages without onward links, consistent capitalization, no clipped text; console pageerrors == 0.
- Log every nit with severity P0(broken)/P1(user-blocking confusion)/P2(clear polish gap)/P3(nit), each with a screenshot path.
- Deliverables: recording; screenshots /tmp/r174/*.png; report file /tmp/r174/report.md (screenshots uploaded + embedded as URLs).
