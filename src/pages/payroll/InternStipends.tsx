import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import * as payrollApi from '../../api/payroll';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { ErrorMessage } from '../../components/ui/Feedback';
import { PageHeader } from '../../components/ui/PageHeader';
import { Loading } from '../../components/ui/Spinner';
import { currencyOf, fmtMoney, monthName } from '../../lib/format';
import type { Entity } from '../../types';

const thisMonth = () => new Date().toISOString().slice(0, 7);

export default function InternStipends() {
  const [entity, setEntity] = useState<Entity>('BH');
  const [period, setPeriod] = useState(thisMonth());
  const data = useQuery({
    queryKey: ['payroll', 'stipends', period, entity],
    queryFn: () => payrollApi.stipends(period, entity),
    enabled: /^\d{4}-\d{2}$/.test(period),
  });
  const cur = currencyOf(entity);

  function exportCsv() {
    const rows = data.data?.rows ?? [];
    if (rows.length === 0) return;
    const lines = [
      ['Code', 'Name', 'University', 'Monthly stipend', 'Paid days', 'Amount'],
      ...rows.map((r) => [r.employeeCode, r.name, r.university ?? '', r.monthlyStipend, String(r.paidDays), r.amount]),
    ];
    const csv = lines.map((l) => l.map((c) => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `intern-stipends-${entity}-${period}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <PageHeader title="Intern stipends" subtitle="Paid outside the salary run. Part months are prorated (days / 30). No social insurance." />
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div className="flex gap-2">
          {(['BH', 'SA'] as Entity[]).map((e) => (
            <Button key={e} variant={entity === e ? 'primary' : 'secondary'} onClick={() => setEntity(e)}>
              {e === 'BH' ? 'Bahrain (BHD)' : 'Saudi Arabia (SAR)'}
            </Button>
          ))}
        </div>
        <label className="text-sm">
          <span className="mb-1 block font-medium text-slate-700">Month</span>
          <input type="month" className="input" value={period} onChange={(e) => setPeriod(e.target.value)} />
        </label>
        <Button variant="secondary" onClick={exportCsv} disabled={!data.data?.rows.length}>Export CSV</Button>
      </div>

      {data.isLoading ? <Loading /> : data.error ? <ErrorMessage error={data.error} /> : (
        <Card>
          <p className="mb-3 text-sm text-slate-600">{monthName(period)} · {data.data?.rows.length ?? 0} interns</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase text-slate-500">
                <tr><th className="py-2">Intern</th><th>University</th><th className="text-right">Monthly</th><th className="text-right">Paid days</th><th className="text-right">Amount</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(data.data?.rows ?? []).map((r) => (
                  <tr key={r.employeeId}>
                    <td className="py-2.5"><span className="font-medium text-slate-900">{r.name}</span><p className="text-xs text-slate-500">{r.employeeCode}</p></td>
                    <td>{r.university ?? '-'}</td>
                    <td className="text-right">{fmtMoney(r.monthlyStipend, cur)}</td>
                    <td className="text-right">{r.paidDays}</td>
                    <td className="text-right font-medium">{fmtMoney(r.amount, cur)}</td>
                  </tr>
                ))}
                {(data.data?.rows ?? []).length === 0 && (
                  <tr><td colSpan={5} className="py-6 text-center text-slate-500">No interns with a stipend and internship dates in this month.</td></tr>
                )}
              </tbody>
              {data.data && data.data.rows.length > 0 && (
                <tfoot className="border-t border-slate-200 text-sm font-semibold">
                  <tr><td className="py-2.5" colSpan={4}>Total</td><td className="text-right">{fmtMoney(data.data.total, cur)}</td></tr>
                </tfoot>
              )}
            </table>
          </div>
        </Card>
      )}
    </>
  );
}
