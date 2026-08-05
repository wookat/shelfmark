# Shelfmark Round 2 — Live Site Test Report (PR #2)

Target: **https://shelfmark.zalize.com** (production). Regression + new-feature pass, recorded (desktop + 375px mobile).

## Results summary

| # | Test | Result |
|---|------|--------|
| 1 | Home: hero/search render; "Genres" in nav+footer; xkcd/LNCS removed from Popular series | ⚠️ **Partial fail** — curation improved but "Biographisches Lexikon des Kaiserthums Oesterreich" (60 vols, 1856–1891 reference work) is the **#1 popular series** |
| 2 | /genres index (fantasy 279 · sci-fi 199 …) + /genres/fantasy lists 200 series linking to series pages (clicked Discworld) | ✅ Pass |
| 3 | Author standalone section: /authors/brandon-sanderson "Standalone books · 28 books"; 2 ticks → "2 of 28 read (7%)"; persists after reload | ✅ Pass |
| 4 | Series tracker regression: round-1 Mistborn ticks still present (localStorage intact across deploy) | ✅ Pass |
| 5 | Covers: /series/lecture-notes-in-computer-science shows 38×57 OL thumbnails; cover-less rows align; no broken-image icons | ✅ Pass |
| 6 | /shelf: Mistborn (2) + "Brandon Sanderson — standalone" (2) groups shown | ⚠️ **Partial fail** — standalone group heading links to `/series/standalone-brandon-sanderson` which returns **404** |
| 7 | Mobile 375px: home, /genres/fantasy, covers page — readable, no horizontal overflow | ⚠️ **Partial fail** — layout fine, but the "Genres" nav link is `hidden sm:inline` so it's absent from the mobile header (only reachable via footer) |
| 8 | /confirm?t=zzz → HTTP 400 (curl) + "Link invalid or already used" page | ✅ Pass |
| 9 | sitemap.xml → 6 chunks; all 200; url counts 5075/5000/5000/5000/2839/2680 (≈25.6K URLs) | ✅ Pass |
| 10 | Search "jack reacher" + /series/nonexistent-slug 404 (regression) | ✅ Pass |

## Issues (severity)

- **P1 — /shelf standalone group heading is a dead link**: "Brandon Sanderson — standalone" links to `/series/standalone-brandon-sanderson` → HTTP 404. Should link to the author page (or not be a link).
- **P1 — Home "Popular series" still leads with a junk entry**: "Biographisches Lexikon des Kaiserthums Oesterreich" is #1. Curation removed xkcd/LNCS but count-based ranking still surfaces reference works.
- **P2 — "Genres" nav hidden on mobile header** (`hidden sm:inline` in src/html.ts:60): new feature is undiscoverable on phones except via the footer. Mobile was a hard acceptance criterion in round 1, so worth fixing.
- **P2 — Data-quality (ordering)**: Discworld list shows duplicate ordinals (three books numbered "1.", two "2." etc.) because sub-series ordinals are mixed; confusing "in order" presentation.

## Evidence

### 1. Home (Genres nav; Popular series with junk #1 entry)
![Home round 2](https://app.devin.ai/attachments/088e9241-80d9-432d-8d89-a2fb16349d40/ss_23b216fe.png)

### 2. Genres
| 🟢 /genres index | 🟢 /genres/fantasy |
|---|---|
| ![genres index](https://app.devin.ai/attachments/3697357e-f251-484f-a80b-4bbf615f5342/ss_4a63c17b.png) | ![fantasy genre](https://app.devin.ai/attachments/25faea21-78f7-4e7d-8116-9826cc804be6/ss_cb41c873.png) |

### 3. Standalone books tracker + persistence
| 🟢 After ticking 2 ("2 of 28 read (7%)") | 🟢 After reload (ticks persisted) |
|---|---|
| ![ticked](https://app.devin.ai/attachments/b95de23c-235b-4937-8975-8f71bbfa2fca/ss_13000602.png) | ![reload](https://app.devin.ai/attachments/a05beb42-9a0b-4ddb-ad50-2893216ce908/ss_f5f9bbab.png) |

### 5. Covers
| 🟢 Series page with OL thumbnails | 🟢 Zoom: cover / no-cover rows aligned, no broken icons |
|---|---|
| ![covers](https://app.devin.ai/attachments/678ddfbb-1ddc-43a3-8f91-132c607ca52a/ss_463c6584.png) | ![covers zoom](https://app.devin.ai/attachments/4f0ace1b-5a2e-4037-9898-9ce27d00ed86/ss_zoom_7dfc8cad.png) |

### 6. /shelf with standalone group (heading link → 404 = P1)
![shelf](https://app.devin.ai/attachments/60e3431e-5d9e-4c53-a6be-a03810905a06/ss_246a26ec.png)

### 7. Mobile 375px (note missing "Genres" in header nav)
| 🟢 /genres/fantasy @375px | 🟢 Covers page @375px |
|---|---|
| ![mobile genre](https://app.devin.ai/attachments/ffd3e223-f97b-470c-94a6-c5f1ecdcc429/ss_17a5b636.png) | ![mobile covers](https://app.devin.ai/attachments/bd376647-0070-4c16-a9a9-9fae2572d419/ss_ab70971f.png) |

### 8. Invalid confirm token (HTTP 400)
![confirm 400](https://app.devin.ai/attachments/3e0cf817-d3b1-400d-a68e-473887377951/ss_bacdbf41.png)

### 10. Regression: search + 404
| 🟢 "jack reacher" search | 🟢 404 page |
|---|---|
| ![search](https://app.devin.ai/attachments/a208995e-8c35-4802-8f95-63d718867c59/ss_dd29ee0d.png) | ![404](https://app.devin.ai/attachments/e47b1d5d-724b-4504-baad-36dacf457591/ss_2b224a95.png) |

### 9. Sitemaps (shell)
```
sitemaps/1.xml -> 200 urls: 5075
sitemaps/2.xml -> 200 urls: 5000
sitemaps/3.xml -> 200 urls: 5000
sitemaps/4.xml -> 200 urls: 5000
sitemaps/5.xml -> 200 urls: 2839
sitemaps/6.xml -> 200 urls: 2680
```
