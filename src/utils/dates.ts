import type { Task } from '../types';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export type DurationResult =
  | { ok: true; duration: number; startDate: string; finishDate: string }
  | { ok: false; message: string };

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

function parseProjectDate(value: string): { ok: true; date: Date; normalized: string } | { ok: false; message: string } {
  const trimmed = value.trim();
  if (!trimmed) {
    return { ok: false, message: 'Start Date and Finish Date are required.' };
  }

  const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(trimmed);
  if (!match) {
    return { ok: false, message: 'Use date format DD/MM/YYYY.' };
  }

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return { ok: false, message: 'Enter a valid calendar date.' };
  }

  return {
    ok: true,
    date,
    normalized: `${pad2(day)}/${pad2(month)}/${year}`,
  };
}

export function calculateDurationFromDates(startDate: string, finishDate: string): DurationResult {
  const start = parseProjectDate(startDate);
  const finish = parseProjectDate(finishDate);

  if (!start.ok) return { ok: false, message: `Start Date: ${start.message}` };
  if (!finish.ok) return { ok: false, message: `Finish Date: ${finish.message}` };
  if (finish.date.getTime() < start.date.getTime()) {
    return { ok: false, message: 'Finish Date must be on or after Start Date.' };
  }

  return {
    ok: true,
    duration: Math.floor((finish.date.getTime() - start.date.getTime()) / MS_PER_DAY) + 1,
    startDate: start.normalized,
    finishDate: finish.normalized,
  };
}

export function getCalculatedTaskDuration(task: Pick<Task, 'duration' | 'start_date' | 'finish_date'>): number {
  const result = calculateDurationFromDates(task.start_date, task.finish_date);
  return result.ok ? result.duration : Math.max(1, task.duration);
}

export function formatTaskDuration(task: Pick<Task, 'duration' | 'start_date' | 'finish_date'>): string {
  return `${getCalculatedTaskDuration(task)} days`;
}
