# Shelfmark

Book series reading order + no-signup private reading tracker. Live at https://shelfmark.zalize.com

- Cloudflare Workers (Hono SSR) + D1 (catalog, analytics, emails) + KV (cache)
- Tailwind CSS v4 (`npm run css`)
- Data pipeline: `scripts/fetch_wikidata.py` → `scripts/build_seed.py` → `data/seed.sql`

## Develop
```
npm i
npm run css
npx wrangler dev
```

## Deploy
```
npm run css && npx wrangler deploy
```
