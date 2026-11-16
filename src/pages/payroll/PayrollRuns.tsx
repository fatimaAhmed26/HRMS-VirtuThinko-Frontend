import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as payrollApi from '../../api/payroll';
import { useAuth } from '../../auth/useAuth';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { ErrorMessage } from '../../components/ui/Feedback';
import { PageHeader } from '../../components/ui/PageHeader';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Loading } from '../../components/ui/Spinner';
import { currencyOf, fmtDate, fmtMoney, monthName } from '../../lib/format';
import { P } from '../../lib/permissions';
import type { Entity } from '../../types';

const thisMonth = () => new Date().toISOString().slice(0, 7);

export default function PayrollRuns() {
  const { can } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [entity, setEntity] = useState<Entity>('BH');
  const [period, setPeriod] = useState(thisMonth());
  const runs = useQuery({ queryKey: ['payroll', 'runs', entity], queryFn: () => payrollApi.runs({ entity }) });
  const create = useMutation({
    mutationFn: () => payrollApi.createRun(period, entity),
    onSuccess: (run) => {
      qc.invalidateQueries({ queryKey: ['payroll'] });
      navigate(`/payroll/runs/${run.id}`);
    },
  });

  function submit(e: FormEvent) {
    e.preventDefault();
    create.mutate();
  }

  return (
    <>
      <PageHeader title="Payroll run" subtitle="Bahrain and Saudi Arabia run separately. Only employees with an active contract are included." />
      <div className="mb-4 flex gap-2">
        {(['BH', 'SA'] as Entity[]).map((e) => (
          <Button key={e} variant={entity === e ? 'primary' : 'secondary'} onClick={() => setEntity(e)}>
            {e === 'BH' ? 'Bahrain (BHD)' : 'Saudi Arabia (SAR)'}
          </Button>
        ))}
      </div>
      {can(P.payrollCreate) && (
        <Card title="Prepare a new run" className="mb-6">
          <form onSubmit={submit} className="flex flex-wrap items-end gap-3">
            <label className="text-sm">
              <span className="mb-1 block font-medium text-slate-700">Month</span>
              <input type="month" className="input" value={period} onChange={(e) => setPeriod(e.target.value)} required />
            </label>
            <Button type="submit" loading={create.isPending}>Prepare run</Button>
          </form>
          <div className="mt-3"><ErrorMessage error={create.error} /></div>
        </Card>
      )}
      {runs.isLoading ? <Loading /> : runs.error ? <ErrorMessage error={runs.error} /> : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase text-slate-500">
                <tr><th className="py-2">Month</th><th>Status</th><th>Employees</th><th className="text-right">Net pay</th><th>Prepared</th><th /></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(runs.data ?? []).map((r) => {
                  const t = r.totals?.[0];
                  return (
                    <tr key={r.id}>
                      <td className="py-2.5 font-medium text-slate-900">{monthName(r.period)}</td>
                      <td><StatusBadge status={r.status} /></td>
                      <td>{t?.employees ?? 0}</td>
                      <td className="text-right">{fmtMoney(t?.net, currencyOf(r.entity))}</td>
                      <td>{fmtDate(r.createdAt)}</td>
                      <td className="text-right"><Link to={`/payroll/runs/${r.id}`} className="text-brand-600 hover:underline">Open</Link></td>
                    </tr>
                  );
                })}
                {(runs.data ?? []).length === 0 && (
                  <tr><td colSpan={6} className="py-6 text-center text-slate-500">No payroll runs for {entity === 'BH' ? 'Bahrain' : 'Saudi Arabia'} yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </>
  );
}
