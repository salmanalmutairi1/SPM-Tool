import { useState, type ChangeEvent } from 'react';
import { Check, Pencil, Plus, Trash2, X } from 'lucide-react';
import { useDb } from '../../hooks/useDb';
import type { Task } from '../../types';
import { actionButtonCls, dangerButtonCls, inputCls, primaryButtonCls, tableCls, tdCls, tdEditCls, thCls } from '../shared/TableStyles';

type TaskForm = Omit<Task, 'id'>;

const emptyForm = (): TaskForm => ({
  name: '',
  duration: 1,
  start_date: '',
  finish_date: '',
});

export default function TasksTab() {
  const { exec, query } = useDb();
  const [editingId, setEditingId] = useState<number | 'new' | null>(null);
  const [form, setForm] = useState<TaskForm>(emptyForm());
  const tasks = query<Task>('SELECT * FROM tasks ORDER BY id');

  const startEdit = (task: Task) => {
    setEditingId(task.id);
    setForm({
      name: task.name,
      duration: task.duration,
      start_date: task.start_date,
      finish_date: task.finish_date,
    });
  };

  const startNew = () => {
    setEditingId('new');
    setForm(emptyForm());
  };

  const cancel = () => {
    setEditingId(null);
    setForm(emptyForm());
  };

  const save = () => {
    const cleanName = form.name.trim();
    if (!cleanName || !form.start_date.trim() || !form.finish_date.trim() || form.duration < 1) return;

    if (editingId === 'new') {
      exec(
        'INSERT INTO tasks (name, duration, start_date, finish_date) VALUES (?, ?, ?, ?)',
        [cleanName, form.duration, form.start_date.trim(), form.finish_date.trim()],
      );
    } else if (typeof editingId === 'number') {
      exec(
        'UPDATE tasks SET name = ?, duration = ?, start_date = ?, finish_date = ? WHERE id = ?',
        [cleanName, form.duration, form.start_date.trim(), form.finish_date.trim(), editingId],
      );
    }

    cancel();
  };

  const deleteTask = (id: number) => {
    exec('DELETE FROM tasks WHERE id = ?', [id]);
  };

  const updateForm = (field: keyof TaskForm) => (event: ChangeEvent<HTMLInputElement>) => {
    const value = field === 'duration' ? Math.max(1, Number(event.target.value) || 1) : event.target.value;
    setForm((current) => ({ ...current, [field]: value }));
  };

  const editRow = (taskId: number | 'new') => (
    <tr className="bg-blue-50">
      <td className={tdEditCls}>{taskId === 'new' ? 'New' : taskId}</td>
      <td className={tdEditCls}>
        <input className={inputCls} value={form.name} onChange={updateForm('name')} placeholder="Task name" autoFocus />
      </td>
      <td className={tdEditCls}>
        <input className={inputCls} type="number" min={1} value={form.duration} onChange={updateForm('duration')} />
      </td>
      <td className={tdEditCls}>
        <input className={inputCls} value={form.start_date} onChange={updateForm('start_date')} placeholder="DD/MM/YYYY" />
      </td>
      <td className={tdEditCls}>
        <input className={inputCls} value={form.finish_date} onChange={updateForm('finish_date')} placeholder="DD/MM/YYYY" />
      </td>
      <td className={`${tdEditCls} whitespace-nowrap`}>
        <div className="flex gap-1">
          <button type="button" className={actionButtonCls} onClick={save} title="Save task" aria-label="Save task">
            <Check size={16} />
          </button>
          <button type="button" className={actionButtonCls} onClick={cancel} title="Cancel" aria-label="Cancel">
            <X size={16} />
          </button>
        </div>
      </td>
    </tr>
  );

  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-gray-900">Tasks</h2>
        <button type="button" className={primaryButtonCls} onClick={startNew} disabled={editingId !== null}>
          <Plus size={16} />
          Add Row
        </button>
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
              <th className={`${thCls} w-24`}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => (
              editingId === task.id ? editRow(task.id) : (
                <tr key={task.id} className="hover:bg-gray-50">
                  <td className={tdCls}>{task.id}</td>
                  <td className={tdCls}>{task.name}</td>
                  <td className={tdCls}>{task.duration} days</td>
                  <td className={tdCls}>{task.start_date}</td>
                  <td className={tdCls}>{task.finish_date}</td>
                  <td className={`${tdCls} whitespace-nowrap`}>
                    <div className="flex gap-1">
                      <button type="button" className={actionButtonCls} onClick={() => startEdit(task)} disabled={editingId !== null} title="Edit task" aria-label="Edit task">
                        <Pencil size={15} />
                      </button>
                      <button type="button" className={dangerButtonCls} onClick={() => deleteTask(task.id)} disabled={editingId !== null} title="Delete task" aria-label="Delete task">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            ))}
            {editingId === 'new' && editRow('new')}
            {tasks.length === 0 && editingId !== 'new' && (
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
