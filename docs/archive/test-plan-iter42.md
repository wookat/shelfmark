# Shelfmark Rounds 41–42 — author ItemList JSON-LD, search placeholder, /new genre chips (deploy d48426e6, PR #9)

Shell-verified setup facts (grounding, all live — no cache lag observed):
- /new chips: `All` chip + genre chips sorted by count with `<span class="text-ink-700/75">N</span>` badges (romance novel 6, science fiction 4, spokon 2 … Nordic noir 1); chip row has `aria-label="Filter by genre"`. Unselected chip = white/border; selected = `bg-ink-900 text-ink-50 border-ink-900`.
- Item counts: All = 31 `<li>`, ?genre=science%20fiction = 4, ?genre=nordic%20noir (lowercase → case-insensitive) = 1, ?genre=zzz = 31 with **no** noindex (fallback to All).
- noindex,follow present only on filtered views; All view has 0 noindex.
- /authors/brandon-sanderson JSON-LD: Person + BreadcrumbList + ItemList "Book series by Brandon Sanderson", numberOfItems 6, position 1 Mistborn → /series/mistborn (book_count order).
- Homepage placeholders: 2× "Search series, authors, books…" (header desktop + mobile) + hero "Try …" unchanged.
- RSS link on /new unchanged: `<a class="text-amber-accent underline whitespace-nowrap" href="/new.rss">RSS feed</a>`.

## Recorded browser pass

1. /new: chip row renders under intro — All (dark/selected) + genre chips with count badges, sorted desc (romance novel 6 first, science fiction 4). Fail: chips missing, no counts, All not selected by default.
2. Click "science fiction" chip → URL /new?genre=science%20fiction, exactly **4** items, sf chip now dark (bg-ink-900), All chip white; DOM check `meta[name=robots]` = "noindex,follow". Fail: item count ≠ 4, chip not highlighted, missing noindex.
3. Click "All" chip → back to /new, **31** items, no robots-noindex meta. Fail otherwise.
4. Click "Nordic noir" chip (mixed-case genre) → 1 item; also navigate directly to /new?genre=nordic%20noir (lowercase) → same 1 item (case-insensitive). Fail: 0 items or error on lowercase.
5. Navigate to /new?genre=zzz → full 31-item All view rendered, All chip selected, no noindex. Fail: empty list, error page, or noindex present.
6. R41 placeholder: header search input on a desktop page visibly shows "Search series, authors, books…" (screenshot); mobile width (~508px) search box shows the same. Fail: old "Search a series or author…" text.
7. R41 JSON-LD (shell): /authors/brandon-sanderson ItemList — name "Book series by Brandon Sanderson", numberOfItems 6, 6 elements, position 1 = Mistborn with series URL. Fail: missing ItemList or wrong count/order.
8. Mobile spot-check (~508px): /new chip row wraps, no horizontal overflow (scrollWidth ≤ innerWidth), chips readable (screenshot).
9. Regression: click "RSS feed" link on /new → lands on /new.rss feed content.
10. Axe (shell, Playwright + bypass_csp, axe-core 4.10.2) on /new and /new?genre=science%20fiction: expect 0 violations each (chip contrast!). Save /tmp/axe_results_r42.json.

Report → /home/ubuntu/repos/shelfmark/test-report-iter42.md
