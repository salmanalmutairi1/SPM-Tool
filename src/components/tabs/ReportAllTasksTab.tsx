import { useDb } from '../../hooks/useDb';
import type { Task } from '../../types';
import { formatTaskDuration } from '../../utils/dates';
import { tableCls, tdCls, thCls } from '../shared/TableStyles';

export default function ReportAllTasksTab() {
  const { query } = useDb();
  const tasks = query<Task>('SELECT * FROM tasks ORDER BY id');

  return (
    <section>
      <div className="mb-3">
        <h2 className="text-base font-semibold text-gray-900">Report: All Tasks</h2>
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
              </tr>
            ))}
            {tasks.length === 0 && (
              <tr>
                <td colSpan={5} className="border border-gray-300 px-3 py-5 text-center text-sm text-gray-500">
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
