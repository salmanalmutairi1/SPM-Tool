import { useState, type ChangeEvent } from 'react';
import { Check, Pencil, Plus, Trash2, X } from 'lucide-react';
import { useDb } from '../../hooks/useDb';
import type { Resource } from '../../types';
import {
  actionButtonCls,
  dangerButtonCls,
  disabledInputCls,
  inputCls,
  primaryButtonCls,
  tableCls,
  tdCls,
  tdEditCls,
  thCls,
} from '../shared/TableStyles';

type ResourceForm = Omit<Resource, 'id'>;

const emptyForm = (): ResourceForm => ({
  name: '',
  type: 'Work',
  max_units: '100%',
  standard_rate: null,
  overtime_rate: null,
  cost_per_use: null,
});

function numberOrNull(value: string): number | null {
  if (value.trim() === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function money(value: number | null): string {
  return value == null ? '-' : `$${value}`;
}

export default function ResourcesTab() {
  const { exec, query } = useDb();
  const [editingId, setEditingId] = useState<number | 'new' | null>(null);
  const [form, setForm] = useState<ResourceForm>(emptyForm());
  const resources = query<Resource>('SELECT * FROM resources ORDER BY id');

  const startEdit = (resource: Resource) => {
    setEditingId(resource.id);
    setForm({
      name: resource.name,
      type: resource.type,
      max_units: resource.max_units,
      standard_rate: resource.standard_rate,
      overtime_rate: resource.overtime_rate,
      cost_per_use: resource.cost_per_use,
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
    if (!cleanName) return;

    const normalized: ResourceForm = form.type === 'Work'
      ? {
          name: cleanName,
          type: 'Work',
          max_units: form.max_units?.trim() || null,
          standard_rate: form.standard_rate,
          overtime_rate: form.overtime_rate,
          cost_per_use: null,
        }
      : {
          name: cleanName,
          type: 'Cost',
          max_units: null,
          standard_rate: null,
          overtime_rate: null,
          cost_per_use: form.cost_per_use,
        };

    if (editingId === 'new') {
      exec(
        'INSERT INTO resources (name, type, max_units, standard_rate, overtime_rate, cost_per_use) VALUES (?, ?, ?, ?, ?, ?)',
        [normalized.name, normalized.type, normalized.max_units, normalized.standard_rate, normalized.overtime_rate, normalized.cost_per_use],
      );
    } else if (typeof editingId === 'number') {
      exec(
        'UPDATE resources SET name = ?, type = ?, max_units = ?, standard_rate = ?, overtime_rate = ?, cost_per_use = ? WHERE id = ?',
        [normalized.name, normalized.type, normalized.max_units, normalized.standard_rate, normalized.overtime_rate, normalized.cost_per_use, editingId],
      );
    }

    cancel();
  };

  const deleteResource = (id: number) => {
    exec('DELETE FROM resources WHERE id = ?', [id]);
  };

  const setText = (field: 'name' | 'max_units') => (event: ChangeEvent<HTMLInputElement>) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const setNumber = (field: 'standard_rate' | 'overtime_rate' | 'cost_per_use') => (event: ChangeEvent<HTMLInputElement>) => {
    setForm((current) => ({ ...current, [field]: numberOrNull(event.target.value) }));
  };

  const changeType = (event: ChangeEvent<HTMLSelectElement>) => {
    const nextType = event.target.value as Resource['type'];
    setForm((current) => ({
      ...current,
      type: nextType,
      max_units: nextType === 'Work' ? (current.max_units ?? '100%') : null,
      standard_rate: nextType === 'Work' ? current.standard_rate : null,
      overtime_rate: nextType === 'Work' ? current.overtime_rate : null,
      cost_per_use: nextType === 'Cost' ? current.cost_per_use : null,
    }));
  };

  const editRow = (resourceId: number | 'new') => {
    const isWork = form.type === 'Work';
    return (
      <tr className="bg-blue-50">
        <td className={tdEditCls}>{resourceId === 'new' ? 'New' : resourceId}</td>
        <td className={tdEditCls}>
          <input className={inputCls} value={form.name} onChange={setText('name')} placeholder="Resource name" autoFocus />
        </td>
        <td className={tdEditCls}>
          <select className={inputCls} value={form.type} onChange={changeType}>
            <option value="Work">Work</option>
            <option value="Cost">Cost</option>
          </select>
        </td>
        <td className={tdEditCls}>
          <input className={isWork ? inputCls : disabledInputCls} value={form.max_units ?? ''} onChange={setText('max_units')} disabled={!isWork} placeholder="100%" />
        </td>
        <td className={tdEditCls}>
          <input className={isWork ? inputCls : disabledInputCls} type="number" min={0} value={form.standard_rate ?? ''} onChange={setNumber('standard_rate')} disabled={!isWork} />
        </td>
        <td className={tdEditCls}>
          <input className={isWork ? inputCls : disabledInputCls} type="number" min={0} value={form.overtime_rate ?? ''} onChange={setNumber('overtime_rate')} disabled={!isWork} />
        </td>
        <td className={tdEditCls}>
          <input className={!isWork ? inputCls : disabledInputCls} type="number" min={0} value={form.cost_per_use ?? ''} onChange={setNumber('cost_per_use')} disabled={isWork} />
        </td>
        <td className={`${tdEditCls} whitespace-nowrap`}>
          <div className="flex gap-1">
            <button type="button" className={actionButtonCls} onClick={save} title="Save resource" aria-label="Save resource">
              <Check size={16} />
            </button>
            <button type="button" className={actionButtonCls} onClick={cancel} title="Cancel" aria-label="Cancel">
              <X size={16} />
            </button>
          </div>
        </td>
      </tr>
    );
  };

  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-gray-900">Resources</h2>
        <button type="button" className={primaryButtonCls} onClick={startNew} disabled={editingId !== null}>
          <Plus size={16} />
          Add Row
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className={tableCls}>
          <thead>
            <tr>
              <th className="w-24 border border-gray-300 bg-gray-200 px-3 py-2 text-left text-sm font-semibold text-gray-800">Resource ID</th>
              <th className={`${thCls} min-w-52`}>Resource Name</th>
              <th className={`${thCls} w-28`}>Type</th>
              <th className={`${thCls} w-40`}>Max</th>
              <th className={`${thCls} w-28`}>St. Rate</th>
              <th className={`${thCls} w-28`}>Ovt.</th>
              <th className={`${thCls} w-28`}>Cost/Use</th>
              <th className={`${thCls} w-24`}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {resources.map((resource) => (
              editingId === resource.id ? editRow(resource.id) : (
                <tr key={resource.id} className="hover:bg-gray-50">
                  <td className={tdCls}>{resource.id}</td>
                  <td className={tdCls}>{resource.name}</td>
                  <td className={tdCls}>{resource.type}</td>
                  <td className={tdCls}>{resource.max_units ?? '-'}</td>
                  <td className={tdCls}>{resource.standard_rate == null ? '-' : `${money(resource.standard_rate)}/hr`}</td>
                  <td className={tdCls}>{resource.overtime_rate == null ? '-' : `${money(resource.overtime_rate)}/hr`}</td>
                  <td className={tdCls}>{money(resource.cost_per_use)}</td>
                  <td className={`${tdCls} whitespace-nowrap`}>
                    <div className="flex gap-1">
                      <button type="button" className={actionButtonCls} onClick={() => startEdit(resource)} disabled={editingId !== null} title="Edit resource" aria-label="Edit resource">
                        <Pencil size={15} />
                      </button>
                      <button type="button" className={dangerButtonCls} onClick={() => deleteResource(resource.id)} disabled={editingId !== null} title="Delete resource" aria-label="Delete resource">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            ))}
            {editingId === 'new' && editRow('new')}
            {resources.length === 0 && editingId !== 'new' && (
              <tr>
                <td colSpan={8} className="border border-gray-300 px-3 py-5 text-center text-sm text-gray-500">
                  No resources found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
