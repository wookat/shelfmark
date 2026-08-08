import { Hono } from "hono";
import { layout, esc } from "./html";

type Env = {
  DB: D1Database;
  CACHE: KVNamespace;
  ASSETS: Fetcher;
  SITE_URL: string;
  RESEND_API_KEY?: string;
};

type Author = { id: number; slug: string; name: string; bio: string | null; series_count: number; book_count: number; photo_url: string | null };
type Series = { id: number; slug: string; name: string; author_id: number | null; description: string | null; genre: string | null; book_count: number; first_year: number | null; last_year: number | null; cover_url?: string | null; author_name?: string; author_slug?: string; parent_id?: number | null };
type Book = { id: number; series_id: number | null; author_id: number | null; title: string; year: number | null; position: number | null; cover_url: string | null; description: string | null };
type TrackList = { slug: string; name: string; author_name?: string | null };

const app = new Hono<{ Bindings: Env }>();

app.use("*", async (c, next) => {
  await next();
  const h = c.res.headers;
  h.set("X-Content-Type-Options", "nosniff");
  h.set("Referrer-Policy", "strict-origin-when-cross-origin");
  h.set("X-Frame-Options", "DENY");
  h.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  h.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()");
  if ((h.get("content-type") ?? "").includes("text/html")) {
    const p = new URL(c.req.url).pathname;
    if (c.req.method === "GET" && c.res.status === 200 && !h.has("Cache-Control") && p !== "/confirm" && p !== "/unsubscribe" && p !== "/shelf") {
      h.set("Cache-Control", "public, max-age=300, stale-while-revalidate=3600");
    }
    h.set(
      "Content-Security-Policy",
      "default-src 'self'; img-src 'self' https://covers.openlibrary.org https://archive.org https://*.archive.org https://commons.wikimedia.org https://upload.wikimedia.org data:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; script-src 'self' https://static.cloudflareinsights.com; connect-src 'self' https://cloudflareinsights.com; base-uri 'self'; form-action 'self'; frame-ancestors 'none'"
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
function fmtYear(y: number): string {
  return y <= 0 ? `${1 - y} BCE` : String(y);
}

function yearsSpan(s: Series) {
  if (s.first_year && s.last_year && s.first_year !== s.last_year) return `${fmtYear(s.first_year)}–${fmtYear(s.last_year)}`;
  return s.first_year ? fmtYear(s.first_year) : "";
}

function seriesCard(s: Series): string {
  return `<a href="/series/${s.slug}" class="card-lift flex gap-3 rounded-2xl bg-white border border-ink-200 p-4 hover:border-amber-accent">
    ${s.cover_url ? `<img src="${esc(s.cover_url)}" alt="" width="40" height="56" loading="lazy" class="w-10 h-14 rounded object-cover border border-ink-200 bg-ink-100 shrink-0">` : `<span aria-hidden="true" class="w-10 h-14 rounded bg-ink-100 border border-ink-200 shrink-0 flex items-center justify-center font-display font-semibold text-ink-700/60">${esc((s.name[0] ?? "?").toUpperCase())}</span>`}
    <div class="min-w-0 flex-1">
    <p class="font-display font-semibold text-ink-900">${esc(s.name)}</p>
    <p class="text-sm text-ink-700/80 mt-1">${s.author_name ? esc(s.author_name) + " · " : ""}${bookNoun(s.book_count)}${yearsSpan(s) ? " · " + yearsSpan(s) : ""}</p>
    <div class="mt-2 h-1.5 rounded-full bg-ink-100 overflow-hidden"><div class="h-full bg-amber-accent rounded-full" style="width:0%" data-progress-bar="${s.slug}" data-total="${s.book_count}"></div></div>
    </div>
  </a>`;
}

function authorCard(a: Author): string {
  return `<a href="/authors/${a.slug}" class="card-lift flex items-center gap-3 rounded-2xl bg-white border border-ink-200 p-4 hover:border-amber-accent">${a.photo_url ? `<img src="${esc(a.photo_url.replace("width=256", "width=96"))}" alt="" width="48" height="48" loading="lazy" class="w-12 h-12 rounded-full object-cover border border-ink-200 bg-ink-100 shrink-0">` : `<span aria-hidden="true" class="w-12 h-12 rounded-full bg-ink-100 border border-ink-200 shrink-0 flex items-center justify-center font-display font-semibold text-ink-700/75">${esc((a.name[0] ?? "?").toUpperCase())}</span>`}<div class="min-w-0"><p class="font-display font-semibold text-ink-900">${esc(a.name)}</p><p class="text-sm text-ink-700/80 mt-0.5">${a.series_count} series · ${bookNoun(a.book_count)}</p></div></a>`;
}

// ---------- Random series discovery ----------
app.get("/random", async (c) => {
  const row = await c.env.DB.prepare(
    `SELECT slug FROM series WHERE book_count BETWEEN 2 AND 80 AND author_id IS NOT NULL AND genre IS NOT NULL AND genre NOT LIKE '%dictionary%' AND genre NOT LIKE '%encyclopedia%' AND genre NOT LIKE '%reference%' ORDER BY RANDOM() LIMIT 1`
  ).first<{ slug: string }>();
  c.header("Cache-Control", "no-store");
  c.header("X-Robots-Tag", "noindex");
  return c.redirect(row ? `/series/${row.slug}` : "/series", 302);
});

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
  const heroCovers = popular.filter((s) => s.cover_url).slice(0, 7);
  const body = `
<section class="text-center py-10">
  <h1 class="font-display font-bold text-4xl sm:text-6xl text-ink-900 leading-tight">Read every series<br>in the <em class="text-amber-accent">right order</em>.</h1>
  <p class="mt-4 text-lg text-ink-700 max-w-xl mx-auto">Publication order for ${Number(nb).toLocaleString()} books across ${Number(ns).toLocaleString()} series — with a private reading tracker built in. No account needed.</p>
  <form action="/search" method="get" class="mt-6 max-w-lg mx-auto flex gap-2">
    <input name="q" type="search" required placeholder="Try “Jack Reacher” or “Brandon Sanderson”…" class="flex-1 min-w-0 rounded-full border border-ink-200 bg-white px-5 py-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-accent/50">
    <button class="rounded-full bg-ink-900 text-ink-50 px-6 py-3 text-sm font-semibold hover:bg-ink-700">Search</button>
  </form>
  <p class="mt-3 text-sm text-ink-700/80">or <a href="/random" class="text-amber-accent font-medium underline underline-offset-2">surprise me with a series</a></p>
  ${heroCovers.length >= 5 ? `<div class="hero-covers mt-10 flex justify-center items-end gap-3 sm:gap-5">
    ${heroCovers.map((s, i) => `<a href="/series/${s.slug}" title="${esc(s.name)} reading order" style="transform:rotate(${[-6, 4, -3, 5, -5, 3, -4, 6][i % 8]}deg)" class="shrink-0${i > 3 ? " hidden md:block" : i > 2 ? " hidden sm:block" : ""}"><img src="${esc(s.cover_url!)}" alt="${esc(s.name)}" width="88" height="132" loading="lazy" class="w-16 sm:w-[88px] aspect-[2/3] object-cover rounded-md shadow-md border border-ink-200 bg-ink-100"></a>`).join("")}
  </div>` : ""}
</section>
<div id="continue-reading"></div>
<section class="mt-8">
  <div class="flex items-baseline justify-between"><h2 class="font-display font-semibold text-2xl text-ink-900">Popular series</h2><span class="text-sm"><a href="/popular" class="text-amber-accent font-medium">Top 100 →</a> · <a href="/lists" class="text-amber-accent font-medium">Lists →</a> · <a href="/series" class="text-amber-accent font-medium">All series →</a></span></div>
  <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 mt-4">${popular.map(seriesCard).join("")}</div>
</section>
${fresh.length ? `<section class="mt-12">
  <div class="flex items-baseline justify-between"><h2 class="font-display font-semibold text-2xl text-ink-900">New &amp; upcoming</h2><a href="/new" class="text-sm text-amber-accent font-medium">All new releases →</a></div>
  <ul class="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">${fresh.map((b) => `<li class="min-w-0"><a href="/series/${b.series_slug}" class="card-lift flex items-center gap-3 rounded-2xl bg-white border border-ink-200 p-4 hover:border-amber-accent min-w-0">${b.cover_url ? `<img src="${esc(b.cover_url)}" alt="" loading="lazy" width="38" height="57" class="w-[38px] h-[57px] object-cover rounded shadow-sm shrink-0 bg-ink-100">` : `<span aria-hidden="true" class="w-[38px] h-[57px] rounded shadow-sm shrink-0 bg-ink-100 border border-ink-200 flex items-center justify-center font-display font-semibold text-ink-700/75">${esc((b.title[0] ?? "?").toUpperCase())}</span>`}<span class="min-w-0"><span class="block font-medium text-ink-900 text-sm truncate">${esc(b.title)}${b.year ? ` (${b.year})` : ""}</span><span class="block text-xs text-ink-700/75 mt-0.5 truncate">${esc(b.series_name)}${b.author_name ? ` · ${esc(b.author_name)}` : ""}</span></span></a></li>`).join("")}</ul>
</section>` : ""}
<section class="mt-12">
  <div class="flex items-baseline justify-between"><h2 class="font-display font-semibold text-2xl text-ink-900">Browse by genre</h2><a href="/genres" class="text-sm text-amber-accent font-medium">All genres →</a></div>
  <div class="mt-4 flex flex-wrap gap-2">${topGenres.map((g) => `<a href="/genres/${gslug(g.genre)}" class="rounded-full bg-white border border-ink-200 px-4 py-2 text-sm hover:border-amber-accent">${esc(g.genre)} <span class="text-ink-700/75">${g.n}</span></a>`).join("")}</div>
</section>
<section class="mt-12">
  <div class="flex items-baseline justify-between"><h2 class="font-display font-semibold text-2xl text-ink-900">Prolific authors</h2><a href="/authors" class="text-sm text-amber-accent font-medium">All authors →</a></div>
  <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 mt-4">
    ${authors.map(authorCard).join("")}
  </div>
</section>
<section class="mt-14 rounded-3xl bg-ink-900 text-ink-50 p-8 sm:p-10" data-reveal>
  <h2 class="font-display font-semibold text-2xl">Your shelf lives in your browser.</h2>
  <p class="mt-2 text-ink-50/80 max-w-2xl">Tick off books as you read them on any series page. Your progress is saved privately on your device — no account, no tracking, no social feed. Visit <a href="/shelf" class="underline text-amber-accent">My Shelf</a> to see everything in one place and share a reading card.</p>
</section>`;
  return c.html(
    layout({
      title: "Shelfmark — Book Series in Order + No-Signup Reading Tracker",
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
      description: `Browse ${Number(n).toLocaleString()} book series${letter ? ` starting with ${letter}` : ""} with complete reading orders and a built-in no-signup progress tracker.`,
      path: letter ? `/series?letter=${letter}${page > 1 ? `&page=${page}` : ""}` : page > 1 ? `/series?page=${page}` : "/series",
      siteUrl: c.env.SITE_URL,
      body,
    })
  );
});

// ---------- Popular series ----------
app.get("/popular", async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT s.*, a.name AS author_name FROM series s LEFT JOIN authors a ON a.id=s.author_id WHERE s.book_count BETWEEN 3 AND 80 AND s.author_id IS NOT NULL AND s.genre IS NOT NULL AND s.genre NOT LIKE '%dictionary%' AND s.genre NOT LIKE '%encyclopedia%' AND s.genre NOT LIKE '%reference%' ORDER BY s.book_count DESC, s.name LIMIT 100`
  ).all<Series>();
  const body = `
<nav aria-label="Breadcrumb" class="text-sm text-ink-700/75 mb-4"><a href="/" class="hover:text-amber-accent">Home</a> / <span aria-current="page">Popular</span></nav>
<h1 class="font-display font-bold text-3xl text-ink-900">The 100 most popular book series</h1>
<p class="mt-2 text-ink-700 max-w-2xl">The biggest, best-documented series in the Shelfmark catalog — every one with a complete reading order and a built-in no-signup progress tracker.</p>
<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 mt-6">${results.map(seriesCard).join("")}</div>`;
  return c.html(
    layout({
      title: "100 Most Popular Book Series in Order | Shelfmark",
      description: "The 100 biggest book series with complete reading orders — track your progress with no account needed (free while in beta).",
      path: "/popular",
      image: results.find((s) => s.cover_url)?.cover_url?.replace("-M.jpg", "-L.jpg"),
      siteUrl: c.env.SITE_URL,
      body,
      jsonLd: [
        breadcrumbLd(c.env.SITE_URL, [["Popular", "/popular"]]),
        {
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "Most popular book series on Shelfmark",
          numberOfItems: results.length,
          itemListElement: results.map((s, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: s.name,
            url: `${c.env.SITE_URL}/series/${s.slug}`,
          })),
        },
      ],
    })
  );
});

