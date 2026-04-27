import { useMemo, useState } from 'react';
import { Database, ListChecks, WalletCards, Users, Link2, ClipboardList, FileText, Calculator, Sigma } from 'lucide-react';
import { DatabaseProvider } from './context/DatabaseContext';
import TasksTab from './components/tabs/TasksTab';
import ResourcesTab from './components/tabs/ResourcesTab';
import AllocationTab from './components/tabs/AllocationTab';
import ReportAllTasksTab from './components/tabs/ReportAllTasksTab';
import ReportAllResourcesTab from './components/tabs/ReportAllResourcesTab';
import ReportTasksResourcesTab from './components/tabs/ReportTasksResourcesTab';
import ReportCostPerTaskTab from './components/tabs/ReportCostPerTaskTab';
import ReportTotalCostTab from './components/tabs/ReportTotalCostTab';

const TABS = [
  { label: 'Tasks', icon: ListChecks, component: TasksTab },
  { label: 'Resources', icon: Users, component: ResourcesTab },
  { label: 'Allocate Resources', icon: Link2, component: AllocationTab },
  { label: 'Report: All Tasks', icon: ClipboardList, component: ReportAllTasksTab },
  { label: 'Report: All Resources', icon: FileText, component: ReportAllResourcesTab },
  { label: 'Report: Tasks + Resources', icon: WalletCards, component: ReportTasksResourcesTab },
  { label: 'Report: Cost per Task', icon: Calculator, component: ReportCostPerTaskTab },
  { label: 'Report: Total Cost', icon: Sigma, component: ReportTotalCostTab },
];

export default function App() {
  const [activeTab, setActiveTab] = useState(0);
  const ActiveComponent = useMemo(() => TABS[activeTab].component, [activeTab]);

  return (
    <DatabaseProvider>
      <div className="min-h-screen bg-white font-sans text-gray-900">
        <header className="border-b border-blue-900 bg-blue-800 px-5 py-3 text-white shadow-sm">
          <div className="flex items-center gap-3">
            <Database size={22} aria-hidden="true" />
            <div>
              <h1 className="text-lg font-semibold tracking-normal">Project Manager - SPM Tool</h1>
              <p className="text-xs text-blue-100">SQLite browser workspace</p>
            </div>
          </div>
        </header>

        <nav className="flex overflow-x-auto border-b border-gray-300 bg-gray-50 px-3" aria-label="SPM tool tabs">
          {TABS.map((tab, index) => {
            const Icon = tab.icon;
            const isActive = index === activeTab;
            return (
              <button
                key={tab.label}
                type="button"
                onClick={() => setActiveTab(index)}
                className={`flex h-11 shrink-0 items-center gap-2 border-b-2 px-4 text-sm font-medium transition-colors ${
                  isActive
                    ? 'border-blue-700 bg-white text-blue-800'
                    : 'border-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Icon size={16} aria-hidden="true" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        <main className="px-5 py-5">
          <ActiveComponent />
        </main>
      </div>
    </DatabaseProvider>
  );
}
