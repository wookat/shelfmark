# Shelfmark Rounds 101–105 — /pricing, Beta badge, copy repositioning, Where-to-start + Find-a-copy (deploy 5bd481b2, PR #15)

Shell pre-check facts (workers.dev + cache-bust): /pricing has Reader + Shelfmark Plus h2s, $2.99 ×3, "$24/year — planned pricing, not charged during beta", "Free during beta", "Start free beta trial" (href=/shelf), "Pricing FAQ" h2 + 3 h3s (pay today / data locked / beta end), BreadcrumbList JSON-LD (2 ListItems); sitemaps/1.xml has /pricing. Header: `.beta-badge` link → /pricing (title "Free while in beta — see planned pricing"), nav "Pricing" with `hidden sm:inline`, footer Pricing link. styles.css: `.beta-badge` amber border/text + `:hover{background:amber;color:#fff}`. Home title "…No-Signup Reading Tracker"; "free tracker" 0 hits; opensearch "no-signup tracker"; llms.txt lists /pricing. /series/mistborn: "Where to start" aside (border-l-4 amber, "Start with "Mistborn: The Final Empire" (2006)", publication-order text); breadcrumb 4-level visible + JSON-LD [Home, Series, Brandon Sanderson, Mistborn]; 8 "Find a copy" links → bookshop.org/search, rel="nofollow noopener" target=_blank class print:hidden; author page has 59 bookshop links.

## Recorded browser pass (main profile, non-destructive; hard reload for styles.css)

1. /pricing via header Beta pill: hard-reload homepage; header shows amber "Beta" pill next to logo + "Pricing" nav link; click Beta pill → lands on /pricing. Fail: no pill, or link elsewhere.
2. /pricing renders: Reader card "$0", Shelfmark Plus card "$2.99/mo" with "Free during beta" badge and "or $24/year — planned…" note; Pricing FAQ with the 3 questions; visible breadcrumb Home / Pricing. Fail: missing card/badge/FAQ.
3. CTA: click "Start free beta trial" → navigates to /shelf. Fail: dead link or other target.
4. Series page: /series/mistborn (hard reload) shows "Where to start" card with "Start with "Mistborn: The Final Empire" (2006)" + publication-order text; visible breadcrumb Home / Series / Brandon Sanderson / Mistborn; each book row has "Find a copy" link; hover shows bookshop.org/search URL. Click one → new tab to bookshop.org search for that title. Fail: card/breadcrumb/link missing.
5. Regression tracker: same page baseline 6/8 (75%) with Where-to-start card present; tick The Lost Metal → 7/8 (88%); untick → 6/8 (75%).
6. Regression save-for-later (main profile, restore after): ☆ Save for later → ★ Saved for later (aria-pressed=true); click again to unsave → ☆; verify shelfmark_saved_v1 back to {}.
7. Dark mode (DevTools emulate prefers-color-scheme: dark): homepage header beta badge legible amber-on-dark; /pricing renders dark cards distinct from bg. Screenshot both.

## Shell checks

8. Axe (Playwright bypass_csp, 4.10.2): /pricing light + dark → 0 violations. Also / light+dark (badge markup). Save /tmp/axe_results_r105.json.
9. Mobile (Playwright 375×812): /pricing cards stack single-column, header Beta pill visible, nav "Pricing" link hidden (`hidden sm:inline`); screenshot. Fail: horizontal overflow or Pricing visible <sm.
10. Regression security headers on / unchanged (workers.dev + cb).
11. Copy: home title exact "Shelfmark — Book Series in Order + No-Signup Reading Tracker"; "free tracker" absent on / /series /popular /genres; llms.txt + opensearch updated (captured).

Cleanup: main profile canonical (Mistborn 6/8, saved {}, no goal key). No destructive actions planned.
Report → /home/ubuntu/repos/shelfmark/test-report-iter105.md
