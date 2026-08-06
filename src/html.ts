export const esc = (s: unknown): string =>
  String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string)
  );

export interface PageOpts {
  title: string;
  description: string;
  path: string;
  siteUrl: string;
  jsonLd?: object[];
  body: string;
  h1?: boolean;
  image?: string;
}

const SISTERS = [
  ["AstroSage", "https://astrosage.zalize.com", "Zi Wei astrology readings"],
  ["SubSleuth", "https://subsleuth.zalize.com", "Track your subscriptions"],
  ["HonestCV", "https://cv.zalize.com", "Honest resume feedback"],
  ["WatchDeck", "https://watchdeck.zalize.com", "Track TV shows"],
  ["MealLoop", "https://mealloop.zalize.com", "Weekly meal planning"],
];

export function layout(o: PageOpts): string {
  const canonical = o.siteUrl + o.path;
  const ld = (o.jsonLd ?? [])
    .map((x) => `<script type="application/ld+json">${JSON.stringify(x).replace(/</g, "\\u003c")}</script>`)
    .join("\n");
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(o.title)}</title>
<meta name="description" content="${esc(o.description)}">
<link rel="canonical" href="${esc(canonical)}">
<meta property="og:title" content="${esc(o.title)}">
<meta property="og:description" content="${esc(o.description)}">
<meta property="og:url" content="${esc(canonical)}">
<meta property="og:site_name" content="Shelfmark">
<meta property="og:type" content="website">
<meta property="og:image" content="${esc(o.image ?? o.siteUrl + "/og.png")}">
<meta name="twitter:card" content="${o.image ? "summary" : "summary_large_image"}">
<meta name="twitter:image" content="${esc(o.image ?? o.siteUrl + "/og.png")}">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/styles.css">
${ld}
</head>
<body class="bg-ink-50 text-ink-800 font-sans antialiased min-h-screen flex flex-col">
<a href="#main" class="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:bg-white focus:px-3 focus:py-1.5 focus:rounded-full focus:text-sm focus:shadow">Skip to content</a>
<header class="border-b border-ink-200 bg-ink-50/90 backdrop-blur sticky top-0 z-20">
  <div class="max-w-5xl mx-auto px-4 h-14 flex items-center gap-4">
    <a href="/" class="font-display font-bold text-xl text-ink-900 shrink-0">Shelf<span class="text-amber-accent">mark</span></a>
    <form action="/search" method="get" class="flex-1 max-w-md hidden sm:block">
      <input name="q" type="search" placeholder="Search a series or author…" class="w-full rounded-full border border-ink-200 bg-white px-4 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-accent/50">
    </form>
    <nav class="ml-auto flex items-center gap-4 text-sm font-medium">
      <a href="/series" class="hover:text-amber-accent">Series</a>
      <a href="/authors" class="hover:text-amber-accent">Authors</a>
      <a href="/genres" class="hover:text-amber-accent">Genres</a>
      <a href="/new" class="hover:text-amber-accent hidden sm:inline">New</a>
      <a href="/shelf" class="rounded-full bg-ink-900 text-ink-50 px-3.5 py-1.5 hover:bg-ink-700">My Shelf</a>
    </nav>
  </div>
  <form action="/search" method="get" class="sm:hidden px-4 pb-3">
    <input name="q" type="search" placeholder="Search a series or author…" class="w-full rounded-full border border-ink-200 bg-white px-4 py-1.5 text-sm">
  </form>
</header>
<main id="main" class="flex-1 w-full max-w-5xl mx-auto px-4 py-8">
${o.body}
</main>
<footer class="border-t border-ink-200 mt-16 py-10 text-sm text-ink-700">
  <div class="max-w-5xl mx-auto px-4 grid gap-8 sm:grid-cols-3">
    <div>
      <p class="font-display font-bold text-ink-900 text-lg mb-2">Shelfmark</p>
      <p>Every book series in the right order — and a private, no-signup reading tracker built into every page.</p>
      <p class="mt-3 text-xs text-ink-700/70">Data from Wikidata &amp; Open Library (CC0). Not affiliated with any retailer.</p>
    </div>
    <div>
      <p class="font-semibold text-ink-900 mb-2">Explore</p>
      <ul class="space-y-1">
        <li><a class="hover:text-amber-accent" href="/series">All series</a></li>
        <li><a class="hover:text-amber-accent" href="/authors">All authors</a></li>
        <li><a class="hover:text-amber-accent" href="/genres">Genres</a></li>
        <li><a class="hover:text-amber-accent" href="/new">New releases</a></li>
        <li><a class="hover:text-amber-accent" href="/shelf">My shelf</a></li>
        <li><a class="hover:text-amber-accent" href="/about">About &amp; methodology</a></li>
        <li><a class="hover:text-amber-accent" href="/privacy">Privacy</a></li>
      </ul>
    </div>
    <div>
      <p class="font-semibold text-ink-900 mb-2">More from Zalize</p>
      <ul class="space-y-1">
        ${SISTERS.map(([n, u, d]) => `<li><a class="hover:text-amber-accent" href="${u}" title="${esc(d)}">${n}</a> <span class="text-ink-700/80">— ${esc(d)}</span></li>`).join("")}
      </ul>
    </div>
  </div>
  <div class="max-w-5xl mx-auto px-4 mt-8 flex flex-wrap items-center gap-4 justify-between">
    <p>© ${new Date().getFullYear()} Shelfmark · zalize.com</p>
    <form data-subscribe class="flex flex-wrap gap-2">
      <input type="email" name="email" required aria-label="Email for new-release alerts" placeholder="Email for new-release alerts" class="rounded-full border border-ink-200 bg-white px-3 py-1.5 text-xs w-56">
      <button class="rounded-full bg-amber-accent text-white px-3.5 py-1.5 text-xs font-semibold hover:opacity-90">Notify me</button>
    </form>
  </div>
</footer>
<script src="/app.js" defer></script>
</body>
</html>`;
}
