import { Rickshaw } from './types';

export const RATE_RICKSHAW = 70; // Rs. per day
export const RATE_REDI = 60;     // Rs. per day

export function rateFor(r: Pick<Rickshaw, 'type'>): number {
  return r.type === 'redi' ? RATE_REDI : RATE_RICKSHAW;
}

// "Din" 2 baje raat ko badalta hai, midnight par nahi —
// isliye raat 12 se 2 baje tak pichla din hi mana jayega.
export function cycleDate(d: Date): Date {
  const dt = new Date(d);
  if (dt.getHours() < 2) {
    dt.setDate(dt.getDate() - 1);
  }
  dt.setHours(0, 0, 0, 0);
  return dt;
}

export function cycleDateStr(d: Date): string {
  const dt = cycleDate(d);
  return (
    dt.getFullYear() +
    '-' +
    String(dt.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(dt.getDate()).padStart(2, '0')
  );
}

export function addDaysStr(dateStr: string, days: number): string {
  const dt = new Date(dateStr + 'T00:00:00');
  dt.setDate(dt.getDate() + days);
  return (
    dt.getFullYear() +
    '-' +
    String(dt.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(dt.getDate()).padStart(2, '0')
  );
}

export function daysBetween(fromStr: string, toStr: string): number {
  const from = new Date(fromStr + 'T00:00:00');
  const to = new Date(toStr + 'T00:00:00');
  return Math.round((to.getTime() - from.getTime()) / 86400000);
}

export function formatHistoryDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

// Natural numeric sort — "9841" pehle, "10383" baad mein, jaisa original app mein tha.
export function naturalCompare(a: string, b: string): number {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
}
