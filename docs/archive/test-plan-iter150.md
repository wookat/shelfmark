# R150: "Start here" chip regression (production worker b93b5427)

Setup facts: deployed /styles.css has `.start-chip` light `#2f5d2a`/`#e7efe2`, dark `#a8cf9e`/`#263822`, print-hidden alongside `.year-chip`. Server markup: 1 chip on /series/mistborn, 0 on /series/marsupilami (1-book fixture), 7 on /authors/brandon-sanderson. No first-book year-chip combo found in 12 /new series → combo check skipped per brief. Test on workers.dev, cache-busted, fresh contexts. No recording; screenshots.

## 1. Series page placement (browser 1440 light)
- /series/mistborn: PASS = green "Start here" pill visible after book 1's title/year in the screenshot; books 2–8 have NO chip (count of .start-chip == 1, and its enclosing li is the first li). Computed style color rgb(47,93,42) bg rgb(231,239,226).

## 2. Author page
- /authors/brandon-sanderson: PASS = each multi-book series section's FIRST li has the chip (7 chips; verify chip-per-section: each .start-chip is inside the first li of its ol). Screenshot of one section.

## 3. Negative: 1-book series
- /series/marsupilami: PASS = zero .start-chip elements.

## 4. Dark + mobile
- /series/mistborn dark 1440: chip visible, computed color rgb(168,207,158) bg rgb(38,56,34). Screenshot.
- 375px light: chip renders on book 1 without pushing layout (scrollWidth==375, no wrap weirdness). Screenshot.

## 5. Contrast/axe
- axe light+dark on /series/mistborn: PASS = 0 violations (chip contrast: 2f5d2a on e7efe2 ≈ 7:1; a8cf9e on 263822 ≈ 7:1 — axe would flag if wrong).

## 6. Print
- Print emulation on /series/mistborn: PASS = .start-chip computed display:none (and year-chip rule intact).

## 7. Regression: tracker
- Fresh context /series/mistborn: tick book 1 → checkbox checked, Up-next badge moves to book 2; untick → badge/state reverts; no JS errors. PASS = tick/untick works with chip present.

## 8. Combo year-chip + start-chip
- SKIPPED: no series found whose first book has a New/Upcoming year-chip (sampled 12 series from /new). Report as coverage gap.