// ---------- Curated lists ----------
const LIST_BASE = `s.author_id IS NOT NULL AND s.genre IS NOT NULL AND s.genre NOT LIKE '%dictionary%' AND s.genre NOT LIKE '%encyclopedia%' AND s.genre NOT LIKE '%reference%'`;
const CURATED_LISTS: { slug: string; name: string; blurb: string; where: string; order: string }[] = [
  {
    slug: "trilogies",
    name: "Trilogies to binge",
    blurb: "Complete three-book series — a beginning, a middle, and an end you can finish in a few weekends.",
    where: `${LIST_BASE} AND s.book_count = 3`,
    order: `s.first_year DESC, s.name`,
  },
  {
    slug: "long-running-epics",
    name: "Long-running epics",
    blurb: "Series with 15 or more books — enough reading to last a whole year (or three).",
    where: `${LIST_BASE} AND s.book_count BETWEEN 15 AND 200`,
    order: `s.book_count DESC, s.name`,
  },
  {
    slug: "new-series-of-the-2020s",
    name: "New series of the 2020s",
    blurb: "Series that started in 2020 or later and already have at least two books — get in near the ground floor.",
    where: `${LIST_BASE} AND s.first_year >= 2020 AND s.book_count >= 2`,
    order: `s.book_count DESC, s.first_year DESC, s.name`,
  },
  {
    slug: "classic-series",
    name: "Classic series",
    blurb: "Series that began between 1850 and 1980 and are still being read today — three or more books each.",
    where: `${LIST_BASE} AND s.first_year BETWEEN 1850 AND 1980 AND s.book_count >= 3`,
    order: `s.first_year, s.name`,
  },
];

app.get("/lists", (c) => {
  const body = `
<nav aria-label="Breadcrumb" class="text-sm text-ink-700/75 mb-4"><a href="/" class="hover:text-amber-accent">Home</a> / <span aria-current="page">Lists</span></nav>
<h1 class="font-display font-bold text-3xl text-ink-900">Reading lists</h1>
<p class="mt-2 text-ink-700 max-w-2xl">Focused slices of the catalog, derived straight from the series data — each list links to complete reading orders with the built-in tracker.</p>
<div class="grid gap-3 sm:grid-cols-2 mt-6">${CURATED_LISTS.map((l) => `<a href="/lists/${l.slug}" class="rounded-2xl bg-white border border-ink-200 p-5 hover:border-amber-accent block" data-reveal><h2 class="font-display font-semibold text-xl text-ink-900">${l.name}</h2><p class="mt-1.5 text-sm text-ink-700">${l.blurb}</p></a>`).join("")}</div>`;
  return c.html(
    layout({
      title: "Reading Lists — Curated Book Series | Shelfmark",
      description: "Curated book-series lists: trilogies to binge, long-running epics, new series of the 2020s, classic series — all with complete reading orders.",
      path: "/lists",
      siteUrl: c.env.SITE_URL,
      body,
      jsonLd: [breadcrumbLd(c.env.SITE_URL, [["Lists", "/lists"]])],
    })
  );
});

app.get("/lists/:slug", async (c) => {
  const list = CURATED_LISTS.find((l) => l.slug === c.req.param("slug"));
  if (!list) return notFound(c);
  const { results } = await c.env.DB.prepare(
    `SELECT s.*, a.name AS author_name FROM series s LEFT JOIN authors a ON a.id=s.author_id WHERE ${list.where} ORDER BY ${list.order} LIMIT 60`
  ).all<Series>();
  const body = `
${crumbs([["Lists", "/lists"], [list.name, ""]])}
<h1 class="font-display font-bold text-3xl text-ink-900">${list.name}</h1>
<p class="mt-2 text-ink-700 max-w-2xl">${list.blurb} Showing ${results.length} series — every one with a complete reading order.</p>
<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 mt-6">${results.map(seriesCard).join("")}</div>
<p class="mt-8 text-sm text-ink-700/80">More lists: ${CURATED_LISTS.filter((l) => l.slug !== list.slug).map((l) => `<a class="text-amber-accent underline" href="/lists/${l.slug}">${l.name}</a>`).join(" · ")}</p>`;
  return c.html(
    layout({
      title: `${list.name} — Book Series in Order | Shelfmark`,
      description: `${list.blurb} Complete reading orders with a free no-signup tracker (open beta).`,
      path: `/lists/${list.slug}`,
      image: results.find((s) => s.cover_url)?.cover_url?.replace("-M.jpg", "-L.jpg"),
      siteUrl: c.env.SITE_URL,
      body,
      jsonLd: [
        breadcrumbLd(c.env.SITE_URL, [["Lists", "/lists"], [list.name, `/lists/${list.slug}`]]),
        {
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: `${list.name} on Shelfmark`,
          numberOfItems: results.length,
          itemListElement: results.map((s, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: s.name,
            url: `${c.env.SITE_URL}/series/${s.slug}`,
          })),
        },
      ],
    })
  );
});

