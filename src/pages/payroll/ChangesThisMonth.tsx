import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import clsx from 'clsx';
import { useState, type FormEvent } from 'react';
import * as employeesApi from '../../api/employees';
import * as payrollApi from '../../api/payroll';
import { useAuth } from '../../auth/useAuth';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { ErrorMessage } from '../../components/ui/Feedback';
import { PageHeader } from '../../components/ui/PageHeader';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Loading } from '../../components/ui/Spinner';
import { fullName } from '../../lib/format';
import { P } from '../../lib/permissions';

type Filter = 'pending' | 'approved' | 'rejected' | '';
const FILTERS: { value: Filter; label: string }[] = [
  { value: 'pending', label: 'Waiting approval' }, { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' }, { value: '', label: 'All' },
];
const thisMonth = () => new Date().toISOString().slice(0, 7);
const blank = { employeeId: '', typeId: '', amount: '', recurring: false, fromPeriod: thisMonth(), toPeriod: '', reason: '' };
type Form = typeof blank;

export default function ChangesThisMonth() {
  const { can } = useAuth();
  const qc = useQueryClient();
  const [filter, setFilter] = useState<Filter>('pending');
  const [form, setForm] = useState<Form>(blank);
  const items = useQuery({ queryKey: ['payroll', 'items', filter], queryFn: () => payrollApi.items(filter ? { status: filter } : {}) });
  const types = useQuery({ queryKey: ['payroll', 'item-types'], queryFn: payrollApi.itemTypes });
  const employees = useQuery({ queryKey: ['employees', 'active-list'], queryFn: () => employeesApi.list({ status: 'active', pageSize: 100 }) });

  const refresh = () => qc.invalidateQueries({ queryKey: ['payroll'] });
  const create = useMutation({
    mutationFn: () => payrollApi.createItem({
      employeeId: Number(form.employeeId),
      typeId: Number(form.typeId),
      amount: Number(form.amount),
      recurring: form.recurring,
      fromPeriod: form.fromPeriod,
      toPeriod: form.recurring && form.toPeriod ? form.toPeriod : undefined,
      reason: form.reason.trim() || undefined,
    }),
    onSuccess: () => { setForm(blank); refresh(); },
  });
  const decide = useMutation({
    mutationFn: ({ id, approve }: { id: number; approve: boolean }) => (approve ? payrollApi.approveItem(id) : payrollApi.rejectItem(id)),
    onSuccess: refresh,
  });
  const remove = useMutation({ mutationFn: (id: number) => payrollApi.deleteItem(id), onSuccess: refresh });

  const set = (k: keyof Form, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }) as Form);
  function submit(e: FormEvent) {
    e.preventDefault();
    create.mutate();
  }

  return (
    <>
      <PageHeader title="Changes this month" subtitle="Allowances, deductions and other changes. Approved changes go into the next payroll run." />

      {can(P.payrollCreate) && (
        <Card title="Add an allowance or deduction" className="mb-6">
          <form onSubmit={submit} className="grid gap-3 md:grid-cols-3">
            <label className="text-sm">
              <span className="mb-1 block font-medium text-slate-700">Employee</span>
              <select className="input" required value={form.employeeId} onChange={(e) => set('employeeId', e.target.value)}>
                <option value="">Select…</option>
                {(employees.data?.items ?? []).map((e) => <option key={e.id} value={e.id}>{e.employeeCode} · {fullName(e)}</option>)}
              </select>
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-medium text-slate-700">Type</span>
              <select className="input" required value={form.typeId} onChange={(e) => set('typeId', e.target.value)}>
                <option value="">Select…</option>
                {(types.data ?? []).map((t) => <option key={t.id} value={t.id}>{t.name} ({t.kind})</option>)}
              </select>
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-medium text-slate-700">Amount</span>
              <input type="number" min="0" step="0.001" className="input" required value={form.amount} onChange={(e) => set('amount', e.target.value)} />
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-medium text-slate-700">From month</span>
              <input type="month" className="input" required value={form.fromPeriod} onChange={(e) => set('fromPeriod', e.target.value)} />
            </label>
            <label className="flex items-center gap-2 pt-6 text-sm">
              <input type="checkbox" checked={form.recurring} onChange={(e) => set('recurring', e.target.checked)} /> Recurring
            </label>
            {form.recurring && (
              <label className="text-sm">
                <span className="mb-1 block font-medium text-slate-700">Until (optional)</span>
                <input type="month" className="input" value={form.toPeriod} onChange={(e) => set('toPeriod', e.target.value)} />
              </label>
            )}
            <label className="text-sm md:col-span-3">
              <span className="mb-1 block font-medium text-slate-700">Reason</span>
              <input className="input" maxLength={255} value={form.reason} onChange={(e) => set('reason', e.target.value)} />
            </label>
            <div className="flex items-center gap-3 md:col-span-3">
              <Button type="submit" loading={create.isPending}>Add to payroll</Button>
              <span className="text-xs text-slate-500">It counts only after it is approved.</span>
            </div>
            <div className="md:col-span-3"><ErrorMessage error={create.error} /></div>
          </form>
        </Card>
      )}

      <div className="mb-3 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.label}
            type="button"
            onClick={() => setFilter(f.value)}
            className={clsx('rounded-full border px-3 py-1 text-xs font-medium',
              filter === f.value ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50')}
          >
            {f.label}
          </button>
        ))}
      </div>
      <div className="mb-3"><ErrorMessage error={decide.error ?? remove.error} /></div>

      {items.isLoading ? <Loading /> : items.error ? <ErrorMessage error={items.error} /> : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase text-slate-500">
                <tr><th className="py-2">Employee</th><th>Item</th><th className="text-right">Amount</th><th>Period</th><th>Reason</th><th>Status</th><th /></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(items.data ?? []).map((i) => (
                  <tr key={i.id}>
                    <td className="py-2.5"><span className="font-medium text-slate-900">{i.employee ? fullName(i.employee) : '-'}</span><p className="text-xs text-slate-500">{i.employee?.employeeCode}</p></td>
                    <td>{i.type?.name ?? '-'}<p className="text-xs text-slate-500">{i.type?.kind}</p></td>
                    <td className={clsx('text-right font-medium', i.type?.kind === 'deduction' ? 'text-red-700' : 'text-green-700')}>
                      {i.type?.kind === 'deduction' ? '−' : '+'}{Number(i.amount).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 3 })}
                    </td>
                    <td className="whitespace-nowrap">{i.recurring ? `${i.fromPeriod} to ${i.toPeriod ?? 'open'}` : i.fromPeriod}</td>
                    <td className="max-w-xs truncate">{i.reason ?? '-'}</td>
                    <td><StatusBadge status={i.status} /></td>
                    <td className="whitespace-nowrap text-right">
                      {i.status === 'pending' && can(P.payrollApprove) && (
                        <span className="flex justify-end gap-1.5">
                          <Button variant="secondary" className="px-2.5 py-1 text-xs" onClick={() => decide.mutate({ id: i.id, approve: true })}>Approve</Button>
                          <Button variant="secondary" className="px-2.5 py-1 text-xs" onClick={() => decide.mutate({ id: i.id, approve: false })}>Reject</Button>
                        </span>
                      )}
                      {i.status === 'pending' && can(P.payrollEdit) && (
                        <Button variant="secondary" className="ml-1.5 px-2.5 py-1 text-xs" onClick={() => remove.mutate(i.id)}>Delete</Button>
                      )}
                    </td>
                  </tr>
                ))}
                {(items.data ?? []).length === 0 && <tr><td colSpan={7} className="py-6 text-center text-slate-500">Nothing here.</td></tr>}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </>
  );
}
