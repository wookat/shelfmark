# Email lifecycle (Resend)

_All sends require prior double opt-in (confirmed=1, unsubscribed=0) and carry List-Unsubscribe + one-click headers. Sender: Shelfmark <no-reply@zalize.com>._

## Live today

1. **Confirmation email** — sent on subscribe (double opt-in step). In code: `/api/subscribe`.
2. **Welcome email** — NEW (R131): sent once, immediately after a first-time confirmation at `/confirm`. Content: what to expect (weekly digest, only when there's news) + 3 starter links (Popular, New & upcoming/RSS, tracker→My Shelf) + unsubscribe link.
3. **Weekly digest** — Mondays 09:00 UTC cron; incremental catalog additions only; skips when empty.

## Template on deck (not automated — no re-engagement trigger data yet)

**Win-back / re-visit (manual send or future cron when we can detect 60d inactivity):**
- Subject: `Your series kept going — see what's new`
- Body: "It's been a while. Since you subscribed, N new installments landed in series readers follow. See what's new: {SITE}/new — or check your shelf: {SITE}/shelf. [Unsubscribe]"
- Rule: only to confirmed & not-unsubscribed; max 1 win-back per address ever unless they re-engage.

## Guardrails

- Never email unconfirmed addresses (except the confirmation email itself).
- Every template ends with the emailShell signature ("Shelfmark · shelfmark.zalize.com · unsubscribe note") — keep it.
- Tone per brand guide §3: plain, no urgency tricks, no "last chance".
