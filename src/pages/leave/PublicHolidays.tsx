import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import clsx from 'clsx';
import { Trash2 } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import * as leaveApi from '../../api/leave';
import { useAuth } from '../../auth/useAuth';
import { CountryTabs } from '../../components/leave/CountryTabs';
import { useLeaveSetup } from '../../components/leave/useLeaveSetup';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EmptyState, ErrorMessage } from '../../components/ui/Feedback';
import { PageHeader } from '../../components/ui/PageHeader';
import { Loading } from '../../components/ui/Spinner';
import { fmtDate } from '../../lib/format';
import { addDays, groupHolidays } from '../../lib/leave';
import { P } from '../../lib/permissions';
import type { Entity } from '../../types';

const DOTS = ['bg-red-500', 'bg-green-500', 'bg-amber-500', 'bg-blue-500', 'bg-violet-500', 'bg-pink-500', 'bg-teal-500', 'bg-orange-500'];
const THIS_YEAR = new Date().getFullYear();

// Public holidays (design screen 34): one list per office
export default function PublicHolidays() {
  const { can } = useAuth();
  const { country: myCountry } = useLeaveSetup();
  const [picked, setPicked] = useState<Entity | null>(null);
  const country = picked ?? myCountry ?? 'BH';
  const [year, setYear] = useState(THIS_YEAR);
  const { data = [], isLoading, error } = useQuery({ queryKey: ['leave', 'holidays', country, year], queryFn: () => leaveApi.holidays({ country, year }) });
  const qc = useQueryClient();
  const remove = useMutation({
    mutationFn: async (ids: number[]) => { for (const id of ids) await leaveApi.deleteHoliday(id); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['leave', 'holidays'] }),
  });
  const ranges = groupHolidays(data);

  return (
    <>
      <PageHeader title="Public holidays" subtitle="Holidays are skipped when working-day leave is counted." />
      <div className="max-w-2xl">
        <CountryTabs value={country} onChange={setPicked} />
        <div className="mb-4 flex gap-2">
          {[THIS_YEAR, THIS_YEAR + 1].map((y) => (
            <button key={y} onClick={() => setYear(y)} className={clsx('rounded-lg px-3 py-1 text-sm font-medium', year === y ? 'bg-brand-600 text-white' : 'border border-slate-200 bg-white text-slate-600')}>{y}</button>
          ))}
        </div>
        <Card>
          {isLoading && <Loading />}
          <ErrorMessage error={error ?? remove.error} />
          {!isLoading && ranges.length === 0 && <EmptyState title={`No holidays added for ${year} yet`} />}
          <ul className="space-y-2">
            {ranges.map((h, i) => (
              <li key={h.start} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2">
                <span className="flex items-center gap-3">
                  <span className={`h-2.5 w-2.5 rounded-full ${DOTS[i % DOTS.length]}`} />
                  <span>
                    <span className="block text-sm font-medium">{h.name}</span>
                    <span className="block text-xs text-slate-500">{h.start === h.end ? fmtDate(h.start) : `${fmtDate(h.start)} – ${fmtDate(h.end)}`}</span>
                  </span>
                </span>
                {can(P.leaveManage) && (
                  <Button variant="ghost" className="px-2 py-1" onClick={() => remove.mutate(h.ids)} aria-label={`Delete ${h.name}`}><Trash2 className="h-4 w-4" /></Button>
                )}
              </li>
            ))}
          </ul>
        </Card>
        {can(P.leaveManage) && <AddHoliday country={country} />}
      </div>
    </>
  );
}

function AddHoliday({ country }: { country: Entity }) {
  const qc = useQueryClient();
  const [name, setName] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const add = useMutation({
    mutationFn: async () => {
      for (let k = start; k <= (end || start); k = addDays(k, 1)) await leaveApi.addHoliday({ country, date: k, name: name.trim() });
    },
    onSuccess: () => { setName(''); setStart(''); setEnd(''); qc.invalidateQueries({ queryKey: ['leave', 'holidays'] }); },
  });
  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || !start) return setFormError('Enter a name and a date');
    if (end && end < start) return setFormError('The last day must be on or after the first day');
    setFormError(null);
    add.mutate();
  }
  return (
    <Card title={`Add a holiday (${country === 'BH' ? 'Bahrain' : 'Saudi'} office)`} className="mt-6">
      <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-4">
        <input className="input sm:col-span-2" placeholder="e.g. Eid Al Fitr" value={name} onChange={(e) => setName(e.target.value)} maxLength={100} aria-label="Holiday name" />
        <input type="date" className="input" value={start} onChange={(e) => setStart(e.target.value)} aria-label="First day" />
        <input type="date" className="input" value={end} min={start} onChange={(e) => setEnd(e.target.value)} aria-label="Last day (optional)" />
        <div className="sm:col-span-4"><ErrorMessage error={formError ?? add.error} /></div>
        <div className="sm:col-span-4"><Button type="submit" loading={add.isPending}>Add holiday</Button></div>
      </form>
    </Card>
  );
}
