#!/usr/bin/env python3
"""Merge Wikidata exports into data/seed.sql for D1.

Inputs:
  data/raw_rows.jsonl         series -> books (with ordinals), series authors
  data/raw_author_rows.jsonl  author -> literary works (incl. standalone), optional series
  data/raw_genres.jsonl       series -> genre label (optional)
  data/raw_isbns.jsonl        book -> isbn (optional, for Open Library covers)
"""
import json, os, re
from collections import defaultdict

def qid(uri): return uri.rsplit("/", 1)[-1]
def is_q(uri): return bool(re.search(r"/Q\d+$", uri))

def slugify(s):
    s = re.sub(r"[’'\"]", "", s.lower())
    s = re.sub(r"[^a-z0-9]+", "-", s).strip("-")
    return s[:80] or "x"

def sq(s):
    if s is None: return "NULL"
    return "'" + str(s).replace("'", "''") + "'"

def rows(path):
    if not os.path.exists(path): return
    with open(path) as f:
        for line in f:
            yield json.loads(line)

def good_label(l):
    return l and not re.fullmatch(r"Q\d+", l)

series = {}            # sQid -> {name, author}
books = {}             # bQid -> {title, series, ordinal, year, author}
authors = {}           # aQid -> name

# --- pass 1: series dataset (has ordinals + series authorship) ---
for r in rows("data/raw_rows.jsonl"):
    s, b = qid(r["series"]), qid(r["book"])
    sl, bl = r.get("seriesLabel", ""), r.get("bookLabel", "")
    if not good_label(sl) or not good_label(bl): continue
    a = qid(r["author"]) if r.get("author") and is_q(r["author"]) else None
    al = r.get("authorLabel")
    if a and good_label(al): authors.setdefault(a, al)
    else: a = None
    if s not in series: series[s] = {"name": sl, "author": a}
    elif series[s]["author"] is None and a: series[s]["author"] = a
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
        books[b] = {"title": bl, "series": s, "ordinal": ordinal, "year": year, "author": a}
    else:
        cur.setdefault("series", s)
        if cur.get("series") is None: cur["series"] = s
        if cur["ordinal"] is None and ordinal is not None: cur["ordinal"] = ordinal
        if year is not None and (cur["year"] is None or year < cur["year"]): cur["year"] = year

# --- pass 2: author dataset (literary works, incl. standalone) ---
for r in rows("data/raw_author_rows.jsonl"):
    b = qid(r["book"])
    bl, al = r.get("bookLabel", ""), r.get("authorLabel", "")
    if not good_label(bl) or not good_label(al): continue
    if not is_q(r["author"]): continue
    a = qid(r["author"])
    authors.setdefault(a, al)
    s = qid(r["series"]) if r.get("series") and qid(r["series"]) in series else None
    year = None
    if r.get("pub"):
        try: year = int(r["pub"][:4])
        except ValueError: pass
    cur = books.get(b)
    if cur is None:
        books[b] = {"title": bl, "series": s, "ordinal": None, "year": year, "author": a}
    else:
        if cur.get("author") is None: cur["author"] = a
        if cur.get("series") is None and s: cur["series"] = s
        if year is not None and (cur["year"] is None or year < cur["year"]): cur["year"] = year

# fill book author from series author when missing
for v in books.values():
    if v.get("author") is None and v.get("series"):
        v["author"] = series[v["series"]]["author"]

# --- genres ---
genre_of = {}
for r in rows("data/raw_genres.jsonl"):
    s = qid(r["series"])
    g = r.get("genreLabel", "")
    if s in series and good_label(g) and s not in genre_of:
        genre_of[s] = g[:60]

# --- isbns -> covers ---
cover_of = {}
for r in rows("data/raw_isbns.jsonl"):
    b = qid(r["book"])
    isbn = re.sub(r"[^0-9Xx]", "", r.get("isbn", ""))
    if b in books and len(isbn) in (10, 13) and b not in cover_of:
        cover_of[b] = f"https://covers.openlibrary.org/b/isbn/{isbn}-M.jpg"

# --- eligibility filters ---
book_count_by_author = defaultdict(int)
for v in books.values():
    if v.get("author"): book_count_by_author[v["author"]] += 1
keep_authors = {a for a, n in book_count_by_author.items() if n >= 2 and a in authors}

series_sizes = defaultdict(int)
for v in books.values():
    if v.get("series"): series_sizes[v["series"]] += 1
keep_series = {s for s, n in series_sizes.items() if n >= 2}

def keep_book(v):
    if v.get("series") in keep_series: return True
    return v.get("author") in keep_authors

