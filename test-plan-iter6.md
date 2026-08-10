# Shelfmark Iteration 6 — series FAQ section + FAQPage JSON-LD (deploy 006eb147)

Code refs: src/index.ts:259-265 (faq generation: first book Q if books[0]; count Q always; most-recent Q only if latest!==first; author Q only if author_name), :284 (visible "{Series} FAQ" section, dl of Q/A cards after also-like section), :301-311 (FAQPage JSON-LD with mainEntity Question/acceptedAnswer).

1. /series/mistborn FAQ accuracy: section "Mistborn FAQ" after "If you like Mistborn…"; 4 cards:
   - "What is the first Mistborn book?" → “Mistborn: The Final Empire” (2006) — must match row #1 of list.
   - "How many books are in the Mistborn series?" → 8 books, published 2006–2022 — must match "8 books" pill.
   - "What is the most recent Mistborn book?" → “Mistborn: The Lost Metal” (2022) — must match highest-year row.
   - "Who writes the Mistborn series?" → Brandon Sanderson.
   Fail: section absent, wrong titles/years/count, or answers contradicting the page's own book list.
2. /series/discworld FAQ: same 4 questions with Discworld data (first = row #1 e.g. The Light Fantastic (1986)?, count matches pill, latest year matches the max year in list, author Terry Pratchett). Cross-check against visible list.
3. FAQPage JSON-LD: extract <script type="application/ld+json"> from /series/mistborn HTML; one block must be valid JSON with @type=FAQPage and mainEntity array of Question objects with acceptedAnswer.text matching the visible answers. Fail: missing, invalid JSON, or mismatch with visible FAQ.
4. Graceful degradation: use /series/fortress (verified no-author via curl) (author Q absent — FAQ has only first/count/latest Qs) and/or a single-book series (no "most recent" Q since latest===first). Verify no empty/broken cards, no "undefined"/"null" text. Fail: broken markup or missing FAQ where books exist.
5. Mobile ~375px: /series/mistborn FAQ cards stack, no horizontal overflow (scrollWidth <= innerWidth).
6. Regression smoke: tracker tick on a series page increments count and persists after reload; Ctrl+P print preview shows no layout break (FAQ may print — fine), header/footer/checkboxes still hidden.
