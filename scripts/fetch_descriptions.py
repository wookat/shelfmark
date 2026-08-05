#!/usr/bin/env python3
"""Fetch en descriptions for entity QIDs (stdin, one per line) in VALUES batches -> stdout JSONL."""
import json, sys, time, urllib.parse, urllib.request

ENDPOINT = "https://query.wikidata.org/sparql"
UA = "ShelfmarkBot/1.0 (https://shelfmark.zalize.com; contact@zalize.com)"

def main():
    qids = [l.strip() for l in sys.stdin if l.strip()]
    B = 500
    for i in range(0, len(qids), B):
        vals = " ".join(f"wd:{q}" for q in qids[i:i+B])
        query = f'SELECT ?s ?d WHERE {{ VALUES ?s {{ {vals} }} ?s schema:description ?d . FILTER(LANG(?d)="en") }}'
        data = urllib.parse.urlencode({"query": query, "format": "json"}).encode()
        rows = None
        for attempt in range(4):
            try:
                req = urllib.request.Request(ENDPOINT, data=data, headers={"User-Agent": UA, "Content-Type": "application/x-www-form-urlencoded"})
                with urllib.request.urlopen(req, timeout=180) as r:
                    rows = json.load(r)["results"]["bindings"]
                break
            except Exception as e:
                print("retry", i, e, file=sys.stderr)
                time.sleep(10 * (attempt + 1))
        if rows is None:
            print("SKIP", i, file=sys.stderr)
            continue
        for b in rows:
            print(json.dumps({"s": b["s"]["value"], "d": b["d"]["value"]}, ensure_ascii=False))
        print("batch", i, len(rows), file=sys.stderr)
        time.sleep(1)

if __name__ == "__main__":
    main()