books = {k: v for k, v in books.items() if keep_book(v)}
series = {k: v for k, v in series.items() if k in keep_series}
# re-derive authors present
present_authors = set()
for v in books.values():
    if v.get("author") in keep_authors: present_authors.add(v["author"])
    else: v["author"] = v["author"] if v.get("author") in keep_authors else None
for v in series.values():
    if v["author"] not in keep_authors: v["author"] = None
    if v["author"]: present_authors.add(v["author"])

# --- ids and slugs ---
a_seen, s_seen = {}, {}
def uniq_slug(base, seen):
    s, i = base, 2
    while s in seen:
        s = f"{base}-{i}"; i += 1
    seen[s] = True
    return s

author_ids, a_rows = {}, []
for i, aq in enumerate(sorted(present_authors), start=1):
    author_ids[aq] = i
    a_rows.append((i, uniq_slug(slugify(authors[aq]), a_seen), authors[aq], aq))

series_ids, s_rows = {}, []
for i, (sqid, v) in enumerate(sorted(series.items()), start=1):
    series_ids[sqid] = i
    aid = author_ids.get(v["author"]) if v["author"] else None
    s_rows.append((i, uniq_slug(slugify(v["name"]), s_seen), v["name"], aid, genre_of.get(sqid), sqid))

# Drop "books" that are really series entities (sub-series rows from Wikidata P179)
if os.path.exists("data/subseries_book_qids.json"):
    for bq in json.load(open("data/subseries_book_qids.json")):
        books.pop(bq, None)

# Book ids are stable across imports: reuse previous qid->id assignments
# (data/book_ids.json) so localStorage reading progress keyed by id survives.
prev_ids = {}
if os.path.exists("data/book_ids.json"):
    prev_ids = json.load(open("data/book_ids.json"))
next_id = max(prev_ids.values(), default=0) + 1
b_rows = []
for bq, v in sorted(books.items()):
    bid = prev_ids.get(bq)
    if bid is None:
        bid = next_id; next_id += 1
        prev_ids[bq] = bid
    sid = series_ids.get(v.get("series"))
    aid = author_ids.get(v.get("author"))
    b_rows.append([bid, sid, aid, v["title"][:200], v["year"], v["ordinal"], cover_of.get(bq), bq])
json.dump(prev_ids, open("data/book_ids.json", "w"))

# fill missing positions by year within series
by_series = defaultdict(list)
for r in b_rows:
    if r[1]: by_series[r[1]].append(r)
for sid, items in by_series.items():
    items.sort(key=lambda r: (r[5] is None, r[5] if r[5] is not None else 0, r[4] if r[4] is not None else 9999, r[3]))
    for pos, r in enumerate(items, start=1):
        if r[5] is None: r[5] = float(pos)

out = open("data/seed.sql", "w")
out.write("DELETE FROM books;\nDELETE FROM series;\nDELETE FROM authors;\n")
BATCH = 300
def emit(table, cols, rs, fmt):
    for i in range(0, len(rs), BATCH):
        out.write(f"INSERT INTO {table} ({cols}) VALUES " + ",".join(fmt(r) for r in rs[i:i+BATCH]) + ";\n")

emit("authors", "id,slug,name,wikidata_id", a_rows,
     lambda r: f"({r[0]},{sq(r[1])},{sq(r[2])},{sq(r[3])})")
emit("series", "id,slug,name,author_id,genre,wikidata_id", s_rows,
     lambda r: f"({r[0]},{sq(r[1])},{sq(r[2])},{r[3] if r[3] else 'NULL'},{sq(r[4])},{sq(r[5])})")
emit("books", "id,series_id,author_id,title,year,position,cover_url,wikidata_id", b_rows,
     lambda r: f"({r[0]},{r[1] if r[1] else 'NULL'},{r[2] if r[2] else 'NULL'},{sq(r[3])},{r[4] if r[4] else 'NULL'},{r[5] if r[5] is not None else 'NULL'},{sq(r[6])},{sq(r[7])})")

out.write("""
UPDATE series SET book_count=(SELECT COUNT(*) FROM books WHERE books.series_id=series.id);
UPDATE series SET first_year=(SELECT MIN(year) FROM books WHERE books.series_id=series.id AND year IS NOT NULL),
                  last_year=(SELECT MAX(year) FROM books WHERE books.series_id=series.id AND year IS NOT NULL);
UPDATE authors SET series_count=(SELECT COUNT(*) FROM series WHERE series.author_id=authors.id),
                   book_count=(SELECT COUNT(*) FROM books WHERE books.author_id=authors.id);
DELETE FROM authors WHERE book_count < 2 AND series_count = 0;
""")
out.close()
print("authors", len(a_rows), "series", len(s_rows), "books", len(b_rows), "covers", len(cover_of), "genres", len(genre_of))
