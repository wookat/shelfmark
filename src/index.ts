import { Hono } from "hono";
import { layout, esc } from "./html";

type Env = {
  DB: D1Database;
  CACHE: KVNamespace;
  ASSETS: Fetcher;
  SITE_URL: string;
};

type Author = { id: number; slug: string; name: string; bio: string | null; series_count: number; book_count: number };
type Series = { id: number; slug: string; name: string; author_id: number | null; description: string | null; genre: string | null; book_count: number; first_year: number | null; last_year: number | null; author_name?: string; author_slug?: string; parent_id?: number | null };
type Book = { id: number; series_id: number | null; author_id: number | null; title: string; year: number | null; position: number | null; cover_url: string | null; description: string | null };
type TrackList = { slug: string; name: string };

const app = new Hono<{ Bindings: Env }>();

app.use("*", async (c, next) => {
  await next();
  const h = c.res.headers;
  h.set("X-Content-Type-Options", "nosniff");
  h.set("Referrer-Policy", "strict-origin-when-cross-origin");
  h.set("X-Frame-Options", "DENY");
  if ((h.get("content-type") ?? "").includes("text/html")) {
    h.set(
      "Content-Security-Policy",
      "default-src 'self'; img-src 'self' https://covers.openlibrary.org https://archive.org https://*.archive.org data:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; script-src 'self' https://static.cloudflareinsights.com; connect-src 'self' https://cloudflareinsights.com; base-uri 'self'; form-action 'self'; frame-ancestors 'none'"
    );
  }
});

async function rateLimited(c: { env: Env; req: { header: (n: string) => string | undefined } }, bucket: string, limit: number): Promise<boolean> {
  const ip = c.req.header("cf-connecting-ip") ?? "unknown";
  const key = `rl:${bucket}:${ip}:${Math.floor(Date.now() / 60000)}`;
  const n = parseInt((await c.env.CACHE.get(key)) ?? "0", 10) + 1;
  await c.env.CACHE.put(key, String(n), { expirationTtl: 120 });
  return n > limit;
}

const PAGE_SIZE = 60;

function bookNoun(n: number) {
  return `${n} book${n === 1 ? "" : "s"}`;
}
function yearsSpan(s: Series) {
  if (s.first_year && s.last_year && s.first_year !== s.last_year) return `${s.first_year}–${s.last_year}`;
  return s.first_year ? String(s.first_year) : "";
}

function seriesCard(s: Series): string {
  return `<a href="/series/${s.slug}" class="block rounded-2xl bg-white border border-ink-200 p-4 hover:border-amber-accent hover:shadow-sm transition">
    <p class="font-display font-semibold text-ink-900">${esc(s.name)}</p>
    <p class="text-sm text-ink-700/80 mt-1">${s.author_name ? esc(s.author_name) + " · " : ""}${bookNoun(s.book_count)}${yearsSpan(s) ? " · " + yearsSpan(s) : ""}</p>
    <div class="mt-2 h-1.5 rounded-full bg-ink-100 overflow-hidden"><div class="h-full bg-amber-accent rounded-full" style="width:0%" data-progress-bar="${s.slug}"></div></div>
  </a>`;
}

// ---------- Home ----------
app.get("/", async (c) => {
  const { results: popular } = await c.env.DB.prepare(
    `SELECT s.*, a.name AS author_name FROM series s LEFT JOIN authors a ON a.id=s.author_id WHERE s.book_count BETWEEN 3 AND 60 AND s.author_id IS NOT NULL AND s.genre IS NOT NULL AND s.genre NOT LIKE '%dictionary%' AND s.genre NOT LIKE '%encyclopedia%' AND s.genre NOT LIKE '%reference%' ORDER BY s.book_count DESC LIMIT 12`
  ).all<Series>();
  const { results: authors } = await c.env.DB.prepare(
    `SELECT * FROM authors WHERE series_count >= 2 AND book_count BETWEEN 10 AND 400 ORDER BY book_count DESC LIMIT 12`
  ).all<Author>();
  const homeYear = new Date().getFullYear();
  const { results: fresh } = await c.env.DB.prepare(
    `SELECT b.title, b.year, b.cover_url, s.slug AS series_slug, s.name AS series_name, a.name AS author_name FROM books b JOIN series s ON s.id=b.series_id LEFT JOIN authors a ON a.id=b.author_id WHERE b.year>=? AND b.year<=? AND s.author_id IS NOT NULL AND s.book_count BETWEEN 2 AND 80 AND s.genre IS NOT NULL AND s.genre NOT LIKE '%comic strip%' AND s.genre NOT LIKE '%webcomic%' AND s.first_year IS NOT NULL AND s.first_year < b.year ORDER BY b.year, s.book_count DESC, b.title LIMIT 6`
  ).bind(homeYear, homeYear + 1).all<{ title: string; year: number; cover_url: string | null; series_slug: string; series_name: string; author_name: string | null }>();
  const [{ ns }] = ((await c.env.DB.prepare(`SELECT COUNT(*) AS ns FROM series`).all()).results as any[]);
  const [{ nb }] = ((await c.env.DB.prepare(`SELECT COUNT(*) AS nb FROM books`).all()).results as any[]);
  const { results: topGenres } = await c.env.DB.prepare(
    `SELECT genre, COUNT(*) AS n FROM series WHERE genre IS NOT NULL AND book_count > 0 GROUP BY genre HAVING n >= 10 ORDER BY n DESC LIMIT 12`
  ).all<{ genre: string; n: number }>();
  const body = `
<section class="text-center py-10">
  <h1 class="font-display font-bold text-4xl sm:text-5xl text-ink-900 leading-tight">Read every series<br>in the <span class="text-amber-accent">right order</span>.</h1>
  <p class="mt-4 text-lg text-ink-700 max-w-xl mx-auto">Publication order for ${Number(nb).toLocaleString()} books across ${Number(ns).toLocaleString()} series — with a private reading tracker built in. No account needed.</p>
  <form action="/search" method="get" class="mt-6 max-w-lg mx-auto flex gap-2">
    <input name="q" type="search" required placeholder="Try “Jack Reacher” or “Brandon Sanderson”…" class="flex-1 rounded-full border border-ink-200 bg-white px-5 py-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-accent/50">
    <button class="rounded-full bg-ink-900 text-ink-50 px-6 py-3 text-sm font-semibold hover:bg-ink-700">Search</button>
  </form>
</section>
<section class="mt-8">
  <div class="flex items-baseline justify-between"><h2 class="font-display font-semibold text-2xl text-ink-900">Popular series</h2><a href="/series" class="text-sm text-amber-accent font-medium">All series →</a></div>
  <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 mt-4">${popular.map(seriesCard).join("")}</div>
</section>
${fresh.length ? `<section class="mt-12">
  <div class="flex items-baseline justify-between"><h2 class="font-display font-semibold text-2xl text-ink-900">New &amp; upcoming</h2><a href="/new" class="text-sm text-amber-accent font-medium">All new releases →</a></div>
  <ul class="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">${fresh.map((b) => `<li><a href="/series/${b.series_slug}" class="flex items-center gap-3 rounded-2xl bg-white border border-ink-200 p-4 hover:border-amber-accent transition">${b.cover_url ? `<img src="${esc(b.cover_url)}" alt="" loading="lazy" width="38" height="57" class="w-[38px] h-[57px] object-cover rounded shadow-sm shrink-0 bg-ink-100">` : `<span aria-hidden="true" class="w-[38px] h-[57px] rounded shadow-sm shrink-0 bg-ink-100 border border-ink-200 flex items-center justify-center font-display font-semibold text-ink-700/75">${esc((b.title[0] ?? "?").toUpperCase())}</span>`}<span class="min-w-0"><span class="block font-medium text-ink-900 text-sm truncate">${esc(b.title)}${b.year ? ` (${b.year})` : ""}</span><span class="block text-xs text-ink-700/75 mt-0.5 truncate">${esc(b.series_name)}${b.author_name ? ` · ${esc(b.author_name)}` : ""}</span></span></a></li>`).join("")}</ul>
</section>` : ""}
<section class="mt-12">
  <div class="flex items-baseline justify-between"><h2 class="font-display font-semibold text-2xl text-ink-900">Browse by genre</h2><a href="/genres" class="text-sm text-amber-accent font-medium">All genres →</a></div>
  <div class="mt-4 flex flex-wrap gap-2">${topGenres.map((g) => `<a href="/genres/${gslug(g.genre)}" class="rounded-full bg-white border border-ink-200 px-4 py-2 text-sm hover:border-amber-accent">${esc(g.genre)} <span class="text-ink-700/75">${g.n}</span></a>`).join("")}</div>
</section>
<section class="mt-12">
  <div class="flex items-baseline justify-between"><h2 class="font-display font-semibold text-2xl text-ink-900">Prolific authors</h2><a href="/authors" class="text-sm text-amber-accent font-medium">All authors →</a></div>
  <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 mt-4">
    ${authors.map((a) => `<a href="/authors/${a.slug}" class="block rounded-2xl bg-white border border-ink-200 p-4 hover:border-amber-accent transition"><p class="font-display font-semibold text-ink-900">${esc(a.name)}</p><p class="text-sm text-ink-700/80 mt-1">${a.series_count} series · ${bookNoun(a.book_count)}</p></a>`).join("")}
  </div>
</section>
<section class="mt-14 rounded-3xl bg-ink-900 text-ink-50 p-8 sm:p-10">
  <h2 class="font-display font-semibold text-2xl">Your shelf lives in your browser.</h2>
  <p class="mt-2 text-ink-50/80 max-w-2xl">Tick off books as you read them on any series page. Your progress is saved privately on your device — no account, no tracking, no social feed. Visit <a href="/shelf" class="underline text-amber-accent">My Shelf</a> to see everything in one place and share a reading card.</p>
</section>`;
  return c.html(
    layout({
      title: "Shelfmark — Book Series in Order + Free Reading Tracker",
      description: `Find the correct reading order for ${Number(ns).toLocaleString()} book series and track your progress privately. No signup required.`,
      path: "/",
      siteUrl: c.env.SITE_URL,
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "Shelfmark",
          url: c.env.SITE_URL,
          potentialAction: {
            "@type": "SearchAction",
            target: { "@type": "EntryPoint", urlTemplate: c.env.SITE_URL + "/search?q={search_term_string}" },
            "query-input": "required name=search_term_string",
          },
        },
      ],
      body,
    })
  );
});

