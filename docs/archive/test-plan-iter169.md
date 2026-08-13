# R169: print palette + interactive-hide + 44px touch targets (production worker 3abe57ec)

Regression of the three R168 P2 fixes. Against https://shelfmark.wookat520.workers.dev, cache-busted fresh contexts. Code refs (commit d3584af): src/styles.css L318-345 @media print hides header/footer/nav/form/button/input/select/textarea and resets ink palette vars to light (amber → #a05f10, body white, img filter none); src/styles.css L214-224 @media (pointer:coarse) pills padding-block .7rem + breadcrumb 44px hit area (padding+negative margin); src/index.ts: "More series by X" + "If you like X, you'll love…" sections now print:hidden.

## T1. Dark-theme print — /series/mistborn (1440, color_scheme=dark, emulate_media print)
- JS: computed display none for ALL of: [data-share], [data-print], [data-copylist], [data-save-series], header, footer, every button/input, the "More series by" section, the "If you like" section (anchor by h2 text). FAQ still visible (intentional).
- Palette: getComputedStyle(document.body).backgroundColor is white; h1 color resolves to dark ink (#1a1916), NOT the pale dark-theme value; card backgrounds light (spot-check first book li background-color luminance > 200).
- Pixel: full-page screenshot shows dark-ink-on-white order list of 8 books with numbers/titles/years, no dark cards, no buttons, no recommendation grids.

## T2. Dark-theme print — /shelf (same context, 2 books seeded via UI ticks or localStorage from T4 profile; simplest: tick 2 Discworld books via UI first)
- JS: zero visible button/input inside #shelf-root/#saved-root (Set goal, Remove, Share this list, Export JSON/CSV, Import JSON, Clear all data, Download reading card all display:none).
- Pixel: stats (2 books read / 1 series followed), series list rows legible dark-on-light; headings not washed out.

## T3. Light-theme print regression — /series/mistborn (fresh light context)
- Same hide assertions as T1; order list legible; screenshot reviewed.

## T4. Coarse pointer 375px (fresh context has_touch=True, viewport 375x812, light + dark)
- Verify matchMedia('(pointer: coarse)').matches === true (else emulation approach invalid — adjust).
- getBoundingClientRect heights: all 4 series action pills (Share/Print list/Copy list/☆ Save for later) ≥ 44px (was 34); breadcrumb link hit area: getBoundingClientRect().height + resolved padding-block gives ≥44 — assert via elementFromPoint probe at crumb center ±22px vertical hitting the anchor, or computed paddingBlock 0.85rem present and clientHeight ≥ 44.
- No layout breakage: scrollingElement.scrollWidth == 375 in light AND dark; screenshot pill row + crumbs both themes; no overlapping text (pixel review).

## T5. Desktop fine-pointer sanity + axe (1440 light, no touch)
- Pill heights back to ~34px (coarse rule not applied); crumbs ~17px.
- axe fresh light load on /series/mistborn → 0 violations; fresh dark load → 0.
- Zero pageerrors everywhere.
