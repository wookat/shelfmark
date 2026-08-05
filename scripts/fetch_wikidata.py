#!/usr/bin/env python3
"""Fetch book series data from Wikidata SPARQL into data/raw_rows.jsonl."""
import json, sys, time, urllib.parse, urllib.request

ENDPOINT = "https://query.wikidata.org/sparql"
UA = "ShelfmarkBot/1.0 (https://shelfmark.zalize.com; contact@zalize.com)"

QUERY = """
SELECT ?series ?seriesLabel ?author ?authorLabel ?book ?bookLabel ?ordinal ?pub WHERE {
  ?series wdt:P31/wdt:P279* wd:Q277759 .
  ?book wdt:P179 ?series .
  OPTIONAL { ?book p:P179 ?st . ?st pq:P1545 ?ordinal . }
  OPTIONAL { ?book wdt:P577 ?pub . }
  OPTIONAL { ?series wdt:P50 ?author . }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en" . }
}
LIMIT %d OFFSET %d
"""

def run(offset, limit):
    q = QUERY % (limit, offset)
    url = ENDPOINT + "?" + urllib.parse.urlencode({"query": q, "format": "json"})
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=180) as r:
        return json.load(r)

def main():
    out = open("data/raw_rows.jsonl", "w")
    offset, limit, total = 0, 20000, 0
    while True:
        for attempt in range(4):
            try:
                d = run(offset, limit)
                break
            except Exception as e:
                print("retry", offset, e, file=sys.stderr)
                time.sleep(15 * (attempt + 1))
        else:
            print("giving up at offset", offset, file=sys.stderr)
            break
        rows = d["results"]["bindings"]
        if not rows:
            break
        for b in rows:
            rec = {k: b[k]["value"] for k in b}
            out.write(json.dumps(rec, ensure_ascii=False) + "\n")
        total += len(rows)
        print("offset", offset, "got", len(rows), "total", total, file=sys.stderr)
        if len(rows) < limit:
            break
        offset += limit
        time.sleep(3)
    out.close()

if __name__ == "__main__":
    main()