// ---------- Series index ----------
app.get("/series", async (c) => {
  const page = Math.max(1, parseInt(c.req.query("page") ?? "1") || 1);
  const rawLetter = (c.req.query("letter") ?? "").toUpperCase();
  const letter = /^[A-Z]$/.test(rawLetter) ? rawLetter : null;
  const where = letter ? `WHERE s.book_count > 0 AND UPPER(s.name) LIKE ?` : "WHERE s.book_count > 0";
  const listSql = `SELECT s.*, a.name AS author_name FROM series s LEFT JOIN authors a ON a.id=s.author_id ${where} ORDER BY ${letter ? "s.name" : "(s.author_id IS NOT NULL AND s.genre IS NOT NULL) DESC, s.book_count DESC"} LIMIT ? OFFSET ?`;
  const listArgs = letter ? [`${letter}%`, PAGE_SIZE, (page - 1) * PAGE_SIZE] : [PAGE_SIZE, (page - 1) * PAGE_SIZE];
  const { results } = await c.env.DB.prepare(listSql).bind(...listArgs).all<Series>();
  const countSql = `SELECT COUNT(*) AS n FROM series s ${where}`;
  const [{ n }] = ((letter
    ? await c.env.DB.prepare(countSql).bind(`${letter}%`).all()
    : await c.env.DB.prepare(countSql).all()
  ).results as any[]);
  const pages = Math.ceil(Number(n) / PAGE_SIZE);
  if (page > Math.max(1, pages)) return notFound(c);
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  const body = `
<h1 class="font-display font-bold text-3xl text-ink-900">All book series${letter ? `: ${letter}` : ""}</h1>
<p class="mt-2 text-ink-700">${Number(n).toLocaleString()} series${letter ? ` starting with ${letter}` : ", best-documented first"}. Page ${page} of ${pages || 1}.</p>
<nav aria-label="Series by letter" class="mt-4 flex flex-wrap gap-1.5 text-sm">
  <a href="/series" class="rounded-full px-3 py-1.5 border ${!letter ? "bg-ink-900 text-ink-50 border-ink-900" : "bg-white border-ink-200 hover:border-amber-accent"}">All</a>
  ${letters.map((l) => `<a href="/series?letter=${l}" class="rounded-full px-3 py-1.5 border ${letter === l ? "bg-ink-900 text-ink-50 border-ink-900" : "bg-white border-ink-200 hover:border-amber-accent"}">${l}</a>`).join("")}
</nav>
<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 mt-6">${results.map(seriesCard).join("")}</div>
${!results.length ? `<p class="mt-6 text-ink-700">No series under this letter yet.</p>` : ""}
${paginationQ(letter ? `/series?letter=${letter}&` : "/series?", page, pages)}`;
  return c.html(
    layout({
      title: `${letter ? `Book Series Starting With ${letter}` : "All Book Series in Order"} — Page ${page} | Shelfmark`,
      description: `Browse ${Number(n).toLocaleString()} book series${letter ? ` starting with ${letter}` : ""} with complete reading orders and a free progress tracker.`,
      path: letter ? `/series?letter=${letter}${page > 1 ? `&page=${page}` : ""}` : page > 1 ? `/series?page=${page}` : "/series",
      siteUrl: c.env.SITE_URL,
      body,
    })
  );
});

function pagination(base: string, page: number, pages: number): string {
  if (pages <= 1) return "";
  const link = (p: number, label: string) =>
    `<a href="${base}?page=${p}" class="rounded-full border border-ink-200 bg-white px-4 py-2 text-sm hover:border-amber-accent">${label}</a>`;
  return `<div class="flex gap-2 justify-center mt-8">
    ${page > 1 ? link(page - 1, "← Previous") : ""}
    ${page < pages ? link(page + 1, "Next →") : ""}
  </div>`;
}

// ---------- Authors index ----------
app.get("/authors", async (c) => {
  const page = Math.max(1, parseInt(c.req.query("page") ?? "1") || 1);
  const rawLetter = (c.req.query("letter") ?? "").toUpperCase();
  const letter = /^[A-Z]$/.test(rawLetter) ? rawLetter : null;
  const where = letter ? `WHERE UPPER(name) LIKE ?` : "";
  const listSql = `SELECT * FROM authors ${where} ORDER BY ${letter ? "name" : "book_count DESC"} LIMIT ? OFFSET ?`;
  const listArgs = letter ? [`${letter}%`, PAGE_SIZE, (page - 1) * PAGE_SIZE] : [PAGE_SIZE, (page - 1) * PAGE_SIZE];
  const { results } = await c.env.DB.prepare(listSql).bind(...listArgs).all<Author>();
  const countSql = `SELECT COUNT(*) AS n FROM authors ${where}`;
  const [{ n }] = ((letter
    ? await c.env.DB.prepare(countSql).bind(`${letter}%`).all()
    : await c.env.DB.prepare(countSql).all()
  ).results as any[]);
  const pages = Math.ceil(Number(n) / PAGE_SIZE);
  if (page > Math.max(1, pages)) return notFound(c);
  const base = letter ? `/authors?letter=${letter}&` : "/authors?";
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  const body = `
<h1 class="font-display font-bold text-3xl text-ink-900">All authors${letter ? `: ${letter}` : ""}</h1>
<p class="mt-2 text-ink-700">${Number(n).toLocaleString()} authors${letter ? ` starting with ${letter}` : " with series reading orders"}. Page ${page} of ${pages || 1}.</p>
<nav aria-label="Authors by letter" class="mt-4 flex flex-wrap gap-1.5 text-sm">
  <a href="/authors" class="rounded-full px-3 py-1.5 border ${!letter ? "bg-ink-900 text-ink-50 border-ink-900" : "bg-white border-ink-200 hover:border-amber-accent"}">All</a>
  ${letters.map((l) => `<a href="/authors?letter=${l}" class="rounded-full px-3 py-1.5 border ${letter === l ? "bg-ink-900 text-ink-50 border-ink-900" : "bg-white border-ink-200 hover:border-amber-accent"}">${l}</a>`).join("")}
</nav>
<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 mt-6">
${results.map((a) => `<a href="/authors/${a.slug}" class="block rounded-2xl bg-white border border-ink-200 p-4 hover:border-amber-accent transition"><p class="font-display font-semibold text-ink-900">${esc(a.name)}</p><p class="text-sm text-ink-700/80 mt-1">${a.series_count} series · ${bookNoun(a.book_count)}</p></a>`).join("")}
</div>
${!results.length ? `<p class="mt-6 text-ink-700">No authors under this letter yet.</p>` : ""}
${paginationQ(base, page, pages)}`;
  return c.html(
    layout({
      title: `Authors${letter ? ` Starting With ${letter}` : " A–Z"}: Books in Order — Page ${page} | Shelfmark`,
      description: `Browse ${Number(n).toLocaleString()} authors${letter ? ` starting with ${letter}` : ""} and find every book series in the correct reading order.`,
      path: letter ? `/authors?letter=${letter}${page > 1 ? `&page=${page}` : ""}` : page > 1 ? `/authors?page=${page}` : "/authors",
      siteUrl: c.env.SITE_URL,
      body,
    })
  );
});

