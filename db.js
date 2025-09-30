import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const dbPath = path.join (__dirname, 'risk-register.db');
const db = new Database(dbPath);


db.exec(`
  PRAGMA foreign_keys = ON;

  -- Mapping table: allow one ISO to map to multiple NIST CSF subcategories
  CREATE TABLE IF NOT EXISTS iso_to_csf (
    iso_control TEXT NOT NULL,     -- e.g., 'A.9.2.3'
    nist_csf    TEXT NOT NULL,     -- e.g., 'PR.AC-1'
    iso_title TEXT NOT NULL,
    nist_desc TEXT NOT NULL,

    PRIMARY KEY (iso_control, nist_csf)
  );

  -- Main risks table (normalized): store ISO only
  CREATE TABLE IF NOT EXISTS risks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    asset         TEXT NOT NULL,
    threat        TEXT NOT NULL,
    vulnerability TEXT NOT NULL,

    likelihood INTEGER NOT NULL CHECK (likelihood BETWEEN 1 AND 5),
    impact     INTEGER NOT NULL CHECK (impact BETWEEN 1 AND 5),
    risk_rating INTEGER GENERATED ALWAYS AS (likelihood * impact) VIRTUAL,

    treatment TEXT NOT NULL CHECK (treatment IN ('accept','mitigate','transfer','avoid')),
    owner     TEXT,
    status    TEXT NOT NULL CHECK (status IN ('open','in-progress','closed')) DEFAULT 'open',

    iso_control TEXT,              -- e.g., 'A.9.2.3'
    due_date   TEXT,               -- 'YYYY-MM-DD'

    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  -- Keep updated_at fresh on changes
  CREATE TRIGGER IF NOT EXISTS risks_updated_at
  AFTER UPDATE ON risks FOR EACH ROW
  BEGIN
    UPDATE risks SET updated_at = datetime('now') WHERE id = OLD.id;
  END;

   -- Convenience VIEW: risks + aggregated NIST CSF codes with descriptions
  DROP VIEW IF EXISTS risk_with_nist;
  CREATE VIEW risk_with_nist AS
  SELECT r.*,
         (
           SELECT group_concat(m.nist_csf || ' — ' || m.nist_desc, '; ')
           FROM iso_to_csf m
           WHERE m.iso_control = r.iso_control
         ) AS nist_mappings,
         (
           SELECT iso_title
           FROM iso_to_csf m
           WHERE m.iso_control = r.iso_control
           LIMIT 1
         ) AS iso_title
  FROM risks r;

`);


export default db




