import dayjs from 'dayjs';
import type { HrDocument } from '../../types';

// HR is alerted before a document expires; the employee sees the same status
const RENEW_WINDOW_DAYS = 90;

export function expiryStatus(doc: Pick<HrDocument, 'expiryDate'>) {
  if (!doc.expiryDate) return { label: 'On file', tone: 'ok' as const, daysLeft: null };
  const daysLeft = dayjs(doc.expiryDate).startOf('day').diff(dayjs().startOf('day'), 'day');
  if (daysLeft < 0) return { label: 'Expired', tone: 'bad' as const, daysLeft };
  if (daysLeft <= RENEW_WINDOW_DAYS) return { label: 'Renew soon', tone: 'warn' as const, daysLeft };
  return { label: 'Valid', tone: 'ok' as const, daysLeft };
}

export const toneClass = {
  ok: 'bg-green-50 text-green-700',
  warn: 'bg-amber-50 text-amber-700',
  bad: 'bg-red-50 text-red-700',
};
