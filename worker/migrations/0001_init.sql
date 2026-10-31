-- Migration: 0001_init.sql
-- Description: Create title_cache and known_ids tables for out-of-window titles

CREATE TABLE IF NOT EXISTS title_cache (
  type TEXT NOT NULL CHECK (type IN ('movie', 'tv')),
  id INTEGER NOT NULL,
  data TEXT NOT NULL,
  fetched_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (type, id)
);

CREATE INDEX IF NOT EXISTS idx_title_cache_fetched_at ON title_cache(fetched_at);

CREATE TABLE IF NOT EXISTS known_ids (
  type TEXT NOT NULL CHECK (type IN ('movie', 'tv')),
  id INTEGER NOT NULL,
  recorded_at INTEGER NOT NULL,
  PRIMARY KEY (type, id)
);
