#!/usr/bin/env python3
"""Reconcile D1 book positions/years against a fresh scoped Wikidata fetch.

Inputs:
  data/raw_rows.jsonl  fresh fetch_wikidata.py output (ordinal scoped to the
                       series membership statement, see fetch_wikidata.py)
  local sqlite mirror  built from `wrangler d1 export` dumps (books + series)

Outputs:
  data/reconcile.sql    UPDATE statements for D1 (positions + null-year backfill)
  data/reconcile_report.tsv  every change with old/new values for review

Rules (honest-data policy):
  - position := the ordinal recorded on THIS series' P179 statement. If the
    scoped statement has no ordinal, position becomes NULL (earlier ingests
    leaked sub-series ordinals into parents, inventing numbers).
  - year is only backfilled where D1 has NULL and Wikidata has a P577; existing
    years are never overwritten (verified against P577 in the R153 audit).
"""
import json, re, sqlite3, sys
from collections import defaultdict

db = sqlite3.connect(sys.argv[1] if len(sys.argv) > 1 else "/tmp/r9/local.db")

wd = {}  # (series_qid, book_qid) -> {"ord": float|None, "year": int|None}
for line in open("data/raw_rows.jsonl"):
    r = json.loads(line)
    s, b = r["series"].rsplit("/", 1)[-1], r["book"].rsplit("/", 1)[-1]
    e = wd.setdefault((s, b), {"ord": None, "year": None})
    if r.get("ordinal"):
        m = re.match(r"^\d+(\.\d+)?", r["ordinal"].strip())
        if m:
            o = float(m.group(0))
            e["ord"] = o if e["ord"] is None else min(e["ord"], o)
    if r.get("pub"):
        try:
            y = int(r["pub"][:4])
            e["year"] = y if e["year"] is None else min(e["year"], y)
        except ValueError:
            pass

series_by_id = {row[0]: row[1] for row in db.execute(
    "SELECT id, wikidata_id FROM series WHERE wikidata_id IS NOT NULL")}

sql, report = [], []
stats = defaultdict(int)
for bid, sid, wqid, pos, year in db.execute(
    "SELECT id, series_id, wikidata_id, position, year FROM books "
    "WHERE series_id IS NOT NULL AND wikidata_id IS NOT NULL"
):
    sqid = series_by_id.get(sid)
    if not sqid:
        continue
    e = wd.get((sqid, wqid))
    if e is None:
        stats["not_in_fetch"] += 1
        continue
    sets = []
    if e["ord"] != pos and not (e["ord"] is None and pos is None):
        sets.append("position=" + ("NULL" if e["ord"] is None else repr(e["ord"] if e["ord"] % 1 else int(e["ord"]))))
        stats["pos_nulled" if e["ord"] is None else "pos_changed"] += 1
        report.append((bid, wqid, sqid, "position", pos, e["ord"]))
    if year is None and e["year"] is not None:
        sets.append(f"year={e['year']}")
        stats["year_backfilled"] += 1
        report.append((bid, wqid, sqid, "year", year, e["year"]))
    if sets:
        sql.append(f"UPDATE books SET {', '.join(sets)} WHERE id={bid};")
    stats["checked"] += 1

# Missing members (upstream has the membership, catalog doesn't) — report only,
# never auto-insert: many are diaries/maps/unpublished items that need review.
book_qids = {r[0] for r in db.execute("SELECT wikidata_id FROM books WHERE wikidata_id IS NOT NULL")}
series_qids = set(series_by_id.values())
for (sqid, bqid), e in wd.items():
    if sqid in series_qids and bqid not in book_qids and bqid not in series_qids:
        stats["missing_member"] += 1
        report.append(("", bqid, sqid, "missing_member", "", e["ord"]))

# Recompute series stats over the numbered set (falls back to all books where
# the series has no numbering) — companions/shorts no longer inflate counts/spans.
# Computed in Python over the post-reconcile state and emitted as literal UPDATEs.
new_pos = {}
for bid, wqid, sqid, field, old, new in report:
    if field == "position":
        new_pos[bid] = new
per_series = defaultdict(list)
for bid, sid, wqid, pos, year in db.execute(
    "SELECT b.id, b.series_id, b.wikidata_id, b.position, b.year FROM books b "
    "WHERE b.series_id IS NOT NULL AND (b.wikidata_id IS NULL OR b.wikidata_id NOT IN "
    "(SELECT wikidata_id FROM series WHERE wikidata_id IS NOT NULL))"
):
    per_series[sid].append((new_pos.get(bid, pos) if bid in new_pos else pos, year))
old_stats = {r[0]: (r[1], r[2], r[3]) for r in db.execute(
    "SELECT id, book_count, first_year, last_year FROM series")}
for sid, items in per_series.items():
    counted = [(p, y) for p, y in items if p is not None] or items
    years = [y for _, y in counted if y is not None]
    new_stats = (len(counted), min(years) if years else None, max(years) if years else None)
    if old_stats.get(sid) != new_stats:
        stats["series_stats_changed"] += 1
        sql.append(
            f"UPDATE series SET book_count={new_stats[0]}, "
            f"first_year={new_stats[1] if new_stats[1] is not None else 'NULL'}, "
            f"last_year={new_stats[2] if new_stats[2] is not None else 'NULL'} WHERE id={sid};"
        )

open("data/reconcile.sql", "w").write("\n".join(sql) + "\n")
with open("data/reconcile_report.tsv", "w") as f:
    f.write("book_id\tbook_qid\tseries_qid\tfield\told\tnew\n")
    for row in report:
        f.write("\t".join(str(x) for x in row) + "\n")
print(dict(stats))
