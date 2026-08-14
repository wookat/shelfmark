-- R9 sample-series fixes (applied after data/reconcile.sql).
-- Sources: Wikidata scoped ordinals; publication years from public first-publication
-- record where the Wikidata work item lacks P577 (noted per line).

-- Discworld (series 1733): reattach The Colour of Magic (Q32136) — orphaned by the
-- old ingest's one-series-per-book rule; Wikidata ordinal 1, 1983.
UPDATE books SET series_id=1733, position=1 WHERE id=138939;
-- Discworld: insert missing #37 Unseen Academicals (Q2669617, 2009) — item has no
-- English label upstream, so the old label-filtering ingest dropped it.
INSERT INTO books (series_id, author_id, title, year, position, wikidata_id)
VALUES (1733, 12888, 'Unseen Academicals', 2009, 37, 'Q2669617');

-- Rivers of London (series 1667): Stone & Sky is novel #10 (public record; the
-- Wikidata membership statement has no ordinal).
UPDATE books SET position=10 WHERE id=95146;
-- First-publication years missing upstream (public record):
UPDATE books SET year=2016 WHERE wikidata_id='Q30668110'; -- The Hanging Tree
UPDATE books SET year=2017 WHERE wikidata_id='Q30642054'; -- The Furthest Station
UPDATE books SET year=2020 WHERE wikidata_id='Q134455467'; -- False Value
UPDATE books SET year=2022 WHERE wikidata_id='Q134455468'; -- Amongst Our Weapons

-- Jack Reacher: No Plan B (2022, public record; year missing upstream).
UPDATE books SET year=2022 WHERE id=34202;

-- Unclean raw description leak ("Lee Child´s book") — worthless stubs, drop.
UPDATE books SET description=NULL WHERE description='Lee Child´s book';

-- Recompute stats for the two series whose numbered set changed above.
UPDATE series SET book_count=41, first_year=1983, last_year=2015 WHERE id=1733;
UPDATE series SET book_count=11, first_year=2011, last_year=2025 WHERE id=1667;
