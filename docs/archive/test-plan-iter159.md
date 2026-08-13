# R159: regression of R158 P2 fixes (production worker 1a4d63e7)

Against https://shelfmark.wookat520.workers.dev, cache-busted fresh contexts, clipboard permissions. Code refs: app.js L11-15 (#sr-live sr-only role=status appended to body), L160-167 (srLive.textContent = "Up next: {title}" only when animate), L381/L403/L921 (aria-live="polite" set at bind on [data-copylist], [data-share], shelf Share-this-list); html.ts L68/L80 + index.ts L111 (aria-label="Search series, authors, and books").

## T1. Clipboard live announcements (/series/mistborn)
- Runtime attrs: [data-share] and [data-copylist] both have aria-live="polite" (getAttribute). FAIL if null.
- Click "Copy list" (keyboard Enter): button text becomes "Copied ✓" AND is inside/on an aria-live=polite element. Screenshot.
- Click "Share": text "Link copied ✓" with aria-live=polite.
- Shelf flow: save Mistborn for later → /shelf → "Share this list" button has aria-live="polite"; click → "Link copied ✓".

## T2. Search input accessible name
- Header input on / and /series/mistborn + hero input on /: aria-label === "Search series, authors, and books"; accessibility-tree combobox name equals the aria-label (NOT placeholder "Search series, authors, books…"). FAIL if name is the placeholder string.

## T3. #sr-live up-next announcement (/series/mistborn)
- On load: #sr-live exists in body, class contains sr-only, role=status, textContent "".
- Precondition screenshot, then tick book 1 checkbox (Space via keyboard): #sr-live.textContent === "Up next: Mistborn: The Well of Ascension"; visible Up next badge on book 2 (screenshot).
- Tick book 2: #sr-live updates to "Up next: Mistborn: The Hero of Ages" (subsequent ticks announced too).
- sr-only actually invisible: #sr-live bounding box ≤1px or clipped (computed position absolute / 1x1) and not visible in screenshot.

## T4. Sanity regression
- Typeahead: "/" focus, type "mist" → listbox opens (aria-expanded true, 4 options), ArrowDown+Enter navigates; Escape retains text. Coach tip appears on fresh series page, "Got it" dismisses; tick persists after reload (tracker unchanged).

## T5. axe home + series, light and dark (isolated fresh page load per theme)
- 4 runs, each: 0 violations (empty array). Any violation = fail with rule ids.

Pass = exact values above.
