import { useQuery } from '@tanstack/react-query';
import * as leaveApi from '../../api/leave';
import { useLeaveSetup } from '../../components/leave/useLeaveSetup';
import { Card } from '../../components/ui/Card';
import { PageHeader } from '../../components/ui/PageHeader';
import type { LeaveType } from '../../types';

const STEPS = [
  { who: 'Employee', title: 'Submits request', text: 'Picks the type and dates on the calendar and attaches a document when required.' },
  { who: 'System', title: 'Checks policy', text: 'Balance, notice period, eligibility, public holidays and overlapping requests.' },
  { who: 'Line manager', title: 'Approves', text: 'Notified straight away; approves or rejects with a comment.' },
  { who: 'HR', title: 'Final approval', text: 'Gives the final decision and checks supporting documents.' },
  { who: 'System', title: 'Updates records', text: 'Deducts the balance, adds the leave to the company calendar and notifies the employee.' },
  { who: 'Payroll', title: 'Salary effect', text: "Half-paid and unpaid days are deducted in that month's payroll." },
];

// Classify each leave type by what it does to salary
function group(types: LeaveType[]) {
  const paid: string[] = [], partial: string[] = [], unpaid: string[] = [];
  for (const t of types) {
    const tiers = t.payTiers ?? [];
    if (tiers.length === 0 || tiers.every((x) => x.payPercent === 100)) paid.push(t.name);
    else if (tiers.every((x) => x.payPercent === 0)) unpaid.push(t.name);
    else partial.push(`${t.name} (${tiers.map((x) => `${x.days}d at ${x.payPercent}%`).join(', ')})`);
  }
  return { paid, partial, unpaid };
}

// How leave works (design screen 38)
export default function HowLeaveWorks() {
  const { country } = useLeaveSetup();
  const c = country ?? 'BH';
  const { data = [] } = useQuery({ queryKey: ['leave', 'types', c], queryFn: () => leaveApi.types(c) });
  const g = group(data);

  return (
    <>
      <PageHeader title="How leave works" subtitle="From request to payroll" />
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {STEPS.map((s, i) => (
          <div key={s.title} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-2 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-600 text-xs font-semibold text-white">{i + 1}</span>
              <span className="text-xs text-slate-500">{s.who}</span>
            </div>
            <p className="text-sm font-semibold">{s.title}</p>
            <p className="mt-1 text-xs text-slate-600">{s.text}</p>
          </div>
        ))}
      </div>
      <Card title={`Effect on payroll (${c === 'BH' ? 'Bahrain' : 'Saudi'} rules)`}>
        <ul className="space-y-2 text-sm">
          <li><span className="mr-2 rounded bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">Paid</span>{g.paid.join(', ') || '-'}</li>
          <li><span className="mr-2 rounded bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">Part paid</span>{g.partial.join('; ') || '-'}</li>
          <li><span className="mr-2 rounded bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">Unpaid</span>{g.unpaid.join(', ') || '-'} (the daily rate is deducted)</li>
        </ul>
      </Card>
    </>
  );
}
