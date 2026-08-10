## ✅ Rounds 71–75 live QA — author FAQ, search avatars, reading goal, reading-card goal subline all verified

Tested against production https://shelfmark.zalize.com, deploy 419a600b (recorded in Devin session).

**🟢 R73 yearly reading goal:** on /shelf, "Set goal" opens the native prompt; entering **12** renders **"2026 reading goal: 7 of 12 books"** with the amber progress bar (`role=progressbar`, aria-valuenow=7/min=0/max=12) stored at `shelfmark:goal:2026`; "Edit goal" reopens the prompt and entering **0** clears back to the Set-goal state and removes the key.

| 🔴 Before: Set-goal state | 🟢 After: goal active 7/12 + amber bar |
|---|---|
| ![Set goal](/home/ubuntu/screenshots/ss_4f115440.png) | ![Goal active](/home/ubuntu/screenshots/ss_zoom_21f43eaa.png) |

**🟢 R74 reading card:** the actual downloaded PNGs were inspected — with a goal the subline reads **"books read · 3 series · 2026 goal 7/12"**; without a goal it stays "books read · 3 series". (✓-when-met variant not exercised — would require destructively ticking 5+ books in the test profile.)

| 🟢 With goal | 🟢 Without goal (unchanged) |
|---|---|
| ![Card goal](/tmp/card_goal.png) | ![Card no goal](/tmp/card_nogoal.png) |

**🟢 R71 author FAQ:** /authors/brandon-sanderson shows the visible 3-question FAQ (60 books/6 series · "Moment Zero" (2025) · Mistborn, 8 books 2006–2022) with an exactly matching FAQPage JSON-LD; janci-patterson (no qualifying series) degrades gracefully to a single question with no longest-series Q.

![FAQ](/home/ubuntu/screenshots/ss_bef2538f.png)

**🟢 R72 search avatars:** /search?q=sanderson uses the shared avatar card with the round Commons photo; no-photo authors render initial-letter placeholder circles, layout intact.

**♿ Axe** (4.10.2): **0 violations** on /authors/brandon-sanderson and /shelf with the goal card visibly rendered.

<details><summary>Regression (all green)</summary>

Tracker on /series/mistborn: tick → 7/8 (88%), untick → exact restore 6/8 (75%). Security headers (HSTS/CSP/Permissions-Policy/XFO/nosniff/referrer) unchanged via workers.dev + cache-bust.

| Ticked 7/8 | Restored 6/8 |
|---|---|
| ![Tick](/home/ubuntu/screenshots/ss_zoom_49b1004c.png) | ![Restore](/home/ubuntu/screenshots/ss_zoom_eba0c1fd.png) |
</details>
