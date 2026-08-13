# Shelfmark Iteration 2 — live re-verify (PR #5)

Code refs: src/index.ts:251-272 (alsoLike: same genre, other authors, book_count 3–60, ≤6 cards), src/index.ts:304 (no-cover placeholder: 38x57 span with uppercase title initial), src/html.ts:51 (skip-to-content link, sr-only until focused).

1. /series/mistborn: "If you like Mistborn, you'll love…" section renders with up to 6 cards, none by Brandon Sanderson; click one card → its series page loads. Fail: section absent or card 404s.
2. /series/discworld: rows without covers (e.g. #14 Troll Bridge, #15 Theatre of Cruelty, #26 The Sea and Little Fishes) show a 38x57 initial-letter tile ("T") aligned with neighboring cover images — screenshot proof. Fail: blank gap/no tile.
3. Skip link: from a fresh page load press Tab once → "Skip to content" pill visible top-left (screenshot); press Enter → focus/scroll jumps to #main. Fail: first tab goes to search input.
4. Regression tracker: tick an unticked Discworld book → count increments; reload → persists.
5. Regression mobile 375px: /series/mistborn incl. also-like grid, no horizontal overflow (scrollWidth <= innerWidth).