function paginationQ(base: string, page: number, pages: number): string {
  if (pages <= 1) return "";
  const link = (p: number, label: string) =>
    `<a href="${base}page=${p}" class="rounded-full border border-ink-200 bg-white px-4 py-2 text-sm hover:border-amber-accent">${label}</a>`;
  return `<div class="flex gap-2 justify-center mt-8">
    ${page > 1 ? link(page - 1, "← Previous") : ""}
    ${page < pages ? link(page + 1, "Next →") : ""}
  </div>`;
}

// ---------- Author page ----------
app.get("/authors/:slug", async (c) => {
  const slug = c.req.param("slug");
  const author = await c.env.DB.prepare(`SELECT * FROM authors WHERE slug=?`).bind(slug).first<Author>();
  if (!author) return notFound(c, await authorSuggestions(c, slug), slug.replace(/-/g, " "));
  const { results: series } = await c.env.DB.prepare(
    `SELECT * FROM series WHERE author_id=? ORDER BY book_count DESC`
  ).bind(author.id).all<Series>();
  const { results: books } = await c.env.DB.prepare(
    `SELECT * FROM books WHERE author_id=? ORDER BY series_id, position, year`
  ).bind(author.id).all<Book>();
  const bySeries = new Map<number, Book[]>();
  const standalone: Book[] = [];
  for (const b of books) {
    if (b.series_id == null) { standalone.push(b); continue; }
    if (!bySeries.has(b.series_id)) bySeries.set(b.series_id, []);
    bySeries.get(b.series_id)!.push(b);
  }
  standalone.sort((a, b) => (a.year ?? 9999) - (b.year ?? 9999));
  const body = `
${crumbs([["Authors", "/authors"], [author.name, ""]])}
<h1 class="font-display font-bold text-3xl sm:text-4xl text-ink-900">${esc(author.name)} Books in Order</h1>
<p class="mt-3 text-ink-700 max-w-2xl">${author.bio ? `${esc(author.name)} is ${/^[aeiou]/i.test(author.bio) ? "an" : "a"} ${esc(author.bio)}. ` : ""}${esc(`${author.name} has written ${bookNoun(author.book_count)}${author.series_count ? ` across ${author.series_count} series` : ""}. Below is every book in publication order — tick books off as you read them; progress saves automatically on your device.`)}</p>
<div class="mt-4 flex flex-wrap items-center gap-3 text-sm print:hidden">
  <button type="button" data-share data-share-title="${esc(author.name)} Books in Order" class="rounded-full bg-white border border-ink-200 px-3.5 py-1.5 hover:border-amber-accent cursor-pointer">Share</button>
  <button type="button" data-print class="rounded-full bg-white border border-ink-200 px-3.5 py-1.5 hover:border-amber-accent cursor-pointer">Print list</button>
</div>
${series.map((s) => {
  const bs = bySeries.get(s.id) ?? [];
  return `<section class="mt-10" id="${s.slug}">
  <div class="flex flex-wrap items-baseline gap-x-3 gap-y-1">
    <h2 class="font-display font-semibold text-2xl text-ink-900"><a href="/series/${s.slug}" class="hover:text-amber-accent">${esc(s.name)}</a></h2>
    <span class="text-sm text-ink-700/75">${bookNoun(s.book_count)}${yearsSpan(s) ? " · " + yearsSpan(s) : ""}</span>
    <span class="text-sm font-medium text-amber-accent" data-progress-label="${s.slug}"></span>
  </div>
  ${bookList(bs, s)}
</section>`;
}).join("")}
${standalone.length ? `<section class="mt-10" id="standalone">
  <div class="flex flex-wrap items-baseline gap-x-3 gap-y-1">
    <h2 class="font-display font-semibold text-2xl text-ink-900">Standalone books</h2>
    <span class="text-sm text-ink-700/75">${bookNoun(standalone.length)}</span>
    <span class="text-sm font-medium text-amber-accent" data-progress-label="standalone-${slug}"></span>
  </div>
  ${bookList(standalone, { slug: `standalone-${slug}`, name: `${author.name} — standalone` })}
</section>` : ""}`;
  return c.html(
    layout({
      title: `${author.name} Books in Order (Complete Series List) | Shelfmark`,
      description: `Complete list of ${author.name} books in order: ${series.slice(0, 3).map((s) => s.name).join(", ")}${series.length > 3 ? " and more" : ""}. Reading order + free progress tracker.`,
      path: `/authors/${slug}`,
      siteUrl: c.env.SITE_URL,
      jsonLd: [
        { "@context": "https://schema.org", "@type": "Person", name: author.name, url: `${c.env.SITE_URL}/authors/${slug}` },
        breadcrumbLd(c.env.SITE_URL, [["Authors", "/authors"], [author.name, `/authors/${slug}`]]),
        ...(series.length ? [{
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: `Book series by ${author.name}`,
          numberOfItems: series.length,
          itemListElement: series.map((s, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: s.name,
            url: `${c.env.SITE_URL}/series/${s.slug}`,
          })),
        }] : []),
      ],
      body,
    })
  );
});

