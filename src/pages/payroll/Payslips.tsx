import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import * as payrollApi from '../../api/payroll';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { ErrorMessage } from '../../components/ui/Feedback';
import { PageHeader } from '../../components/ui/PageHeader';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Loading } from '../../components/ui/Spinner';
import { currencyOf, fmtMoney, monthName } from '../../lib/format';

export default function Payslips() {
  const [runId, setRunId] = useState<number | null>(null);
  const runs = useQuery({ queryKey: ['payroll', 'runs', 'all'], queryFn: () => payrollApi.runs() });
  const run = useQuery({ queryKey: ['payroll', 'run', runId], queryFn: () => payrollApi.run(runId!), enabled: runId !== null });
  const pdf = useMutation({ mutationFn: (id: number) => payrollApi.payslipPdf(id) });

  return (
    <>
      <PageHeader title="Payslips" subtitle="Payslips for one payroll run. Each run's payslips are a fixed record once it is processed." />
      <Card className="mb-6">
        <label className="text-sm">
          <span className="mb-1 block font-medium text-slate-700">Payroll run</span>
          <select className="input max-w-md" value={runId ?? ''} onChange={(e) => setRunId(e.target.value ? Number(e.target.value) : null)}>
            <option value="">Select a run…</option>
            {(runs.data ?? []).map((r) => (
              <option key={r.id} value={r.id}>{monthName(r.period)} · {r.entity === 'SA' ? 'Saudi Arabia' : 'Bahrain'} · {r.status.replace('_', ' ')}</option>
            ))}
          </select>
        </label>
      </Card>

      <ErrorMessage error={pdf.error} />
      {runId === null ? null : run.isLoading ? <Loading /> : run.error || !run.data ? <ErrorMessage error={run.error ?? 'Run not found'} /> : (
        <Card>
          <div className="mb-3 flex items-center gap-2 text-sm text-slate-600"><StatusBadge status={run.data.status} /> {run.data.payslips?.length ?? 0} payslips</div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase text-slate-500">
                <tr><th className="py-2">Employee</th><th>Department</th><th className="text-right">Gross</th><th className="text-right">Net</th><th /></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(run.data.payslips ?? []).map((p) => (
                  <tr key={p.id}>
                    <td className="py-2.5"><span className="font-medium text-slate-900">{p.employeeName}</span><p className="text-xs text-slate-500">{p.employeeCode}</p></td>
                    <td>{p.department ?? '-'}</td>
                    <td className="text-right">{fmtMoney(p.grossSalary, currencyOf(run.data!.entity))}</td>
                    <td className="text-right font-medium">{fmtMoney(p.netSalary, currencyOf(run.data!.entity))}</td>
                    <td className="text-right">
                      <Button variant="secondary" className="px-2.5 py-1 text-xs" loading={pdf.isPending && pdf.variables === p.id} onClick={() => pdf.mutate(p.id)}>PDF</Button>
                    </td>
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
