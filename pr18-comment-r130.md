## ✅ R128–130 onboarding live QA — new-user walkthrough fully green (worker c565b465)

Tested on production https://shelfmark.zalize.com in fresh incognito contexts (recorded in Devin session).

**🟢 R128 3-step guide:** cards render under the hero with working links (/popular clicked through; /shelf + /year-in-books present); dark bottom panel now mentions My Shelf, shareable saved list, and Year in Books. Reduced-motion emulation: section opacity 1 / no js-reveal at load — content never hidden.

![3-step guide, fresh profile](/home/ubuntu/screenshots/ss_dfabf1de.png)

**🟢 R129 coach mark:** exact copy + "Got it" shown above the book list only for empty-store profiles; Got-it dismiss persists across reload; main QA profile (Mistborn 6/8) correctly shows **no** tip; print emulation → `display:none`.

| 🟢 Coach mark (new user) | 🟢 Main profile 6/8 — no tip |
|---|---|
| ![coach mark](/home/ubuntu/screenshots/ss_0ba05dd2.png) | ![no tip](/home/ubuntu/screenshots/ss_fb699376.png) |

**🟢 R130 first-tick hint:** first-ever tick removes the tip instantly and shows "First book tracked ✓ See all your progress on My Shelf."; observed the 12s auto-removal on screen; the My Shelf link navigates to /shelf showing the tracked book; after reload neither tip nor hint returns and the tick persists.

| 🟢 Hint after first tick | 🟢 Hint link → /shelf (1 read) |
|---|---|
| ![hint](/home/ubuntu/screenshots/ss_40ef6a17.png) | ![shelf](/home/ubuntu/screenshots/ss_81a09484.png) |

<details><summary>Baselines (green)</summary>

axe 4.10.2 **0 violations** light+dark on / and coach-marked /series/discworld; no horizontal overflow at 375/320px with the tip visible; tracker tick/persist regression fine in disposable contexts; main profile untouched.
</details>
