export interface Task {
  id: number;
  name: string;
  duration: number;
  start_date: string;
  finish_date: string;
}

export interface Resource {
  id: number;
  name: string;
  type: 'Work' | 'Material' | 'Cost';
  max_units: string | null;
  material_label: string | null;
  standard_rate: number | null;
  overtime_rate: number | null;
  cost_per_use: number | null;
}

export interface TaskWithResources extends Task {
  resource_names: string;
}

export interface AssignedResource extends Resource {
  quantity: number | null;
}
