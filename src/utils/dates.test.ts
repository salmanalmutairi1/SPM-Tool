import { describe, expect, it } from 'vitest';
import { calculateDurationFromDates, getCalculatedTaskDuration } from './dates';
import type { Task } from '../types';

describe('calculateDurationFromDates', () => {
  it('calculates inclusive project duration from DD/MM/YYYY dates', () => {
    expect(calculateDurationFromDates('10/11/2023', '14/11/2023')).toEqual({
      ok: true,
      duration: 5,
      startDate: '10/11/2023',
      finishDate: '14/11/2023',
    });
  });

  it('returns one day when start and finish are the same day', () => {
    expect(calculateDurationFromDates('01/01/2024', '01/01/2024')).toMatchObject({
      ok: true,
      duration: 1,
    });
  });

  it('normalizes single digit day and month input', () => {
    expect(calculateDurationFromDates('1/1/2024', '2/1/2024')).toEqual({
      ok: true,
      duration: 2,
      startDate: '01/01/2024',
      finishDate: '02/01/2024',
    });
  });

  it('rejects invalid calendar dates', () => {
    expect(calculateDurationFromDates('31/02/2024', '02/03/2024')).toMatchObject({
      ok: false,
    });
  });

  it('rejects finish dates before start dates', () => {
    expect(calculateDurationFromDates('10/11/2023', '09/11/2023')).toEqual({
      ok: false,
      message: 'Finish Date must be on or after Start Date.',
    });
  });
});

describe('getCalculatedTaskDuration', () => {
  it('uses calculated duration before stored duration', () => {
    const task: Task = {
      id: 1,
      name: 'Gather Requirements',
      duration: 6,
      start_date: '15/11/2023',
      finish_date: '21/11/2023',
    };

    expect(getCalculatedTaskDuration(task)).toBe(7);
  });

  it('falls back to stored duration when legacy saved dates are invalid', () => {
    const task: Task = {
      id: 1,
      name: 'Legacy',
      duration: 4,
      start_date: 'bad',
      finish_date: 'date',
    };

    expect(getCalculatedTaskDuration(task)).toBe(4);
  });
});
