CREATE TABLE IF NOT EXISTS rss_source (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  feed_url TEXT NOT NULL UNIQUE,
  homepage_url TEXT,
  update_freq TEXT NOT NULL DEFAULT 'medium',
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  last_fetch_at TEXT,
  last_item_published_at TEXT,
  fail_count INTEGER NOT NULL DEFAULT 0,
  popularity INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_rss_source_category ON rss_source(category);
CREATE INDEX IF NOT EXISTS idx_rss_source_status ON rss_source(status);
CREATE INDEX IF NOT EXISTS idx_rss_source_popularity ON rss_source(popularity);

CREATE TABLE IF NOT EXISTS subscription (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  device_id TEXT NOT NULL,
  source_id INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(device_id, source_id),
  FOREIGN KEY(source_id) REFERENCES rss_source(id)
);

CREATE INDEX IF NOT EXISTS idx_subscription_device ON subscription(device_id);

CREATE TABLE IF NOT EXISTS content_item (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  link_url TEXT NOT NULL,
  author TEXT,
  published_at TEXT NOT NULL,
  guid TEXT,
  raw_summary TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(source_id, link_url),
  FOREIGN KEY(source_id) REFERENCES rss_source(id)
);

CREATE INDEX IF NOT EXISTS idx_content_source_published ON content_item(source_id, published_at);
CREATE INDEX IF NOT EXISTS idx_content_published ON content_item(published_at);
