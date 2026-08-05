#!/usr/bin/env python3
"""Match books to Open Library covers via the search API.

Reads data/books_need_covers.jsonl ({id,title,author}), writes data/ol_covers.jsonl
({id,cover_id}) for confident matches (first result with a cover_i).
"""
import json, os, re, sys, time, urllib.parse, urllib.request

UA = "ShelfmarkBot/1.0 (https://shelfmark.zalize.com; contact@zalize.com)"

def norm(s):
    return re.sub(r"[^a-z0-9]+", " ", s.lower()).strip()

def main():
    done = set()
    if os.path.exists(sys.argv[2]):
        for l in open(sys.argv[2]):
            done.add(json.loads(l)["id"])
    out = open(sys.argv[2], "a")
    n = hits = 0
    for line in open(sys.argv[1]):
        r = json.loads(line)
        if r["id"] in done:
            continue
        n += 1
        params = {"title": r["title"], "limit": 3, "fields": "title,author_name,cover_i"}
        if r.get("author"):
            params["author"] = r["author"]
        url = "https://openlibrary.org/search.json?" + urllib.parse.urlencode(params)
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=30) as resp:
                docs = json.load(resp).get("docs", [])
        except Exception as e:
            print("err", r["id"], e, file=sys.stderr)
            time.sleep(10)
            continue
        want = norm(r["title"])
        for d in docs:
            if d.get("cover_i") and norm(d.get("title", "")) == want:
                out.write(json.dumps({"id": r["id"], "cover_id": d["cover_i"]}) + "\n")
                out.flush()
                hits += 1
                break
        if n % 200 == 0:
            print(n, "checked", hits, "matched", file=sys.stderr)
        time.sleep(0.6)
    print("done", n, hits, file=sys.stderr)

if __name__ == "__main__":
    main()
