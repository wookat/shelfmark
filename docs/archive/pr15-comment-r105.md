## ✅ Rounds 101–105 live QA — /pricing, Beta badge, copy, series enhancements verified; mobile header overflow found & fixed

Tested against production https://shelfmark.zalize.com, deploy 5bd481b2 (recorded in Devin session). The one ❌ (mobile header overflow) is fixed in 0f96092 / deploy 736b827e — see bottom.

**🟢 R101 /pricing:** Reader $0 + Shelfmark Plus $2.99/mo with "Free during beta" badge and "$24/year — planned" note; "Start free beta trial" CTA clicks through to /shelf; 3-item FAQ; breadcrumb + BreadcrumbList JSON-LD; in sitemaps/1.xml.

| 🟢 /pricing light | 🟢 /pricing dark (0 axe violations both) |
|---|---|
| ![Pricing light](/home/ubuntu/screenshots/ss_95b32dfc.png) | ![Pricing dark](/home/ubuntu/screenshots/ss_6460b932.png) |

**🟢 R102 header:** amber Beta pill next to logo clicks through to /pricing; `.beta-badge` served in styles.css with white-on-amber hover (legible in dark mode too); Pricing nav link correctly hidden below `sm`; footer Explore has Pricing.

**🟢 R103 copy:** "free tracker" gone site-wide; home title now "…No-Signup Reading Tracker"; /series /popular /genres descriptions, OpenSearch, and llms.txt (now lists /pricing) all updated.

**🟢 R104 series pages:** /series/mistborn shows the "Where to start" card ("Start with "Mistborn: The Final Empire" (2006)" + publication-order text; Discworld variant renders its cover thumbnail), 4-level breadcrumb incl. Brandon Sanderson (visible + JSON-LD), and a Find-a-copy link per row with `rel="nofollow noopener" target="_blank"` + `print:hidden` (attrs verified in served HTML on both origins; live click-through blocked by bookshop.org's Cloudflare for datacenter IPs). Author pages carry 59 links incl. standalones.

![Series page](/home/ubuntu/screenshots/ss_f1619837.png)

**❌→✅ Mobile header (375px):** primary nav overflowed — `scrollWidth` 500 vs 375. Root causes: `.beta-badge`'s custom `display` overrode Tailwind's `hidden` utility (badge visible on mobile), homepage New&upcoming grid items lacked `min-w-0`, and the base nav pre-dated R101 overflow. Fixed in 0f96092: badge now `hidden sm:inline-block`, Genres/New shown only ≥360/380px, tighter mobile nav gaps + logo size, grid `min-w-0`. Playwright probe post-fix: no horizontal overflow at 360/375/420/500/640/768px on /, /pricing, /series/mistborn (320px retains a small pre-existing overflow, logged P3).

| 🔴 Before @375px | 🟢 Plus card stacks fine |
|---|---|
| ![Mobile header](/tmp/mobile_pricing.png) | ![Mobile card](/tmp/mobile_cards_crop.png) |

<details><summary>Regression (all green)</summary>

Tracker tick 7/8 (88%) → untick 6/8 (75%); save-for-later ☆→★→☆ with key restored to `{}`; axe 0 violations on /pricing light+dark; security headers unchanged; main profile left canonical (Mistborn 6/8, saved `{}`, no goal key).
</details>
