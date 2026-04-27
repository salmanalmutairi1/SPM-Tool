import { useDb } from '../../hooks/useDb';
import type { Resource } from '../../types';
import { tableCls, tdCls, thCls } from '../shared/TableStyles';

function money(value: number | null, suffix = ''): string {
  return value == null ? '-' : `$${value}${suffix}`;
}

export default function ReportAllResourcesTab() {
  const { query } = useDb();
  const resources = query<Resource>('SELECT * FROM resources ORDER BY id');

  return (
    <section>
      <div className="mb-3">
        <h2 className="text-base font-semibold text-gray-900">Report: All Resources</h2>
        <p className="text-xs text-gray-500">View only</p>
      </div>

      <div className="overflow-x-auto">
        <table className={tableCls}>
          <thead>
            <tr>
              <th className={`${thCls} min-w-56`}>Resource Name</th>
              <th className={`${thCls} w-28`}>Type</th>
              <th className={`${thCls} w-40`}>Max</th>
              <th className={`${thCls} w-28`}>St. Rate</th>
              <th className={`${thCls} w-28`}>Ovt.</th>
              <th className={`${thCls} w-28`}>Cost/Use</th>
            </tr>
          </thead>
          <tbody>
            {resources.map((resource) => (
              <tr key={resource.id} className="hover:bg-gray-50">
                <td className={tdCls}>{resource.name}</td>
                <td className={tdCls}>{resource.type}</td>
                <td className={tdCls}>{resource.max_units ?? '-'}</td>
                <td className={tdCls}>{money(resource.standard_rate, '/hr')}</td>
                <td className={tdCls}>{money(resource.overtime_rate, '/hr')}</td>
                <td className={tdCls}>{money(resource.cost_per_use)}</td>
              </tr>
            ))}
            {resources.length === 0 && (
              <tr>
                <td colSpan={6} className="border border-gray-300 px-3 py-5 text-center text-sm text-gray-500">
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
