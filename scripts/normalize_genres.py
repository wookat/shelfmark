#!/usr/bin/env python3
"""Normalize near-duplicate genre labels so genre hub pages consolidate.

Conservative synonym map only: variants that clearly mean the same shelf
(e.g. "crime literature" -> "crime fiction"). Also clears known-bad P136
values that are not genres.
Usage: CLOUDFLARE_API_TOKEN=... python3 scripts/normalize_genres.py
"""
import json
import os
import urllib.request

ACCOUNT = "ddff52d24ee44e21a021c15eaffcc86d"
DB = "199bce20-bde4-4875-b8e1-fbc339b020b5"
TOKEN = os.environ["CLOUDFLARE_API_TOKEN"]

MERGES = {
    "fantasy literature": "fantasy",
    "dark fantasy literature": "dark fantasy",
    "science fiction literature": "science fiction",
    "crime literature": "crime fiction",
    "crime novel": "crime fiction",
    "detective literature": "detective fiction",
    "children's fiction": "children's literature",
    "children's book": "children's literature",
    "children's novel": "children's literature",
    "romance": "romance novel",
    "romantic fiction": "romance novel",
    "horror literature": "horror fiction",
    "thriller novel": "thriller",
    "historical novel": "historical fiction",
    "cyberpunk novel": "cyberpunk",
    "fiction literature": "fiction",
    "non-fiction literature": "non-fiction",
    "non-fiction literary work": "non-fiction",
    "historical non-fiction work": "non-fiction",
    "historical non-fiction": "non-fiction",
    "young adult fiction": "young adult literature",
    "Western novel": "Western",
    "vampire literature": "vampire fiction",
}
# P136 values that are not genres at all
CLEAR = ["Gunilla Bergström", "timeline", "landscape painting", "puppetry", "epistemology", "cosmology", "colonialism"]


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
    return out["result"][0]


def main():
    total = 0
    for src, dst in MERGES.items():
        r = d1("UPDATE series SET genre=? WHERE genre=?", [dst, src])
        n = r.get("meta", {}).get("changes", 0)
        if n:
            print(f"{src} -> {dst}: {n}")
        total += n
    for bad in CLEAR:
        r = d1("UPDATE series SET genre=NULL WHERE genre=?", [bad])
        n = r.get("meta", {}).get("changes", 0)
        if n:
            print(f"cleared {bad}: {n}")
        total += n
    print(f"done: {total} rows changed")


if __name__ == "__main__":
    main()
