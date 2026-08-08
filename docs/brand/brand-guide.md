# Shelfmark Brand Guide

_v1 — R131 branding batch. Single source of truth for how Shelfmark speaks and looks. Update this file whenever brand-facing copy or assets change._

## 1. Brand story & positioning

**One-liner (for readers):**
> Shelfmark tells you the right order to read any book series — and lets you tick books off as you go, with no account, ever.

**Elevator story:**
Series readers face two small but constant frustrations: figuring out the correct reading order (publication vs. chronological, sub-series, renamed reissues), and remembering where they left off across dozens of series — without signing up for yet another social reading network. Shelfmark solves exactly these two things. It's a reference site first (tens of thousands of series with documented publication order, built from open data), with a private tracker built into every page: progress lives in the reader's own browser, never on our servers.

**Positioning vs. alternatives:**
- vs. order-listing sites (OrderOfBooks, BookSeriesInOrder): same reference job, but with a built-in tracker, modern design, dark mode, open data provenance, and an open API.
- vs. social trackers (Goodreads, StoryGraph): same tracking job, but zero-signup, zero-social, privacy-absolute. We are the tracker for people who don't want an account.

**Audience:** adult series readers (fantasy/SF/crime/romance binge readers), privacy-conscious readers, librarians/booksellers answering "what order?" questions.

**Brand personality:** a knowledgeable, unfussy librarian. Helpful, precise, quietly warm. Never gamified, never pushy, never social-media-loud.

## 2. Naming & terminology

| Term | Correct usage | Never |
|---|---|---|
| Shelfmark | Always one word, capital S only. `Shelf` + amber `mark` in the logotype. | SHELFMARK, ShelfMark, Shelf Mark |
| My Shelf | Feature name for /shelf, both words capitalized. | My shelf, MyShelf, "the shelf page" |
| Year in Books | Feature name for /year-in-books. | Year In Books, Yearly Report, Wrapped |
| Saved for later | The TBR list feature. "saved list" is fine mid-sentence. | Wishlist, TBR (except when explaining the concept) |
| reading order / publication order | We list *publication order* by default; say so. | "chronological order" as a synonym |
| tracker / reading tracker | Lowercase; qualified as "no-signup" or "private" on first mention. | "app" (we're a website that installs as one) |
| open beta | Current commercial status; pair with "everything unlocked". | — |
| Zalize | Parent brand, appears in footer + copyright only. | Prominent co-branding |

**Banned words / claims:**
- "free forever", "100% free", "always free" — we are **"free during beta"** with planned paid plans (see /pricing). Never re-introduce a free positioning.
- "the best / #1 / world's largest" — unverifiable superlatives.
- "sign up", "create an account", "log in" — the product has none; never imply it does.
- "we track" — we never track readers; progress is device-local. Phrase as "saved privately in your browser".
- Anything social: "friends", "followers", "feed".

## 3. Tone of voice

- **Plain and concrete.** Short sentences. Say what a feature does, not how excited we are about it.
- **Reader-first.** Second person ("your progress", "tick books as you read"). We/our only for methodology and policy.
- **Privacy stated as fact, not marketing.** "Progress is saved privately in this browser — no account, ever." is the canonical formulation; reuse it rather than inventing variants.
- **Calm UI copy.** One-time hints, dismissible tips, no exclamation marks except the sparing "✓" confirmations (e.g. "First book tracked ✓", "Subscribed ✓").
- **British-neutral American English**, sentence case for headings, serial-comma optional but consistent within a page.

## 4. Visual identity

**Logo / logotype:**
- Primary mark: `public/favicon.svg` — an open book with an amber bookmark ribbon, on the ink-950 rounded square.
- Logotype: "Shelf**mark**" set in Fraunces Bold; "mark" in amber accent (`#9a6414` on light, `#e8b05f` on dark surfaces).
- Clear space: ≥ 0.5× the mark's height on all sides. Don't recolor, outline, rotate, or add effects.

**Color palette (defined in `src/styles.css` @theme):**
| Token | Hex | Role |
|---|---|---|
| ink-50 | `#f7f6f3` | page background (paper) |
| ink-100 | `#edebe4` | subtle fills |
| ink-200 | `#d9d5c8` | borders |
| ink-700 | `#3d3a33` | body text |
| ink-800 | `#292722` | default text color |
| ink-900 | `#1a1916` | headings, dark panels |
| amber-accent | `#9a6414` | links, CTAs, brand accent (light) |
| amber-accent (dark surfaces) | `#e8b05f` | ≥4.5:1 contrast on ink-900 |

Dark mode remaps the palette via `prefers-color-scheme` (see styles.css); email templates use the same paper/ink pairing (`#f7f6f3` / `#292722` / `#1a1916`).

**Typography:**
- Display: **Fraunces** (500/700, italic 600/700) — headings, logotype, numerals in stats. Italic Fraunces = emphasis inside hero copy only.
- Body/UI: **Inter** (400/500/600).
- Both loaded from Google Fonts (OFL licensed).

**Texture & motion:**
- Paper grain: faint feTurbulence SVG noise on `body` — the signature "printed paper" feel. Keep opacity ≤ 0.05.
- Motion tokens: card lift, cover tilt, checkbox pop, scroll reveal — all gated behind `prefers-reduced-motion: no-preference`. New motion must follow the same gate.
- Radii: pills (`rounded-full`) for actions/badges, `rounded-2xl` for cards.

**Imagery:**
- Real book covers (Open Library) wherever available; letter-tile placeholders otherwise. Original line-art SVG illustrations for empty states. No stock photos, no AI-generated fake covers.
- OG/share image: `public/og.png` (1200×630); generated cards (reading card, Year in Books) are 1080×1350 canvas PNGs in the same palette.

## 5. Boilerplate (canonical copy blocks)

**Short (≤160 chars):**
> Shelfmark — book series in the right reading order, with a private no-signup tracker built into every page.

**Medium (press/directory):**
> Shelfmark is a reading-order reference and private reading tracker. It lists the correct publication order for tens of thousands of book series — built from open data (Wikidata, Open Library) — and lets readers tick books off as they read. Progress is stored only in the reader's browser: no account, no cookies, no social feed. Currently in open beta with all features unlocked.

**Footer tagline (in use):**
> Every book series in the right order — and a private, no-signup reading tracker built into every page.

## 6. Brand touchpoints checklist

Where brand copy/assets live in code — check these when anything above changes:
- `src/html.ts`: header logotype, nav, footer tagline + sister products, OG defaults, theme-color.
- `src/index.ts`: page titles/descriptions (all end `| Shelfmark`), /about, /pricing (beta framing), /press, email templates (`emailShell` signature "Shelfmark · shelfmark.zalize.com"), llms.txt.
- `public/`: favicon.svg, og.png, manifest.json (name/short_name/theme colors).
- `docs/marketing/`: outbound copy must match §5 boilerplate and §2 terminology.
