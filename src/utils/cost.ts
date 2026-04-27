import type { Resource } from '../types';

export function calculateResourceCostForTask(resource: Resource, durationDays: number): number {
  if (resource.type === 'Work') {
    return (resource.standard_rate ?? 0) * durationDays * 8;
  }
  return resource.cost_per_use ?? 0;
}

export function calculateTaskCost(resources: Resource[], durationDays: number): number {
  return resources.reduce((sum, r) => sum + calculateResourceCostForTask(r, durationDays), 0);
}

export function calculateProjectCost(taskCosts: number[]): number {
  return taskCosts.reduce((sum, c) => sum + (isFinite(c) ? c : 0), 0);
}
