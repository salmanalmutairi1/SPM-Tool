import { describe, it, expect } from 'vitest';
import { calculateResourceCostForTask, calculateTaskCost, calculateProjectCost } from './cost';
import type { Resource } from '../types';

const workResource: Resource = {
  id: 1,
  name: 'Project Manager',
  type: 'Work',
  max_units: '100%',
  material_label: null,
  standard_rate: 15,
  overtime_rate: null,
  cost_per_use: null,
};

const costResource: Resource = {
  id: 2,
  name: 'Laptop',
  type: 'Cost',
  max_units: null,
  material_label: null,
  standard_rate: null,
  overtime_rate: null,
  cost_per_use: 1000,
};

const materialResource: Resource = {
  id: 3,
  name: 'Paper',
  type: 'Material',
  max_units: null,
  material_label: 'stack',
  standard_rate: 25,
  overtime_rate: null,
  cost_per_use: null,
};

describe('calculateResourceCostForTask', () => {
  it('Work: standard_rate x duration_days x 8', () => {
    expect(calculateResourceCostForTask(workResource, 5)).toBe(600);
  });

  it('Cost: returns cost_per_use regardless of duration', () => {
    expect(calculateResourceCostForTask(costResource, 5)).toBe(1000);
  });

  it('Material: standard_rate times assigned quantity', () => {
    expect(calculateResourceCostForTask({ ...materialResource, quantity: 3 }, 5)).toBe(75);
  });

  it('Work with null standard_rate returns 0', () => {
    const r: Resource = { ...workResource, standard_rate: null };
    expect(calculateResourceCostForTask(r, 5)).toBe(0);
  });

  it('Cost with null cost_per_use returns 0', () => {
    const r: Resource = { ...costResource, cost_per_use: null };
    expect(calculateResourceCostForTask(r, 5)).toBe(0);
  });

  it('Material with null standard_rate returns 0', () => {
    const r: Resource = { ...materialResource, standard_rate: null };
    expect(calculateResourceCostForTask({ ...r, quantity: 3 }, 5)).toBe(0);
  });

  it('Material with invalid quantity returns 0', () => {
    expect(calculateResourceCostForTask({ ...materialResource, quantity: -2 }, 5)).toBe(0);
  });
});

describe('calculateTaskCost', () => {
  it('sums work and cost resources: $600 + $1000 = $1600', () => {
    expect(calculateTaskCost([workResource, costResource], 5)).toBe(1600);
  });

  it('includes material assignment costs in the task total', () => {
    expect(calculateTaskCost([workResource, costResource, { ...materialResource, quantity: 3 }], 5)).toBe(1675);
  });

  it('returns 0 for empty resource list', () => {
    expect(calculateTaskCost([], 5)).toBe(0);
  });
});

describe('calculateProjectCost', () => {
  it('sums all task total costs', () => {
    expect(calculateProjectCost([1600, 800, 200])).toBe(2600);
  });

  it('returns 0 for empty list', () => {
    expect(calculateProjectCost([])).toBe(0);
  });

  it('skips NaN values safely', () => {
    expect(calculateProjectCost([1600, NaN, 200])).toBe(1800);
  });
});
