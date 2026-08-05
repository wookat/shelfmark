---
name: testing-shelfmark
description: How to test the Shelfmark live site (shelfmark.zalize.com) — key routes, tracker/localStorage behavior, exports, and SEO endpoints.
---

# Testing Shelfmark

- Production: https://shelfmark.zalize.com (Cloudflare Worker + D1, SSR via Hono; code in `src/index.ts`, ~440 lines). No login or local setup needed to test the live site.
- Key routes: `/` (home), `/search?q=`, `/authors/<slug>` (e.g. brandon-sanderson), `/series/<slug>` (e.g. mistborn, jack-reacher, discworld), `/shelf`, `/about`, `/privacy`, `/robots.txt`, `/sitemap.xml`, `/sitemaps/N.xml`. Unknown slugs return HTTP 404 with a styled page.
- Reading tracker: on series/author pages, checkboxes per book update a "N of M read (X%)" label + progress bar instantly; state is stored in localStorage only (never sent to the server), so it persists across reloads but not across browsers/profiles.
- `/shelf` renders from localStorage: books grouped by series. "Export JSON" downloads `shelfmark-export.json` (map of bookId → {t, title, series, slug}); "Download my reading card" generates a 1080×1350 PNG (`shelfmark-reading-card.png`) via canvas. Check `~/Downloads/` for both.
- Email capture: footer form POSTs to `/api/subscribe`; on success the button text changes to "Subscribed ✓" (no toast). Use a test@example.com-style address.
- SEO: series pages include title, meta description, canonical, OG tags, and JSON-LD (BookSeries + BreadcrumbList) — verify via `view-source:` or curl.
- Mobile: test at ~375px width (resize with `wmctrl -r :ACTIVE: -e 0,100,0,375,740` after removing maximized state).
- Local dev if needed: `npx wrangler dev` in the repo (wrangler.toml binds D1 `shelfmark-db`); requires a Cloudflare token.

## Devin Secrets Needed
- None for live-site testing. `CLOUDFLARE_WORKERS_API_TOKEN` / `CLOUDFLARE_ADMIN_API_TOKEN` only if deploying or querying D1 directly.
