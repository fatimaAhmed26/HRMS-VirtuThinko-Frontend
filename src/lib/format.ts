import dayjs from 'dayjs';

export const fmtDate = (d?: string | Date | null) => (d ? dayjs(d).format('DD MMM YYYY') : '-');
export const fmtDateTime = (d?: string | Date | null) => (d ? dayjs(d).format('DD MMM YYYY, HH:mm') : '-');

// BHD has 3 decimal places, SAR has 2
export function fmtMoney(amount: number | string | null | undefined, currency = 'BHD') {
  if (amount === null || amount === undefined || amount === '') return '-';
  const digits = currency === 'BHD' ? 3 : 2;
  return `${Number(amount).toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits })} ${currency}`;
}

export const fullName = (p?: { firstName: string; lastName: string } | null) => (p ? `${p.firstName} ${p.lastName}` : '-');

export const COUNTRY_NAMES: Record<string, string> = { BH: 'Bahrain', SA: 'Saudi Arabia', ALL: 'All entities' };

// "pending_manager" -> "Pending manager"
export const humanize = (s: string) => (s.charAt(0).toUpperCase() + s.slice(1)).replace(/_/g, ' ');
export const yesNo = (v: boolean | null | undefined) => (v === true ? 'Yes' : v === false ? 'No' : null);
