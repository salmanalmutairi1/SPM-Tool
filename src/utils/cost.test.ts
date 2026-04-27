import { describe, it, expect } from 'vitest';
import { calculateResourceCostForTask, calculateTaskCost, calculateProjectCost } from './cost';
import type { Resource } from '../types';

const workResource: Resource = {
  id: 1, name: 'Project Manager', type: 'Work',
  max_units: '100%', standard_rate: 15, overtime_rate: null, cost_per_use: null,
};

const costResource: Resource = {
  id: 2, name: 'Laptop', type: 'Cost',
  max_units: null, standard_rate: null, overtime_rate: null, cost_per_use: 1000,
};

describe('calculateResourceCostForTask', () => {
  it('Work: standard_rate × duration_days × 8', () => {
    expect(calculateResourceCostForTask(workResource, 5)).toBe(600); // 15 × 5 × 8
  });

  it('Cost: returns cost_per_use regardless of duration', () => {
    expect(calculateResourceCostForTask(costResource, 5)).toBe(1000);
  });

  it('Work with null standard_rate returns 0', () => {
    const r: Resource = { ...workResource, standard_rate: null };
    expect(calculateResourceCostForTask(r, 5)).toBe(0);
  });

  it('Cost with null cost_per_use returns 0', () => {
    const r: Resource = { ...costResource, cost_per_use: null };
    expect(calculateResourceCostForTask(r, 5)).toBe(0);
  });
});

describe('calculateTaskCost', () => {
  it('sums all resource costs — matches PDF example: $600 + $1000 = $1600', () => {
    expect(calculateTaskCost([workResource, costResource], 5)).toBe(1600);
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
