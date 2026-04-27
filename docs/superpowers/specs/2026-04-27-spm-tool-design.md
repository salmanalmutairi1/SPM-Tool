# SPM Tool — Design Spec
**Date:** 2026-04-27  
**Project:** appSPM (C:\Users\salma\Downloads\appSPM)  
**Goal:** A Microsoft Project-style web app with 8 tabs, backed by SQLite (sql.js) auto-saved to localStorage.

---

## 1. Tech Stack

| Concern | Choice |
|---------|--------|
| Framework | React 19 + Vite 6 + TypeScript |
| Styling | Tailwind CSS 4 |
| Icons | lucide-react |
| Database | sql.js (SQLite compiled to WASM, runs in browser) |
| Persistence | Auto-save DB to localStorage as base64 on every mutation |

---

## 2. File Structure

```
appSPM/
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
└── src/
    ├── main.tsx
    ├── App.tsx                             ← Tab navigation shell only
    ├── db/
    │   └── schema.ts                       ← CREATE TABLE SQL + DB init/load
    ├── context/
    │   └── DatabaseContext.tsx             ← Provides sql.js DB + auto-save + refresh trigger
    ├── hooks/
    │   └── useDb.ts                        ← Helper: exec(), query(), triggerRefresh()
    └── components/
        ├── shared/
        │   ├── EditableTable.tsx           ← Reusable inline-edit table shell
        │   └── ResourceChecklist.tsx       ← Dropdown multi-select checklist
        └── tabs/
            ├── TasksTab.tsx                ← Tab 1: Manage Tasks
            ├── ResourcesTab.tsx            ← Tab 2: Manage Resources
            ├── AllocationTab.tsx           ← Tab 3: Allocate Resources to Tasks
            ├── ReportAllTasksTab.tsx       ← Tab 4: Report — All Tasks
            ├── ReportAllResourcesTab.tsx   ← Tab 5: Report — All Resources
            ├── ReportTasksResourcesTab.tsx ← Tab 6: Report — Tasks + Resources
            ├── ReportCostPerTaskTab.tsx    ← Tab 7: Report — Cost per Task
            └── ReportTotalCostTab.tsx      ← Tab 8: Report — Total Project Cost
```

---

## 3. Database Schema

```sql
CREATE TABLE IF NOT EXISTS tasks (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT    NOT NULL,
  duration    INTEGER NOT NULL,   -- in days
  start_date  TEXT    NOT NULL,   -- format: DD/MM/YYYY
  finish_date TEXT    NOT NULL    -- format: DD/MM/YYYY
);

CREATE TABLE IF NOT EXISTS resources (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT    NOT NULL,
  type          TEXT    NOT NULL CHECK(type IN ('Work', 'Cost')),
  max_units     TEXT,             -- e.g. '100%' — only for Work type
  standard_rate REAL,             -- $/hr — only for Work type
  overtime_rate REAL,             -- $/hr — optional, for Work type
  cost_per_use  REAL              -- fixed $ — only for Cost type
);

CREATE TABLE IF NOT EXISTS task_resources (
  task_id     INTEGER NOT NULL REFERENCES tasks(id)     ON DELETE CASCADE,
  resource_id INTEGER NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  PRIMARY KEY (task_id, resource_id)
);
```

**Persistence:** On every INSERT/UPDATE/DELETE, export the DB via `db.export()` and store as base64 in `localStorage['spm_db']`. On app load, check localStorage first; if found, load it; otherwise initialise fresh schema.

---

## 4. Cost Calculation Rules

- **Work** resource cost for a task = `standard_rate ($/hr) × duration_days × 8 hrs/day`
- **Cost** resource cost for a task = `cost_per_use ($)`
- **Task Total Cost** = sum of all assigned resource costs for that task (shows `$0` if no resources assigned)
- **Project Total Cost** = sum of all task total costs (shows `$0` if no tasks exist)

---

## 5. Tab Specifications

### Tab 1 — Tasks (CRUD)
**Columns:** Task ID (auto, read-only) | Task Name | Duration (days) | Start Date | Finish Date  
**Actions:** Add Row button → blank row at bottom; each row has Edit / Save / Delete buttons.  
Inline editing: all fields editable except Task ID.

### Tab 2 — Resources (CRUD)
**Columns:** Resource ID (auto, read-only) | Resource Name | Type (dropdown: Work / Cost) | Max (No. of Resource) | St. Rate | Ovt. | Cost/Use  
**Type rules:**
- `Work` selected → St. Rate + Ovt. + Max are active; Cost/Use greyed out
- `Cost` selected → Cost/Use active; St. Rate + Ovt. + Max greyed out  
**Actions:** Add Row / Edit / Save / Delete (same pattern as Tab 1).

### Tab 3 — Allocate Resources to Tasks
**Columns:** Task ID | Task Name | Duration | Start Date | Finish Date | Resource Name  
**Resource Name cell:** clicking opens a dropdown checklist of all resources from Tab 2.  
Checked resources are saved to `task_resources`. Cell displays assigned resources as comma-separated names (e.g. `Project Manager, Laptop`). If no resources are assigned yet, the cell shows `— Select resources —` as a placeholder.  
Deleting a resource in Tab 2 automatically removes it from all task assignments (ON DELETE CASCADE).  
Tasks are loaded from Tab 1; no add/delete here.

### Tab 4 — Report: All Tasks (View only)
**Columns:** Task ID | Task Name | Duration | Start Date | Finish Date

### Tab 5 — Report: All Resources (View only)
**Columns:** Resource Name | Type | Max | St. Rate | Ovt. | Cost/Use

### Tab 6 — Report: All Tasks + Resources (View only)
**Columns:** Task ID | Task Name | Duration | Start Date | Finish Date | Resource Name

### Tab 7 — Report: Total Cost per Task (View only)
**Columns:** Task ID | Task Name | Duration | Start Date | Finish Date | Resource Name | Total Cost

### Tab 8 — Report: Total Cost for Whole Project (View only)
**Columns:** Task ID | Task Name | Duration | Start Date | Finish Date | Resource Name | Total Cost  
**Extra:** Bold **Total Cost** row at the bottom summing all task costs.

---

## 6. UI / Visual Style

- Microsoft Project-inspired: white background, grey table headers, thin bordered cells
- Active tab: blue underline accent
- Disabled fields (type mismatch in Tab 2): greyed background, not editable
- Reports tabs clearly labelled as read-only (no edit/delete buttons visible)
- Follows the same Tailwind + lucide-react conventions as sibling projects (`yas---your-app-starter`, `salman-almutairi-portfolio`)

---

## 7. Constraints & Decisions

| Decision | Choice | Reason |
|----------|--------|--------|
| Task ID | Auto-increment, never user-entered | Matches PDF sample; avoids duplicate key errors |
| Duration unit | Days only | PDF samples all show "X days" |
| Date format | DD/MM/YYYY | Matches PDF samples |
| Working hours/day | 8 | Confirmed by cost example in PDF (15$/hr × 5d × 8h + $1000 = $1600) |
| Overtime rate | Stored but not used in cost formula | PDF does not specify overtime cost formula; field collected for completeness |
| sql.js WASM | Loaded via CDN or npm package | Must configure Vite to handle `.wasm` asset |
