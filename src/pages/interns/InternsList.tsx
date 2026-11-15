import { useQuery } from '@tanstack/react-query';
import clsx from 'clsx';
import dayjs from 'dayjs';
import { GraduationCap } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import * as employeesApi from '../../api/employees';
import { useAuth } from '../../auth/useAuth';
import { Button } from '../../components/ui/Button';
import { Card, StatCard } from '../../components/ui/Card';
import { EmptyState, ErrorMessage } from '../../components/ui/Feedback';
import { PageHeader } from '../../components/ui/PageHeader';
import { Loading } from '../../components/ui/Spinner';
import { fmtDate } from '../../lib/format';
import { P } from '../../lib/permissions';
import type { InternListItem } from '../../types';
import { ChecklistDialog } from './ChecklistDialog';
import { INTERN_DOCS, docApplies } from './internDocs';

type Filter = 'all' | 'starting' | 'active' | 'completed';
const FILTERS: [Filter, string][] = [['all', 'All'], ['starting', 'Starting soon'], ['active', 'Active'], ['completed', 'Completed']];

const missing = (i: InternListItem) => INTERN_DOCS.filter((d) => docApplies(d, i.internType) && !i.documentChecklist?.[d.key]?.received).length;
const daysTo = (date: string) => dayjs(date).startOf('day').diff(dayjs().startOf('day'), 'day');

function status(i: InternListItem): [string, string] {
  if (i.phase === 'unscheduled') return ['No dates', 'bg-slate-100 text-slate-600'];
  if (i.phase === 'completed') return ['Completed', 'bg-slate-100 text-slate-600'];
  if (i.phase === 'starting') {
    const d = daysTo(i.internshipStart!);
    return [`Starts in ${d} day${d === 1 ? '' : 's'}`, 'bg-blue-50 text-blue-700'];
  }
  const left = Math.max(0, daysTo(i.internshipEnd!));
  return left <= 14 ? [`Ends in ${left} day${left === 1 ? '' : 's'}`, 'bg-amber-100 text-amber-800'] : [`Active · ${left} days left`, 'bg-green-50 text-green-700'];
}

export default function InternsList() {
  const { can } = useAuth();
  const [filter, setFilter] = useState<Filter>('all');
  const [checklistId, setChecklistId] = useState<number | null>(null);
  const { data = [], isLoading, error } = useQuery({ queryKey: ['interns'], queryFn: employeesApi.interns });

  const count = (f: Filter) => (f === 'all' ? data.length : data.filter((i) => i.phase === f).length);
  const rows = filter === 'all' ? data : data.filter((i) => i.phase === filter);
  const year = dayjs().year();

  return (
    <>
      <PageHeader
        title="Interns"
        subtitle="Interns have no portal login. HR and the mentor manage documents and the acceptance letter."
        actions={can(P.employeeCreate) && <Link to="/interns/new"><Button><GraduationCap className="h-4 w-4" /> Add intern</Button></Link>}
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active interns" value={count('active')} />
        <StatCard label="Starting soon" value={count('starting')} />
        <StatCard label="Missing documents" value={data.filter((i) => i.phase !== 'completed' && missing(i) > 0).length} />
        <StatCard label="Completed this year" value={data.filter((i) => i.phase === 'completed' && i.internshipEnd && dayjs(i.internshipEnd).year() === year).length} />
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        {FILTERS.map(([f, label]) => (
          <button key={f} type="button" onClick={() => setFilter(f)}
            className={clsx('rounded-full border px-3 py-1 text-xs font-medium', filter === f ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-slate-200 bg-white text-slate-600')}>
            {label} ({count(f)})
          </button>
        ))}
      </div>

      <Card>
        <ErrorMessage error={error} />
        {isLoading && <Loading />}
        {!isLoading && rows.length === 0 && <EmptyState title={data.length ? 'No interns in this group' : 'No interns yet'} />}
        {rows.length > 0 && (
          <div className="overflow-x-auto">
            <table className="table">
              <thead><tr><th>Intern</th><th>Department · mentor</th><th>Period</th><th>Status</th><th>Documents</th><th>Letter</th><th /></tr></thead>
              <tbody>
                {rows.map((i) => {
                  const [label, cls] = status(i);
                  return (
                    <tr key={i.id}>
                      <td>
                        <Link to={`/employees/${i.id}`} className="whitespace-nowrap font-medium text-slate-900 hover:text-brand-600">{i.firstName} {i.lastName}</Link>
                        <p className="text-xs text-slate-500">{[i.major, i.university].filter(Boolean).join(' · ') || i.employeeCode}</p>
                      </td>
                      <td>{i.department?.name ?? '-'}<p className="text-xs text-slate-500">{i.manager ? `Mentor: ${i.manager.firstName} ${i.manager.lastName}` : 'No mentor'}</p></td>
                      <td className="whitespace-nowrap">{i.internshipStart && i.internshipEnd ? <>{fmtDate(i.internshipStart)}<span className="block text-slate-500">to {fmtDate(i.internshipEnd)}</span></> : '-'}</td>
                      <td><span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>{label}</span></td>
                      <td>
                        <span className="flex max-w-36 flex-wrap gap-1">
                          {INTERN_DOCS.filter((d) => docApplies(d, i.internType)).map((d) => (
                            <span key={d.key} className={clsx('rounded px-1.5 py-0.5 text-[11px] font-medium', i.documentChecklist?.[d.key]?.received ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700')}>{d.short}</span>
                          ))}
                        </span>
                      </td>
                      <td><span className={clsx('rounded-full px-2 py-0.5 text-xs font-medium', i.letterSignedAt ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-600')}>{i.letterSignedAt ? 'Signed' : 'Draft'}</span></td>
                      <td>
                        <span className="flex justify-end gap-1.5 whitespace-nowrap">
                          <Button variant="secondary" className="px-2.5 py-1 text-xs" onClick={() => setChecklistId(i.id)}>Checklist</Button>
                          <Link to={`/interns/${i.id}/letter`}><Button variant="secondary" className="px-2.5 py-1 text-xs">Letter</Button></Link>
                          {can(P.employeeEdit) && <Link to={`/interns/${i.id}/edit`}><Button variant="secondary" className="px-2.5 py-1 text-xs">Edit</Button></Link>}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-3 text-xs text-slate-500">
          <span className="rounded bg-green-50 px-1.5 py-0.5 font-medium text-green-700">CV</span> received ·{' '}
          <span className="rounded bg-red-50 px-1.5 py-0.5 font-medium text-red-700">CLP</span> missing
        </p>
      </Card>

      <ChecklistDialog intern={data.find((i) => i.id === checklistId) ?? null} canEdit={can(P.employeeEdit) && can(P.documentUpload)} onClose={() => setChecklistId(null)} />
    </>
  );
}
