import { Rickshaw, RickshawType } from './types';

// Yeh sirf "default" / starting rates hain — naya rickshaw/redi/bike/chinchi
// add karte waqt yehi rate se shuru hota hai. Har gari ka apna alag rate
// (Rickshaw ke ✎ ke pass +/- se) baad mein set kiya ja sakta hai, kyunke
// har kisi ka rate same nahi hota (koi 60 deta hai koi 80).
export const RATE_RICKSHAW = 70;   // Rs. per din
export const RATE_REDI = 60;       // Rs. per din
export const RATE_CHINCHI = 70;    // Rs. per din
export const RATE_BIKE = 800;      // Rs. per MAHINA (bike ka hisab monthly hai)

// +/- stepper kitne se badhta/ghatta hai — daily walon ke liye 10, bike
// (monthly) ke liye 100, taake bade rate ko adjust karna aasan rahe.
export const RATE_STEP: Record<RickshawType, number> = {
  rickshaw: 10,
  redi: 10,
  chinchi: 10,
  bike: 100,
};

export function defaultRateFor(type: RickshawType): number {
  switch (type) {
    case 'redi': return RATE_REDI;
    case 'bike': return RATE_BIKE;
    case 'chinchi': return RATE_CHINCHI;
    default: return RATE_RICKSHAW;
  }
}

// Har rickshaw/redi/bike/chinchi ka apna rate ho sakta hai (kabhi 60, kabhi
// 80) — agar us gari par rate set hai to wohi use hota hai, warna type ka
// default rate.
export function rateFor(r: Pick<Rickshaw, 'type'> & { rate?: number }): number {
  if (typeof r.rate === 'number' && r.rate > 0) return r.rate;
  return defaultRateFor(r.type);
}

// Bike ka hisab month se hai, baaki (rickshaw/redi/chinchi) daily hain.
export function isMonthly(type: RickshawType): boolean {
  return type === 'bike';
}

export function unitLabel(type: RickshawType): string {
  return isMonthly(type) ? 'mahina' : 'din';
}

export function unitLabelPlural(type: RickshawType): string {
  return isMonthly(type) ? 'mahine' : 'din';
}

export function typeLabel(type: Rickshaw['type']): string {
  switch (type) {
    case 'redi': return 'Redi';
    case 'bike': return 'Bike';
    case 'chinchi': return 'Chinchi';
    default: return 'Rickshaw';
  }
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

export const MONTH_NAMES_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

export const MONTH_NAMES_FULL = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// Natural numeric sort — "9841" pehle, "10383" baad mein, jaisa original app mein tha.
export function naturalCompare(a: string, b: string): number {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
}