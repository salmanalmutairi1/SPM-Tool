import { useCallback } from 'react';
import { useDatabase } from '../context/DatabaseContext';

type SqlParam = string | number | null;
type SqlStatement = {
  sql: string;
  params?: SqlParam[];
};

export function useDb() {
  const { db, refresh, triggerRefresh, saveDb } = useDatabase();

  const exec = useCallback(
    (sql: string, params?: SqlParam[]) => {
      if (!db) return;
      db.run(sql, params);
      saveDb(db);
      triggerRefresh();
    },
    [db, saveDb, triggerRefresh],
  );

  const execBatch = useCallback(
    (statements: SqlStatement[]) => {
      if (!db || statements.length === 0) return;
      db.run('BEGIN TRANSACTION');
      try {
        for (const statement of statements) {
          db.run(statement.sql, statement.params);
        }
        db.run('COMMIT');
      } catch (error) {
        db.run('ROLLBACK');
        throw error;
      }
      saveDb(db);
      triggerRefresh();
    },
    [db, saveDb, triggerRefresh],
  );

  const query = useCallback(
    <T = Record<string, unknown>>(sql: string, params?: SqlParam[]): T[] => {
      if (!db) return [];
      const result = db.exec(sql, params);
      if (!result.length) return [];
      const { columns, values } = result[0];
      return values.map((row) => {
        const obj: Record<string, unknown> = {};
        columns.forEach((col, i) => {
          obj[col] = row[i];
        });
        return obj as T;
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [db, refresh],
  );

  return { exec, execBatch, query, refresh };
}
