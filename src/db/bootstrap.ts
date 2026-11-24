import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS products (
  sku             TEXT PRIMARY KEY COLLATE NOCASE,
  name            TEXT NOT NULL,
  category        TEXT NOT NULL,
  storage_class   TEXT NOT NULL DEFAULT 'STANDARD',
  unit            TEXT NOT NULL DEFAULT 'EA',
  max_receive_qty INTEGER NOT NULL DEFAULT 5000,
  active          INTEGER NOT NULL DEFAULT 1,
  created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE IF NOT EXISTS nav_nodes (
  id   TEXT PRIMARY KEY,
  kind TEXT NOT NULL,
  x    REAL NOT NULL,
  y    REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS nav_edges (
  from_node TEXT NOT NULL,
  to_node   TEXT NOT NULL,
  distance  REAL NOT NULL,
  PRIMARY KEY (from_node, to_node)
);

CREATE TABLE IF NOT EXISTS shelves (
  code          TEXT PRIMARY KEY,
  aisle         TEXT NOT NULL,
  bay           INTEGER NOT NULL,
  side          TEXT NOT NULL,
  storage_class TEXT NOT NULL DEFAULT 'STANDARD',
  status        TEXT NOT NULL DEFAULT 'ACTIVE',
  nav_node_id   TEXT NOT NULL,
  x             REAL NOT NULL,
  y             REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS bins (
  code             TEXT PRIMARY KEY,
  shelf_code       TEXT NOT NULL,
  level            INTEGER NOT NULL,
  capacity         INTEGER NOT NULL,
  status           TEXT NOT NULL DEFAULT 'ACTIVE',
  recount_required INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS inventory (
  bin_code     TEXT PRIMARY KEY,
  sku          TEXT COLLATE NOCASE,
  qty          INTEGER NOT NULL DEFAULT 0,
  reserved_qty INTEGER NOT NULL DEFAULT 0,
  updated_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE IF NOT EXISTS stock_movements (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  ref           TEXT NOT NULL UNIQUE,
  movement_type TEXT NOT NULL,
  sku           TEXT NOT NULL COLLATE NOCASE,
  qty           INTEGER NOT NULL,
  from_kind     TEXT NOT NULL,
  from_ref      TEXT,
  to_kind       TEXT NOT NULL,
  to_ref        TEXT,
  related_type  TEXT,
  related_ref   TEXT,
  performed_by  INTEGER,
  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
`;

export function ensureDatabase(dbPath: string): void {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  if (fs.existsSync(dbPath)) return;

  const db = new Database(dbPath);
  try {
    db.exec(SCHEMA_SQL);
  } finally {
    db.close();
  }
}
