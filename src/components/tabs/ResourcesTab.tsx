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
  material_label: null,
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
  const [formError, setFormError] = useState<string | null>(null);
  const resources = query<Resource>('SELECT * FROM resources ORDER BY id');

  const startEdit = (resource: Resource) => {
    setEditingId(resource.id);
    setFormError(null);
    setForm({
      name: resource.name,
      type: resource.type,
      max_units: resource.max_units,
      material_label: resource.material_label,
      standard_rate: resource.standard_rate,
      overtime_rate: resource.overtime_rate,
      cost_per_use: resource.cost_per_use,
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
    if (!cleanName) {
      setFormError('Resource Name is required.');
      return;
    }

    if (form.type === 'Material' && !form.material_label?.trim()) {
      setFormError('Material resources need a Material Label, such as stack, box, ton, or sheet.');
      return;
    }

    const normalized: ResourceForm = {
      name: cleanName,
      type: form.type,
      max_units: form.type === 'Work' ? form.max_units?.trim() || null : null,
      material_label: form.type === 'Material' ? form.material_label?.trim() || null : null,
      standard_rate: form.type === 'Work' || form.type === 'Material' ? form.standard_rate : null,
      overtime_rate: form.type === 'Work' ? form.overtime_rate : null,
      cost_per_use: form.type === 'Cost' ? form.cost_per_use : null,
    };

    if (editingId === 'new') {
      exec(
        'INSERT INTO resources (name, type, max_units, material_label, standard_rate, overtime_rate, cost_per_use) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [
          normalized.name,
          normalized.type,
          normalized.max_units,
          normalized.material_label,
          normalized.standard_rate,
          normalized.overtime_rate,
          normalized.cost_per_use,
        ],
      );
    } else if (typeof editingId === 'number') {
      exec(
        'UPDATE resources SET name = ?, type = ?, max_units = ?, material_label = ?, standard_rate = ?, overtime_rate = ?, cost_per_use = ? WHERE id = ?',
        [
          normalized.name,
          normalized.type,
          normalized.max_units,
          normalized.material_label,
          normalized.standard_rate,
          normalized.overtime_rate,
          normalized.cost_per_use,
          editingId,
        ],
      );
    }

    cancel();
  };

  const deleteResource = (id: number) => {
    exec('DELETE FROM resources WHERE id = ?', [id]);
  };

  const setText = (field: 'name' | 'max_units' | 'material_label') => (event: ChangeEvent<HTMLInputElement>) => {
    setFormError(null);
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const setNumber = (field: 'standard_rate' | 'overtime_rate' | 'cost_per_use') => (event: ChangeEvent<HTMLInputElement>) => {
    setFormError(null);
    setForm((current) => ({ ...current, [field]: numberOrNull(event.target.value) }));
  };

  const changeType = (event: ChangeEvent<HTMLSelectElement>) => {
    const nextType = event.target.value as Resource['type'];
    setFormError(null);
    setForm((current) => ({
      ...current,
      type: nextType,
      max_units: nextType === 'Work' ? (current.max_units ?? '100%') : null,
      material_label: nextType === 'Material' ? current.material_label : null,
      standard_rate: nextType === 'Work' || nextType === 'Material' ? current.standard_rate : null,
      overtime_rate: nextType === 'Work' ? current.overtime_rate : null,
      cost_per_use: nextType === 'Cost' ? current.cost_per_use : null,
    }));
  };

  const editRow = (resourceId: number | 'new') => {
    const isWork = form.type === 'Work';
    const isMaterial = form.type === 'Material';
    const isCost = form.type === 'Cost';
    return (
      <>
        <tr className="bg-blue-50">
          <td className={tdEditCls}>{resourceId === 'new' ? 'New' : resourceId}</td>
          <td className={tdEditCls}>
            <input className={inputCls} value={form.name} onChange={setText('name')} placeholder="Resource name" autoFocus />
          </td>
          <td className={tdEditCls}>
            <select className={inputCls} value={form.type} onChange={changeType}>
              <option value="Work">Work</option>
              <option value="Material">Material</option>
              <option value="Cost">Cost</option>
            </select>
          </td>
          <td className={tdEditCls}>
            <input className={isWork ? inputCls : disabledInputCls} value={form.max_units ?? ''} onChange={setText('max_units')} disabled={!isWork} placeholder="100%" />
          </td>
          <td className={tdEditCls}>
            <input className={isMaterial ? inputCls : disabledInputCls} value={form.material_label ?? ''} onChange={setText('material_label')} disabled={!isMaterial} placeholder="stack" />
          </td>
          <td className={tdEditCls}>
            <input className={isWork || isMaterial ? inputCls : disabledInputCls} type="number" min={0} value={form.standard_rate ?? ''} onChange={setNumber('standard_rate')} disabled={isCost} />
          </td>
          <td className={tdEditCls}>
            <input className={isWork ? inputCls : disabledInputCls} type="number" min={0} value={form.overtime_rate ?? ''} onChange={setNumber('overtime_rate')} disabled={!isWork} />
          </td>
          <td className={tdEditCls}>
            <input className={isCost ? inputCls : disabledInputCls} type="number" min={0} value={form.cost_per_use ?? ''} onChange={setNumber('cost_per_use')} disabled={!isCost} />
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
        {formError && (
          <tr className="bg-red-50">
            <td colSpan={9} className="border border-red-200 px-3 py-2 text-sm text-red-700">
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
              <th className={`${thCls} w-36`}>Material Label</th>
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
                  <td className={tdCls}>{resource.material_label ?? '-'}</td>
                  <td className={tdCls}>
                    {resource.standard_rate == null
                      ? '-'
                      : `${money(resource.standard_rate)}${resource.type === 'Material' ? `/${resource.material_label ?? 'unit'}` : '/hr'}`}
                  </td>
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
                <td colSpan={9} className="border border-gray-300 px-3 py-5 text-center text-sm text-gray-500">
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
