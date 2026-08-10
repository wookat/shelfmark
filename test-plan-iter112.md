# Shelfmark R112 email pipeline — quick regression (deploy e2347551, PR #17, commit 5056863)

Scope per lead: do NOT test actual email sending (lead already verified E2E with mail.tm); do not submit a real address or leave subscriber rows. No recording needed unless useful.

Shell facts already captured (workers.dev + cache-bust):
- app.js contains success note "Almost done — check your inbox and click the confirmation link." (commit adds it at the footer form handler)
- /unsubscribe (no token) and /unsubscribe?t=deadbeef → 400, `noindex,follow`, h1 "Link invalid or already used", full site layout
- /privacy: "Subscriptions are double opt-in (nothing is sent until you confirm) and every email includes a one-click unsubscribe link"
- Security headers: all 6 present (HSTS/CSP/PP/XFO/nosniff/RP)
- Browser screenshot of /unsubscribe?t=bogus: styled page renders (ss_4b0ef17a.png)

## Remaining browser spot-checks (main profile, non-destructive)

1. Homepage /: loads normally, footer subscribe form ("Email for new-release alerts" + Notify me) renders. Submit with a syntactically invalid value ("not-an-email") → browser native email validation blocks submission (no POST). Fail: form missing or page broken.
2. /series/discworld: page loads with book list; tracker persistence — existing "3 of 55 read" state still shown (no tick/untick needed; persistence proven if prior count intact). Fail: progress lost or page broken.
3. Verify no console errors on both pages.

Cleanup: nothing to clean (no subscribe POST sent).
Report → append R112 section to /home/ubuntu/repos/shelfmark/test-report-iter108-111.md or standalone summary in final message.
