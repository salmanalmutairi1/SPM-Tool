import { useState, type ChangeEvent } from 'react';
import { Check, Pencil, Plus, Trash2, X } from 'lucide-react';
import { useDb } from '../../hooks/useDb';
import type { Task } from '../../types';
import { calculateDurationFromDates, formatTaskDuration } from '../../utils/dates';
import { actionButtonCls, dangerButtonCls, disabledInputCls, inputCls, primaryButtonCls, tableCls, tdCls, tdEditCls, thCls } from '../shared/TableStyles';

type TaskForm = Omit<Task, 'id' | 'duration'>;

const emptyForm = (): TaskForm => ({
  name: '',
  start_date: '',
  finish_date: '',
});

export default function TasksTab() {
  const { exec, query } = useDb();
  const [editingId, setEditingId] = useState<number | 'new' | null>(null);
  const [form, setForm] = useState<TaskForm>(emptyForm());
  const [formError, setFormError] = useState<string | null>(null);
  const tasks = query<Task>('SELECT * FROM tasks ORDER BY id');
  const durationResult = calculateDurationFromDates(form.start_date, form.finish_date);

  const startEdit = (task: Task) => {
    setEditingId(task.id);
    setFormError(null);
    setForm({
      name: task.name,
      start_date: task.start_date,
      finish_date: task.finish_date,
    });
  };

  const startNew = () => {
    setEditingId('new');
    setForm(emptyForm());
    setFormError(null);
  };

  const cancel = () => {
    setEditingId(null);
    setForm(emptyForm());
    setFormError(null);
  };

  const save = () => {
    const cleanName = form.name.trim();
    const calculated = calculateDurationFromDates(form.start_date, form.finish_date);

    if (!cleanName) {
      setFormError('Task Name is required.');
      return;
    }

    if (!calculated.ok) {
      setFormError(calculated.message);
      return;
    }

    if (editingId === 'new') {
      exec(
        'INSERT INTO tasks (name, duration, start_date, finish_date) VALUES (?, ?, ?, ?)',
        [cleanName, calculated.duration, calculated.startDate, calculated.finishDate],
      );
    } else if (typeof editingId === 'number') {
      exec(
        'UPDATE tasks SET name = ?, duration = ?, start_date = ?, finish_date = ? WHERE id = ?',
        [cleanName, calculated.duration, calculated.startDate, calculated.finishDate, editingId],
      );
    }

    cancel();
  };

  const deleteTask = (id: number) => {
    exec('DELETE FROM tasks WHERE id = ?', [id]);
  };

  const updateForm = (field: keyof TaskForm) => (event: ChangeEvent<HTMLInputElement>) => {
    setFormError(null);
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const editRow = (taskId: number | 'new') => {
    const durationText = durationResult.ok ? `${durationResult.duration} days` : 'Waiting for valid dates';

    return (
      <>
        <tr className="bg-blue-50">
          <td className={tdEditCls}>{taskId === 'new' ? 'New' : taskId}</td>
          <td className={tdEditCls}>
            <input className={inputCls} value={form.name} onChange={updateForm('name')} placeholder="Task name" autoFocus />
          </td>
          <td className={tdEditCls}>
            <input className={disabledInputCls} value={durationText} readOnly aria-label="Calculated duration" />
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
        {formError && (
          <tr className="bg-red-50">
            <td colSpan={6} className="border border-red-200 px-3 py-2 text-sm text-red-700">
              {formError}
            </td>
          </tr>
        )}
      </>
    );
  };

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
                  <td className={tdCls}>{formatTaskDuration(task)}</td>
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