// ---------- Series page ----------
app.get("/series/:slug", async (c) => {
  const slug = c.req.param("slug");
  const series = await c.env.DB.prepare(
    `SELECT s.*, a.name AS author_name, a.slug AS author_slug FROM series s LEFT JOIN authors a ON a.id=s.author_id WHERE s.slug=?`
  ).bind(slug).first<Series>();
  if (!series) return notFound(c, await seriesSuggestions(c, slug), slug.replace(/-/g, " "));
  const { results: books } = await c.env.DB.prepare(
    `SELECT * FROM books WHERE series_id=? AND wikidata_id NOT IN (SELECT wikidata_id FROM series WHERE wikidata_id IS NOT NULL) ORDER BY position, year, id`
  ).bind(series.id).all<Book>();
  const { results: related } = await c.env.DB.prepare(
    `SELECT s.*, a.name AS author_name FROM series s LEFT JOIN authors a ON a.id=s.author_id WHERE s.author_id=? AND s.id<>? ORDER BY s.book_count DESC LIMIT 6`
  ).bind(series.author_id ?? -1, series.id).all<Series>();
  const { results: children } = await c.env.DB.prepare(
    `SELECT s.*, a.name AS author_name FROM series s LEFT JOIN authors a ON a.id=s.author_id WHERE s.parent_id=? ORDER BY s.first_year, s.book_count DESC`
  ).bind(series.id).all<Series>();
  const parent = series.parent_id
    ? await c.env.DB.prepare(`SELECT slug, name FROM series WHERE id=?`).bind(series.parent_id).first<{ slug: string; name: string }>()
    : null;
  const { results: alsoLike } = series.genre
    ? await c.env.DB.prepare(
        `SELECT s.*, a.name AS author_name FROM series s LEFT JOIN authors a ON a.id=s.author_id WHERE s.genre=? AND s.id<>? AND (s.author_id IS NULL OR s.author_id<>?) AND s.book_count BETWEEN 3 AND 60 ORDER BY s.book_count DESC LIMIT 6`
      ).bind(series.genre, series.id, series.author_id ?? -1).all<Series>()
    : { results: [] as Series[] };
  const { results: sameName } = await c.env.DB.prepare(
    `SELECT s.slug, s.name, a.name AS author_name FROM series s LEFT JOIN authors a ON a.id=s.author_id WHERE s.name=? AND s.id<>? LIMIT 3`
  ).bind(series.name, series.id).all<{ slug: string; name: string; author_name: string | null }>();
  const seriesPositions = books.map((b) => b.position).filter((p): p is number => p != null);
  const orderedBooks =
    new Set(seriesPositions).size !== seriesPositions.length
      ? [...books].sort((a, b) => (a.year ?? 9999) - (b.year ?? 9999) || (a.position ?? 0) - (b.position ?? 0))
      : books;
  const first = orderedBooks[0];
  const latest = books.reduce<Book | null>((m, b) => (b.year != null && (m?.year == null || b.year > m.year) ? b : m), null);
  const faqs: [string, string][] = [];
  if (first) faqs.push([`What is the first ${series.name} book?`, `The series starts with “${first.title}”${first.year ? ` (${first.year})` : ""}. Publication order is the order most readers should follow.`]);
  faqs.push([`How many books are in the ${series.name} series?`, `There are ${bookNoun(series.book_count)} in ${series.name}${yearsSpan(series) ? `, published ${yearsSpan(series)}` : ""}.`]);
  if (latest && latest !== first) faqs.push([`What is the most recent ${series.name} book?`, `The most recent installment on record is “${latest.title}”${latest.year ? ` (${latest.year})` : ""}.`]);
  if (series.author_name) faqs.push([`Who writes the ${series.name} series?`, `${series.name} is written by ${series.author_name}.`]);
  const body = `
${crumbs([["Series", "/series"], [series.name, ""]])}
<h1 class="font-display font-bold text-3xl sm:text-4xl text-ink-900">${esc(series.name)} Books in Order</h1>
${sameName.length ? `<p class="mt-2 text-sm text-ink-700/80">Looking for a different ${esc(series.name)}? ${sameName.map((o) => `<a class="text-amber-accent underline" href="/series/${o.slug}">${esc(o.name)}${o.author_name ? ` by ${esc(o.author_name)}` : ""}</a>`).join(" · ")}</p>` : ""}
<p class="mt-3 text-ink-700 max-w-2xl">${esc(series.description ?? `${series.name}${series.author_name ? ` by ${series.author_name}` : ""} has ${bookNoun(series.book_count)}${yearsSpan(series) ? ` published ${yearsSpan(series)}` : ""}. The list below is the publication order — the order most readers should follow.${first ? ` Start with “${first.title}”.` : ""}`)}</p>
<div class="mt-4 flex flex-wrap items-center gap-3 text-sm">
  ${series.author_name ? `<a href="/authors/${series.author_slug}" class="rounded-full bg-white border border-ink-200 px-3.5 py-1.5 hover:border-amber-accent">More by ${esc(series.author_name)}</a>` : ""}
  ${parent ? `<a href="/series/${parent.slug}" class="rounded-full bg-white border border-ink-200 px-3.5 py-1.5 hover:border-amber-accent">Part of ${esc(parent.name)}</a>` : ""}
  <span class="rounded-full bg-white border border-ink-200 px-3.5 py-1.5">${bookNoun(series.book_count)}</span>
  ${series.genre ? `<a href="/genres/${gslug(series.genre)}" class="rounded-full bg-white border border-ink-200 px-3.5 py-1.5 hover:border-amber-accent capitalize">${esc(series.genre)}</a>` : ""}
  <button type="button" data-share data-share-title="${esc(series.name)} Books in Order" class="rounded-full bg-white border border-ink-200 px-3.5 py-1.5 hover:border-amber-accent print:hidden cursor-pointer">Share</button>
  <button type="button" data-print class="rounded-full bg-white border border-ink-200 px-3.5 py-1.5 hover:border-amber-accent print:hidden cursor-pointer">Print list</button>
  ${books.length ? `<button type="button" data-copylist="${series.slug}" class="rounded-full bg-white border border-ink-200 px-3.5 py-1.5 hover:border-amber-accent print:hidden cursor-pointer">Copy list</button>` : ""}
  <span class="font-medium text-amber-accent print:hidden" data-progress-label="${series.slug}"></span>
</div>
<div class="mt-2 h-2 rounded-full bg-ink-100 max-w-md overflow-hidden"><div class="h-full bg-amber-accent rounded-full transition-all" style="width:0%" data-progress-bar="${series.slug}"></div></div>
${bookList(books, series)}
${children.length ? `<section class="mt-10"><h2 class="font-display font-semibold text-2xl text-ink-900">Sub-series within ${esc(series.name)}</h2><div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 mt-4">${children.map(seriesCard).join("")}</div></section>` : ""}
<p class="mt-4 text-sm text-ink-700/75 print:hidden">☑️ Tick a book to mark it read. Progress is saved privately in your browser — see <a href="/shelf" class="text-amber-accent underline">My Shelf</a>.</p>
${related.length ? `<section class="mt-12"><h2 class="font-display font-semibold text-2xl text-ink-900">More series${series.author_name ? ` by ${esc(series.author_name)}` : ""}</h2><div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 mt-4">${related.map(seriesCard).join("")}</div></section>` : ""}
${alsoLike.length ? `<section class="mt-12"><h2 class="font-display font-semibold text-2xl text-ink-900">If you like ${esc(series.name)}, you’ll love…</h2><div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 mt-4">${alsoLike.map(seriesCard).join("")}</div></section>` : ""}
${faqs.length ? `<section class="mt-12"><h2 class="font-display font-semibold text-2xl text-ink-900">${esc(series.name)} FAQ</h2><dl class="mt-4 space-y-4 max-w-2xl">${faqs.map(([q2, a2]) => `<div class="rounded-xl bg-white border border-ink-200 px-4 py-3"><dt class="font-medium text-ink-900">${esc(q2)}</dt><dd class="mt-1 text-sm text-ink-700">${esc(a2)}</dd></div>`).join("")}</dl></section>` : ""}`;
  return c.html(
    layout({
      title: `${series.name} Books in Order (${series.book_count} Books)${series.author_name ? " — " + series.author_name : ""} | Shelfmark`,
      description: `${series.name} reading order: all ${bookNoun(series.book_count)}${series.author_name ? ` by ${series.author_name}` : ""} listed in publication order${first ? `, starting with ${first.title}` : ""}. Track your progress free.`,
      path: `/series/${slug}`,
      siteUrl: c.env.SITE_URL,
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "BookSeries",
          name: series.name,
          url: `${c.env.SITE_URL}/series/${slug}`,
          ...(series.author_name ? { author: { "@type": "Person", name: series.author_name } } : {}),
          numberOfItems: series.book_count,
          ...(orderedBooks.length ? {
            hasPart: orderedBooks.slice(0, 50).map((b, i) => ({
              "@type": "Book",
              name: b.title,
              position: i + 1,
              ...(b.year ? { datePublished: String(b.year) } : {}),
              ...(b.cover_url ? { image: b.cover_url } : {}),
              ...(series.author_name ? { author: { "@type": "Person", name: series.author_name } } : {}),
            })),
          } : {}),
        },
        breadcrumbLd(c.env.SITE_URL, [["Series", "/series"], [series.name, `/series/${slug}`]]),
        ...(faqs.length
          ? [{
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: faqs.map(([q2, a2]) => ({
                "@type": "Question",
                name: q2,
                acceptedAnswer: { "@type": "Answer", text: a2 },
              })),
            }]
          : []),
      ],
      image: books.find((b) => b.cover_url)?.cover_url?.replace("-M.jpg", "-L.jpg"),
      body,
    })
  );
});

function bookList(books: Book[], s: TrackList): string {
  if (!books.length) return `<p class="mt-4 text-ink-700/75 text-sm">No books recorded for this series yet.</p>`;
  const positions = books.map((b) => b.position).filter((p): p is number => p != null);
  const dupPositions = new Set(positions).size !== positions.length;
  if (dupPositions) books = [...books].sort((a, b) => (a.year ?? 9999) - (b.year ?? 9999) || (a.position ?? 0) - (b.position ?? 0));
  return `<ol class="mt-5 space-y-2" data-series="${s.slug}" data-series-name="${esc(s.name)}">
${books.map((b, i) => `<li class="flex items-center gap-3 rounded-xl bg-white border border-ink-200 px-4 py-3">
  <label class="flex items-center gap-3 cursor-pointer flex-1 min-w-0">
    <input type="checkbox" class="size-5 accent-amber-accent shrink-0" data-book="${b.id}" data-title="${esc(b.title)}">
    ${b.cover_url ? `<img src="${esc(b.cover_url)}" alt="" loading="lazy" width="38" height="57" class="w-[38px] h-[57px] object-cover rounded shadow-sm shrink-0 bg-ink-100">` : `<span aria-hidden="true" class="w-[38px] h-[57px] rounded shadow-sm shrink-0 bg-ink-100 border border-ink-200 flex items-center justify-center font-display font-semibold text-ink-700/75">${esc((b.title[0] ?? "?").toUpperCase())}</span>`}
    <span class="text-sm sm:text-base min-w-0"><span class="text-ink-700/75 tabular-nums mr-2">${dupPositions ? i + 1 : b.position ?? i + 1}.</span><span class="font-medium text-ink-900">${esc(b.title)}</span>${b.year ? `<span class="text-ink-700/75 ml-2">(${b.year})</span>` : ""}${b.year && b.year >= new Date().getFullYear() ? `<span class="year-chip">${b.year > new Date().getFullYear() ? "Upcoming" : "New"}</span>` : ""}${b.description ? `<span class="block text-xs text-ink-700/75 mt-0.5">${esc(b.description)}</span>` : ""}</span>
  </label>
</li>`).join("\n")}
</ol>`;
}

function crumbs(items: [string, string][]): string {
  return `<nav aria-label="Breadcrumb" class="text-sm text-ink-700/75 mb-4"><a href="/" class="hover:text-amber-accent">Home</a>${items
    .map(([label, href]) => ` / ${href ? `<a href="${href}" class="hover:text-amber-accent">${esc(label)}</a>` : `<span class="text-ink-900">${esc(label)}</span>`}`)
    .join("")}</nav>`;
}

function breadcrumbLd(siteUrl: string, items: [string, string][]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [["Home", "/"], ...items].map(([name, path], i) => ({
      "@type": "ListItem",
      position: i + 1,
      name,
      item: siteUrl + path,
    })),
  };
}

// ---------- Genres ----------
const gslug = (g: string) => g.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

app.get("/genres", async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT genre, COUNT(*) AS n FROM series WHERE genre IS NOT NULL AND book_count > 0 GROUP BY genre HAVING n >= 3 ORDER BY n DESC`
  ).all<{ genre: string; n: number }>();
  const body = `
<h1 class="font-display font-bold text-3xl text-ink-900">Browse series by genre</h1>
<p class="mt-2 text-ink-700">Every genre with reading orders on Shelfmark.</p>
<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 mt-6">
${results.map((g) => `<a href="/genres/${gslug(g.genre)}" class="block rounded-2xl bg-white border border-ink-200 p-4 hover:border-amber-accent transition"><p class="font-display font-semibold text-ink-900">${esc(g.genre)}</p><p class="text-sm text-ink-700/80 mt-1">${g.n} series</p></a>`).join("")}
</div>`;
  return c.html(
    layout({
      title: "Book Series by Genre | Shelfmark",
      description: "Browse book series reading orders by genre: fantasy, crime, science fiction, romance and more.",
      path: "/genres",
      siteUrl: c.env.SITE_URL,
      body,
    })
  );
});

