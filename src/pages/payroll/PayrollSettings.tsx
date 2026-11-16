import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import clsx from 'clsx';
import { useState, type FormEvent } from 'react';
import * as payrollApi from '../../api/payroll';
import { useAuth } from '../../auth/useAuth';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { ErrorMessage } from '../../components/ui/Feedback';
import { PageHeader } from '../../components/ui/PageHeader';
import { Loading } from '../../components/ui/Spinner';
import { P } from '../../lib/permissions';

const blank = { code: '', name: '', kind: 'earning' as 'earning' | 'deduction', contributory: false };

export default function PayrollSettings() {
  const { can } = useAuth();
  const qc = useQueryClient();
  const [form, setForm] = useState(blank);
  const types = useQuery({ queryKey: ['payroll', 'item-types'], queryFn: payrollApi.itemTypes });
  const create = useMutation({
    mutationFn: () => payrollApi.createItemType({ code: form.code.trim().toUpperCase(), name: form.name.trim(), kind: form.kind, contributory: form.contributory }),
    onSuccess: () => { setForm(blank); qc.invalidateQueries({ queryKey: ['payroll', 'item-types'] }); },
  });

  function submit(e: FormEvent) {
    e.preventDefault();
    create.mutate();
  }

  return (
    <>
      <PageHeader title="Payroll settings" subtitle="Allowance and deduction types that can be used in payroll." />
      {can(P.payrollEdit) && (
        <Card title="Add a type" className="mb-6">
          <form onSubmit={submit} className="grid gap-3 md:grid-cols-4">
            <label className="text-sm">
              <span className="mb-1 block font-medium text-slate-700">Code</span>
              <input className="input uppercase" required maxLength={30} placeholder="HOUSING" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
            </label>
            <label className="text-sm md:col-span-2">
              <span className="mb-1 block font-medium text-slate-700">Name</span>
              <input className="input" required maxLength={100} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-medium text-slate-700">Kind</span>
              <select className="input" value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value as 'earning' | 'deduction' })}>
                <option value="earning">Earning (adds)</option>
                <option value="deduction">Deduction (takes off)</option>
              </select>
            </label>
            <label className="flex items-center gap-2 pt-6 text-sm md:col-span-2">
              <input type="checkbox" checked={form.contributory} onChange={(e) => setForm({ ...form, contributory: e.target.checked })} />
              Counts toward social insurance
            </label>
            <div className="flex items-center md:col-span-4"><Button type="submit" loading={create.isPending}>Add type</Button></div>
            <div className="md:col-span-4"><ErrorMessage error={create.error} /></div>
          </form>
        </Card>
      )}
      {types.isLoading ? <Loading /> : types.error ? <ErrorMessage error={types.error} /> : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase text-slate-500">
                <tr><th className="py-2">Code</th><th>Name</th><th>Kind</th><th>Social insurance</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(types.data ?? []).map((t) => (
                  <tr key={t.id}>
                    <td className="py-2.5 font-mono text-xs">{t.code}</td>
                    <td>{t.name}</td>
                    <td><span className={clsx('rounded-full px-2 py-0.5 text-xs font-medium', t.kind === 'earning' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700')}>{t.kind}</span></td>
                    <td>{t.contributory ? 'Yes' : 'No'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </>
  );
}
