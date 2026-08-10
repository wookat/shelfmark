# Shelfmark Rounds 33–34 — author-page Share/Print pills + genre ItemList JSON-LD (deploy be25e741, PR #9)

Code refs: served /authors/brandon-sanderson HTML — under the intro `<p>`, `<div class="mt-4 flex flex-wrap items-center gap-3 text-sm print:hidden">` containing `<button data-share data-share-title="Brandon Sanderson Books in Order">Share</button>` and `<button data-print>Print list</button>`. app.js:219–229 — data-share falls back to `navigator.clipboard.writeText(location.href)` + button text "Link copied ✓" for 2s (no navigator.share on desktop Chrome/Linux); data-print → window.print(). R34 shell-verified: /genres/fantasy ItemList JSON-LD numberOfItems 272, 60 itemListElement, first = Discworld position 1, url /series/discworld; ?page=2 first position 61.

## Recorded browser pass

1. /authors/brandon-sanderson: Share + Print list pills visibly render directly under the intro paragraph (screenshot). Fail: absent or misplaced.
2. Click Print list → Chrome print preview opens showing the clean numbered book lists across his series; verify in the preview page(s) that Share/Print pills and checkboxes are NOT in the printout (row has print:hidden). Cancel preview. Fail: no preview, or buttons/checkboxes visible in printout.
3. Click Share → button text flips to "Link copied ✓" (screenshot within 2s), reverts to "Share" after ~2s; verify system clipboard (`xclip -selection clipboard -o`) = https://shelfmark.zalize.com/authors/brandon-sanderson. Fail: no feedback or wrong URL.
4. Regression: tick first unread Mistborn book on the author page → per-series progress label increments (6 of 8 → 7 of 8); untick → restores 6 of 8.
5. Axe (shell, Playwright + bypass_csp, axe-core 4.10.2) on /authors/brandon-sanderson and /genres/fantasy: expect zero violations. Save /tmp/axe_results_r34.json.

R34 (shell-only, include in report): ItemList JSON-LD numbers above.