app.get("/genres/:slug", async (c) => {
  const slug = c.req.param("slug");
  const { results: genres } = await c.env.DB.prepare(
    `SELECT DISTINCT genre FROM series WHERE genre IS NOT NULL`
  ).all<{ genre: string }>();
  const genre = genres.find((g) => gslug(g.genre) === slug)?.genre;
  if (!genre) return notFound(c);
  const page = Math.max(1, parseInt(c.req.query("page") ?? "1") || 1);
  const [{ n }] = ((await c.env.DB.prepare(`SELECT COUNT(*) AS n FROM series WHERE genre=? AND book_count > 0`).bind(genre).all()).results as any[]);
  const total = Number(n);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (page > pages) return notFound(c);
  const { results } = await c.env.DB.prepare(
    `SELECT s.*, a.name AS author_name FROM series s LEFT JOIN authors a ON a.id=s.author_id WHERE s.genre=? AND s.book_count > 0 ORDER BY s.book_count DESC LIMIT ? OFFSET ?`
  ).bind(genre, PAGE_SIZE, (page - 1) * PAGE_SIZE).all<Series>();
  const body = `
${crumbs([["Genres", "/genres"], [genre, ""]])}
<h1 class="font-display font-bold text-3xl text-ink-900">${esc(genre)} Series in Order${page > 1 ? ` — Page ${page}` : ""}</h1>
<p class="mt-2 text-ink-700">${total} ${esc(genre.toLowerCase())} series with complete reading orders.</p>
<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 mt-6">${results.map(seriesCard).join("")}</div>
${paginationQ(`/genres/${slug}?`, page, pages)}`;
  return c.html(
    layout({
      title: `${genre} Book Series in Order (${total} Series) | Shelfmark`,
      description: `All ${genre.toLowerCase()} book series on Shelfmark with reading orders and a free progress tracker.`,
      path: `/genres/${slug}${page > 1 ? `?page=${page}` : ""}`,
      siteUrl: c.env.SITE_URL,
      jsonLd: [
        breadcrumbLd(c.env.SITE_URL, [["Genres", "/genres"], [genre, `/genres/${slug}`]]),
        {
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: `${genre} book series in order`,
          numberOfItems: total,
          itemListElement: results.map((s, i) => ({
            "@type": "ListItem",
            position: (page - 1) * PAGE_SIZE + i + 1,
            name: s.name,
            url: `${c.env.SITE_URL}/series/${s.slug}`,
          })),
        },
      ],
      body,
    })
  );
});

