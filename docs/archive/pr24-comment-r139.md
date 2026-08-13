## ✅ R139 acceptance fixes — live QA green over two rounds (final worker 9d213355)

Tested on production https://shelfmark.zalize.com in fresh incognito contexts, cache-busted (recorded in Devin session).

**🟢 P1 /shelf callout:** amber "Your shelf lives on this device." box renders under the intro; "export a backup" anchors to the `#backup` Export/Import/Clear row. **🟢 P2-1 Jump nav:** renders on brandon-sanderson & terry-pratchett (all anchors resolve incl. #standalone, links measure exactly 44px), absent on suzanne-collins (3 sections — correct <4 guard).

| 🟢 Callout with #backup link | 🟢 Jump to nav (Sanderson) |
|---|---|
| ![callout](/home/ubuntu/screenshots/ss_zoom_fe074012.png) | ![jump nav](/home/ubuntu/screenshots/ss_28e8cd48.png) |

**🟢 P2-2 Up next:** tick book 1 → badge on book 2 with visible amber pulse; badge tracks first-unread through further ticks/unticks; mark-all and clear both remove it; badge shows on load from existing progress **without** animation; reduced-motion keeps the badge with computed `animation-name: none`; single-checkbox book pages never show it.

| 🟢 Badge + pulse after tick | 🟢 Badge closeup |
|---|---|
| ![pulse](/home/ubuntu/screenshots/ss_804537cd.png) | ![badge](/home/ubuntu/screenshots/ss_zoom_71e80418.png) |

**🟢 Round-2 nit fixes verified:** `[id]{scroll-margin-top:72px}` — anchor jumps now land headings at 72px, clear of the 57px sticky header (author jump nav + /shelf #backup both confirmed); pulse start color softened to amber 10% — dark-mode axe **0 violations at 300ms and 600ms mid-pulse** (previously 4.47:1 transient), pulse still clearly perceptible (row samples amber tint vs steady white).

**🟢 Baselines:** axe 4.10.2 **0 violations** steady-state light+dark on /shelf, author, series (badge present); no 375px overflow on any of the three; tick→/shelf sync and coach mark unaffected.
