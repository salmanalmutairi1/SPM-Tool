import type { AssignedResource, Resource } from '../types';

type ResourceCostInput = Resource | AssignedResource;

function safeQuantity(resource: ResourceCostInput): number {
  const quantity = 'quantity' in resource ? resource.quantity : 1;
  return typeof quantity === 'number' && Number.isFinite(quantity) && quantity >= 0 ? quantity : 0;
}

export function calculateResourceCostForTask(resource: ResourceCostInput, durationDays: number): number {
  if (resource.type === 'Work') {
    return (resource.standard_rate ?? 0) * durationDays * 8;
  }
  if (resource.type === 'Material') {
    return (resource.standard_rate ?? 0) * safeQuantity(resource);
  }
  return resource.cost_per_use ?? 0;
}

export function calculateTaskCost(resources: ResourceCostInput[], durationDays: number): number {
  return resources.reduce((sum, r) => sum + calculateResourceCostForTask(r, durationDays), 0);
}

export function calculateProjectCost(taskCosts: number[]): number {
  return taskCosts.reduce((sum, c) => sum + (isFinite(c) ? c : 0), 0);
}
