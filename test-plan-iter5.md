# Shelfmark Iteration 5 — live re-verify (deploy 3f801e9c)

Code refs: src/index.ts:447 (/new query: s.author_id IS NOT NULL, book_count 2–80, genre exclusions for dictionary/encyclopedia/reference/comic strip/webcomic), src/html.ts:43-45 (og:image fallback siteUrl+/og.png with twitter:card summary_large_image; when image set → that URL + card summary), src/index.ts:295 (series image = first book cover -M→-L.jpg).

1. /new curation: page shows 2026 (and possibly 2027) sections; NO xkcd/Randall Munroe rows anywhere on the page (Ctrl+F/DOM check for "Munroe" and "xkcd" = 0 matches); no "Singapore as Model..." pamphlet entries; visible entries are attributed series books with covers or initial tiles. Fail: any Munroe/xkcd row remains or page empty.
2. /new mobile 375px: stacks, no horizontal overflow (scrollWidth <= innerWidth).
3. og meta (view-source/curl on rendered HTML):
   - `/`: og:image = https://shelfmark.zalize.com/og.png, twitter:card = summary_large_image, twitter:image same.
   - `/series/discworld` (has covers): og:image = a covers.openlibrary.org URL ending -L.jpg, twitter:card = summary.
   - `/series/mistborn` (no covers): og:image = https://shelfmark.zalize.com/og.png, twitter:card = summary_large_image.
4. /og.png loads directly in browser as an image with natural dimensions 1200x630 (check via naturalWidth/naturalHeight or image tab display).
5. Regression smoke: home renders (hero + popular series); search "discworld" returns series results; tick an unticked Mistborn book → count increments and persists after reload.
