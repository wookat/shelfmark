#!/usr/bin/env python3
"""Fetch series genres and book ISBNs from Wikidata into data/raw_genres.jsonl and data/raw_isbns.jsonl."""
import json, sys, time, urllib.parse, urllib.request

ENDPOINT = "https://query.wikidata.org/sparql"
UA = "ShelfmarkBot/1.0 (https://shelfmark.zalize.com; contact@zalize.com)"

GENRES = """
SELECT ?series ?genreLabel WHERE {
  ?series wdt:P31/wdt:P279* wd:Q277759 .
  ?series wdt:P136 ?genre .
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en" . }
}
LIMIT %d OFFSET %d
"""

ISBNS = """
SELECT ?book ?isbn WHERE {
  { ?book wdt:P179 ?s . ?s wdt:P31/wdt:P279* wd:Q277759 . }
  UNION
  { ?book wdt:P31 wd:Q7725634 . }
  { ?book wdt:P212 ?isbn . } UNION { ?book wdt:P957 ?isbn . }
}
LIMIT %d OFFSET %d
"""

def fetch(query, path):
    out = open(path, "w")
    offset, limit, total = 0, 20000, 0
    while True:
        q = query % (limit, offset)
        url = ENDPOINT + "?" + urllib.parse.urlencode({"query": q, "format": "json"})
        for attempt in range(5):
            try:
                req = urllib.request.Request(url, headers={"User-Agent": UA})
                with urllib.request.urlopen(req, timeout=300) as r:
                    d = json.load(r)
                break
            except Exception as e:
                print("retry", path, offset, e, file=sys.stderr)
                time.sleep(20 * (attempt + 1))
        else:
            print("giving up", path, offset, file=sys.stderr)
            break
        rows = d["results"]["bindings"]
        if not rows:
            break
        for b in rows:
            out.write(json.dumps({k: b[k]["value"] for k in b}, ensure_ascii=False) + "\n")
        out.flush()
        total += len(rows)
        print(path, "offset", offset, "total", total, file=sys.stderr)
        if len(rows) < limit:
            break
        offset += limit
        time.sleep(2)
    out.close()

if __name__ == "__main__":
    fetch(GENRES, "data/raw_genres.jsonl")
    fetch(ISBNS, "data/raw_isbns.jsonl")
