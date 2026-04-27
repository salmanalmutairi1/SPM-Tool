import { useDb } from '../../hooks/useDb';
import type { Resource, Task } from '../../types';
import { calculateTaskCost } from '../../utils/cost';
import { tableCls, tdCls, thCls } from '../shared/TableStyles';

interface TaskCostRow extends Task {
  resource_names: string;
  resources_json: string | null;
}

function parseResources(value: string | null): Resource[] {
  if (!value) return [];
  try {
    return JSON.parse(value) as Resource[];
  } catch {
    return [];
  }
}

function money(value: number): string {
  return `$${value}`;
}

export default function ReportCostPerTaskTab() {
  const { query } = useDb();
  const rows = query<TaskCostRow>(`
    SELECT
      t.id,
      t.name,
      t.duration,
      t.start_date,
      t.finish_date,
      COALESCE(GROUP_CONCAT(r.name, ', '), '-') AS resource_names,
      CASE
        WHEN COUNT(r.id) = 0 THEN NULL
        ELSE json_group_array(json_object(
          'id', r.id,
          'name', r.name,
          'type', r.type,
          'max_units', r.max_units,
          'standard_rate', r.standard_rate,
          'overtime_rate', r.overtime_rate,
          'cost_per_use', r.cost_per_use
        ))
      END AS resources_json
    FROM tasks t
    LEFT JOIN task_resources tr ON tr.task_id = t.id
    LEFT JOIN resources r ON r.id = tr.resource_id
    GROUP BY t.id
    ORDER BY t.id
  `);

  return (
    <section>
      <div className="mb-3">
        <h2 className="text-base font-semibold text-gray-900">Report: Total Cost for Each Task</h2>
        <p className="text-xs text-gray-500">View only</p>
      </div>

      <div className="overflow-x-auto">
        <table className={tableCls}>
          <thead>
            <tr>
              <th className="w-24 border border-gray-300 bg-gray-200 px-3 py-2 text-left text-sm font-semibold text-gray-800">Task ID</th>
              <th className={`${thCls} min-w-56`}>Task Name</th>
              <th className={`${thCls} w-32`}>Duration</th>
              <th className={`${thCls} w-40`}>Start Date</th>
              <th className={`${thCls} w-40`}>Finish Date</th>
              <th className={`${thCls} min-w-64`}>Resource Name</th>
              <th className={`${thCls} w-32`}>Total Cost</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const cost = calculateTaskCost(parseResources(row.resources_json), row.duration);
              return (
                <tr key={row.id} className="hover:bg-gray-50">
                  <td className={tdCls}>{row.id}</td>
                  <td className={tdCls}>{row.name}</td>
                  <td className={tdCls}>{row.duration} days</td>
                  <td className={tdCls}>{row.start_date}</td>
                  <td className={tdCls}>{row.finish_date}</td>
                  <td className={tdCls}>{row.resource_names}</td>
                  <td className={tdCls}>{money(cost)}</td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="border border-gray-300 px-3 py-5 text-center text-sm text-gray-500">
                  No tasks found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
