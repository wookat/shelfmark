# Shelfmark Rounds 39–40 — production QA report (headless)

**Target:** https://shelfmark.zalize.com · deploy `fa2f528a` · PR #9 branch
**Method:** headless shell (curl + python XML/JSON validation) and headless Playwright Chromium (console/CSP listeners, CDP `Page.getAppManifest`, axe-core 4.10.2 with `bypass_csp=True`). No recording — meta/infra features with no visual UI, per brief.
**Plan:** `/home/ubuntu/repos/shelfmark/test-plan-iter40.md` · **Raw axe/console/CDP output:** `/tmp/axe_results_r40.json`

## Summary

All 9 checks passed. No escalations. No edge-propagation delay observed — all new routes were live at test time.

## R39 — OpenSearch

1. ✅ **/opensearch.xml** → HTTP 200, `content-type: application/opensearchdescription+xml; charset=utf-8`, parses as valid XML with root `OpenSearchDescription` (opensearch 1.1 namespace), `ShortName` = "Shelfmark", 16×16 SVG image → /favicon.svg.
2. ✅ **Search templates correct:**

```xml
<Url type="text/html" method="get" template="https://shelfmark.zalize.com/search?q={searchTerms}"/>
<Url type="application/x-suggestions+json" method="get" template="https://shelfmark.zalize.com/api/opensearch-suggest?q={searchTerms}"/>
```

3. ✅ **/api/opensearch-suggest** returns the OpenSearch JSON suggestion shape `["q",[names…]]`, content-type `application/json`, ≤5 names, ordered by book_count:

```
q=disc    → 200 ["disc", ["Discworld", "Discovery", "Discrete Mathematics and Its Applications"]]
q=mist    → 200 ["mist", ["Mistborn"]]
q=        → 200 ["", []]           (empty query: well-formed, no 500)
q=zzzqqq  → 200 ["zzzqqq", []]     (no match: well-formed)
q=';--    → 200 ["';--", []]       (injection-ish input: well-formed, no error)
```

4. ✅ **Autodiscovery link on all pages:** `<link rel="search" type="application/opensearchdescription+xml" title="Shelfmark" href="/opensearch.xml">` present in head on `/`, `/series/mistborn`, and `/new`.

## R40 — web app manifest

5. ✅ **/manifest.json** → HTTP 200, parses as JSON: `display: "standalone"`, `theme_color: "#f7f6f3"`, `background_color: "#f7f6f3"`, `start_url: "/"`, icon `src: "/favicon.svg"` (`sizes: any`, `type: image/svg+xml`); **/favicon.svg itself → 200 `image/svg+xml`**.
6. ✅ **Head tags on all pages:** `<link rel="manifest" href="/manifest.json">` + `<meta name="theme-color" content="#f7f6f3">` present on `/`, `/series/mistborn`, and `/new`.
7. ✅ **No console/CSP errors:** homepage loaded in a real-CSP context (no bypass) with `console` and `pageerror` listeners → **0 entries**; no CSP violation mentioning the manifest fetch.
8. ✅ **Chrome recognizes the manifest (CDP):** `Page.getAppManifest` on the homepage → `url: https://shelfmark.zalize.com/manifest.json`, `errors: []`, 393 bytes of manifest data returned — Chrome parses it with zero manifest errors.

## Accessibility

9. ✅ **Axe (axe-core 4.10.2) on `/`: 0 violations** — head-only changes introduce nothing; zero baseline holds.

```
console/pageerror entries: 0
getAppManifest url: https://shelfmark.zalize.com/manifest.json errors: [] dataLen: 393
axe / violations: 0
```

## Notes / limitations

- No visual evidence this round by design — both features are head/route-level with no rendered UI. The nearest user-visible proof (Chrome installability prompt / OS install dialog) was covered via CDP `Page.getAppManifest` instead of driving the browser's install UI, which is environment-dependent in a sandboxed Chromium.
- Full installability audit (Lighthouse PWA category) not run — brief marked browser recognition as optional; `getAppManifest` returned clean, which is the underlying signal.