// ---------- Pricing ----------
app.get("/pricing", (c) => {
  const check = `<svg class="w-4 h-4 shrink-0 mt-0.5" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3 8.5l3.5 3.5L13 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  const li = (t: string) => `<li class="flex gap-2 text-sm text-ink-700"><span class="text-amber-accent">${check}</span>${t}</li>`;
  const body = `
<nav aria-label="Breadcrumb" class="text-sm text-ink-700/75 mb-4"><a href="/" class="hover:text-amber-accent">Home</a> / <span aria-current="page">Pricing</span></nav>
<h1 class="font-display font-bold text-3xl text-ink-900">Pricing</h1>
<p class="mt-2 text-ink-700 max-w-2xl">Shelfmark is in <strong>open beta</strong>: every feature below is unlocked for everyone, no payment required. These are the plans we intend to charge for once the beta ends — beta users will get generous notice before anything changes.</p>
<div class="grid gap-4 sm:grid-cols-2 mt-8 max-w-3xl">
  <section class="rounded-2xl bg-white border border-ink-200 p-6 flex flex-col">
    <h2 class="font-display font-semibold text-xl text-ink-900">Reader</h2>
    <p class="mt-1 text-3xl font-display font-bold text-ink-900">$0<span class="text-base font-sans font-normal text-ink-700/80"> forever</span></p>
    <ul class="mt-4 space-y-2 flex-1">
      ${li("Every reading-order page — 2,500+ series, 22,000+ authors")}
      ${li("No-signup progress tracker (stays in your browser)")}
      ${li("Search, genres, new &amp; upcoming, RSS feeds")}
      ${li("Save for later list")}
    </ul>
    <a href="/series" class="mt-6 rounded-full border border-ink-200 bg-white px-5 py-2.5 text-sm font-semibold text-center hover:border-amber-accent">Browse series</a>
  </section>
  <section class="rounded-2xl bg-white border-2 border-amber-accent p-6 flex flex-col relative">
    <span class="absolute -top-3 right-4 rounded-full bg-amber-accent text-white text-xs font-semibold px-3 py-1">Free during beta</span>
    <h2 class="font-display font-semibold text-xl text-ink-900">Shelfmark Plus</h2>
    <p class="mt-1 text-3xl font-display font-bold text-ink-900">$2.99<span class="text-base font-sans font-normal text-ink-700/80">/month</span></p>
    <p class="text-sm text-ink-700/80">or $24/year — planned pricing, not charged during beta</p>
    <ul class="mt-4 space-y-2 flex-1">
      ${li("Everything in Reader")}
      ${li("Reading stats, yearly goals &amp; 12-month pace chart")}
      ${li("Shareable reading cards (PNG)")}
      ${li("JSON &amp; CSV backup export / import")}
      ${li("Up-next badges &amp; bulk tracker actions")}
      ${li("Priority access to the open data API")}
    </ul>
    <a href="/shelf" class="mt-6 rounded-full bg-ink-900 text-ink-50 px-5 py-2.5 text-sm font-semibold text-center hover:bg-ink-700">Start free beta trial</a>
  </section>
</div>
<div class="mt-10 max-w-3xl space-y-4">
  <h2 class="font-display font-semibold text-2xl text-ink-900">Pricing FAQ</h2>
  <div><h3 class="font-semibold text-ink-900">Do I need to pay anything today?</h3><p class="text-ink-700 mt-1">No. While Shelfmark is in beta, every Plus feature is unlocked for all visitors and we do not collect any payment.</p></div>
  <div><h3 class="font-semibold text-ink-900">Will my reading data be locked behind the paywall later?</h3><p class="text-ink-700 mt-1">Never. Your progress lives in your own browser and the export tools will always let you take it with you.</p></div>
  <div><h3 class="font-semibold text-ink-900">When does the beta end?</h3><p class="text-ink-700 mt-1">No date is set. Beta users will get clear notice on this page before any plan starts charging.</p></div>
</div>`;
  return c.html(
    layout({
      title: "Pricing — Free During Beta | Shelfmark",
      description: "Shelfmark plans: Reader ($0) and Shelfmark Plus ($2.99/mo, planned). Everything is unlocked free while we're in open beta.",
      path: "/pricing",
      siteUrl: c.env.SITE_URL,
      body,
      jsonLd: [breadcrumbLd(c.env.SITE_URL, [["Pricing", "/pricing"]])],
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
${results.map(authorCard).join("")}
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
  const topGenre = series.find((s) => s.genre)?.genre ?? null;
  const { results: similar } = topGenre
    ? await c.env.DB.prepare(
        `SELECT a.name, a.slug, MAX(s.book_count) AS top FROM authors a JOIN series s ON s.author_id=a.id
         WHERE s.genre=? AND s.book_count > 0 AND a.id != ? GROUP BY a.id ORDER BY top DESC LIMIT 6`
      ).bind(topGenre, author.id).all<{ name: string; slug: string }>()
    : { results: [] as { name: string; slug: string }[] };
  const latestBook = books.reduce<Book | null>((m, b) => (b.year != null && (m?.year == null || b.year > m.year) ? b : m), null);
  const authorFaqs: [string, string][] = [];
  if (author.book_count) authorFaqs.push([`How many books has ${author.name} written?`, `${author.name} has ${bookNoun(author.book_count)} on record${author.series_count ? ` across ${author.series_count} series` : ""}.`]);
  if (latestBook?.year) authorFaqs.push([`What is the most recent ${author.name} book?`, `The most recent ${author.name} book on record is “${latestBook.title}” (${latestBook.year}).`]);
  if (series[0] && series[0].book_count >= 2) authorFaqs.push([`What is ${author.name}'s longest series?`, `${author.name}'s longest series is ${series[0].name}, with ${bookNoun(series[0].book_count)}${yearsSpan(series[0]) ? ` published ${yearsSpan(series[0])}` : ""}.`]);
  const body = `
${crumbs([["Authors", "/authors"], [author.name, ""]])}
${author.photo_url ? `<img src="${esc(author.photo_url)}" alt="${esc(author.name)}" width="112" height="112" loading="lazy" class="float-right ml-4 mb-2 w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border border-ink-200 shadow-sm bg-ink-100">` : ""}
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
    ${bs.length ? `<button type="button" data-copylist="${s.slug}" class="text-sm rounded-full bg-white border border-ink-200 px-3 py-1 hover:border-amber-accent print:hidden cursor-pointer">Copy list</button>` : ""}
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
  ${bookList(standalone, { slug: `standalone-${slug}`, name: `${author.name} — standalone`, author_name: author.name })}
</section>` : ""}
${authorFaqs.length ? `<section class="mt-12"><h2 class="font-display font-semibold text-2xl text-ink-900">${esc(author.name)} FAQ</h2><dl class="mt-4 space-y-4 max-w-2xl">${authorFaqs.map(([q2, a2]) => `<div class="rounded-xl bg-white border border-ink-200 px-4 py-3"><dt class="font-medium text-ink-900">${esc(q2)}</dt><dd class="mt-1 text-sm text-ink-700">${esc(a2)}</dd></div>`).join("")}</dl></section>` : ""}
${similar.length ? `<section class="mt-12 print:hidden">
  <h2 class="font-display font-semibold text-2xl text-ink-900">More ${esc(topGenre!.toLowerCase())} authors</h2>
  <div class="mt-4 flex flex-wrap gap-2">
    ${similar.map((a) => `<a href="/authors/${a.slug}" class="rounded-full bg-white border border-ink-200 px-4 py-2 text-sm hover:border-amber-accent">${esc(a.name)}</a>`).join("")}
    <a href="/genres/${gslug(topGenre!)}" class="rounded-full bg-white border border-ink-200 px-4 py-2 text-sm text-amber-accent hover:border-amber-accent">All ${esc(topGenre!.toLowerCase())} series →</a>
  </div>
</section>` : ""}`;
  return c.html(
    layout({
      title: `${author.name} Books in Order (Complete Series List) | Shelfmark`,
      description: `Complete list of ${author.name} books in order: ${series.slice(0, 3).map((s) => s.name).join(", ")}${series.length > 3 ? " and more" : ""}. Reading order + no-signup progress tracker.`,
      path: `/authors/${slug}`,
      siteUrl: c.env.SITE_URL,
      jsonLd: [
        { "@context": "https://schema.org", "@type": "Person", name: author.name, url: `${c.env.SITE_URL}/authors/${slug}`, ...(author.photo_url ? { image: author.photo_url } : {}) },
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
        ...(authorFaqs.length ? [{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: authorFaqs.map(([q2, a2]) => ({
            "@type": "Question",
            name: q2,
            acceptedAnswer: { "@type": "Answer", text: a2 },
          })),
        }] : []),
      ],
      image: author.photo_url?.replace("width=256", "width=512") ?? books.find((b) => b.cover_url)?.cover_url?.replace("-M.jpg", "-L.jpg"),
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
  const thisYear = new Date().getFullYear();
  const recentRelease = latest && latest.year != null && latest.year >= thisYear ? latest : null;
  const body = `
${crumbs(series.author_name ? [["Series", "/series"], [series.author_name, `/authors/${series.author_slug}`], [series.name, ""]] : [["Series", "/series"], [series.name, ""]])}
<h1 class="font-display font-bold text-3xl sm:text-4xl text-ink-900">${esc(series.name)} Books in Order</h1>
${recentRelease ? `<p class="mt-3 rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-sm max-w-2xl"><span class="year-chip !ml-0">${recentRelease.year! > thisYear ? "Upcoming" : `New in ${recentRelease.year}`}</span> <span class="text-ink-700 ml-1">“${esc(recentRelease.title)}”${recentRelease.year! > thisYear ? ` arrives in ${recentRelease.year}` : ` is the newest ${esc(series.name)} book`} — it's in the list below.</span></p>` : ""}
${sameName.length ? `<p class="mt-2 text-sm text-ink-700/80">Looking for a different ${esc(series.name)}? ${sameName.map((o) => `<a class="text-amber-accent underline" href="/series/${o.slug}">${esc(o.name)}${o.author_name ? ` by ${esc(o.author_name)}` : ""}</a>`).join(" · ")}</p>` : ""}
<p class="mt-3 text-ink-700 max-w-2xl">${esc(series.description ?? `${series.name}${series.author_name ? ` by ${series.author_name}` : ""} has ${bookNoun(series.book_count)}${yearsSpan(series) ? ` published ${yearsSpan(series)}` : ""}. The list below is the publication order — the order most readers should follow.${first ? ` Start with “${first.title}”.` : ""}`)}</p>
<div class="mt-4 flex flex-wrap items-center gap-3 text-sm">
  ${series.author_name ? `<a href="/authors/${series.author_slug}" class="rounded-full bg-white border border-ink-200 px-3.5 py-1.5 hover:border-amber-accent">More by ${esc(series.author_name)}</a>` : ""}
  ${parent ? `<a href="/series/${parent.slug}" class="rounded-full bg-white border border-ink-200 px-3.5 py-1.5 hover:border-amber-accent">Part of ${esc(parent.name)}</a>` : ""}
  <span class="rounded-full bg-white border border-ink-200 px-3.5 py-1.5">${bookNoun(series.book_count)}</span>
  ${yearsSpan(series) ? `<span class="rounded-full bg-white border border-ink-200 px-3.5 py-1.5">${yearsSpan(series)}</span>` : ""}
  ${series.genre ? `<a href="/genres/${gslug(series.genre)}" class="rounded-full bg-white border border-ink-200 px-3.5 py-1.5 hover:border-amber-accent capitalize">${esc(series.genre)}</a>` : ""}
  <button type="button" data-share data-share-title="${esc(series.name)} Books in Order" class="rounded-full bg-white border border-ink-200 px-3.5 py-1.5 hover:border-amber-accent print:hidden cursor-pointer">Share</button>
  <button type="button" data-print class="rounded-full bg-white border border-ink-200 px-3.5 py-1.5 hover:border-amber-accent print:hidden cursor-pointer">Print list</button>
  ${books.length ? `<button type="button" data-copylist="${series.slug}" class="rounded-full bg-white border border-ink-200 px-3.5 py-1.5 hover:border-amber-accent print:hidden cursor-pointer">Copy list</button>` : ""}
  <button type="button" data-save-series="${series.slug}" data-save-name="${esc(series.name)}" class="rounded-full bg-white border border-ink-200 px-3.5 py-1.5 hover:border-amber-accent print:hidden cursor-pointer">☆ Save for later</button>
  <span class="font-medium text-amber-accent print:hidden" data-progress-label="${series.slug}"></span>
</div>
<div class="mt-2 h-2 rounded-full bg-ink-100 max-w-md overflow-hidden"><div class="h-full bg-amber-accent rounded-full transition-all" style="width:0%" data-progress-bar="${series.slug}"></div></div>
${first ? `<aside class="mt-6 flex gap-4 rounded-2xl border-l-4 border-amber-accent bg-white border border-ink-200 px-5 py-4 max-w-2xl" aria-label="Where to start">
  ${first.cover_url ? `<img src="${esc(first.cover_url)}" alt="" width="56" height="84" loading="lazy" class="w-14 h-[84px] rounded object-cover border border-ink-200 bg-ink-100 shrink-0 self-center">` : ""}
  <div class="min-w-0">
  <p class="text-xs font-semibold uppercase tracking-wide text-amber-accent">Where to start</p>
  <p class="mt-1 font-display font-semibold text-lg text-ink-900">Start with “${esc(first.title)}”${first.year ? ` (${first.year})` : ""}</p>
  <p class="mt-1 text-sm text-ink-700">Read ${esc(series.name)} in publication order — the list below tracks ${bookNoun(series.book_count)}${yearsSpan(series) ? ` published ${yearsSpan(series)}` : ""}. Tick each book as you finish it.</p>
  </div>
</aside>` : ""}
${bookList(books, series)}
${children.length ? `<section class="mt-10"><h2 class="font-display font-semibold text-2xl text-ink-900">Sub-series within ${esc(series.name)}</h2><div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 mt-4">${children.map(seriesCard).join("")}</div></section>` : ""}
<p class="mt-4 text-sm text-ink-700/75 print:hidden">☑️ Tick a book to mark it read. Progress is saved privately in your browser — see <a href="/shelf" class="text-amber-accent underline">My Shelf</a>. Spotted a wrong or missing book? <a class="text-amber-accent underline" href="mailto:contact@zalize.com?subject=${encodeURIComponent(`Shelfmark data issue: ${series.name}`)}">Report it</a>.</p>
${related.length ? `<section class="mt-12"><h2 class="font-display font-semibold text-2xl text-ink-900">More series${series.author_name ? ` by ${esc(series.author_name)}` : ""}</h2><div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 mt-4">${related.map(seriesCard).join("")}</div></section>` : ""}
${alsoLike.length ? `<section class="mt-12"><h2 class="font-display font-semibold text-2xl text-ink-900">If you like ${esc(series.name)}, you’ll love…</h2><div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 mt-4">${alsoLike.map(seriesCard).join("")}</div></section>` : ""}
${faqs.length ? `<section class="mt-12"><h2 class="font-display font-semibold text-2xl text-ink-900">${esc(series.name)} FAQ</h2><dl class="mt-4 space-y-4 max-w-2xl">${faqs.map(([q2, a2]) => `<div class="rounded-xl bg-white border border-ink-200 px-4 py-3"><dt class="font-medium text-ink-900">${esc(q2)}</dt><dd class="mt-1 text-sm text-ink-700">${esc(a2)}</dd></div>`).join("")}</dl></section>` : ""}`;
  return c.html(
    layout({
      title: `${series.name} Books in Order (${series.book_count} Books)${series.author_name ? " — " + series.author_name : ""} | Shelfmark`,
      description: `${series.name} reading order: all ${bookNoun(series.book_count)}${series.author_name ? ` by ${series.author_name}` : ""} listed in publication order${first ? `, starting with ${first.title}` : ""}. Track your progress, no signup needed.`,
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
        breadcrumbLd(
          c.env.SITE_URL,
          series.author_name
            ? [["Series", "/series"], [series.author_name, `/authors/${series.author_slug}`], [series.name, `/series/${slug}`]]
            : [["Series", "/series"], [series.name, `/series/${slug}`]]
        ),
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

const bslug = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);

// ---------- Book detail page ----------
app.get("/book/:key", async (c) => {
  const m = /^(\d+)(?:-.*)?$/.exec(c.req.param("key"));
  if (!m) return notFound(c);
  const id = parseInt(m[1]);
  const book = await c.env.DB.prepare(
    `SELECT b.*, s.slug AS series_slug, s.name AS series_name, s.book_count AS series_count, a.name AS author_name, a.slug AS author_slug
     FROM books b LEFT JOIN series s ON s.id=b.series_id LEFT JOIN authors a ON a.id=COALESCE(b.author_id, s.author_id) WHERE b.id=?`
  ).bind(id).first<Book & { series_slug: string | null; series_name: string | null; series_count: number | null; author_name: string | null; author_slug: string | null }>();
  if (!book) return notFound(c);
  const canonicalKey = `${id}-${bslug(book.title)}`;
  if (c.req.param("key") !== canonicalKey) return c.redirect(`/book/${canonicalKey}`, 301);
  let prev: Book | null = null, next: Book | null = null, ordinal: number | null = null;
  if (book.series_id) {
    const { results } = await c.env.DB.prepare(
      `SELECT id, title, year, position FROM books WHERE series_id=? AND wikidata_id NOT IN (SELECT wikidata_id FROM series WHERE wikidata_id IS NOT NULL) ORDER BY position, year, id`
    ).bind(book.series_id).all<Book>();
    let sibs = results;
    const positions = sibs.map((b) => b.position).filter((p): p is number => p != null);
    if (new Set(positions).size !== positions.length)
      sibs = [...sibs].sort((a, b) => (a.year ?? 9999) - (b.year ?? 9999) || (a.position ?? 0) - (b.position ?? 0));
    const i = sibs.findIndex((b) => b.id === id);
    if (i >= 0) { ordinal = i + 1; prev = sibs[i - 1] ?? null; next = sibs[i + 1] ?? null; }
  }
  const buy = `https://bookshop.org/search?keywords=${encodeURIComponent(book.title + (book.author_name ? " " + book.author_name : ""))}`;
  const navLink = (b: Book, label: string) => `<a href="/book/${b.id}-${bslug(b.title)}" class="rounded-full bg-white border border-ink-200 px-3.5 py-1.5 text-sm hover:border-amber-accent">${label} ${esc(b.title.length > 34 ? b.title.slice(0, 32) + "…" : b.title)}</a>`;
  const body = `
${crumbs([
    ...(book.series_slug ? ([["Series", "/series"]] as [string, string][]) : []),
    ...(book.author_name && book.author_slug ? ([[book.author_name, `/authors/${book.author_slug}`]] as [string, string][]) : []),
    ...(book.series_slug && book.series_name ? ([[book.series_name, `/series/${book.series_slug}`]] as [string, string][]) : []),
    [book.title, ""],
  ])}
<div class="flex flex-col sm:flex-row gap-6">
  ${book.cover_url ? `<img src="${esc(book.cover_url.replace("-M.jpg", "-L.jpg"))}" alt="Cover of ${esc(book.title)}" width="160" height="240" class="w-40 rounded-lg shadow object-cover bg-ink-100 border border-ink-200 shrink-0 self-start">` : ""}
  <div class="min-w-0">
    <h1 class="font-display font-bold text-3xl sm:text-4xl text-ink-900 break-words">${esc(book.title)}</h1>
    <p class="mt-2 text-ink-700">${book.author_name ? `by <a href="/authors/${book.author_slug}" class="text-amber-accent underline underline-offset-2">${esc(book.author_name)}</a>` : ""}${book.year ? `${book.author_name ? " · " : ""}${book.year}` : ""}</p>
    ${ordinal && book.series_name ? `<p class="mt-2 text-sm text-ink-700">Book ${ordinal} of ${book.series_count} in <a href="/series/${book.series_slug}" class="text-amber-accent underline underline-offset-2">${esc(book.series_name)}</a></p>` : ""}
    ${book.description ? `<p class="mt-4 text-ink-700 max-w-2xl">${esc(book.description)}</p>` : ""}
    <div class="mt-5 flex flex-wrap gap-3">
      ${book.series_slug ? `<a href="/series/${book.series_slug}" class="rounded-full bg-ink-900 text-ink-50 px-5 py-2.5 text-sm font-semibold hover:bg-ink-700">Full reading order</a>` : ""}
      <a href="${buy}" rel="nofollow noopener" target="_blank" class="rounded-full bg-white border border-ink-200 px-5 py-2.5 text-sm font-semibold hover:border-amber-accent">Find a copy</a>
    </div>
    ${prev || next ? `<div class="mt-5 flex flex-wrap gap-2">${prev ? navLink(prev, "←") : ""}${next ? navLink(next, "Next:") : ""}</div>` : ""}
  </div>
</div>`;
  return c.html(
    layout({
      title: `${book.title}${book.series_name ? ` (${book.series_name}${ordinal ? ` #${ordinal}` : ""})` : ""}${book.author_name ? ` by ${book.author_name}` : ""} | Shelfmark`,
      description: book.description
        ? book.description.slice(0, 155)
        : `${book.title}${book.author_name ? ` by ${book.author_name}` : ""}${book.series_name ? `, part of the ${book.series_name} series` : ""}${book.year ? ` (${book.year})` : ""}. Reading order and details on Shelfmark.`,
      path: `/book/${canonicalKey}`,
      siteUrl: c.env.SITE_URL,
      noindex: !book.description,
      image: book.cover_url?.replace("-M.jpg", "-L.jpg"),
      body,
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "Book",
          name: book.title,
          url: `${c.env.SITE_URL}/book/${canonicalKey}`,
          ...(book.author_name ? { author: { "@type": "Person", name: book.author_name } } : {}),
          ...(book.year ? { datePublished: String(book.year) } : {}),
          ...(book.cover_url ? { image: book.cover_url } : {}),
          ...(book.description ? { description: book.description } : {}),
          ...(book.series_name ? { isPartOf: { "@type": "BookSeries", name: book.series_name, url: `${c.env.SITE_URL}/series/${book.series_slug}` }, ...(ordinal ? { position: ordinal } : {}) } : {}),
        },
        breadcrumbLd(c.env.SITE_URL, [
          ...(book.series_slug && book.series_name ? ([[book.series_name, `/series/${book.series_slug}`]] as [string, string][]) : []),
          [book.title, `/book/${canonicalKey}`],
        ]),
      ],
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
    <span class="text-sm sm:text-base min-w-0"><span class="text-ink-700/75 tabular-nums mr-2">${dupPositions ? i + 1 : b.position ?? i + 1}.</span><a href="/book/${b.id}-${bslug(b.title)}" class="font-medium text-ink-900 hover:text-amber-accent">${esc(b.title)}</a>${b.year ? `<span class="text-ink-700/75 ml-2">(${b.year})</span>` : ""}${b.year && b.year >= new Date().getFullYear() ? `<span class="year-chip">${b.year > new Date().getFullYear() ? "Upcoming" : "New"}</span>` : ""}${b.description ? `<span class="block text-xs text-ink-700/75 mt-0.5">${esc(b.description)}</span>` : ""}</span>
  </label>
  <a href="https://bookshop.org/search?keywords=${encodeURIComponent(b.title + (s.author_name ? " " + s.author_name : ""))}" rel="nofollow noopener" target="_blank" class="shrink-0 text-xs text-ink-700/75 hover:text-amber-accent underline print:hidden" aria-label="Find a copy of ${esc(b.title)} on Bookshop.org">Find a copy</a>
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
const gtitle = (g: string) => g.replace(/(^|[\s-])[a-z]/g, (ch) => ch.toUpperCase());

app.get("/genres", async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT genre, COUNT(*) AS n FROM series WHERE genre IS NOT NULL AND book_count > 0 GROUP BY genre HAVING n >= 3 ORDER BY n DESC`
  ).all<{ genre: string; n: number }>();
  const body = `
<h1 class="font-display font-bold text-3xl text-ink-900">Browse series by genre</h1>
<p class="mt-2 text-ink-700">Every genre with reading orders on Shelfmark.</p>
<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 mt-6">
${results.map((g) => `<a href="/genres/${gslug(g.genre)}" class="block rounded-2xl bg-white border border-ink-200 p-4 hover:border-amber-accent transition"><p class="font-display font-semibold text-ink-900">${esc(gtitle(g.genre))}</p><p class="text-sm text-ink-700/80 mt-1">${g.n} series</p></a>`).join("")}
</div>`;
  return c.html(
    layout({
      title: "Book Series by Genre | Shelfmark",
      description: "Browse book series reading orders by genre: fantasy, crime, science fiction, romance and more.",
      path: "/genres",
      siteUrl: c.env.SITE_URL,
      jsonLd: [
        breadcrumbLd(c.env.SITE_URL, [["Genres", "/genres"]]),
        {
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "Book series genres on Shelfmark",
          numberOfItems: results.length,
          itemListElement: results.map((g, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: gtitle(g.genre),
            url: `${c.env.SITE_URL}/genres/${gslug(g.genre)}`,
          })),
        },
      ],
      body,
    })
  );
});

// Slugs of genre labels merged into a canonical vocabulary; old URLs 301 to the canonical genre page.
const GENRE_SLUG_REDIRECTS: Record<string, string> = {
  "children-s-book": "children-s-literature",
  "children-s-fiction": "children-s-literature",
  "children-s-novel": "children-s-literature",
  "crime-literature": "crime-fiction",
  "crime-novel": "crime-fiction",
  "cyberpunk-novel": "cyberpunk",
  "dark-fantasy-literature": "dark-fantasy",
  "detective-literature": "detective-fiction",
  "fantasy-literature": "fantasy",
  "fiction-literature": "fiction",
  "historical-non-fiction": "non-fiction",
  "historical-non-fiction-work": "non-fiction",
  "historical-novel": "historical-fiction",
  "horror-literature": "horror-fiction",
  "non-fiction-literary-work": "non-fiction",
  "non-fiction-literature": "non-fiction",
  "romance": "romance-novel",
  "romantic-fiction": "romance-novel",
  "science-fiction-literature": "science-fiction",
  "thriller-novel": "thriller",
  "vampire-literature": "vampire-fiction",
  "western-novel": "western",
  "young-adult-fiction": "young-adult-literature",
};

app.get("/genres/:slug", async (c) => {
  const slug = c.req.param("slug");
  const redirect = GENRE_SLUG_REDIRECTS[slug];
  if (redirect) return c.redirect(`/genres/${redirect}`, 301);
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
  const year = new Date().getFullYear();
  const newCount = Number(((await c.env.DB.prepare(
    `SELECT COUNT(*) AS n FROM books b JOIN series s ON s.id=b.series_id WHERE b.year>=? AND b.year<=? AND s.genre=? AND s.author_id IS NOT NULL AND s.book_count BETWEEN 2 AND 80 AND s.first_year IS NOT NULL AND s.first_year < b.year`
  ).bind(year, year + 1, genre).all()).results as any[])[0].n);
  const body = `
${crumbs([["Genres", "/genres"], [gtitle(genre), ""]])}
<h1 class="font-display font-bold text-3xl text-ink-900">${esc(gtitle(genre))} Series in Order${page > 1 ? ` — Page ${page}` : ""}</h1>
<p class="mt-2 text-ink-700">${total} ${esc(genre.toLowerCase())} series with complete reading orders.${newCount ? ` <a class="text-amber-accent underline" href="/new?genre=${encodeURIComponent(genre.toLowerCase())}">New &amp; upcoming in ${esc(genre.toLowerCase())} (${newCount})</a> · <a class="text-amber-accent underline" href="/new.rss?genre=${encodeURIComponent(genre.toLowerCase())}">RSS</a>` : ""}</p>
<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 mt-6">${results.map(seriesCard).join("")}</div>
${paginationQ(`/genres/${slug}?`, page, pages)}`;
  return c.html(
    layout({
      title: `${gtitle(genre)} Book Series in Order (${total} Series) | Shelfmark`,
      description: `All ${genre.toLowerCase()} book series on Shelfmark with reading orders and a built-in no-signup progress tracker.`,
      path: `/genres/${slug}${page > 1 ? `?page=${page}` : ""}`,
      siteUrl: c.env.SITE_URL,
      rss: `/new.rss?genre=${encodeURIComponent(genre.toLowerCase())}`,
      noindex: total < 3,
      image: results.find((s) => s.cover_url)?.cover_url?.replace("-M.jpg", "-L.jpg"),
      jsonLd: [
        breadcrumbLd(c.env.SITE_URL, [["Genres", "/genres"], [gtitle(genre), `/genres/${slug}`]]),
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
  c.header("Cache-Control", "no-store");
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
    const day = new Date().toISOString().slice(0, 10);
    const nResults = series.length + authors.length + bookHits.length;
    await c.env.DB.prepare(
      `INSERT INTO searches (day, term, results, count) VALUES (?, ?, ?, 1) ON CONFLICT(day, term) DO UPDATE SET count = count + 1, results = excluded.results`
    ).bind(day, q.toLowerCase().slice(0, 100), nResults).run();
    body = `<h1 class="font-display font-bold text-3xl text-ink-900">Results for “${esc(q)}”</h1>
${closeMatches && (series.length || authors.length) ? `<p class="mt-2 text-ink-700">No exact match — showing close matches instead.</p>` : ""}
${authors.length ? `<h2 class="font-display font-semibold text-2xl text-ink-900 mt-8">Authors</h2><div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 mt-4">${authors.map(authorCard).join("")}</div>` : ""}
${series.length ? `<h2 class="font-display font-semibold text-2xl text-ink-900 mt-8">Series</h2><div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 mt-4">${series.map(seriesCard).join("")}</div>` : ""}
${bookHits.length ? `<h2 class="font-display font-semibold text-2xl text-ink-900 mt-8">Books</h2><ul class="mt-4 space-y-2">${bookHits.map((b) => `<li class="rounded-xl bg-white border border-ink-200 px-4 py-3 text-sm"><a class="font-medium text-ink-900 hover:text-amber-accent" href="/series/${b.series_slug}">${esc(b.title)}</a>${b.year ? ` <span class="text-ink-700/75">(${b.year})</span>` : ""} <span class="text-ink-700/75">— ${esc(b.series_name)}${b.author_name ? ` by ${esc(b.author_name)}` : ""}</span></li>`).join("")}</ul>` : ""}
${!series.length && !authors.length && !bookHits.length ? await (async () => {
      const { results: popular } = await c.env.DB.prepare(
        `SELECT s.*, a.name AS author_name FROM series s LEFT JOIN authors a ON a.id=s.author_id WHERE s.book_count BETWEEN 3 AND 60 AND s.author_id IS NOT NULL AND s.genre IS NOT NULL AND s.genre NOT LIKE '%dictionary%' AND s.genre NOT LIKE '%encyclopedia%' AND s.genre NOT LIKE '%reference%' ORDER BY s.book_count DESC LIMIT 6`
      ).all<Series>();
      return `<p class="mt-6 text-ink-700">Nothing found. Try a different spelling, or <a href="/authors" class="text-amber-accent underline">browse all authors</a> and <a href="/genres" class="text-amber-accent underline">genres</a>.</p>
<h2 class="font-display font-semibold text-2xl text-ink-900 mt-10">Popular series</h2>
<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 mt-4">${popular.map(seriesCard).join("")}</div>`;
    })() : ""}`;
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
<div id="saved-root" class="mt-10"></div>
<div class="mt-10 flex flex-wrap gap-3">
  <a href="/year-in-books" class="rounded-full bg-amber-accent text-white px-5 py-2.5 text-sm font-semibold hover:opacity-90">Year in Books →</a>
  <button id="share-card-btn" class="rounded-full bg-ink-900 text-ink-50 px-5 py-2.5 text-sm font-semibold hover:bg-ink-700">Download my reading card</button>
  <button id="export-btn" class="rounded-full bg-white border border-ink-200 px-5 py-2.5 text-sm font-semibold hover:border-amber-accent">Export JSON</button>
  <button id="export-csv-btn" class="rounded-full bg-white border border-ink-200 px-5 py-2.5 text-sm font-semibold hover:border-amber-accent">Export CSV</button>
  <button id="import-btn" class="rounded-full bg-white border border-ink-200 px-5 py-2.5 text-sm font-semibold hover:border-amber-accent">Import JSON</button>
  <input id="import-file" type="file" accept="application/json,.json" class="hidden" aria-label="Import shelf backup file">
  <button id="clear-data-btn" class="rounded-full bg-white border border-ink-200 px-5 py-2.5 text-sm font-semibold text-ink-700 hover:border-red-400">Clear all data</button>
  <span id="import-status" role="status" class="text-sm text-ink-700/80 self-center"></span>
</div>
<p class="mt-3 text-xs text-ink-700/75 max-w-2xl">Export downloads a backup of your shelf as a JSON file. Import merges a backup into this browser — useful when switching devices. Clear all data erases every Shelfmark record from this browser (progress, saved list, goals) — export first if you want a backup.</p>
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

// ---------- Year in Books (client-rendered) ----------
app.get("/year-in-books", (c) => {
  const y = new Date().getFullYear();
  const body = `
<h1 class="font-display font-bold text-3xl sm:text-4xl text-ink-900">Your Year in Books</h1>
<p class="mt-2 text-ink-700 max-w-2xl">A personal reading report built entirely in your browser from your Shelfmark tracker — books read, top series, busiest months, goal progress. Nothing leaves your device.</p>
<div id="year-root" class="mt-8"><p class="text-ink-700/75">Building your report…</p></div>
<noscript><p class="mt-4 rounded-xl border border-ink-200 bg-white px-4 py-3 text-sm text-ink-700 max-w-2xl">The Year in Books report is generated from your browser's local reading data and needs JavaScript. Your progress is tracked on each <a class="text-amber-accent underline" href="/series">series page</a>.</p></noscript>
<canvas id="year-canvas" width="1080" height="1350" class="hidden"></canvas>`;
  return c.html(
    layout({
      title: `Year in Books ${y} — Your Reading Report | Shelfmark`,
      description: `Your ${y} reading wrapped: books read, top series, busiest months, and a shareable report card — generated privately in your browser, no account needed.`,
      path: "/year-in-books",
      siteUrl: c.env.SITE_URL,
      body,
    })
  );
});

// ---------- Shared saved-list viewer (client-rendered from URL fragment) ----------
app.get("/saved", (c) => {
  const body = `
<h1 class="font-display font-bold text-3xl sm:text-4xl text-ink-900">A shared reading list</h1>
<p class="mt-2 text-ink-700 max-w-2xl">Someone shared their Shelfmark reading list with you. The list travels inside the link itself — it never touches our servers.</p>
<div id="shared-root" class="mt-8"><p class="text-ink-700/75">Reading the list from the link…</p></div>
<noscript><p class="mt-4 rounded-xl border border-ink-200 bg-white px-4 py-3 text-sm text-ink-700 max-w-2xl">Viewing a shared list needs JavaScript (the list is encoded in the link and decoded in your browser).</p></noscript>`;
  return c.html(
    layout({
      title: "Shared Reading List | Shelfmark",
      description: "View a reading list shared from someone's Shelfmark shelf.",
      path: "/saved",
      siteUrl: c.env.SITE_URL,
      noindex: true,
      body,
    })
  );
});

// ---------- New releases ----------
app.get("/new", async (c) => {
  const year = new Date().getFullYear();
  const genreParam = (c.req.query("genre") ?? "").trim().toLowerCase().slice(0, 40);
  const { results: all } = await c.env.DB.prepare(
    `SELECT b.title, b.year, b.cover_url, s.slug AS series_slug, s.name AS series_name, s.genre AS genre, a.name AS author_name FROM books b JOIN series s ON s.id=b.series_id LEFT JOIN authors a ON a.id=b.author_id WHERE b.year>=? AND b.year<=? AND s.author_id IS NOT NULL AND s.book_count BETWEEN 2 AND 80 AND s.genre IS NOT NULL AND s.genre NOT LIKE '%dictionary%' AND s.genre NOT LIKE '%encyclopedia%' AND s.genre NOT LIKE '%reference%' AND s.genre NOT LIKE '%comic strip%' AND s.genre NOT LIKE '%webcomic%' AND s.first_year IS NOT NULL AND s.first_year < b.year ORDER BY b.year, s.book_count DESC, b.title LIMIT 300`
  ).bind(year, year + 1).all<{ title: string; year: number; cover_url: string | null; series_slug: string; series_name: string; genre: string; author_name: string | null }>();
  const genreCounts = new Map<string, number>();
  for (const b of all) genreCounts.set(b.genre, (genreCounts.get(b.genre) ?? 0) + 1);
  const genres = [...genreCounts.entries()].sort((a, b) => b[1] - a[1]).map(([g]) => g);
  const activeGenre = genres.find((g) => g.toLowerCase() === genreParam) ?? null;
  const upcoming = activeGenre ? all.filter((b) => b.genre === activeGenre) : all;
  const byYear = new Map<number, typeof upcoming>();
  for (const b of upcoming) {
    if (!byYear.has(b.year)) byYear.set(b.year, []);
    byYear.get(b.year)!.push(b);
  }
  const body = `
${crumbs([["New releases", ""]])}
<h1 class="font-display font-bold text-3xl sm:text-4xl text-ink-900">New &amp; Upcoming Series Books</h1>
<p class="mt-3 text-ink-700 max-w-2xl">Series installments published in ${year}–${year + 1}, by series. Open a series page to see where the new book fits in the reading order. <a class="text-amber-accent underline whitespace-nowrap" href="/new.rss${activeGenre ? `?genre=${encodeURIComponent(activeGenre.toLowerCase())}` : ""}">RSS feed${activeGenre ? ` (${esc(activeGenre.toLowerCase())})` : ""}</a></p>
${genres.length > 1 ? `<nav aria-label="Filter by genre" class="mt-4 flex flex-wrap gap-1.5 text-sm print:hidden">
  <a href="/new" class="rounded-full px-3 py-1.5 border ${!activeGenre ? "bg-ink-900 text-ink-50 border-ink-900" : "bg-white border-ink-200 hover:border-amber-accent"}">All</a>
  ${genres.map((g) => `<a href="/new?genre=${encodeURIComponent(g)}" class="rounded-full px-3 py-1.5 border capitalize ${activeGenre === g ? "bg-ink-900 text-ink-50 border-ink-900" : "bg-white border-ink-200 hover:border-amber-accent"}">${esc(g)} <span class="${activeGenre === g ? "text-ink-50/75" : "text-ink-700/75"}">${genreCounts.get(g)}</span></a>`).join("")}
</nav>` : ""}
${[...byYear.entries()].map(([y, list]) => `<section class="mt-10"><h2 class="font-display font-semibold text-2xl text-ink-900">${y}</h2><ul class="mt-4 space-y-2">${list.map((b) => `<li class="flex items-center gap-3 rounded-xl bg-white border border-ink-200 px-4 py-3 text-sm">${b.cover_url ? `<img src="${esc(b.cover_url)}" alt="" loading="lazy" width="38" height="57" class="w-[38px] h-[57px] object-cover rounded shadow-sm shrink-0 bg-ink-100">` : `<span aria-hidden="true" class="w-[38px] h-[57px] rounded shadow-sm shrink-0 bg-ink-100 border border-ink-200 flex items-center justify-center font-display font-semibold text-ink-700/75">${esc((b.title[0] ?? "?").toUpperCase())}</span>`}<span class="min-w-0"><span class="font-medium text-ink-900">${esc(b.title)}</span> <span class="text-ink-700/75">— <a class="text-amber-accent hover:underline" href="/series/${b.series_slug}">${esc(b.series_name)}</a>${b.author_name ? ` by ${esc(b.author_name)}` : ""}</span></span></li>`).join("")}</ul></section>`).join("")}
${!upcoming.length ? `<p class="mt-6 text-ink-700">No upcoming releases recorded yet — check back soon.</p>` : ""}
<section class="mt-12 rounded-2xl bg-white border border-ink-200 p-6 max-w-xl print:hidden" data-reveal>
  <h2 class="font-display font-semibold text-xl text-ink-900">Get new releases by email</h2>
  <p class="mt-1.5 text-sm text-ink-700">A short digest when new series installments land in the catalog. Double opt-in, one-click unsubscribe, never shared.</p>
  <form data-subscribe class="mt-4 flex flex-wrap gap-2">
    <input type="email" name="email" required aria-label="Email for new-release alerts" placeholder="you@example.com" class="rounded-full border border-ink-200 bg-white px-3.5 py-2 text-sm w-64 max-w-full">
    <button class="rounded-full bg-ink-900 text-ink-50 px-4 py-2 text-sm font-semibold hover:opacity-90">Notify me</button>
  </form>
</section>`;
  const noindex = Boolean(activeGenre);
  return c.html(
    layout({
      title: `New Book Series Releases ${year} & ${year + 1} | Shelfmark`,
      description: `New and upcoming series books for ${year}–${year + 1}, linked to full reading orders.`,
      path: "/new",
      siteUrl: c.env.SITE_URL,
      jsonLd: [breadcrumbLd(c.env.SITE_URL, [["New releases", "/new"]])],
      rss: `/new.rss${activeGenre ? `?genre=${encodeURIComponent(activeGenre.toLowerCase())}` : ""}`,
      noindex,
      body,
    })
  );
});

app.get("/new.rss", async (c) => {
  const year = new Date().getFullYear();
  const genreParam = (c.req.query("genre") ?? "").trim().toLowerCase().slice(0, 40);
  const { results: items } = await c.env.DB.prepare(
    `SELECT b.title, b.year, b.cover_url, s.slug AS series_slug, s.name AS series_name, s.genre AS genre, a.name AS author_name FROM books b JOIN series s ON s.id=b.series_id LEFT JOIN authors a ON a.id=b.author_id WHERE b.year>=? AND b.year<=? AND s.author_id IS NOT NULL AND s.book_count BETWEEN 2 AND 80 AND s.genre IS NOT NULL AND s.genre NOT LIKE '%dictionary%' AND s.genre NOT LIKE '%encyclopedia%' AND s.genre NOT LIKE '%reference%' AND s.genre NOT LIKE '%comic strip%' AND s.genre NOT LIKE '%webcomic%' AND s.first_year IS NOT NULL AND s.first_year < b.year ORDER BY b.year, s.book_count DESC, b.title LIMIT 100`
  ).bind(year, year + 1).all<{ title: string; year: number; cover_url: string | null; series_slug: string; series_name: string; genre: string; author_name: string | null }>();
  const activeGenre = genreParam ? items.find((b) => b.genre.toLowerCase() === genreParam)?.genre ?? null : null;
  const filtered = activeGenre ? items.filter((b) => b.genre === activeGenre) : items;
  const site = c.env.SITE_URL;
  const selfUrl = `${site}/new.rss${activeGenre ? `?genre=${encodeURIComponent(activeGenre.toLowerCase())}` : ""}`;
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
<title>Shelfmark — New &amp; Upcoming${activeGenre ? ` ${esc(activeGenre[0].toUpperCase() + activeGenre.slice(1))}` : ""} Series Books</title>
<link>${site}/new${activeGenre ? `?genre=${encodeURIComponent(activeGenre.toLowerCase())}` : ""}</link>
<atom:link href="${selfUrl}" rel="self" type="application/rss+xml"/>
<description>New and upcoming${activeGenre ? ` ${esc(activeGenre.toLowerCase())}` : ""} series installments for ${year}–${year + 1}, linked to full reading orders.</description>
<language>en</language>
${filtered.map((b) => `<item>
<title>${esc(b.title)} (${b.series_name ? esc(b.series_name) : ""}${b.author_name ? ` by ${esc(b.author_name)}` : ""}, ${b.year})</title>
<link>${site}/series/${b.series_slug}</link>
<guid isPermaLink="false">${site}/series/${b.series_slug}#${esc(b.title)}-${b.year}</guid>
<description>${esc(b.title)} — a ${b.year} installment in ${esc(b.series_name)}${b.author_name ? ` by ${esc(b.author_name)}` : ""}. See the full reading order on Shelfmark.</description>${b.cover_url ? `\n<enclosure url="${esc(b.cover_url.replace("-M.jpg", "-L.jpg"))}" type="image/jpeg" length="0"/>` : ""}
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
<Description>Search book series and authors on Shelfmark — reading orders and a no-signup tracker.</Description>
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
<h2 class="font-display font-semibold text-2xl text-ink-900 mt-8">Ways to follow new releases</h2>
<ul class="list-disc pl-5 space-y-1.5">
<li>Browse the <a class="text-amber-accent underline" href="/new">New &amp; upcoming</a> page — filter it by genre with the chips at the top.</li>
<li>Subscribe to the <a class="text-amber-accent underline" href="/new.rss">RSS feed</a> in any feed reader — no account or email needed.</li>
<li>Add Shelfmark to your browser's address-bar search engines (we ship an <a class="text-amber-accent underline" href="/opensearch.xml">OpenSearch description</a> with live suggestions).</li>
<li>On mobile, use your browser's <em>Add to Home Screen</em> to install Shelfmark as an app.</li>
</ul>
<h2 class="font-display font-semibold text-2xl text-ink-900 mt-8">Open data API</h2>
<p>Every reading order is available as JSON: <code class="text-sm bg-ink-100 px-1.5 py-0.5 rounded">/api/series/&lt;slug&gt;.json</code> — e.g. <a class="text-amber-accent underline" href="/api/series/mistborn.json">/api/series/mistborn.json</a>. Author bibliographies too: <code class="text-sm bg-ink-100 px-1.5 py-0.5 rounded">/api/authors/&lt;slug&gt;.json</code> — e.g. <a class="text-amber-accent underline" href="/api/authors/brandon-sanderson.json">/api/authors/brandon-sanderson.json</a>. CORS-enabled, no key required. Underlying data is from Wikidata (CC0) and Open Library; a link back is appreciated.</p>
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
<p><strong>Analytics</strong>: we count page views with a first-party, cookie-less counter (URL path + day only). When you arrive from another website we also count the referring site's hostname (e.g. "google.com" — never the full URL, page, or search query). On-site searches are counted in aggregate (search term + day + result count) to improve the catalog; they are never linked to you. No IP addresses, user agents, fingerprints, or identifiers are stored.</p>
<p><strong>Email</strong>: if you subscribe for alerts we store your email address for that purpose only. Subscriptions are double opt-in (nothing is sent until you confirm) and every email includes a one-click unsubscribe link; you can also email <a class="text-amber-accent underline" href="mailto:contact@zalize.com">contact@zalize.com</a>. We never sell or share it.</p>
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

app.get("/api/series/:file", async (c) => {
  const m = /^([a-z0-9-]+)\.json$/.exec(c.req.param("file"));
  if (!m) return c.json({ error: "Not found" }, 404);
  const slug = m[1];
  const series = await c.env.DB.prepare(
    `SELECT s.id, s.name, s.slug, s.genre, s.book_count, a.name AS author_name FROM series s LEFT JOIN authors a ON a.id=s.author_id WHERE s.slug=?`
  ).bind(slug).first<{ id: number; name: string; slug: string; genre: string | null; book_count: number; author_name: string | null }>();
  if (!series) return c.json({ error: "Series not found" }, 404);
  const { results: books } = await c.env.DB.prepare(
    `SELECT title, position, year FROM books WHERE series_id=? AND wikidata_id NOT IN (SELECT wikidata_id FROM series WHERE wikidata_id IS NOT NULL) ORDER BY position, year, id`
  ).bind(series.id).all<{ title: string; position: number | null; year: number | null }>();
  const positions = books.map((b) => b.position).filter((p): p is number => p != null);
  const ordered = new Set(positions).size !== positions.length
    ? [...books].sort((a, b) => (a.year ?? 9999) - (b.year ?? 9999) || (a.position ?? 0) - (b.position ?? 0))
    : books;
  c.header("Cache-Control", "public, max-age=3600");
  c.header("Access-Control-Allow-Origin", "*");
  return c.json({
    name: series.name,
    author: series.author_name,
    genre: series.genre,
    url: `${c.env.SITE_URL}/series/${series.slug}`,
    order: "publication",
    books: ordered.map((b, i) => ({ order: i + 1, title: b.title, year: b.year })),
    license: "Data from Wikidata (CC0) and Open Library; attribution appreciated.",
  });
});

app.get("/api/authors/:file", async (c) => {
  const m = /^([a-z0-9-]+)\.json$/.exec(c.req.param("file"));
  if (!m) return c.json({ error: "Not found" }, 404);
  const author = await c.env.DB.prepare(
    `SELECT id, name, slug, series_count, book_count FROM authors WHERE slug=?`
  ).bind(m[1]).first<{ id: number; name: string; slug: string; series_count: number; book_count: number }>();
  if (!author) return c.json({ error: "Author not found" }, 404);
  const { results: series } = await c.env.DB.prepare(
    `SELECT name, slug, genre, book_count, first_year, last_year FROM series WHERE author_id=? AND book_count > 0 ORDER BY book_count DESC, name`
  ).bind(author.id).all<{ name: string; slug: string; genre: string | null; book_count: number; first_year: number | null; last_year: number | null }>();
  c.header("Cache-Control", "public, max-age=3600");
  c.header("Access-Control-Allow-Origin", "*");
  return c.json({
    name: author.name,
    url: `${c.env.SITE_URL}/authors/${author.slug}`,
    series_count: author.series_count,
    book_count: author.book_count,
    series: series.map((s) => ({
      name: s.name,
      genre: s.genre,
      book_count: s.book_count,
      first_year: s.first_year,
      last_year: s.last_year,
      url: `${c.env.SITE_URL}/series/${s.slug}`,
      api: `${c.env.SITE_URL}/api/series/${s.slug}.json`,
    })),
    license: "Data from Wikidata (CC0) and Open Library; attribution appreciated.",
  });
});

async function sendEmail(env: Env, to: string, subject: string, html: string, text: string, unsubToken?: string): Promise<boolean> {
  if (!env.RESEND_API_KEY) return false;
  const headers: Record<string, string> = {};
  if (unsubToken) {
    headers["List-Unsubscribe"] = `<${env.SITE_URL}/unsubscribe?t=${unsubToken}>`;
    headers["List-Unsubscribe-Post"] = "List-Unsubscribe=One-Click";
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: "Shelfmark <no-reply@zalize.com>", to: [to], subject, html, text, headers }),
  });
  return res.ok;
}

function emailShell(inner: string): string {
  return `<div style="font-family:Georgia,serif;max-width:540px;margin:0 auto;padding:24px;color:#292722;background:#f7f6f3"><p style="font-size:18px;font-weight:bold;margin:0 0 16px">Shelfmark</p>${inner}<p style="font-size:12px;color:#6b675c;margin-top:28px">Shelfmark · shelfmark.zalize.com · You can unsubscribe any time via the link in this email.</p></div>`;
}

app.post("/api/subscribe", async (c) => {
  if (await rateLimited(c, "sub", 5)) return c.json({ ok: false, error: "Too many requests" }, 429);
  const { email, source } = await c.req.json<{ email?: string; source?: string }>().catch(() => ({}) as any);
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || email.length > 200) {
    return c.json({ ok: false, error: "Invalid email" }, 400);
  }
  const addr = email.toLowerCase();
  const token = crypto.randomUUID().replace(/-/g, "");
  await c.env.DB.prepare(`INSERT OR IGNORE INTO emails (email, source, token) VALUES (?, ?, ?)`)
    .bind(addr, (source ?? "footer").slice(0, 100), token).run();
  const row = await c.env.DB.prepare(`SELECT token, confirmed, unsubscribed FROM emails WHERE email=?`)
    .bind(addr).first<{ token: string; confirmed: number; unsubscribed: number }>();
  if (!row) return c.json({ ok: true });
  if (row.confirmed && !row.unsubscribed) return c.json({ ok: true, confirmed: true });
  let t = row.token;
  if (row.unsubscribed) {
    t = token;
    await c.env.DB.prepare(`UPDATE emails SET unsubscribed=0, confirmed=0, token=? WHERE email=?`).bind(t, addr).run();
  }
  const link = `${c.env.SITE_URL}/confirm?t=${t}`;
  await sendEmail(
    c.env,
    addr,
    "Confirm your Shelfmark new-release alerts",
    emailShell(`<p>Someone (hopefully you) asked for new-release alerts from Shelfmark.</p><p style="margin:20px 0"><a href="${link}" style="background:#1a1916;color:#f7f6f3;padding:10px 20px;border-radius:999px;text-decoration:none">Confirm subscription</a></p><p>If that wasn’t you, just ignore this email — you won’t be subscribed.</p>`),
    `Confirm your Shelfmark new-release alerts: ${link}\nIf that wasn’t you, ignore this email — you won’t be subscribed.`,
    t
  );
  return c.json({ ok: true });
});

async function unsubscribe(c: { env: Env }, token: string): Promise<boolean> {
  if (!/^[a-f0-9]{32}$/.test(token)) return false;
  const r = await c.env.DB.prepare(`UPDATE emails SET unsubscribed=1 WHERE token=?`).bind(token).run();
  return (r.meta.changes ?? 0) > 0;
}

app.post("/unsubscribe", async (c) => {
  await unsubscribe(c, (c.req.query("t") ?? "").slice(0, 64));
  return c.body(null, 200);
});

app.get("/unsubscribe", async (c) => {
  const ok = await unsubscribe(c, (c.req.query("t") ?? "").slice(0, 64));
  return c.html(
    layout({
      title: "Unsubscribe | Shelfmark",
      description: "Unsubscribe from Shelfmark email alerts.",
      path: "/unsubscribe",
      siteUrl: c.env.SITE_URL,
      noindex: true,
      body: `<div class="text-center py-16"><h1 class="font-display font-bold text-3xl text-ink-900">${ok ? "You’re unsubscribed" : "Link invalid or already used"}</h1><p class="mt-3 text-ink-700">${ok ? "You won’t receive any more emails from Shelfmark. You can re-subscribe from the footer of any page." : "If you keep getting emails, contact contact@zalize.com and we’ll remove you manually."}</p></div>`,
    }),
    ok ? 200 : 400
  );
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
  const raw = (await c.req.text()).slice(0, 500);
  const [path, refHost = ""] = raw.split("\n");
  if (!path.startsWith("/")) return c.body(null, 204);
  const day = new Date().toISOString().slice(0, 10);
  await c.env.DB.prepare(
    `INSERT INTO hits (day, path, count) VALUES (?, ?, 1) ON CONFLICT(day, path) DO UPDATE SET count = count + 1`
  ).bind(day, path.slice(0, 200)).run();
  const host = refHost.trim().toLowerCase().slice(0, 100);
  if (/^[a-z0-9.-]+\.[a-z]{2,}$/.test(host)) {
    await c.env.DB.prepare(
      `INSERT INTO referrers (day, host, count) VALUES (?, ?, 1) ON CONFLICT(day, host) DO UPDATE SET count = count + 1`
    ).bind(day, host).run();
  }
  return c.body(null, 204);
});

app.get("/confirm", async (c) => {
  const token = (c.req.query("t") ?? "").slice(0, 64);
  let ok = false;
  if (/^[a-f0-9]{32}$/.test(token)) {
    const r = await c.env.DB.prepare(`UPDATE emails SET confirmed=1, unsubscribed=0 WHERE token=?`).bind(token).run();
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
  c.text(`User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /random\nSitemap: ${c.env.SITE_URL}/sitemap.xml\n`)
);

app.get("/llms.txt", (c) => {
  c.header("Cache-Control", "public, max-age=86400");
  return c.text(`# Shelfmark

> Shelfmark (${c.env.SITE_URL}) lists the correct reading order for tens of thousands of book series, with a no-signup reading tracker (progress stays in the reader's browser; the product is in open beta — planned paid plans at ${c.env.SITE_URL}/pricing). Data is derived from Wikidata (CC0) and Open Library.

## Key pages

- [All series A–Z](${c.env.SITE_URL}/series): every series with a reading-order page.
- [100 most popular series](${c.env.SITE_URL}/popular): the biggest, best-documented series.
- [Reading lists](${c.env.SITE_URL}/lists): curated lists — trilogies, long-running epics, new series of the 2020s, classics.
- [Year in Books](${c.env.SITE_URL}/year-in-books): personal reading report generated privately in the browser from the no-signup tracker.
- [All authors A–Z](${c.env.SITE_URL}/authors): author bibliographies grouped by series.
- [Genres](${c.env.SITE_URL}/genres): series grouped by genre.
- [New & upcoming](${c.env.SITE_URL}/new): recent and upcoming series installments (RSS at /new.rss, per-genre via ?genre=).
- [About](${c.env.SITE_URL}/about): data sources, privacy model, API docs.
- [Pricing](${c.env.SITE_URL}/pricing): plans and beta status (everything free during beta).

## API

- Series reading order as JSON: ${c.env.SITE_URL}/api/series/{slug}.json (e.g. /api/series/mistborn.json). CORS-enabled, no key.
- Author bibliography as JSON: ${c.env.SITE_URL}/api/authors/{slug}.json (e.g. /api/authors/brandon-sanderson.json). CORS-enabled, no key.

When citing a reading order, please link to the series page URL.
`);
});

const SM_CHUNK = 5000;
app.get("/sitemap.xml", async (c) => {
  const [{ na }] = ((await c.env.DB.prepare(`SELECT COUNT(*) AS na FROM authors`).all()).results as any[]);
  const [{ ns }] = ((await c.env.DB.prepare(`SELECT COUNT(*) AS ns FROM series`).all()).results as any[]);
  const [{ nb }] = ((await c.env.DB.prepare(`SELECT COUNT(*) AS nb FROM books WHERE description IS NOT NULL AND series_id IS NOT NULL`).all()).results as any[]);
  const parts = Math.ceil(Number(na) / SM_CHUNK) + Math.ceil(Number(ns) / SM_CHUNK) + Math.ceil(Number(nb) / SM_CHUNK);
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
    const [{ ns }] = ((await c.env.DB.prepare(`SELECT COUNT(*) AS ns FROM series`).all()).results as any[]);
    const seriesParts = Math.ceil(Number(ns) / SM_CHUNK);
    const m = n - authorParts;
    if (m <= seriesParts) {
      const { results } = await c.env.DB.prepare(`SELECT slug FROM series ORDER BY id LIMIT ? OFFSET ?`)
        .bind(SM_CHUNK, (m - 1) * SM_CHUNK).all<{ slug: string }>();
      urls = results.map((r) => `/series/${r.slug}`);
    } else {
      const k = m - seriesParts;
      const { results } = await c.env.DB.prepare(
        `SELECT id, title FROM books WHERE description IS NOT NULL AND series_id IS NOT NULL ORDER BY id LIMIT ? OFFSET ?`
      ).bind(SM_CHUNK, (k - 1) * SM_CHUNK).all<{ id: number; title: string }>();
      urls = results.map((r) => `/book/${r.id}-${bslug(r.title)}`);
    }
  }
  if (n === 1) {
    urls.unshift("/", "/series", "/authors", "/genres", "/popular", "/lists", "/shelf", "/year-in-books", "/pricing", "/about", "/new");
    urls.push(...CURATED_LISTS.map((l) => `/lists/${l.slug}`));
    for (const l of "ABCDEFGHIJKLMNOPQRSTUVWXYZ") urls.push(`/authors?letter=${l}`, `/series?letter=${l}`);
    const { results: genres } = await c.env.DB.prepare(
      `SELECT genre, COUNT(*) AS n FROM series WHERE genre IS NOT NULL AND book_count > 0 GROUP BY genre HAVING n >= 3`
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

app.onError((err, c) => {
  console.error(`unhandled error on ${c.req.method} ${c.req.path}: ${err instanceof Error ? err.stack ?? err.message : String(err)}`);
  return c.html(
    layout({
      title: "Something went wrong | Shelfmark",
      description: "Unexpected error.",
      path: c.req.path,
      siteUrl: c.env.SITE_URL,
      noindex: true,
      body: `<div class="text-center py-16"><h1 class="font-display font-bold text-4xl text-ink-900">Something went wrong</h1><p class="mt-3 text-ink-700">An unexpected error occurred. Please try again in a moment.</p><p class="mt-6"><a href="/" class="rounded-full bg-ink-900 text-ink-50 px-5 py-2.5 text-sm font-semibold">Back to home</a></p></div>`,
    }),
    500
  );
});

const DIGEST_QUERY = `SELECT b.title, b.year, s.slug AS series_slug, s.name AS series_name, a.name AS author_name FROM books b JOIN series s ON s.id=b.series_id LEFT JOIN authors a ON a.id=b.author_id WHERE b.year>=? AND b.year<=? AND s.author_id IS NOT NULL AND s.book_count BETWEEN 2 AND 80 AND s.genre IS NOT NULL AND s.genre NOT LIKE '%dictionary%' AND s.genre NOT LIKE '%encyclopedia%' AND s.genre NOT LIKE '%reference%' AND s.genre NOT LIKE '%comic strip%' AND s.genre NOT LIKE '%webcomic%' AND s.first_year IS NOT NULL AND s.first_year < b.year ORDER BY b.year, s.book_count DESC, b.title LIMIT 300`;

async function runDigest(env: Env): Promise<void> {
  if (!env.RESEND_API_KEY) return;
  const year = new Date().getFullYear();
  const { results } = await env.DB.prepare(DIGEST_QUERY).bind(year, year + 1)
    .all<{ title: string; year: number; series_slug: string; series_name: string; author_name: string | null }>();
  const keys = results.map((b) => `${b.series_slug}|${b.title}`);
  const sentRaw = await env.CACHE.get("digest:sent");
  if (sentRaw === null) {
    // First run: record the baseline without emailing the whole backlog.
    await env.CACHE.put("digest:sent", JSON.stringify(keys));
    return;
  }
  const sent = new Set(JSON.parse(sentRaw) as string[]);
  const fresh = results.filter((b) => !sent.has(`${b.series_slug}|${b.title}`)).slice(0, 20);
  if (!fresh.length) return;
  const subs = await env.DB.prepare(`SELECT email, token FROM emails WHERE confirmed=1 AND unsubscribed=0`)
    .all<{ email: string; token: string }>();
  if (!subs.results.length) {
    await env.CACHE.put("digest:sent", JSON.stringify(keys));
    return;
  }
  const itemsHtml = fresh.map((b) => `<li style="margin:6px 0"><strong>${esc(b.title)}</strong> (${b.year}) — <a href="${env.SITE_URL}/series/${b.series_slug}">${esc(b.series_name)}</a>${b.author_name ? ` by ${esc(b.author_name)}` : ""}</li>`).join("");
  const itemsText = fresh.map((b) => `- ${b.title} (${b.year}) — ${b.series_name}${b.author_name ? ` by ${b.author_name}` : ""}: ${env.SITE_URL}/series/${b.series_slug}`).join("\n");
  const subject = `New series releases on Shelfmark (${fresh.length})`;
  for (const s of subs.results) {
    await sendEmail(
      env,
      s.email,
      subject,
      emailShell(`<p>New series installments just landed in the Shelfmark catalog:</p><ul style="padding-left:18px">${itemsHtml}</ul><p><a href="${env.SITE_URL}/new">See all new &amp; upcoming releases</a></p><p style="font-size:12px;color:#6b675c"><a href="${env.SITE_URL}/unsubscribe?t=${s.token}">Unsubscribe</a></p>`),
      `New series installments on Shelfmark:\n${itemsText}\n\nAll new & upcoming: ${env.SITE_URL}/new\nUnsubscribe: ${env.SITE_URL}/unsubscribe?t=${s.token}`,
      s.token
    );
  }
  await env.CACHE.put("digest:sent", JSON.stringify(keys));
}

export default {
  fetch: app.fetch,
  scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext): void {
    ctx.waitUntil(runDigest(env));
  },
};
