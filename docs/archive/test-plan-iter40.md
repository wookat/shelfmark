# Shelfmark Rounds 39–40 — OpenSearch + web app manifest (deploy fa2f528a, PR #9)

Headless round, no recording (meta/infra features). Setup facts already shell-verified live:
- /opensearch.xml → 200, `application/opensearchdescription+xml`, template `/search?q={searchTerms}` + suggestions URL to /api/opensearch-suggest.
- /api/opensearch-suggest?q=disc → `["disc",["Discworld","Discovery","Discrete Mathematics and Its Applications"]]`, content-type application/json.
- /manifest.json → 200 JSON, standalone, theme/background `#f7f6f3`, icon /favicon.svg (200 image/svg+xml).
- Homepage head has `<link rel="search" …opensearch…>`, `<link rel="manifest" href="/manifest.json">`, `<meta name="theme-color" content="#f7f6f3">`.

## Shell checks

1. /opensearch.xml: 200, content-type `application/opensearchdescription+xml`, parses as valid XML (xmllint/python), contains ShortName "Shelfmark", html template `https://shelfmark.zalize.com/search?q={searchTerms}`, and a `application/x-suggestions+json` Url pointing at /api/opensearch-suggest. Fail: non-200, wrong type, XML parse error, missing/incorrect templates.
2. /api/opensearch-suggest?q=disc: valid JSON of exact shape `["disc", [ …strings ]]`, ≤5 names, first "Discworld" (top by book_count); also q=mist → ["mist",["Mistborn",…]]; empty/garbage q returns well-formed shape without a 500. Fail: wrong shape, >5 items, 5xx.
3. Head tags on / (and one non-home page, e.g. /series/mistborn, since brief says "all pages"): rel=search link, rel=manifest link, theme-color meta all present. Fail: any missing.
4. /manifest.json: 200, parses as JSON, `display:"standalone"`, `theme_color:"#f7f6f3"`, icon src /favicon.svg which itself returns 200 image/svg+xml. Fail: parse error, missing keys, icon 404.

## Headless browser checks (Playwright, no recording)

5. Load homepage with console + pageerror listeners: no console errors and no CSP violations (specifically none mentioning manifest). Fail: any CSP/manifest error logged.
6. CDP `Page.getAppManifest` on homepage: returns url ending /manifest.json, no parse errors, data non-empty (Chrome recognizes the manifest). Optional per brief — mark untested if flaky.
7. Axe (axe-core 4.10.2, bypass_csp) on /: expect 0 violations. Save /tmp/axe_results_r40.json. Fail: any violation.

Report → /home/ubuntu/repos/shelfmark/test-report-iter40.md
