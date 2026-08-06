#!/usr/bin/env python3
"""Backfill series.genre from the P136 genres of a series' books.

For series still missing a genre, fetch each book's Wikidata P136 claims and
assign the majority genre label (requires at least 2 books agreeing, or 1 for
2-book series).
Usage: CLOUDFLARE_API_TOKEN=... python3 scripts/backfill_genres_books.py
"""
import json
import os
import time
import urllib.request
from collections import Counter, defaultdict

ACCOUNT = "ddff52d24ee44e21a021c15eaffcc86d"
DB = "199bce20-bde4-4875-b8e1-fbc339b020b5"
TOKEN = os.environ["CLOUDFLARE_API_TOKEN"]
UA = "ShelfmarkBot/1.0 (contact@zalize.com)"


def d1(sql: str, params=None):
    body = json.dumps({"sql": sql, "params": params or []}).encode()
    req = urllib.request.Request(
        f"https://api.cloudflare.com/client/v4/accounts/{ACCOUNT}/d1/database/{DB}/query",
        data=body,
        headers={"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json"},
    )
    out = json.loads(urllib.request.urlopen(req).read())
    if not out.get("success"):
        raise RuntimeError(out)
    return out["result"][0]["results"]


def wd(url_suffix):
    req = urllib.request.Request(
        f"https://www.wikidata.org/w/api.php?action=wbgetentities&format=json&{url_suffix}",
        headers={"User-Agent": UA},
    )
    return json.loads(urllib.request.urlopen(req).read()).get("entities", {})


def main():
    rows = d1(
        """SELECT b.series_id AS sid, b.wikidata_id AS q FROM books b
           JOIN series s ON s.id=b.series_id
           WHERE s.genre IS NULL AND s.book_count > 0 AND s.author_id IS NOT NULL
             AND b.wikidata_id IS NOT NULL"""
    )
    series_books = defaultdict(list)
    for r in rows:
        series_books[r["sid"]].append(r["q"])
    print(f"{len(series_books)} series, {len(rows)} books to scan")
    qids = [r["q"] for r in rows]
    genre_by_book = {}
    for i in range(0, len(qids), 50):
        batch = qids[i : i + 50]
        try:
            ents = wd("props=claims&ids=" + "|".join(batch))
        except Exception as e:
            print("batch failed", i, e)
            time.sleep(2)
            continue
        for q, e in ents.items():
            claims = e.get("claims", {}) if isinstance(e, dict) else {}
            for cl in claims.get("P136", []):
                v = cl.get("mainsnak", {}).get("datavalue", {}).get("value", {})
                if isinstance(v, dict) and v.get("id"):
                    genre_by_book[q] = v["id"]
                    break
        time.sleep(0.25)
        if i % 1000 == 0:
            print(f"scanned {i+len(batch)} books, {len(genre_by_book)} with genre")
    chosen = {}  # sid -> genre qid
    for sid, bs in series_books.items():
        counts = Counter(genre_by_book[q] for q in bs if q in genre_by_book)
        if not counts:
            continue
        gq, n = counts.most_common(1)[0]
        if n >= 2 or (n == 1 and len(bs) <= 2):
            chosen[sid] = gq
    genre_qids = sorted(set(chosen.values()))
    print(f"{len(chosen)} series get a genre; {len(genre_qids)} distinct")
    labels = {}
    for i in range(0, len(genre_qids), 50):
        ents = wd("props=labels&languages=en&ids=" + "|".join(genre_qids[i : i + 50]))
        for q, e in ents.items():
            lab = e.get("labels", {}).get("en", {}).get("value")
            if lab:
                labels[q] = lab
        time.sleep(0.25)
    updated = 0
    for sid, gq in chosen.items():
        lab = labels.get(gq)
        if not lab or len(lab) > 40:
            continue
        d1("UPDATE series SET genre=? WHERE id=?", [lab, sid])
        updated += 1
        if updated % 50 == 0:
            print(f"updated {updated}")
    print(f"done: updated {updated}")


if __name__ == "__main__":
    main()