// ---------- Search ----------
app.get("/search", async (c) => {
  const q = (c.req.query("q") ?? "").trim().slice(0, 100);
  let body: string;
  if (!q) {
    body = `<h1 class="font-display font-bold text-3xl text-ink-900">Search</h1><p class="mt-2 text-ink-700">Type a series or author name above.</p>`;
  } else {
    const like = `%${q.replace(/[%_]/g, " ")}%`;
    let { results: series } = await c.env.DB.prepare(
      `SELECT s.*, a.name AS author_name FROM series s LEFT JOIN authors a ON a.id=s.author_id WHERE s.name LIKE ? AND s.book_count > 0 ORDER BY s.book_count DESC LIMIT 30`
    ).bind(like).all<Series>();
    let { results: authors } = await c.env.DB.prepare(
      `SELECT * FROM authors WHERE name LIKE ? ORDER BY book_count DESC LIMIT 30`
    ).bind(like).all<Author>();
    const { results: bookHits } = await c.env.DB.prepare(
      `SELECT b.title, b.year, s.slug AS series_slug, s.name AS series_name, a.name AS author_name FROM books b JOIN series s ON s.id=b.series_id LEFT JOIN authors a ON a.id=b.author_id WHERE b.title LIKE ? ORDER BY s.book_count DESC LIMIT 20`
    ).bind(like).all<{ title: string; year: number | null; series_slug: string; series_name: string; author_name: string | null }>();
    let closeMatches = false;
    const tokens = q.replace(/[%_]/g, " ").split(/\s+/).filter((t) => t.length > 2);
    if (!series.length && !authors.length && !bookHits.length && tokens.length > 1) {
      closeMatches = true;
      const binds = tokens.map((t) => `%${t}%`);
      ({ results: series } = await c.env.DB.prepare(
        `SELECT s.*, a.name AS author_name FROM series s LEFT JOIN authors a ON a.id=s.author_id WHERE s.book_count > 0 AND (${tokens.map(() => "s.name LIKE ?").join(" OR ")}) ORDER BY s.book_count DESC LIMIT 12`
      ).bind(...binds).all<Series>());
      ({ results: authors } = await c.env.DB.prepare(
        `SELECT * FROM authors WHERE ${tokens.map(() => "name LIKE ?").join(" OR ")} ORDER BY book_count DESC LIMIT 12`
      ).bind(...binds).all<Author>());
    }
    body = `<h1 class="font-display font-bold text-3xl text-ink-900">Results for “${esc(q)}”</h1>
${closeMatches && (series.length || authors.length) ? `<p class="mt-2 text-ink-700">No exact match — showing close matches instead.</p>` : ""}
${authors.length ? `<h2 class="font-display font-semibold text-2xl text-ink-900 mt-8">Authors</h2><div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 mt-4">${authors.map((a) => `<a href="/authors/${a.slug}" class="block rounded-2xl bg-white border border-ink-200 p-4 hover:border-amber-accent"><p class="font-display font-semibold text-ink-900">${esc(a.name)}</p><p class="text-sm text-ink-700/80 mt-1">${a.series_count} series · ${bookNoun(a.book_count)}</p></a>`).join("")}</div>` : ""}
${series.length ? `<h2 class="font-display font-semibold text-2xl text-ink-900 mt-8">Series</h2><div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 mt-4">${series.map(seriesCard).join("")}</div>` : ""}
${bookHits.length ? `<h2 class="font-display font-semibold text-2xl text-ink-900 mt-8">Books</h2><ul class="mt-4 space-y-2">${bookHits.map((b) => `<li class="rounded-xl bg-white border border-ink-200 px-4 py-3 text-sm"><a class="font-medium text-ink-900 hover:text-amber-accent" href="/series/${b.series_slug}">${esc(b.title)}</a>${b.year ? ` <span class="text-ink-700/75">(${b.year})</span>` : ""} <span class="text-ink-700/75">— ${esc(b.series_name)}${b.author_name ? ` by ${esc(b.author_name)}` : ""}</span></li>`).join("")}</ul>` : ""}
${!series.length && !authors.length && !bookHits.length ? `<p class="mt-6 text-ink-700">Nothing found. Try a different spelling, or <a href="/authors" class="text-amber-accent underline">browse all authors</a>.</p>` : ""}`;
  }
  return c.html(
    layout({
      title: q ? `“${q}” — Search | Shelfmark` : "Search | Shelfmark",
      description: "Search book series and authors on Shelfmark.",
      path: "/search",
      siteUrl: c.env.SITE_URL,
      noindex: !!q,
      body,
    })
  );
});

// ---------- Shelf (client-rendered) ----------
app.get("/shelf", (c) => {
  const body = `
<h1 class="font-display font-bold text-3xl sm:text-4xl text-ink-900">My Shelf</h1>
<p class="mt-2 text-ink-700 max-w-2xl">Everything you've ticked off, in one place. Stored privately in this browser — nothing leaves your device.</p>
<div id="shelf-root" class="mt-8"><p class="text-ink-700/75">Loading your shelf…</p></div>
<div class="mt-10 flex flex-wrap gap-3">
  <button id="share-card-btn" class="rounded-full bg-ink-900 text-ink-50 px-5 py-2.5 text-sm font-semibold hover:bg-ink-700">Download my reading card</button>
  <button id="export-btn" class="rounded-full bg-white border border-ink-200 px-5 py-2.5 text-sm font-semibold hover:border-amber-accent">Export JSON</button>
  <button id="import-btn" class="rounded-full bg-white border border-ink-200 px-5 py-2.5 text-sm font-semibold hover:border-amber-accent">Import JSON</button>
  <input id="import-file" type="file" accept="application/json,.json" class="hidden" aria-label="Import shelf backup file">
  <span id="import-status" role="status" class="text-sm text-ink-700/80 self-center"></span>
</div>
<p class="mt-3 text-xs text-ink-700/75 max-w-2xl">Export downloads a backup of your shelf as a JSON file. Import merges a backup into this browser — useful when switching devices.</p>
<canvas id="share-canvas" width="1080" height="1350" class="hidden"></canvas>`;
  return c.html(
    layout({
      title: "My Shelf — Private Reading Tracker | Shelfmark",
      description: "Your private, no-signup reading progress across every series you follow on Shelfmark.",
      path: "/shelf",
      siteUrl: c.env.SITE_URL,
      body,
    })
  );
});

// ---------- New releases ----------
app.get("/new", async (c) => {
  const year = new Date().getFullYear();
  const { results: upcoming } = await c.env.DB.prepare(
    `SELECT b.title, b.year, b.cover_url, s.slug AS series_slug, s.name AS series_name, a.name AS author_name FROM books b JOIN series s ON s.id=b.series_id LEFT JOIN authors a ON a.id=b.author_id WHERE b.year>=? AND b.year<=? AND s.author_id IS NOT NULL AND s.book_count BETWEEN 2 AND 80 AND s.genre IS NOT NULL AND s.genre NOT LIKE '%dictionary%' AND s.genre NOT LIKE '%encyclopedia%' AND s.genre NOT LIKE '%reference%' AND s.genre NOT LIKE '%comic strip%' AND s.genre NOT LIKE '%webcomic%' AND s.first_year IS NOT NULL AND s.first_year < b.year ORDER BY b.year, s.book_count DESC, b.title LIMIT 300`
  ).bind(year, year + 1).all<{ title: string; year: number; cover_url: string | null; series_slug: string; series_name: string; author_name: string | null }>();
  const byYear = new Map<number, typeof upcoming>();
  for (const b of upcoming) {
    if (!byYear.has(b.year)) byYear.set(b.year, []);
    byYear.get(b.year)!.push(b);
  }
  const body = `
${crumbs([["New releases", ""]])}
<h1 class="font-display font-bold text-3xl sm:text-4xl text-ink-900">New &amp; Upcoming Series Books</h1>
<p class="mt-3 text-ink-700 max-w-2xl">Series installments published in ${year}–${year + 1}, by series. Open a series page to see where the new book fits in the reading order. <a class="text-amber-accent underline whitespace-nowrap" href="/new.rss">RSS feed</a></p>
${[...byYear.entries()].map(([y, list]) => `<section class="mt-10"><h2 class="font-display font-semibold text-2xl text-ink-900">${y}</h2><ul class="mt-4 space-y-2">${list.map((b) => `<li class="flex items-center gap-3 rounded-xl bg-white border border-ink-200 px-4 py-3 text-sm">${b.cover_url ? `<img src="${esc(b.cover_url)}" alt="" loading="lazy" width="38" height="57" class="w-[38px] h-[57px] object-cover rounded shadow-sm shrink-0 bg-ink-100">` : `<span aria-hidden="true" class="w-[38px] h-[57px] rounded shadow-sm shrink-0 bg-ink-100 border border-ink-200 flex items-center justify-center font-display font-semibold text-ink-700/75">${esc((b.title[0] ?? "?").toUpperCase())}</span>`}<span class="min-w-0"><span class="font-medium text-ink-900">${esc(b.title)}</span> <span class="text-ink-700/75">— <a class="text-amber-accent hover:underline" href="/series/${b.series_slug}">${esc(b.series_name)}</a>${b.author_name ? ` by ${esc(b.author_name)}` : ""}</span></span></li>`).join("")}</ul></section>`).join("")}
${!upcoming.length ? `<p class="mt-6 text-ink-700">No upcoming releases recorded yet — check back soon.</p>` : ""}`;
  return c.html(
    layout({
      title: `New Book Series Releases ${year} & ${year + 1} | Shelfmark`,
      description: `New and upcoming series books for ${year}–${year + 1}, linked to full reading orders.`,
      path: "/new",
      siteUrl: c.env.SITE_URL,
      jsonLd: [breadcrumbLd(c.env.SITE_URL, [["New releases", "/new"]])],
      rss: "/new.rss",
      body,
    })
  );
});

app.get("/new.rss", async (c) => {
  const year = new Date().getFullYear();
  const { results: items } = await c.env.DB.prepare(
    `SELECT b.title, b.year, s.slug AS series_slug, s.name AS series_name, a.name AS author_name FROM books b JOIN series s ON s.id=b.series_id LEFT JOIN authors a ON a.id=b.author_id WHERE b.year>=? AND b.year<=? AND s.author_id IS NOT NULL AND s.book_count BETWEEN 2 AND 80 AND s.genre IS NOT NULL AND s.genre NOT LIKE '%dictionary%' AND s.genre NOT LIKE '%encyclopedia%' AND s.genre NOT LIKE '%reference%' AND s.genre NOT LIKE '%comic strip%' AND s.genre NOT LIKE '%webcomic%' AND s.first_year IS NOT NULL AND s.first_year < b.year ORDER BY b.year, s.book_count DESC, b.title LIMIT 100`
  ).bind(year, year + 1).all<{ title: string; year: number; series_slug: string; series_name: string; author_name: string | null }>();
  const site = c.env.SITE_URL;
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
<title>Shelfmark — New &amp; Upcoming Series Books</title>
<link>${site}/new</link>
<atom:link href="${site}/new.rss" rel="self" type="application/rss+xml"/>
<description>New and upcoming series installments for ${year}–${year + 1}, linked to full reading orders.</description>
<language>en</language>
${items.map((b) => `<item>
<title>${esc(b.title)} (${b.series_name ? esc(b.series_name) : ""}${b.author_name ? ` by ${esc(b.author_name)}` : ""}, ${b.year})</title>
<link>${site}/series/${b.series_slug}</link>
<guid isPermaLink="false">${site}/series/${b.series_slug}#${esc(b.title)}-${b.year}</guid>
<description>${esc(b.title)} — a ${b.year} installment in ${esc(b.series_name)}${b.author_name ? ` by ${esc(b.author_name)}` : ""}. See the full reading order on Shelfmark.</description>
</item>`).join("\n")}
</channel>
</rss>`;
  c.header("Content-Type", "application/rss+xml; charset=utf-8");
  c.header("Cache-Control", "public, max-age=3600");
  return c.body(xml);
});

app.get("/opensearch.xml", (c) => {
  const site = c.env.SITE_URL;
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<OpenSearchDescription xmlns="http://a9.com/-/spec/opensearch/1.1/">
<ShortName>Shelfmark</ShortName>
<Description>Search book series and authors on Shelfmark — reading orders and a free tracker.</Description>
<InputEncoding>UTF-8</InputEncoding>
<Image width="16" height="16" type="image/svg+xml">${site}/favicon.svg</Image>
<Url type="text/html" method="get" template="${site}/search?q={searchTerms}"/>
<Url type="application/x-suggestions+json" method="get" template="${site}/api/opensearch-suggest?q={searchTerms}"/>
</OpenSearchDescription>`;
  c.header("Content-Type", "application/opensearchdescription+xml; charset=utf-8");
  c.header("Cache-Control", "public, max-age=86400");
  return c.body(xml);
});

app.get("/api/opensearch-suggest", async (c) => {
  const q = (c.req.query("q") ?? "").trim().slice(0, 60);
  if (q.length < 2) return c.json([q, []]);
  const like = `${q.replace(/[%_]/g, " ")}%`;
  const { results } = await c.env.DB.prepare(
    `SELECT name FROM series WHERE name LIKE ? AND book_count > 0 ORDER BY book_count DESC LIMIT 5`
  ).bind(like).all<{ name: string }>();
  c.header("Cache-Control", "public, max-age=3600");
  return c.json([q, results.map((s) => s.name)]);
});

// ---------- Static-ish pages ----------
app.get("/about", (c) =>
  c.html(
    layout({
      title: "About & Methodology | Shelfmark",
      description: "How Shelfmark builds its reading-order database from Wikidata and Open Library, and how the private tracker works.",
      path: "/about",
      siteUrl: c.env.SITE_URL,
      body: `<h1 class="font-display font-bold text-3xl text-ink-900">About Shelfmark</h1>
<div class="prose mt-6 max-w-2xl text-ink-700 space-y-4">
<p>Shelfmark answers one question well: <strong>“In what order should I read this series?”</strong> — and then lets you tick books off as you go, without creating an account.</p>
<h2 class="font-display font-semibold text-2xl text-ink-900 mt-8">Methodology</h2>
<p>Our series and reading-order data is built from <a class="text-amber-accent underline" href="https://www.wikidata.org">Wikidata</a> (CC0) series relationships and ordinals, cross-checked with <a class="text-amber-accent underline" href="https://openlibrary.org">Open Library</a> records. We list <em>publication order</em> by default — the order most authors intend. Spotted an error? Email <a class="text-amber-accent underline" href="mailto:contact@zalize.com">contact@zalize.com</a> and we'll fix it.</p>
<h2 class="font-display font-semibold text-2xl text-ink-900 mt-8">Privacy-first tracking</h2>
<p>Your reading progress is stored in your browser's localStorage only. We run no ad trackers and set no cookies; our analytics is a first-party, cookie-less page counter.</p>
<h2 class="font-display font-semibold text-2xl text-ink-900 mt-8">Part of the Zalize family</h2>
<p>Shelfmark is built by the team behind <a class="text-amber-accent underline" href="https://watchdeck.zalize.com">WatchDeck</a> (TV tracking), <a class="text-amber-accent underline" href="https://mealloop.zalize.com">MealLoop</a>, <a class="text-amber-accent underline" href="https://subsleuth.zalize.com">SubSleuth</a>, <a class="text-amber-accent underline" href="https://cv.zalize.com">HonestCV</a> and <a class="text-amber-accent underline" href="https://astrosage.zalize.com">AstroSage</a>.</p>
</div>`,
    })
  )
);

app.get("/privacy", (c) =>
  c.html(
    layout({
      title: "Privacy Policy | Shelfmark",
      description: "Shelfmark privacy policy: no cookies, no ad trackers, localStorage-only reading progress.",
      path: "/privacy",
      siteUrl: c.env.SITE_URL,
      body: `<h1 class="font-display font-bold text-3xl text-ink-900">Privacy Policy</h1>
<div class="mt-6 max-w-2xl text-ink-700 space-y-4">
<p><strong>Reading progress</strong> is stored only in your browser's localStorage. It is never transmitted to our servers.</p>
<p><strong>Analytics</strong>: we count page views with a first-party, cookie-less counter (URL path + day only). No IP addresses, fingerprints, or identifiers are stored.</p>
<p><strong>Email</strong>: if you subscribe for alerts we store your email address for that purpose only. One-click unsubscribe by replying or emailing <a class="text-amber-accent underline" href="mailto:contact@zalize.com">contact@zalize.com</a>. We never sell or share it.</p>
<p><strong>Cookies</strong>: none.</p>
<p>Contact: contact@zalize.com · Operated by Zalize.</p>
</div>`,
    })
  )
);

// ---------- APIs ----------
app.get("/api/suggest", async (c) => {
  const q = (c.req.query("q") ?? "").trim().slice(0, 60);
  if (q.length < 2) return c.json({ results: [] });
  const like = `${q.replace(/[%_]/g, " ")}%`;
  const { results: series } = await c.env.DB.prepare(
    `SELECT name, slug FROM series WHERE name LIKE ? AND book_count > 0 ORDER BY book_count DESC LIMIT 5`
  ).bind(like).all<{ name: string; slug: string }>();
  const { results: authors } = await c.env.DB.prepare(
    `SELECT name, slug FROM authors WHERE name LIKE ? ORDER BY book_count DESC LIMIT 3`
  ).bind(like).all<{ name: string; slug: string }>();
  const { results: books } = await c.env.DB.prepare(
    `SELECT b.title, s.slug FROM books b JOIN series s ON s.id=b.series_id WHERE b.title LIKE ? AND s.book_count > 0 ORDER BY s.book_count DESC LIMIT 3`
  ).bind(like).all<{ title: string; slug: string }>();
  c.header("Cache-Control", "public, max-age=3600");
  const seen = new Set<string>();
  return c.json({
    results: [
      ...series.map((s) => ({ label: s.name, href: `/series/${s.slug}`, kind: "series" })),
      ...authors.map((a) => ({ label: a.name, href: `/authors/${a.slug}`, kind: "author" })),
      ...books.filter((b) => (seen.has(b.title) ? false : (seen.add(b.title), true))).map((b) => ({ label: b.title, href: `/series/${b.slug}`, kind: "book" })),
    ].slice(0, 8),
  });
});

app.get("/api/series-books/:slug", async (c) => {
  const slug = c.req.param("slug");
  const series = await c.env.DB.prepare(`SELECT id FROM series WHERE slug=?`).bind(slug).first<{ id: number }>();
  if (!series) return c.json({ books: [] }, 404);
  const { results: books } = await c.env.DB.prepare(
    `SELECT id, title, position, year FROM books WHERE series_id=? AND wikidata_id NOT IN (SELECT wikidata_id FROM series WHERE wikidata_id IS NOT NULL) ORDER BY position, year, id`
  ).bind(series.id).all<{ id: number; title: string; position: number | null; year: number | null }>();
  const positions = books.map((b) => b.position).filter((p): p is number => p != null);
  const ordered = new Set(positions).size !== positions.length
    ? [...books].sort((a, b) => (a.year ?? 9999) - (b.year ?? 9999) || (a.position ?? 0) - (b.position ?? 0))
    : books;
  c.header("Cache-Control", "public, max-age=3600");
  return c.json({ books: ordered.map((b) => ({ id: b.id, title: b.title })) });
});

app.post("/api/subscribe", async (c) => {
  if (await rateLimited(c, "sub", 5)) return c.json({ ok: false, error: "Too many requests" }, 429);
  const { email, source } = await c.req.json<{ email?: string; source?: string }>().catch(() => ({}) as any);
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || email.length > 200) {
    return c.json({ ok: false, error: "Invalid email" }, 400);
  }
  const token = crypto.randomUUID().replace(/-/g, "");
  await c.env.DB.prepare(`INSERT OR IGNORE INTO emails (email, source, token) VALUES (?, ?, ?)`)
    .bind(email.toLowerCase(), (source ?? "footer").slice(0, 100), token).run();
  return c.json({ ok: true });
});

app.post("/api/migrate-ids", async (c) => {
  if (await rateLimited(c, "mig", 10)) return c.json({}, 429);
  const { ids } = await c.req.json<{ ids?: unknown }>().catch(() => ({}) as { ids?: unknown });
  if (!Array.isArray(ids) || !ids.length) return c.json({});
  const nums = ids.map((x) => parseInt(String(x), 10)).filter((n) => Number.isFinite(n)).slice(0, 2000);
  if (!nums.length) return c.json({});
  const map: Record<string, number> = {};
  for (let i = 0; i < nums.length; i += 100) {
    const chunk = nums.slice(i, i + 100);
    const { results } = await c.env.DB.prepare(
      `SELECT old_id, new_id FROM id_migrations WHERE old_id IN (${chunk.map(() => "?").join(",")})`
    ).bind(...chunk).all<{ old_id: number; new_id: number }>();
    for (const r of results) map[String(r.old_id)] = r.new_id;
  }
  return c.json(map);
});

app.post("/api/hit", async (c) => {
  if (await rateLimited(c, "hit", 60)) return c.body(null, 429);
  const path = (await c.req.text()).slice(0, 200);
  if (!path.startsWith("/")) return c.body(null, 204);
  const day = new Date().toISOString().slice(0, 10);
  await c.env.DB.prepare(
    `INSERT INTO hits (day, path, count) VALUES (?, ?, 1) ON CONFLICT(day, path) DO UPDATE SET count = count + 1`
  ).bind(day, path).run();
  return c.body(null, 204);
});

app.get("/confirm", async (c) => {
  const token = (c.req.query("t") ?? "").slice(0, 64);
  let ok = false;
  if (/^[a-f0-9]{32}$/.test(token)) {
    const r = await c.env.DB.prepare(`UPDATE emails SET confirmed=1 WHERE token=?`).bind(token).run();
    ok = (r.meta.changes ?? 0) > 0;
  }
  return c.html(
    layout({
      title: "Email confirmation | Shelfmark",
      description: "Confirm your Shelfmark email subscription.",
      path: "/confirm",
      siteUrl: c.env.SITE_URL,
      body: `<div class="text-center py-16"><h1 class="font-display font-bold text-3xl text-ink-900">${ok ? "You’re confirmed!" : "Link invalid or already used"}</h1><p class="mt-3 text-ink-700">${ok ? "We’ll email you when series you track get new releases." : "Try subscribing again from the footer of any page."}</p></div>`,
    }),
    ok ? 200 : 400
  );
});

// ---------- SEO plumbing ----------
app.get("/robots.txt", (c) =>
  c.text(`User-agent: *\nAllow: /\nDisallow: /api/\nSitemap: ${c.env.SITE_URL}/sitemap.xml\n`)
);

const SM_CHUNK = 5000;
app.get("/sitemap.xml", async (c) => {
  const [{ na }] = ((await c.env.DB.prepare(`SELECT COUNT(*) AS na FROM authors`).all()).results as any[]);
  const [{ ns }] = ((await c.env.DB.prepare(`SELECT COUNT(*) AS ns FROM series`).all()).results as any[]);
  const parts = Math.ceil(Number(na) / SM_CHUNK) + Math.ceil(Number(ns) / SM_CHUNK);
  const items = Array.from({ length: parts }, (_, i) => `<sitemap><loc>${c.env.SITE_URL}/sitemaps/${i + 1}.xml</loc></sitemap>`).join("");
  return c.body(`<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${items}</sitemapindex>`, 200, { "content-type": "application/xml" });
});

app.get("/sitemaps/:file", async (c) => {
  const m = /^([0-9]+)\.xml$/.exec(c.req.param("file"));
  if (!m) return notFound(c);
  const n = parseInt(m[1]);
  const [{ na }] = ((await c.env.DB.prepare(`SELECT COUNT(*) AS na FROM authors`).all()).results as any[]);
  const authorParts = Math.ceil(Number(na) / SM_CHUNK);
  let urls: string[];
  if (n <= authorParts) {
    const { results } = await c.env.DB.prepare(`SELECT slug FROM authors ORDER BY id LIMIT ? OFFSET ?`)
      .bind(SM_CHUNK, (n - 1) * SM_CHUNK).all<{ slug: string }>();
    urls = results.map((r) => `/authors/${r.slug}`);
  } else {
    const m = n - authorParts;
    const { results } = await c.env.DB.prepare(`SELECT slug FROM series ORDER BY id LIMIT ? OFFSET ?`)
      .bind(SM_CHUNK, (m - 1) * SM_CHUNK).all<{ slug: string }>();
    urls = results.map((r) => `/series/${r.slug}`);
  }
  if (n === 1) {
    urls.unshift("/", "/series", "/authors", "/genres", "/shelf", "/about", "/new");
    for (const l of "ABCDEFGHIJKLMNOPQRSTUVWXYZ") urls.push(`/authors?letter=${l}`, `/series?letter=${l}`);
    const { results: genres } = await c.env.DB.prepare(
      `SELECT genre, COUNT(*) AS n FROM series WHERE genre IS NOT NULL GROUP BY genre HAVING n >= 3`
    ).all<{ genre: string }>();
    urls.push(...genres.map((g) => `/genres/${gslug(g.genre)}`));
  }
  const body = urls.map((u) => `<url><loc>${c.env.SITE_URL}${u}</loc></url>`).join("");
  return c.body(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</urlset>`, 200, { "content-type": "application/xml" });
});

