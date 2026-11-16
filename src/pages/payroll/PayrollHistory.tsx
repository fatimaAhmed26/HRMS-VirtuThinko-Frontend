import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import * as payrollApi from '../../api/payroll';
import { Card } from '../../components/ui/Card';
import { ErrorMessage } from '../../components/ui/Feedback';
import { PageHeader } from '../../components/ui/PageHeader';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Loading } from '../../components/ui/Spinner';
import { currencyOf, fmtDate, fmtMoney, monthName } from '../../lib/format';

export default function PayrollHistory() {
  const runs = useQuery({ queryKey: ['payroll', 'runs', 'all'], queryFn: () => payrollApi.runs() });
  const sorted = [...(runs.data ?? [])].sort((a, b) => b.period.localeCompare(a.period) || a.entity.localeCompare(b.entity));

  return (
    <>
      <PageHeader title="Payroll history" subtitle="Every payroll run, newest first. Paid runs are kept as they were paid." />
      {runs.isLoading ? <Loading /> : runs.error ? <ErrorMessage error={runs.error} /> : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase text-slate-500">
                <tr><th className="py-2">Month</th><th>Entity</th><th>Status</th><th>Employees</th><th className="text-right">Net pay</th><th>Paid on</th><th /></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sorted.map((r) => {
                  const t = r.totals?.[0];
                  return (
                    <tr key={r.id}>
                      <td className="py-2.5 font-medium text-slate-900">{monthName(r.period)}</td>
                      <td>{r.entity}</td>
                      <td><StatusBadge status={r.status} /></td>
                      <td>{t?.employees ?? 0}</td>
                      <td className="text-right">{fmtMoney(t?.net, currencyOf(r.entity))}</td>
                      <td>{fmtDate(r.paidAt)}</td>
                      <td className="text-right"><Link to={`/payroll/runs/${r.id}`} className="text-brand-600 hover:underline">Open</Link></td>
                    </tr>
                  );
                })}
                {sorted.length === 0 && <tr><td colSpan={7} className="py-6 text-center text-slate-500">No payroll runs yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </>
  );
}
