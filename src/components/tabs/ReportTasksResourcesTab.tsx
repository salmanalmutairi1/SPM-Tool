import { useDb } from '../../hooks/useDb';
import type { TaskWithResources } from '../../types';
import { formatTaskDuration } from '../../utils/dates';
import { tableCls, tdCls, thCls } from '../shared/TableStyles';

export default function ReportTasksResourcesTab() {
  const { query } = useDb();
  const rows = query<TaskWithResources>(`
    SELECT
      t.id,
      t.name,
      t.duration,
      t.start_date,
      t.finish_date,
      COALESCE(GROUP_CONCAT(
        CASE
          WHEN r.type = 'Material' THEN r.name || ' (' || tr.quantity || ' ' || COALESCE(r.material_label, 'unit') || ')'
          ELSE r.name
        END,
        ', '
      ), '-') AS resource_names
    FROM tasks t
    LEFT JOIN task_resources tr ON tr.task_id = t.id
    LEFT JOIN resources r ON r.id = tr.resource_id
    GROUP BY t.id
    ORDER BY t.id
  `);

  return (
    <section>
      <div className="mb-3">
        <h2 className="text-base font-semibold text-gray-900">Report: All Tasks + Resources</h2>
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
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50">
                <td className={tdCls}>{row.id}</td>
                <td className={tdCls}>{row.name}</td>
                <td className={tdCls}>{formatTaskDuration(row)}</td>
                <td className={tdCls}>{row.start_date}</td>
                <td className={tdCls}>{row.finish_date}</td>
                <td className={tdCls}>{row.resource_names}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="border border-gray-300 px-3 py-5 text-center text-sm text-gray-500">
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
