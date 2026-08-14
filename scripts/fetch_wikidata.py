#!/usr/bin/env python3
"""Fetch book series data from Wikidata SPARQL into data/raw_rows.jsonl.

Default mode discovers all series of type Q277759. NOTE: LIMIT/OFFSET pagination
without ORDER BY is not stable on WDQS — pages can drop rows. For refreshing a
known catalog, pass a file of series QIDs (one per line): the query then runs in
deterministic VALUES batches instead.

  python3 scripts/fetch_wikidata.py [series_qids.txt]
"""
import json, sys, time, urllib.parse, urllib.request

ENDPOINT = "https://query.wikidata.org/sparql"
UA = "ShelfmarkBot/1.0 (https://shelfmark.zalize.com; contact@zalize.com)"

QUERY = """
SELECT ?series ?seriesLabel ?author ?authorLabel ?book ?bookLabel ?ordinal ?pub ?type WHERE {
  ?series wdt:P31/wdt:P279* wd:Q277759 .
  # Scope the ordinal to THIS series' membership statement: books that belong to
  # both a series and one of its sub-series carry a P1545 per statement, and an
  # unscoped join leaks the sub-series numbering into the parent series.
  ?book p:P179 ?st . ?st ps:P179 ?series .
  OPTIONAL { ?st pq:P1545 ?ordinal . }
  OPTIONAL { ?book wdt:P577 ?pub . }
  OPTIONAL { ?book wdt:P31 ?type . }
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

BATCH_QUERY = QUERY.replace(
    "?series wdt:P31/wdt:P279* wd:Q277759 .", "VALUES ?series { %s }"
).replace("LIMIT %d OFFSET %d", "")

def run_batch(qids):
    q = BATCH_QUERY % " ".join(f"wd:{x}" for x in qids)
    url = ENDPOINT + "?" + urllib.parse.urlencode({"query": q, "format": "json"})
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=180) as r:
        return json.load(r)

def main_batches(path):
    qids = [l.strip() for l in open(path) if l.strip()]
    out, total = open("data/raw_rows.jsonl", "w"), 0
    for i in range(0, len(qids), 100):
        for attempt in range(4):
            try:
                d = run_batch(qids[i : i + 100])
                break
            except Exception as e:
                print("retry batch", i, e, file=sys.stderr)
                time.sleep(15 * (attempt + 1))
        else:
            raise SystemExit(f"giving up at batch {i}")
        rows = d["results"]["bindings"]
        for b in rows:
            rec = {k: b[k]["value"] for k in b}
            out.write(json.dumps(rec, ensure_ascii=False) + "\n")
        total += len(rows)
        print("batch", i, "got", len(rows), "total", total, file=sys.stderr)
        time.sleep(2)
    out.close()

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
    if len(sys.argv) > 1:
        main_batches(sys.argv[1])
    else:
        main()
