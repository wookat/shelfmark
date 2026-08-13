## ✅ R131 press kit + welcome email — live QA all green (worker 6707ebe9)

Tested on production https://shelfmark.zalize.com with a disposable mail.tm inbox (Devin session).

**🟢 /press:** breadcrumb, h1, boilerplate box, Fast facts, Brand assets (both download links: /favicon.svg 200 `image/svg+xml`, /og.png 200 `image/png`), Contact; footer "Press kit" sits between About & Privacy and "My Shelf" is now capitalized; in sitemaps/1.xml and llms.txt; axe 4.10.2 **0 violations** light+dark; no horizontal overflow at 375/320px.

| 🟢 /press light | 🟢 /press dark |
|---|---|
| ![press light](/home/ubuntu/screenshots/ss_a7349c20.png) | ![press dark](/tmp/press_dark.png) |

**🟢 Welcome email E2E (disposable inbox):** footer subscribe → confirmation email → confirm link → welcome email arrived in seconds with subject exactly "Welcome to Shelfmark new-release alerts", starter links (/popular, /new + RSS, /shelf — all 200), unsubscribe link, and raw headers `List-Unsubscribe: <…/unsubscribe?t=…>` + `List-Unsubscribe-Post: List-Unsubscribe=One-Click`. **Re-visiting the confirm link did NOT resend** — inbox stayed at exactly 2 messages after a 2-min wait — and the unsubscribe link still lands on "You're unsubscribed".

| 🟢 Confirmed (welcome sent once) | 🟢 One-click unsubscribe still works |
|---|---|
| ![confirmed](/home/ubuntu/screenshots/ss_0c629cc5.png) | ![unsubscribed](/home/ubuntu/screenshots/ss_fa9041fa.png) |

<details><summary>Regression (green)</summary>

Homepage and /series/mistborn hard-reload cleanly; main tracker state intact (6 of 8, 75%). The temporary test subscriber row has been deleted from D1 post-test.
</details>
