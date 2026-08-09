PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS memories (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL,
  title TEXT NOT NULL,
  title_en TEXT,
  series TEXT,
  episode TEXT,
  scene TEXT,
  location_json TEXT,
  story TEXT NOT NULL,
  history_json TEXT,
  captured_at TEXT,
  status TEXT NOT NULL DEFAULT 'published',
  needs_confirmation_json TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS image_assets (
  asset_id TEXT PRIMARY KEY,
  memory_id TEXT NOT NULL UNIQUE REFERENCES memories(id) ON DELETE CASCADE,
  local_path TEXT,
  remote_url TEXT,
  remote_id TEXT,
  remote_delete_hash TEXT,
  file_name TEXT,
  width INTEGER,
  height INTEGER,
  alt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS image_uploads (
  upload_id INTEGER PRIMARY KEY,
  asset_id TEXT NOT NULL REFERENCES image_assets(asset_id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  provider_id TEXT,
  url TEXT NOT NULL,
  delete_hash TEXT,
  uploaded_at TEXT NOT NULL,
  UNIQUE(asset_id, provider, url)
);

CREATE TABLE IF NOT EXISTS memory_tags (
  memory_id TEXT NOT NULL REFERENCES memories(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  PRIMARY KEY(memory_id, tag)
);

CREATE TABLE IF NOT EXISTS memory_keywords (
  memory_id TEXT NOT NULL REFERENCES memories(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  PRIMARY KEY(memory_id, keyword)
);

CREATE INDEX IF NOT EXISTS idx_memories_kind ON memories(kind);
CREATE INDEX IF NOT EXISTS idx_memories_captured_at ON memories(captured_at);
CREATE INDEX IF NOT EXISTS idx_image_uploads_asset_provider ON image_uploads(asset_id, provider);
CREATE INDEX IF NOT EXISTS idx_memory_tags_tag ON memory_tags(tag);
CREATE INDEX IF NOT EXISTS idx_memory_keywords_keyword ON memory_keywords(keyword);

PRAGMA user_version = 1;
PRAGMA optimize;
