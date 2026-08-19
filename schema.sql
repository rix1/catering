-- Delt avkryssingstilstand for handlelisten (D1-databasen «handleliste»).
-- Én rad per vare; item_id matcher id-feltet i handleliste-data.js.
CREATE TABLE IF NOT EXISTS checked (
  item_id TEXT PRIMARY KEY,
  checked INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
