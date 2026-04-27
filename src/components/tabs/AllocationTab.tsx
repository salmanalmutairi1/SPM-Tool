import { useDb } from '../../hooks/useDb';
import type { Task } from '../../types';
import { formatTaskDuration } from '../../utils/dates';
import ResourceChecklist from '../shared/ResourceChecklist';
import { tableCls, tdCls, thCls } from '../shared/TableStyles';

interface AssignedResourceRow {
  resource_id: number;
}

export default function AllocationTab() {
  const { execBatch, query } = useDb();
  const tasks = query<Task>('SELECT * FROM tasks ORDER BY id');

  const getAssignedIds = (taskId: number): number[] =>
    query<AssignedResourceRow>('SELECT resource_id FROM task_resources WHERE task_id = ? ORDER BY resource_id', [taskId])
      .map((row) => row.resource_id);

  const handleChange = (taskId: number, resourceIds: number[]) => {
    execBatch([
      { sql: 'DELETE FROM task_resources WHERE task_id = ?', params: [taskId] },
      ...resourceIds.map((resourceId) => ({
        sql: 'INSERT OR IGNORE INTO task_resources (task_id, resource_id) VALUES (?, ?)',
        params: [taskId, resourceId],
      })),
    ]);
  };

  return (
    <section>
      <div className="mb-3">
        <h2 className="text-base font-semibold text-gray-900">Allocate Resources to Tasks</h2>
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
            {tasks.map((task) => (
              <tr key={task.id} className="hover:bg-gray-50">
                <td className={tdCls}>{task.id}</td>
                <td className={tdCls}>{task.name}</td>
                <td className={tdCls}>{formatTaskDuration(task)}</td>
                <td className={tdCls}>{task.start_date}</td>
                <td className={tdCls}>{task.finish_date}</td>
                <td className="border border-gray-300 px-2 py-1 text-sm">
                  <ResourceChecklist selectedIds={getAssignedIds(task.id)} onChange={(ids) => handleChange(task.id, ids)} />
                </td>
              </tr>
            ))}
            {tasks.length === 0 && (
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
