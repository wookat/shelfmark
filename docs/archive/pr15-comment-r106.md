## ✅ R106 book detail pages live QA — full flow verified; 3 findings found & fixed same-round

Tested against production https://shelfmark.zalize.com, deploy 79221be4; the 3 ❌ below are fixed in 6f568c1 / deploy 404b05c1 (re-verified).

**🟢 R106 book detail flow (all verified in browser):** series title click → /book/134080-mistborn-the-final-empire with h1, author link · 2006, "Book 1 of 8 in Mistborn", description, Full reading order (→ /series/mistborn) + Find a copy; Next/← chips walk siblings (Book 2 of 8 and back); wrong slug 301s to canonical; unknown id renders the styled 404; Book JSON-LD (`isPartOf` BookSeries + `position:1`) + BreadcrumbList; `/book/1000-v2` (no description) serves `noindex,follow`; sitemap index has 11 chunks with /book/ URLs in the new chunks; bookshop attrs (`nofollow noopener`, `_blank`) verified in served HTML. **Checkbox regression passed:** ticking toggles 7/8→6/8 with no navigation.

| 🟢 Book page via title click | 🟢 Cover-bearing book (Mort) |
|---|---|
| ![book](/home/ubuntu/screenshots/ss_2c0b8c71.png) | ![mort](/home/ubuntu/screenshots/ss_65f2a147.png) |

**❌→✅ 360px residual overflow (363px) + 380px breakpoint jump (402px):** Genres/New nav breakpoints moved to ≥400/460px and hero search input got `min-w-0`. Post-fix sweep at 320/360/375/380/400/414/420/460/500/640px across /, /pricing, /series/mistborn, /book/… : clean everywhere except the known 320px home case (P3).

**❌→✅ Axe `link-in-text-block` (serious, light+dark)** on the book page's inline author/series links → persistent underline; re-run: 0 violations light and dark.

**❌→✅ Ordinal mismatch on year-resorted series:** book route now applies the same duplicate-position year re-sort as the visible list — /book/181101-mort says "Book 2 of 55 in Discworld", matching the rendered numbering.
