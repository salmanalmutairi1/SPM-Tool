import { useDb } from '../../hooks/useDb';
import type { Resource, Task } from '../../types';
import { formatTaskDuration } from '../../utils/dates';
import ResourceChecklist from '../shared/ResourceChecklist';
import { tableCls, tdCls, thCls } from '../shared/TableStyles';

interface AssignedResourceRow {
  resource_id: number;
  quantity: number;
}

export default function AllocationTab() {
  const { exec, execBatch, query } = useDb();
  const tasks = query<Task>('SELECT * FROM tasks ORDER BY id');
  const resources = query<Resource>('SELECT * FROM resources ORDER BY name');

  const getAssignments = (taskId: number): AssignedResourceRow[] =>
    query<AssignedResourceRow>('SELECT resource_id, quantity FROM task_resources WHERE task_id = ? ORDER BY resource_id', [taskId]);

  const handleChange = (taskId: number, resourceIds: number[]) => {
    const currentAssignments = getAssignments(taskId);
    execBatch([
      { sql: 'DELETE FROM task_resources WHERE task_id = ?', params: [taskId] },
      ...resourceIds.map((resourceId) => ({
        sql: 'INSERT OR IGNORE INTO task_resources (task_id, resource_id, quantity) VALUES (?, ?, ?)',
        params: [
          taskId,
          resourceId,
          currentAssignments.find((assignment) => assignment.resource_id === resourceId)?.quantity ?? 1,
        ],
      })),
    ]);
  };

  const updateQuantity = (taskId: number, resourceId: number, value: string) => {
    const quantity = Math.max(0, Number(value) || 0);
    exec('UPDATE task_resources SET quantity = ? WHERE task_id = ? AND resource_id = ?', [quantity, taskId, resourceId]);
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
            {tasks.map((task) => {
              const assignments = getAssignments(task.id);
              const selectedIds = assignments.map((assignment) => assignment.resource_id);
              const materialAssignments = assignments
                .map((assignment) => ({
                  ...assignment,
                  resource: resources.find((resource) => resource.id === assignment.resource_id),
                }))
                .filter((assignment) => assignment.resource?.type === 'Material');

              return (
                <tr key={task.id} className="hover:bg-gray-50">
                  <td className={tdCls}>{task.id}</td>
                  <td className={tdCls}>{task.name}</td>
                  <td className={tdCls}>{formatTaskDuration(task)}</td>
                  <td className={tdCls}>{task.start_date}</td>
                  <td className={tdCls}>{task.finish_date}</td>
                  <td className="border border-gray-300 px-2 py-1 text-sm">
                    <ResourceChecklist selectedIds={selectedIds} onChange={(ids) => handleChange(task.id, ids)} />
                    {materialAssignments.length > 0 && (
                      <div className="mt-2 grid gap-1">
                        {materialAssignments.map((assignment) => (
                          <label key={assignment.resource_id} className="flex items-center gap-2 text-xs text-gray-700">
                            <span className="min-w-24 truncate">{assignment.resource?.name}</span>
                            <input
                              className="h-7 w-20 rounded border border-gray-300 px-2 text-sm outline-none focus:border-blue-600"
                              type="number"
                              min={0}
                              step="0.01"
                              value={assignment.quantity}
                              onChange={(event) => updateQuantity(task.id, assignment.resource_id, event.target.value)}
                              aria-label={`${assignment.resource?.name} quantity`}
                            />
                            <span className="text-gray-500">{assignment.resource?.material_label ?? 'unit'}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
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
