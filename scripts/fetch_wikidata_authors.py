#!/usr/bin/env python3
"""Fetch author->literary work rows from Wikidata SPARQL into data/raw_author_rows.jsonl."""
import json, sys, time, urllib.parse, urllib.request

ENDPOINT = "https://query.wikidata.org/sparql"
UA = "ShelfmarkBot/1.0 (https://shelfmark.zalize.com; contact@zalize.com)"

QUERY = """
SELECT ?author ?authorLabel ?book ?bookLabel ?pub ?series WHERE {
  ?book wdt:P31 wd:Q7725634 .
  ?book wdt:P50 ?author .
  OPTIONAL { ?book wdt:P577 ?pub . }
  OPTIONAL { ?book wdt:P179 ?series . }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en" . }
}
LIMIT %d OFFSET %d
"""

def run(offset, limit):
    q = QUERY % (limit, offset)
    url = ENDPOINT + "?" + urllib.parse.urlencode({"query": q, "format": "json"})
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=300) as r:
        return json.load(r)

def main():
    out = open("data/raw_author_rows.jsonl", "w")
    offset, limit, total = 0, 20000, 0
    while True:
        for attempt in range(5):
            try:
                d = run(offset, limit)
                break
            except Exception as e:
                print("retry", offset, e, file=sys.stderr)
                time.sleep(20 * (attempt + 1))
        else:
            print("giving up at offset", offset, file=sys.stderr)
            break
        rows = d["results"]["bindings"]
        if not rows:
            break
        for b in rows:
            rec = {k: b[k]["value"] for k in b}
            out.write(json.dumps(rec, ensure_ascii=False) + "\n")
        out.flush()
        total += len(rows)
        print("offset", offset, "got", len(rows), "total", total, file=sys.stderr)
        if len(rows) < limit:
            break
        offset += limit
        time.sleep(2)
    out.close()

if __name__ == "__main__":
    main()