function notFound(c: any, suggestions: { href: string; label: string }[] = [], query = "") {
  return c.html(
    layout({
      title: "Not Found | Shelfmark",
      description: "Page not found.",
      path: c.req.path,
      siteUrl: c.env.SITE_URL,
      body: `<div class="text-center py-16"><h1 class="font-display font-bold text-4xl text-ink-900">Page not found</h1>
${suggestions.length ? `<p class="mt-4 text-ink-700">Were you looking for one of these?</p><ul class="mt-3 space-y-1.5">${suggestions.map((s) => `<li><a class="text-amber-accent underline" href="${s.href}">${esc(s.label)}</a></li>`).join("")}</ul>` : ""}
<p class="mt-4 text-ink-700">Try <a href="/search${query ? `?q=${encodeURIComponent(query)}` : ""}" class="text-amber-accent underline">searching</a> for a series or author.</p></div>`,
    }),
    404
  );
}

const slugWords = (slug: string) =>
  slug.replace(/-\d+$/, "").split("-").filter((w) => w.length > 2).slice(0, 3).map((w) => `%${w.slice(0, 5)}%`);

async function seriesSuggestions(c: any, slug: string): Promise<{ href: string; label: string }[]> {
  const words = slugWords(slug);
  if (!words.length) return [];
  const { results } = await c.env.DB.prepare(
    `SELECT s.slug, s.name, a.name AS author_name FROM series s LEFT JOIN authors a ON a.id=s.author_id WHERE s.book_count > 0 AND (${words.map(() => "s.name LIKE ?").join(" OR ")}) ORDER BY s.book_count DESC LIMIT 5`
  ).bind(...words).all();
  return (results as { slug: string; name: string; author_name: string | null }[]).map((s) => ({ href: `/series/${s.slug}`, label: s.name + (s.author_name ? ` by ${s.author_name}` : "") }));
}

async function authorSuggestions(c: any, slug: string): Promise<{ href: string; label: string }[]> {
  const words = slugWords(slug);
  if (!words.length) return [];
  const { results } = await c.env.DB.prepare(
    `SELECT slug, name FROM authors WHERE ${words.map(() => "name LIKE ?").join(" OR ")} ORDER BY book_count DESC LIMIT 5`
  ).bind(...words).all();
  return (results as { slug: string; name: string }[]).map((a) => ({ href: `/authors/${a.slug}`, label: a.name }));
}

app.notFound(notFound);

export default app;
