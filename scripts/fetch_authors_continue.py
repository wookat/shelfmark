#!/usr/bin/env python3
"""Continue author fetch from a given offset with smaller pages; skip pages that repeatedly fail."""
import json, sys, time, urllib.parse, urllib.request
from fetch_wikidata_authors import QUERY, ENDPOINT, UA

start = int(sys.argv[1])
out = open("data/raw_author_rows.jsonl", "a")
offset, limit, total = start, 10000, 0
while True:
    q = QUERY % (limit, offset)
    url = ENDPOINT + "?" + urllib.parse.urlencode({"query": q, "format": "json"})
    rows = None
    for attempt in range(3):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=300) as r:
                rows = json.load(r)["results"]["bindings"]
            break
        except Exception as e:
            print("retry", offset, e, file=sys.stderr)
            time.sleep(15 * (attempt + 1))
    if rows is None:
        print("SKIP page at", offset, file=sys.stderr)
        offset += limit
        if offset > 500000: break
        continue
    if not rows:
        break
    for b in rows:
        out.write(json.dumps({k: b[k]["value"] for k in b}, ensure_ascii=False) + "\n")
    out.flush()
    total += len(rows)
    print("offset", offset, "got", len(rows), "total", total, file=sys.stderr)
    if len(rows) < limit:
        break
    offset += limit
    time.sleep(2)
out.close()
