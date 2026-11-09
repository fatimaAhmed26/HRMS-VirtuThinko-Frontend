import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import * as documentsApi from '../../api/documents';
import * as leaveApi from '../../api/leave';
import { DateRangeSection, type Range } from '../../components/leave/DateRangeSection';
import { PolicyCheck, type Check } from '../../components/leave/PolicyCheck';
import { useLeaveSetup } from '../../components/leave/useLeaveSetup';
import { Button } from '../../components/ui/Button';
import { EmptyState, ErrorMessage } from '../../components/ui/Feedback';
import { PageHeader } from '../../components/ui/PageHeader';
import { Loading } from '../../components/ui/Spinner';
import { countDays, daysBetween, noticeText, todayKey } from '../../lib/leave';

// Request leave (design screen 31). The backend checks every rule again when the request is sent.
export default function RequestLeave() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { balances, types, holidays, holidaySet, isLoading, error } = useLeaveSetup();

  // only types the employee is eligible for (the balances list already hides e.g. maternity for men)
  const options = types.filter((t) => balances.some((b) => b.leaveTypeId === t.id));
  const [typeId, setTypeId] = useState<number | null>(null);
  const type = options.find((t) => t.id === typeId) ?? options.find((t) => t.code === (params.get('type') ?? 'ANNUAL')) ?? options[0];
  const balance = balances.find((b) => b.leaveTypeId === type?.id);

  const [range, setRange] = useState<Range>({ start: params.get('start'), end: params.get('end') });
  const [reason, setReason] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const days = type && range.start && range.end ? countDays(range.start, range.end, type.countWorkingDays, holidaySet) : 0;
  const checks: Check[] = [];
  if (type && range.start && range.end) {
    checks.push({ ok: days > 0 ? 'ok' : 'bad', text: days > 0 ? `${days} ${type.countWorkingDays ? 'working' : 'calendar'} day${days === 1 ? '' : 's'}` : 'The selected dates contain no working days' });
    if (type.allowance === 'yearly' && balance?.remaining !== undefined) {
      const left = balance.remaining - days;
      checks.push({ ok: left >= 0 ? 'ok' : 'bad', text: left >= 0 ? `Balance after this request: ${left} days` : `Not enough balance: ${balance.remaining} days left` });
    }
    if (type.allowance === 'per_event' && days > type.days) checks.push({ ok: 'bad', text: `${type.name} is limited to ${type.days} days` });
    if (type.noticeDays && days > type.noticeFreeDays) {
      const notice = daysBetween(todayKey(), range.start);
      checks.push(notice >= type.noticeDays
        ? { ok: 'ok', text: `Notice given: ${notice} days (needs ${type.noticeDays})` }
        : { ok: 'bad', text: `More than ${type.noticeFreeDays} days needs ${type.noticeDays} days' notice; this starts in ${Math.max(notice, 0)} days` });
    }
    if (range.start.slice(0, 4) !== range.end.slice(0, 4)) checks.push({ ok: 'bad', text: 'Split requests that cross into a new year' });
    if (type.requiresAttachment) checks.push({ ok: file ? 'ok' : 'warn', text: file ? 'Supporting document attached' : 'A supporting document is required' });
  }
  const blocked = checks.some((c) => c.ok === 'bad');

  const submit = useMutation({
    mutationFn: async () => {
      let attachmentId: number | undefined;
      if (file) attachmentId = (await documentsApi.upload({ file, category: 'leave_attachment', title: `${type!.name} document` })).id;
      return leaveApi.createRequest({ leaveTypeId: type!.id, startDate: range.start!, endDate: range.end!, reason: reason.trim() || undefined, attachmentId });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leave'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      navigate('/leave/data?submitted=1');
    },
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!range.start || !range.end) return setFormError('Pick a start and an end date');
    if (type?.requiresAttachment && !file) return setFormError('Attach the supporting document');
    if (file && file.size > 5 * 1024 * 1024) return setFormError('The file must be 5 MB or smaller');
    setFormError(null);
    submit.mutate();
  }

  function reset() {
    setRange({ start: null, end: null }); setReason(''); setFile(null); setFormError(null);
  }

  return (
    <>
      <PageHeader title="Request leave" subtitle="Select a leave type and choose a date range. The end date is included." />
      {isLoading && <Loading />}
      <ErrorMessage error={error} />
      {!isLoading && !error && options.length === 0 && <EmptyState title="No leave types available">Your account may not be linked to an employee record.</EmptyState>}

      {type && (
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <label className="label" htmlFor="leaveType">Leave type</label>
            <select id="leaveType" className="input" value={type.id} onChange={(e) => setTypeId(Number(e.target.value))}>
              {options.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            <p className="mt-1.5 text-xs text-slate-500">
              {[noticeText(type), type.description, balance?.remaining !== undefined ? `${balance.remaining} days available` : null].filter(Boolean).join(' · ')}
            </p>
          </div>

          <DateRangeSection value={range} onChange={setRange} holidays={holidays} />

          <PolicyCheck checks={checks} empty="Pick your dates on the calendar." />

          <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
            <div>
              <label className="label" htmlFor="reason">Reason</label>
              <textarea id="reason" className="input min-h-20" placeholder="Optional" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} />
            </div>
            <div>
              <label className="label" htmlFor="leaveFile">Supporting document {type.requiresAttachment ? '(required)' : '(optional)'}</label>
              <input id="leaveFile" type="file" accept=".pdf,.jpg,.jpeg,.png" className="text-sm" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
              <p className="mt-1 text-xs text-slate-500">PDF, JPEG or PNG, up to 5 MB.</p>
            </div>
          </div>

          <ErrorMessage error={formError ?? submit.error} />
          <div className="flex gap-3">
            <Button type="button" variant="secondary" onClick={reset}>Reset</Button>
            <Button type="submit" className="flex-1" loading={submit.isPending} disabled={!range.end || blocked}>Submit {type.name}</Button>
          </div>
        </form>
      )}
    </>
  );
}
