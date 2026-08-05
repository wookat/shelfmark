# Shelfmark v1 — Live Site Test Plan (https://shelfmark.zalize.com)

Record entire browser run at desktop width, then a mobile-viewport pass.

## T1 Home page
- Load /. Pass: hero heading, search form, "popular series" and "prolific authors" sections visible.

## T2 Search
- Type "sanderson" in search form → submit. Pass: results include Brandon Sanderson author link and/or series links; clicking a result navigates to author/series page.
- Search "jack reacher". Pass: Jack Reacher series result appears.
- Search "zzzqqq". Pass: friendly no-results state (not error/blank).
- Empty search submit. Pass: no crash; sensible page.

## T3 Author page /authors/brandon-sanderson
- Pass: author name heading, series sections with book checklists (checkboxes per book).

## T4 Series page /series/mistborn — tracker
- Pass: books listed in order with numbers.
- Tick 2 checkboxes. Pass: progress bar fills and label shows "2 of M read" (exact count).
- Reload page. Pass: same 2 boxes still checked, label still "2 of M read" (localStorage persistence).

## T5 /shelf
- Pass: shows the ticked Mistborn books grouped under series heading.
- Click "Export JSON". Pass: JSON file downloads; contents include ticked book slugs.
- Click "Download my reading card". Pass: PNG file downloads and opens as an image.

## T6 Email capture
- Footer form: enter test-shelfmark@example.com, submit. Pass: button text changes to "Subscribed ✓".

## T7 Mobile ~375px
- Resize window to ~375px width; view home + /series/mistborn. Pass: no horizontal overflow, header/nav usable, series list readable, checkboxes tappable.

## T8 SEO plumbing (shell + view-source)
- curl /robots.txt, /sitemap.xml, /sitemaps/1.xml. Pass: 200, valid XML with URLs.
- View source of /series/mistborn. Pass: <title>, meta description, canonical link, JSON-LD script present.

## T9 Footer cross-links
- Pass: footer contains links to astrosage / subsleuth / cv / watchdeck / mealloop .zalize.com.

## T10 404
- Visit /series/nonexistent-slug. Pass: 404 status with styled not-found page (not raw error).

Note any P0/P1/P2 UX/visual issues with screenshots.
