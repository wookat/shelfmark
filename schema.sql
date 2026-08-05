CREATE TABLE IF NOT EXISTS authors (
  id INTEGER PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  bio TEXT,
  wikidata_id TEXT,
  series_count INTEGER DEFAULT 0,
  book_count INTEGER DEFAULT 0
);
CREATE TABLE IF NOT EXISTS series (
  id INTEGER PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  author_id INTEGER REFERENCES authors(id),
  description TEXT,
  genre TEXT,
  wikidata_id TEXT,
  book_count INTEGER DEFAULT 0,
  first_year INTEGER,
  last_year INTEGER
);
CREATE TABLE IF NOT EXISTS books (
  id INTEGER PRIMARY KEY,
  series_id INTEGER REFERENCES series(id),
  author_id INTEGER REFERENCES authors(id),
  title TEXT NOT NULL,
  year INTEGER,
  position REAL,
  wikidata_id TEXT,
  isbn TEXT,
  cover_url TEXT
);
CREATE INDEX IF NOT EXISTS idx_series_author ON series(author_id);
CREATE INDEX IF NOT EXISTS idx_books_series ON books(series_id);
CREATE INDEX IF NOT EXISTS idx_books_author ON books(author_id);
CREATE INDEX IF NOT EXISTS idx_authors_name ON authors(name);
CREATE INDEX IF NOT EXISTS idx_series_name ON series(name);

CREATE TABLE IF NOT EXISTS emails (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  source TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS hits (
  day TEXT NOT NULL,
  path TEXT NOT NULL,
  count INTEGER DEFAULT 0,
  PRIMARY KEY (day, path)
);
