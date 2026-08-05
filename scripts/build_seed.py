#!/usr/bin/env python3
"""Transform data/raw_rows.jsonl into data/seed.sql for D1."""
import json, re, sys
from collections import defaultdict

def qid(uri): return uri.rsplit("/", 1)[-1]

def slugify(s):
    s = re.sub(r"[’'\"]", "", s.lower())
    s = re.sub(r"[^a-z0-9]+", "-", s).strip("-")
    return s[:80] or "x"

def sq(s):
    if s is None: return "NULL"
    return "'" + str(s).replace("'", "''") + "'"

rows = [json.loads(l) for l in open("data/raw_rows.jsonl")]

series = {}          # sQid -> {name, author_qid}
books = {}           # bQid -> {title, series, ordinal, year}
authors = {}         # aQid -> name

for r in rows:
    s = qid(r["series"]); b = qid(r["book"])
    sl = r.get("seriesLabel", ""); bl = r.get("bookLabel", "")
    if not sl or re.fullmatch(r"Q\d+", sl): continue
    if not bl or re.fullmatch(r"Q\d+", bl): continue
    a = qid(r["author"]) if r.get("author") and re.search(r"/Q\d+$", r["author"]) else None
    al = r.get("authorLabel")
    if a and al and not re.fullmatch(r"Q\d+", al):
        authors.setdefault(a, al)
    else:
        a = None
    if s not in series:
        series[s] = {"name": sl, "author": a}
    elif series[s]["author"] is None and a:
        series[s]["author"] = a
    year = None
    if r.get("pub"):
        try: year = int(r["pub"][:4])
        except ValueError: pass
    ordinal = None
    if r.get("ordinal"):
        m = re.match(r"^\d+(\.\d+)?", r["ordinal"].strip())
        if m: ordinal = float(m.group(0))
    cur = books.get(b)
    if cur is None:
        books[b] = {"title": bl, "series": s, "ordinal": ordinal, "year": year}
    else:
        if cur["ordinal"] is None and ordinal is not None: cur["ordinal"] = ordinal
        if year is not None and (cur["year"] is None or year < cur["year"]): cur["year"] = year

# drop series with <2 books
count = defaultdict(int)
for b in books.values(): count[b["series"]] += 1
series = {k: v for k, v in series.items() if count[k] >= 2}
books = {k: v for k, v in books.items() if v["series"] in series}

# ids and slugs
author_ids, seen = {}, {}
def uniq_slug(base, seen):
    s, i = base, 2
    while s in seen:
        s = f"{base}-{i}"; i += 1
    seen[s] = True
    return s

a_rows = []
for i, (aq, name) in enumerate(sorted(authors.items()), start=1):
    author_ids[aq] = i
    a_rows.append((i, uniq_slug(slugify(name), seen), name, aq))

s_seen = {}
series_ids = {}
s_rows = []
for i, (sq_, v) in enumerate(sorted(series.items()), start=1):
    series_ids[sq_] = i
    aid = author_ids.get(v["author"]) if v["author"] else None
    s_rows.append((i, uniq_slug(slugify(v["name"]), s_seen), v["name"], aid, sq_))

b_rows = []
for i, (bq, v) in enumerate(sorted(books.items()), start=1):
    sid = series_ids[v["series"]]
    aid = next((r[3] for r in s_rows if r[0] == sid), None)
    b_rows.append((i, sid, aid, v["title"], v["year"], v["ordinal"], bq))

# fill missing positions by year within series
by_series = defaultdict(list)
for r in b_rows: by_series[r[1]].append(r)
b_final = []
for sid, items in by_series.items():
    items.sort(key=lambda r: (r[5] is None, r[5] if r[5] is not None else 0, r[4] if r[4] is not None else 9999, r[3]))
    for pos, r in enumerate(items, start=1):
        position = r[5] if r[5] is not None else float(pos)
        b_final.append((r[0], r[1], r[2], r[3], r[4], position, r[6]))

out = open("data/seed.sql", "w")
out.write("DELETE FROM books; DELETE FROM series; DELETE FROM authors;\n")
BATCH = 200
def emit(table, cols, rows, fmt):
    for i in range(0, len(rows), BATCH):
        vals = ",".join(fmt(r) for r in rows[i:i+BATCH])
        out.write(f"INSERT INTO {table} ({cols}) VALUES {vals};\n")

emit("authors", "id,slug,name,wikidata_id", a_rows,
     lambda r: f"({r[0]},{sq(r[1])},{sq(r[2])},{sq(r[3])})")
emit("series", "id,slug,name,author_id,wikidata_id", s_rows,
     lambda r: f"({r[0]},{sq(r[1])},{sq(r[2])},{r[3] if r[3] else 'NULL'},{sq(r[4])})")
emit("books", "id,series_id,author_id,title,year,position,wikidata_id", b_final,
     lambda r: f"({r[0]},{r[1]},{r[2] if r[2] else 'NULL'},{sq(r[3])},{r[4] if r[4] else 'NULL'},{r[5]},{sq(r[6])})")

out.write("""
UPDATE series SET book_count=(SELECT COUNT(*) FROM books WHERE books.series_id=series.id);
UPDATE series SET first_year=(SELECT MIN(year) FROM books WHERE books.series_id=series.id AND year IS NOT NULL),
                  last_year=(SELECT MAX(year) FROM books WHERE books.series_id=series.id AND year IS NOT NULL);
UPDATE authors SET series_count=(SELECT COUNT(*) FROM series WHERE series.author_id=authors.id),
                   book_count=(SELECT COUNT(*) FROM books WHERE books.author_id=authors.id);
DELETE FROM authors WHERE series_count=0;
""")
out.close()
print("authors", len(a_rows), "series", len(s_rows), "books", len(b_final))
