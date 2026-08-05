#!/usr/bin/env python3
"""Fetch works for specific author QIDs (data/author_qids.txt) in VALUES batches."""
import json, sys, time, urllib.parse, urllib.request

ENDPOINT = "https://query.wikidata.org/sparql"
UA = "ShelfmarkBot/1.0 (https://shelfmark.zalize.com; contact@zalize.com)"

Q = """
SELECT ?author ?authorLabel ?book ?bookLabel ?pub ?series WHERE {
  VALUES ?author { %s }
  ?book wdt:P31 wd:Q7725634 .
  ?book wdt:P50 ?author .
  OPTIONAL { ?book wdt:P577 ?pub . }
  OPTIONAL { ?book wdt:P179 ?series . }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en" . }
}
"""

def main():
    qids = [l.strip() for l in open("data/author_qids.txt") if l.strip()]
    start = int(sys.argv[1]) if len(sys.argv) > 1 else 0
    out = open("data/raw_author_rows.jsonl", "a" if start else "w")
    B = 300
    for i in range(start, len(qids), B):
        vals = " ".join(f"wd:{q}" for q in qids[i:i+B])
        url = ENDPOINT + "?" + urllib.parse.urlencode({"query": Q % vals, "format": "json"})
        rows = None
        for attempt in range(4):
            try:
                req = urllib.request.Request(url, headers={"User-Agent": UA})
                with urllib.request.urlopen(req, timeout=180) as r:
                    rows = json.load(r)["results"]["bindings"]
                break
            except Exception as e:
                print("retry", i, e, file=sys.stderr)
                time.sleep(10 * (attempt + 1))
        if rows is None:
            print("SKIP batch", i, file=sys.stderr)
            continue
        for b in rows:
            out.write(json.dumps({k: b[k]["value"] for k in b}, ensure_ascii=False) + "\n")
        out.flush()
        print("batch", i, "rows", len(rows), file=sys.stderr)
        time.sleep(1)
    out.close()

if __name__ == "__main__":
    main()
