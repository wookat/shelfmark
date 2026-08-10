## ✅ R108–111 visual upgrade live QA — all green

Tested against production https://shelfmark.zalize.com, deploy 0c3ded07 (recorded in Devin session).

**🟢 Hero + collage:** text-6xl headline with Fraunces-italic amber "right order"; 7 real popular-series covers rotated −6…−4° linking to /series/{slug}; hover straightens (`rotate(0) translateY(-4px) scale(1.05)`).

| Light | Dark |
|---|---|
| ![Hero light](/home/ubuntu/screenshots/ss_524d4951.png) | ![Hero dark](/home/ubuntu/screenshots/ss_240ee76d.png) |

**🟢 Motion tokens (all gated correctly):** motion-safe → `js-reveal` added, bottom panel fades up on scroll, card-lift hover + cover tilt, checkbox pop on tick (7/8→6/8 restore verified). `reduced_motion=reduce` → **no** js-reveal, panel opacity 1 / transform none at load, hover transform none. No-JS → panel fully visible.

**🟢 Empty shelf + brand:** fresh-profile /shelf shows the new line-art SVG with amber bookmark; favicon.svg (open book + ribbon) and regenerated og.png (**1200×630**) served correctly.

![Empty shelf](/home/ubuntu/screenshots/ss_b02beeb4.png)

**🟢 Adversarial re-verification:** axe 4.10.2 **0 violations in all 8 runs** (light+dark × / , /series/discworld, /shelf seeded, /pricing); overflow sweep **clean in all 30 probes** at 320/360/375/380/400/414/459/460/480/640 on /, /pricing, /series/mistborn (the old 360/380 overflow is gone — even 320 passes now); Genres ≥400 / New ≥460 / Beta+Pricing ≥640; R106 fixes hold (Discworld list ordinals match book pages; inline series links persistently underlined); security headers unchanged; styles.css 27.9KB with beta-badge/year-chip/up-next intact.

Collage cover counts render 3 (<sm) / 4 (sm) / 7 (md+) as coded — the test brief's 4/5/7 was an off-by-one in the brief, not the code.

<details><summary>Regression details (green)</summary>

Tracker tick → 7/8 (88%) with check-pop, untick → exact 6/8 (75%); main profile left canonical (Mistborn 6/8, saved {}, no goal key). Where-to-start card, Up-next badge, pricing links unaffected by the CSS rebuild.
</details>
