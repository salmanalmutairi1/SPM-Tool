import {
  createContext, useContext, useEffect, useState, useCallback,
  type ReactNode,
} from 'react';
import type initSqlJs from 'sql.js';
import type { Database } from 'sql.js';
// @ts-expect-error Vite ?raw import
import sqlJsSource from 'sql.js/dist/sql-wasm.js?raw';
// @ts-expect-error Vite ?url import
import sqlWasmUrl from 'sql.js/dist/sql-wasm.wasm?url';
import { SCHEMA_SQL } from '../db/schema';

const STORAGE_KEY = 'spm_db';
const BASE64_CHUNK_SIZE = 0x8000;

interface DatabaseContextValue {
  db: Database | null;
  refresh: number;
  triggerRefresh: () => void;
  saveDb: (database: Database) => void;
}

const DatabaseContext = createContext<DatabaseContextValue | null>(null);

function createSqlJsInitializer(): typeof initSqlJs {
  const moduleShim: { exports: unknown } = { exports: {} };
  const exportsShim = moduleShim.exports;
  const factory = new Function('module', 'exports', `${sqlJsSource}; return module.exports;`);
  const loaded = factory(moduleShim, exportsShim) as typeof initSqlJs | { default?: typeof initSqlJs };
  return typeof loaded === 'function' ? loaded : loaded.default!;
}

const initSqlJsRuntime = createSqlJsInitializer();

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i += BASE64_CHUNK_SIZE) {
    binary += String.fromCharCode(...bytes.slice(i, i + BASE64_CHUNK_SIZE));
  }
  return btoa(binary);
}

function base64ToBytes(value: string): Uint8Array {
  return Uint8Array.from(atob(value), (char) => char.charCodeAt(0));
}

function tableHasColumn(database: Database, tableName: string, columnName: string): boolean {
  const result = database.exec(`PRAGMA table_info(${tableName})`);
  if (!result.length) return false;
  const nameIndex = result[0].columns.indexOf('name');
  return result[0].values.some((row) => row[nameIndex] === columnName);
}

function migrateResourcesTable(database: Database) {
  const result = database.exec("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'resources'");
  const createSql = String(result[0]?.values[0]?.[0] ?? '');
  const hasMaterialType = createSql.includes("'Material'");
  const hasMaterialLabel = tableHasColumn(database, 'resources', 'material_label');

  if (hasMaterialType && hasMaterialLabel) return;

  database.run('PRAGMA foreign_keys = OFF');
  database.run('BEGIN TRANSACTION');
  try {
    database.run(`
      CREATE TABLE resources_next (
        id             INTEGER PRIMARY KEY AUTOINCREMENT,
        name           TEXT    NOT NULL,
        type           TEXT    NOT NULL CHECK(type IN ('Work', 'Material', 'Cost')),
        max_units      TEXT,
        material_label TEXT,
        standard_rate  REAL,
        overtime_rate  REAL,
        cost_per_use   REAL
      )
    `);

    if (hasMaterialLabel) {
      database.run(`
        INSERT INTO resources_next (id, name, type, max_units, material_label, standard_rate, overtime_rate, cost_per_use)
        SELECT id, name, type, max_units, material_label, standard_rate, overtime_rate, cost_per_use
        FROM resources
      `);
    } else {
      database.run(`
        INSERT INTO resources_next (id, name, type, max_units, material_label, standard_rate, overtime_rate, cost_per_use)
        SELECT id, name, type, max_units, NULL, standard_rate, overtime_rate, cost_per_use
        FROM resources
      `);
    }

    database.run('DROP TABLE resources');
    database.run('ALTER TABLE resources_next RENAME TO resources');
    database.run('COMMIT');
  } catch (error) {
    database.run('ROLLBACK');
    throw error;
  } finally {
    database.run('PRAGMA foreign_keys = ON');
  }
}

function migrateTaskResourcesTable(database: Database) {
  if (tableHasColumn(database, 'task_resources', 'quantity')) return;
  database.run('ALTER TABLE task_resources ADD COLUMN quantity REAL NOT NULL DEFAULT 1 CHECK(quantity >= 0)');
}

function runMigrations(database: Database) {
  migrateResourcesTable(database);
  migrateTaskResourcesTable(database);
  database.run('PRAGMA foreign_keys = ON');
}

export function DatabaseProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<Database | null>(null);
  const [refresh, setRefresh] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const SQL = await initSqlJsRuntime({ locateFile: () => sqlWasmUrl as string });
        const saved = localStorage.getItem(STORAGE_KEY);
        let database: Database;

        try {
          database = saved ? new SQL.Database(base64ToBytes(saved)) : new SQL.Database();
        } catch {
          localStorage.removeItem(STORAGE_KEY);
          database = new SQL.Database();
        }

        database.run(SCHEMA_SQL);
        runMigrations(database);
        localStorage.setItem(STORAGE_KEY, bytesToBase64(database.export()));
        if (!cancelled) {
          setDb(database);
        }
      } catch {
        if (!cancelled) {
          setError('Unable to load the local database.');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const saveDb = useCallback((database: Database) => {
    const data = database.export();
    localStorage.setItem(STORAGE_KEY, bytesToBase64(data));
  }, []);

  const triggerRefresh = useCallback(() => setRefresh((r) => r + 1), []);

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-white px-6 text-sm text-red-700">
        {error}
      </div>
    );
  }

  if (!db) {
    return (
      <div className="flex h-screen items-center justify-center bg-white text-sm text-gray-500">
        Loading database...
      </div>
    );
  }

  return (
    <DatabaseContext.Provider value={{ db, refresh, triggerRefresh, saveDb }}>
      {children}
    </DatabaseContext.Provider>
  );
}

export function useDatabase(): DatabaseContextValue {
  const ctx = useContext(DatabaseContext);
  if (!ctx) throw new Error('useDatabase must be used within DatabaseProvider');
  return ctx;
}
