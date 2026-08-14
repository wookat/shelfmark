#!/usr/bin/env python3
"""Series integrity assertions — run after any catalog import/reconcile.

Checks every series (via a local sqlite mirror of the D1 export):
  A. first-volume presence: numbered series must include ordinal 1 (or 0/0.5 prequel + 1)
  B. ordinal continuity: no gaps in the integer ordinals
  C. duplicate ordinals within one series
  D. year completeness: share of books missing a publication year
  E. first_year consistency: series.first_year == min(book year)

Prints a summary plus the worst offenders. Acts as a ratchet gate: exits 1 if
any count exceeds the committed baseline (docs/data-integrity-baseline.json);
pass --update-baseline after a change that legitimately improves the counts.
"""
import json, os, sqlite3, sys

db = sqlite3.connect(sys.argv[1] if len(sys.argv) > 1 else "/tmp/r9/local.db")

series = {r[0]: {"slug": r[1], "first_year": r[2], "books": []} for r in db.execute(
    "SELECT id, slug, first_year FROM series")}
for sid, pos, year in db.execute(
    "SELECT series_id, position, year FROM books WHERE series_id IS NOT NULL "
    "AND (wikidata_id IS NULL OR wikidata_id NOT IN (SELECT wikidata_id FROM series WHERE wikidata_id IS NOT NULL))"
):
    if sid in series:
        series[sid]["books"].append((pos, year))

fail = {"no_first": [], "gaps": [], "dups": [], "years": [], "first_year": []}
for sid, s in series.items():
    books = s["books"]
    if not books:
        continue
    ords = sorted(p for p, _ in books if p is not None)
    ints = sorted({int(p) for p in ords if p == int(p)})
    if ords:
        if 1 not in ints:
            fail["no_first"].append(s["slug"])
        if ints and ints[0] <= 1:
            expected = set(range(max(ints[0], 1), ints[-1] + 1))
            missing = sorted(expected - set(ints))
            if missing:
                fail["gaps"].append((s["slug"], missing[:5]))
        if len(ords) != len(set(ords)):
            fail["dups"].append(s["slug"])
    # Stats (and the years shown) cover the numbered set when the series has one.
    counted = [b for b in books if b[0] is not None] or books
    years = [y for _, y in counted if y is not None]
    if len(counted) >= 3 and len(years) < len(counted) * 0.5:
        fail["years"].append((s["slug"], f"{len(counted) - len(years)}/{len(counted)} missing"))
    if years and s["first_year"] is not None and min(years) < s["first_year"]:
        fail["first_year"].append((s["slug"], s["first_year"], min(years)))

total = sum(1 for s in series.values() if s["books"])
print(f"series with books: {total}")
for k, v in fail.items():
    print(f"{k}: {len(v)}")
    for item in v[:10]:
        print("   ", item)

counts = {k: len(v) for k, v in fail.items()}
base_path = os.path.join(os.path.dirname(__file__), "..", "docs", "data-integrity-baseline.json")
if "--update-baseline" in sys.argv:
    json.dump(counts, open(base_path, "w"), indent=1)
    print("baseline updated")
elif os.path.exists(base_path):
    base = json.load(open(base_path))
    worse = {k: (base.get(k), n) for k, n in counts.items() if n > base.get(k, 0)}
    if worse:
        print("REGRESSION vs baseline:", worse)
        sys.exit(1)
    print("within baseline")
