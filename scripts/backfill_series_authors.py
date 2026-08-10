#!/usr/bin/env python3
"""Backfill series.author_id for author-less series from Wikidata P50.

Input: /tmp/authorless.json — [{id, wikidata_id, slug}] exported from D1.
Output: /tmp/author_backfill.sql — INSERT/UPDATE statements to apply with wrangler.

Only series whose Wikidata entity has exactly one P50 author with an English
label are backfilled; multi-author and unlabeled cases are skipped (logged).
"""
import json, re, sys, time, urllib.parse, urllib.request

ENDPOINT = "https://query.wikidata.org/sparql"
UA = "ShelfmarkBot/1.0 (https://shelfmark.zalize.com; contact@zalize.com)"


def sparql(query):
    url = ENDPOINT + "?" + urllib.parse.urlencode({"query": query, "format": "json"})
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=300) as r:
        return json.load(r)["results"]["bindings"]


def slugify(name):
    s = name.lower()
    s = re.sub(r"['\u2019]", "", s)
    s = re.sub(r"[^a-z0-9]+", "-", s).strip("-")
    return s or "author"


def esc(s):
    return s.replace("'", "''")


def main():
    series = json.load(open("/tmp/authorless.json"))
    qid_to_series = {}
    for s in series:
        if s["wikidata_id"]:
            qid_to_series.setdefault(s["wikidata_id"], []).append(s)
    qids = list(qid_to_series)
    print(len(qids), "series QIDs", file=sys.stderr)

    rows = []
    for i in range(0, len(qids), 150):
        batch = qids[i : i + 150]
        values = " ".join(f"wd:{q}" for q in batch)
        q = f"""
SELECT ?series ?author ?authorLabel ?authorDescription ?img WHERE {{
  VALUES ?series {{ {values} }}
  ?series wdt:P50 ?author .
  OPTIONAL {{ ?author wdt:P18 ?img . }}
  SERVICE wikibase:label {{ bd:serviceParam wikibase:language "en" . }}
}}"""
        for attempt in range(5):
            try:
                rows += sparql(q)
                break
            except Exception as e:
                print("retry", i, e, file=sys.stderr)
                time.sleep(15 * (attempt + 1))
        print("batch", i, "rows", len(rows), file=sys.stderr)
        time.sleep(1.5)

    by_series = {}
    for b in rows:
        sq = b["series"]["value"].rsplit("/", 1)[1]
        aq = b["author"]["value"].rsplit("/", 1)[1]
        label = b.get("authorLabel", {}).get("value", "")
        desc = b.get("authorDescription", {}).get("value", "")
        img = b.get("img", {}).get("value", "")
        by_series.setdefault(sq, {})[aq] = (label, desc, img)

    out = open("/tmp/author_backfill.sql", "w")
    skipped_multi = skipped_none = skipped_label = 0
    authors = {}  # author qid -> (name, desc, img)
    updates = []  # (series_id, author_qid)
    for sq, slist in qid_to_series.items():
        cands = by_series.get(sq, {})
        if not cands:
            skipped_none += 1
            continue
        if len(cands) > 1:
            skipped_multi += 1
            continue
        aq, (label, desc, img) = next(iter(cands.items()))
        if not label or re.fullmatch(r"Q\d+", label):
            skipped_label += 1
            continue
        authors[aq] = (label, desc, img)
        for s in slist:
            updates.append((s["id"], aq))

    taken = set(json.load(open("/tmp/author_slugs.json")))
    for aq, (name, desc, img) in sorted(authors.items()):
        slug = slugify(name)
        if slug in taken:
            slug = f"{slug}-{aq.lower()}"
        taken.add(slug)
        photo = (
            "https://commons.wikimedia.org/wiki/Special:FilePath/"
            + urllib.parse.quote(img.rsplit("/", 1)[1])
            + "?width=256"
            if img
            else ""
        )
        out.write(
            "INSERT INTO authors (slug,name,bio,wikidata_id,series_count,book_count,photo_url) "
            f"SELECT '{esc(slug)}','{esc(name)}',"
            f"{('NULL' if not desc else chr(39) + esc(desc) + chr(39))},'{aq}',0,0,"
            f"{('NULL' if not photo else chr(39) + esc(photo) + chr(39))} "
            f"WHERE NOT EXISTS (SELECT 1 FROM authors WHERE wikidata_id='{aq}');\n"
        )
    for sid, aq in updates:
        out.write(
            f"UPDATE series SET author_id=(SELECT id FROM authors WHERE wikidata_id='{aq}') WHERE id={sid};\n"
        )
        out.write(
            f"UPDATE books SET author_id=(SELECT id FROM authors WHERE wikidata_id='{aq}') "
            f"WHERE series_id={sid} AND author_id IS NULL;\n"
        )
    out.write(
        "UPDATE authors SET series_count=(SELECT COUNT(*) FROM series WHERE series.author_id=authors.id AND series.book_count>0), "
        "book_count=(SELECT COUNT(*) FROM books WHERE books.author_id=authors.id) "
        "WHERE wikidata_id IN (" + ",".join(f"'{q}'" for q in sorted(authors)) + ");\n"
    )
    out.close()
    print(
        f"authors {len(authors)}, series updates {len(updates)}, "
        f"skipped: no-P50 {skipped_none}, multi-author {skipped_multi}, no-label {skipped_label}",
        file=sys.stderr,
    )


if __name__ == "__main__":
    main()
