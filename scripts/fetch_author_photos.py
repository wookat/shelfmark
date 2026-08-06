#!/usr/bin/env python3
"""Fetch author photos (Wikidata P18) for authors in data/author_qids_photos.jsonl.

Writes data/author_photos.jsonl ({id, photo}) where photo is a Commons
Special:FilePath URL (redirects to upload.wikimedia.org) with width=256.
"""
import json, sys, time, urllib.parse, urllib.request

UA = "ShelfmarkBot/1.0 (https://shelfmark.zalize.com; contact@zalize.com)"
API = "https://www.wikidata.org/w/api.php"

def main():
    rows = [json.loads(l) for l in open(sys.argv[1])]
    out = open(sys.argv[2], "w")
    found = 0
    for i in range(0, len(rows), 50):
        batch = rows[i : i + 50]
        qids = "|".join(r["wikidata_id"] for r in batch)
        url = API + "?" + urllib.parse.urlencode(
            {"action": "wbgetentities", "ids": qids, "props": "claims", "format": "json"}
        )
        req = urllib.request.Request(url, headers={"User-Agent": UA})
        data = json.load(urllib.request.urlopen(req, timeout=60))
        ents = data.get("entities", {})
        for r in batch:
            claims = ents.get(r["wikidata_id"], {}).get("claims", {})
            p18 = claims.get("P18")
            if not p18:
                continue
            fname = p18[0].get("mainsnak", {}).get("datavalue", {}).get("value")
            if not isinstance(fname, str):
                continue
            photo = "https://commons.wikimedia.org/wiki/Special:FilePath/" + urllib.parse.quote(fname.replace(" ", "_")) + "?width=256"
            out.write(json.dumps({"id": r["id"], "photo": photo}) + "\n")
            found += 1
        out.flush()
        print(i + len(batch), "processed", found, "photos", file=sys.stderr)
        time.sleep(1)
    print("done", found, file=sys.stderr)

if __name__ == "__main__":
    main()
