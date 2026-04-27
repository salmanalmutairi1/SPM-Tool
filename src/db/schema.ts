export const SCHEMA_SQL = `
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS tasks (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT    NOT NULL,
    duration    INTEGER NOT NULL CHECK(duration > 0),
    start_date  TEXT    NOT NULL,
    finish_date TEXT    NOT NULL
  );

  CREATE TABLE IF NOT EXISTS resources (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    name          TEXT    NOT NULL,
    type          TEXT    NOT NULL CHECK(type IN ('Work', 'Cost')),
    max_units     TEXT,
    standard_rate REAL,
    overtime_rate REAL,
    cost_per_use  REAL
  );

  CREATE TABLE IF NOT EXISTS task_resources (
    task_id     INTEGER NOT NULL REFERENCES tasks(id)     ON DELETE CASCADE,
    resource_id INTEGER NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
    PRIMARY KEY (task_id, resource_id)
  );
`;
