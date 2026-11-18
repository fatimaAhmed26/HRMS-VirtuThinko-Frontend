import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import * as payrollApi from '../../api/payroll';
import type { RunAction } from '../../api/payroll';
import { useAuth } from '../../auth/useAuth';
import { Button } from '../../components/ui/Button';
import { Card, StatCard } from '../../components/ui/Card';
import { ErrorMessage } from '../../components/ui/Feedback';
import { PageHeader } from '../../components/ui/PageHeader';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Loading } from '../../components/ui/Spinner';
import { currencyOf, fmtDateTime, fmtMoney, monthName } from '../../lib/format';
import { P, type Permission } from '../../lib/permissions';
import type { PayrollStatus } from '../../types';

// the buttons offered at each stage; the server enforces the same rules
const NEXT: Record<PayrollStatus, { action: RunAction; label: string; secondary?: boolean }[]> = {
  draft: [{ action: 'submit', label: 'Submit for review' }],
  under_review: [{ action: 'approve', label: 'Approve' }, { action: 'return', label: 'Return to draft', secondary: true }],
  approved: [{ action: 'process', label: 'Process payroll' }, { action: 'return', label: 'Return to draft', secondary: true }],
  processed: [{ action: 'pay', label: 'Mark as paid' }],
  paid: [],
};

const PERM: Record<RunAction, Permission> = {
  submit: P.payrollEdit, approve: P.payrollApprove, return: P.payrollApprove, process: P.payrollProcess, pay: P.payrollProcess,
};

const GROUP_LABEL: Record<string, string> = { salary: 'Salary & allowances', addition: 'Additions', total: 'Totals', deduction: 'Deductions' };
const GROUP_CLS: Record<string, string> = { salary: 'bg-slate-600', addition: 'bg-green-700', total: 'bg-slate-900', deduction: 'bg-red-700' };

// consecutive columns of the same group share one header cell
function groupRuns(columns: payrollApi.SheetColumn[]) {
  const out: { group: string; span: number }[] = [];
  for (const c of columns) {
    const last = out[out.length - 1];
    if (last && last.group === c.group) last.span++;
    else out.push({ group: c.group, span: 1 });
  }
  return out;
}

