#!/usr/bin/env python3
"""Backfill series.genre from Wikidata P136 for series missing a genre.

Usage: CLOUDFLARE_API_TOKEN=... python3 scripts/backfill_genres.py
Reads null-genre series from D1, batch-fetches P136 genre labels via
wbgetentities, and writes the first genre label back to D1.
"""
import json
import os
import time
import urllib.parse
import urllib.request

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


def wd_entities(qids):
    url = (
        "https://www.wikidata.org/w/api.php?action=wbgetentities&format=json"
        f"&props=claims&ids={'|'.join(qids)}"
    )
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    return json.loads(urllib.request.urlopen(req).read()).get("entities", {})


def wd_labels(qids):
    labels = {}
    for i in range(0, len(qids), 50):
        url = (
            "https://www.wikidata.org/w/api.php?action=wbgetentities&format=json"
            f"&props=labels&languages=en&ids={'|'.join(qids[i:i+50])}"
        )
        req = urllib.request.Request(url, headers={"User-Agent": UA})
        ents = json.loads(urllib.request.urlopen(req).read()).get("entities", {})
        for q, e in ents.items():
            lab = e.get("labels", {}).get("en", {}).get("value")
            if lab:
                labels[q] = lab
        time.sleep(0.3)
    return labels


def main():
    rows = d1(
        "SELECT id, wikidata_id FROM series WHERE genre IS NULL AND book_count > 0 AND wikidata_id IS NOT NULL"
    )
    print(f"{len(rows)} series missing genre")
    genre_of = {}  # series id -> genre qid
    qids = [r["wikidata_id"] for r in rows]
    by_qid = {r["wikidata_id"]: r["id"] for r in rows}
    for i in range(0, len(qids), 50):
        batch = qids[i : i + 50]
        try:
            ents = wd_entities(batch)
        except Exception as e:
            print("batch failed", i, e)
            time.sleep(2)
            continue
        for q, e in ents.items():
            claims = e.get("claims", {}) if isinstance(e, dict) else {}
            for cl in claims.get("P136", []):
                v = cl.get("mainsnak", {}).get("datavalue", {}).get("value", {})
                if isinstance(v, dict) and v.get("id"):
                    genre_of[by_qid[q]] = v["id"]
                    break
        time.sleep(0.3)
        if i % 500 == 0:
            print(f"scanned {i+len(batch)}, found {len(genre_of)}")
    genre_qids = sorted(set(genre_of.values()))
    print(f"{len(genre_of)} series have P136; {len(genre_qids)} distinct genres")
    labels = wd_labels(genre_qids)
    updated = 0
    for sid, gq in genre_of.items():
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
