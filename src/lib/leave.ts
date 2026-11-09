import dayjs from 'dayjs';
// Leave helpers shared by the leave screens. Day counting matches the backend (leave.rules.ts).
import type { LeaveType, PublicHoliday } from '../types';

const WEEKEND = [5, 6]; // Friday, Saturday (Bahrain and Saudi)

// Dates travel as "YYYY-MM-DD"; the API sends "2026-11-20T00:00:00.000Z", so the first 10 characters are the date
export const dateKey = (d: string | Date) => (typeof d === 'string' ? d.slice(0, 10) : d.toISOString().slice(0, 10));
const utc = (key: string) => new Date(key + 'T00:00:00Z');
const weekday = (key: string) => utc(key).getUTCDay();
export const isWeekend = (key: string) => WEEKEND.includes(weekday(key));

export function addDays(key: string, n: number) {
  const d = utc(key);
  d.setUTCDate(d.getUTCDate() + n);
  return dateKey(d);
}

export const todayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const daysBetween = (a: string, b: string) => Math.round((utc(b).getTime() - utc(a).getTime()) / 86_400_000);

// Leave days between two dates, inclusive. Working-day types skip Fri/Sat and public holidays.
export function countDays(start: string, end: string, workingDaysOnly: boolean, holidays: Set<string>) {
  let count = 0;
  for (let k = start; k <= end; k = addDays(k, 1)) {
    if (workingDaysOnly && (isWeekend(k) || holidays.has(k))) continue;
    count++;
  }
  return count;
}

export const inRange = (key: string, start: string, end: string) => key >= dateKey(start) && key <= dateKey(end);

// Colour per leave type (dot / chip on calendars and lists)
const TYPE_COLOR: Record<string, string> = {
  ANNUAL: 'bg-blue-100 text-blue-800 border-blue-200',
  SICK: 'bg-amber-100 text-amber-800 border-amber-200',
  MATERNITY: 'bg-pink-100 text-pink-800 border-pink-200',
  PATERNITY: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  MARRIAGE: 'bg-purple-100 text-purple-800 border-purple-200',
  BEREAVEMENT: 'bg-slate-200 text-slate-700 border-slate-300',
  IDDAH: 'bg-violet-100 text-violet-800 border-violet-200',
  HAJJ: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  EXAM: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  UNPAID: 'bg-gray-100 text-gray-700 border-gray-200',
  PRIVATE: 'bg-slate-100 text-slate-700 border-slate-200',
};
export const typeColor = (code: string) => TYPE_COLOR[code] ?? 'bg-slate-100 text-slate-700 border-slate-200';


// The backend stores one row per holiday day; group consecutive days with the same name
export interface HolidayRange {
  name: string;
  start: string;
  end: string;
  ids: number[];
}
export function groupHolidays(rows: PublicHoliday[]): HolidayRange[] {
  const sorted = [...rows].sort((a, b) => a.date.localeCompare(b.date));
  const out: HolidayRange[] = [];
  for (const h of sorted) {
    const key = dateKey(h.date);
    const last = out[out.length - 1];
    if (last && last.name === h.name && addDays(last.end, 1) === key) {
      last.end = key;
      last.ids.push(h.id);
    } else out.push({ name: h.name, start: key, end: key, ids: [h.id] });
  }
  return out;
}

// What the pay tiers mean for payroll: "Paid", "Half pay", "Unpaid" or a mix
export function payLabel(t: Pick<LeaveType, 'payTiers'>) {
  const tiers = t.payTiers ?? [];
  if (tiers.length === 0) return 'Paid';
  return tiers.map((x) => `${x.days} days ${x.payPercent === 100 ? 'full pay' : x.payPercent === 0 ? 'unpaid' : `${x.payPercent}% pay`}`).join(', ');
}

export function entitlementText(t: LeaveType) {
  if (t.allowance === 'per_event') return `${t.days} days per event`;
  const after = t.daysAfterYears && t.daysAfter ? ` (${t.daysAfter} after ${t.daysAfterYears} years)` : '';
  return `${t.days} days a year${after}`;
}

export function noticeText(t: Pick<LeaveType, 'noticeDays' | 'noticeFreeDays'>) {
  if (!t.noticeDays) return null;
  return `${t.noticeFreeDays} days or less anytime; longer requests need ${t.noticeDays} days' notice`;
}

// First and last date shown in the grid for a month (full weeks, Sunday first)
export function gridRange(month: string /* "2026-11" */) {
  const first = `${month}-01`;
  const start = addDays(first, -dayjs(first).day());
  const last = dayjs(first).endOf('month').format('YYYY-MM-DD');
  const end = addDays(last, 6 - dayjs(last).day());
  return { start, end };
}