export default function PayrollRunDetail() {
  const { can } = useAuth();
  const id = Number(useParams().id);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const run = useQuery({ queryKey: ['payroll', 'run', id], queryFn: () => payrollApi.run(id), enabled: id > 0 });
  const refresh = () => qc.invalidateQueries({ queryKey: ['payroll'] });
  const act = useMutation({ mutationFn: (a: RunAction) => payrollApi.transition(id, a), onSuccess: refresh });
  const recalc = useMutation({ mutationFn: () => payrollApi.recalculate(id), onSuccess: refresh });
  const remove = useMutation({
    mutationFn: () => payrollApi.deleteRun(id),
    onSuccess: () => { refresh(); navigate('/payroll'); },
  });
  const bank = useMutation({ mutationFn: () => payrollApi.bankFile(id) });
  const pdf = useMutation({ mutationFn: (payslipId: number) => payrollApi.payslipPdf(payslipId) });
  const sheet = useQuery({ queryKey: ['payroll', 'sheet', id], queryFn: () => payrollApi.sheet(id), enabled: id > 0 });
  const excel = useMutation({ mutationFn: () => payrollApi.sheetExcel(id) });

  if (run.isLoading) return <Loading />;
  if (run.error || !run.data) return <ErrorMessage error={run.error ?? 'Payroll run not found'} />;

  const r = run.data;
  const t = r.totals?.[0];
  const cur = currencyOf(r.entity);
  const error = act.error ?? recalc.error ?? remove.error ?? bank.error ?? pdf.error ?? excel.error;
  const sheetData = sheet.data;
  const dp = sheetData?.currency === 'SAR' ? 2 : 3;
  const amt = (v: string) => (Number(v) === 0 ? '—' : Number(v).toLocaleString('en-US', { minimumFractionDigits: dp, maximumFractionDigits: dp }));
  const busy = act.isPending || recalc.isPending || remove.isPending;

  return (
    <>
      <PageHeader title={`Payroll · ${monthName(r.period)}`} subtitle={r.entity === 'SA' ? 'Saudi Arabia' : 'Bahrain'} />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <StatusBadge status={r.status} />
        {can(P.payrollEdit) && r.status === 'draft' && (
          <Button variant="secondary" loading={recalc.isPending} disabled={busy} onClick={() => recalc.mutate()}>Recalculate</Button>
        )}
        {NEXT[r.status].filter((a) => can(PERM[a.action])).map((a) => (
          <Button
            key={a.action}
            variant={a.secondary ? 'secondary' : 'primary'}
            loading={act.isPending && act.variables === a.action}
            disabled={busy}
            onClick={() => act.mutate(a.action)}
          >
            {a.label}
          </Button>
        ))}
        {(r.status === 'processed' || r.status === 'paid') && can(P.payrollProcess) && (
          <Button variant="secondary" loading={bank.isPending} onClick={() => bank.mutate()}>Bank file</Button>
        )}
        <Button variant="secondary" loading={excel.isPending} onClick={() => excel.mutate()}>Export Excel</Button>
        {r.status === 'draft' && can(P.payrollEdit) && (
          <Button variant="secondary" className="text-red-700" disabled={busy} onClick={() => { if (window.confirm('Delete this draft payroll run?')) remove.mutate(); }}>
            Delete draft
          </Button>
        )}
      </div>
      <div className="mb-4"><ErrorMessage error={error} /></div>

      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard label="Employees" value={t?.employees ?? 0} />
        <StatCard label="Gross" value={fmtMoney(t?.gross, cur)} />
        <StatCard label="Deductions" value={fmtMoney(t?.deductions, cur)} />
        <StatCard label="Net pay" value={fmtMoney(t?.net, cur)} />
      </div>
      <p className="mt-3 text-xs text-slate-500">
        Approved {fmtDateTime(r.approvedAt)} · Processed {fmtDateTime(r.processedAt)} · Paid {fmtDateTime(r.paidAt)}
      </p>

      {r.warnings && r.warnings.length > 0 && (
        <Card title="Needs review" className="mt-6">
          <ul className="divide-y divide-slate-100 text-sm">
            {r.warnings.map((w, i) => (
              <li key={i} className="py-2">
                <span className="font-medium text-slate-900">{w.employee ?? 'Employee'}</span> · {w.message}
                {w.skipped && <span className="ml-2 text-xs text-red-700">left out of this run</span>}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card title="Payslips" className="mt-6">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-slate-500">
              <tr><th className="py-2">Employee</th><th>Department</th><th className="text-right">Gross</th><th className="text-right">Deductions</th><th className="text-right">Net</th><th /></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(r.payslips ?? []).map((p) => (
                <tr key={p.id}>
                  <td className="py-2.5"><span className="font-medium text-slate-900">{p.employeeName}</span><p className="text-xs text-slate-500">{p.employeeCode}</p></td>
                  <td>{p.department ?? '-'}</td>
                  <td className="text-right">{fmtMoney(p.grossSalary, p.currency)}</td>
                  <td className="text-right">{fmtMoney(p.totalDeductions, p.currency)}</td>
                  <td className="text-right font-medium">{fmtMoney(p.netSalary, p.currency)}</td>
                  <td className="text-right">
                    <Button variant="secondary" className="px-2.5 py-1 text-xs" loading={pdf.isPending && pdf.variables === p.id} onClick={() => pdf.mutate(p.id)}>PDF</Button>
                  </td>
                </tr>
              ))}
              {(r.payslips ?? []).length === 0 && <tr><td colSpan={6} className="py-6 text-center text-slate-500">No employees in this run.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title={`Payroll sheet · ${sheetData?.currency ?? ''}`} className="mt-6">
        {sheet.isLoading && <Loading />}
        {sheet.error && <ErrorMessage error={sheet.error} />}
        {sheetData && sheetData.rows.length === 0 && <p className="py-6 text-center text-sm text-slate-500">No employees in this run.</p>}
        {sheetData && sheetData.rows.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs">
              <thead>
                <tr>
                  <th colSpan={5} className="bg-slate-800 px-2 py-1 text-left text-white">Employee details</th>
                  {groupRuns(sheetData.columns).map((g, i) => (
                    <th key={i} colSpan={g.span} className={`px-2 py-1 text-center text-white ${GROUP_CLS[g.group]}`}>{GROUP_LABEL[g.group]}</th>
                  ))}
                </tr>
                <tr className="text-left text-slate-500">
                  <th className="px-2 py-1">No.</th>
                  <th className="px-2 py-1">Employee name</th>
                  <th className="px-2 py-1 text-right">Working days</th>
                  <th className="px-2 py-1">Client</th>
                  <th className="px-2 py-1">Job title</th>
                  {sheetData.columns.map((c) => <th key={c.key} className="px-2 py-1 text-right">{c.label}</th>)}
                </tr>
              </thead>
              <tbody>
                {sheetData.rows.map((row) => (
                  <tr key={row.employeeCode} className="border-t border-slate-100">
                    <td className="px-2 py-1">{row.no}</td>
                    <td className="px-2 py-1 font-medium text-slate-900">{row.employeeName}</td>
                    <td className="px-2 py-1 text-right">{row.workingDays}</td>
                    <td className="px-2 py-1">{row.client}</td>
                    <td className="px-2 py-1">{row.jobTitle}</td>
                    {sheetData.columns.map((c) => <td key={c.key} className="px-2 py-1 text-right tabular-nums">{amt(row.amounts[c.key])}</td>)}
                  </tr>
                ))}
                <tr className="border-t-2 border-slate-300 font-semibold">
                  <td colSpan={5} className="px-2 py-1">Total</td>
                  {sheetData.columns.map((c) => <td key={c.key} className="px-2 py-1 text-right tabular-nums">{amt(sheetData.totals[c.key])}</td>)}
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
