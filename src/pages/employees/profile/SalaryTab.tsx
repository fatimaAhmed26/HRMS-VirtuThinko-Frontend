// Profile tab "Salary & payslips" (design screen 5): HR / payroll only, never shown to employees
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import * as contractsApi from '../../../api/contracts';
import * as payrollApi from '../../../api/payroll';
import { Button } from '../../../components/ui/Button';
import { ErrorMessage } from '../../../components/ui/Feedback';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { fmtMoney } from '../../../lib/format';
import type { Employee } from '../../../types';
import { Item, Panel } from './ui';

const monthName = (period: string) => new Date(`${period}-01T00:00:00Z`).toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' });

export function SalaryTab({ emp }: { emp: Employee }) {
  const [showIban, setShowIban] = useState(false);
  const contracts = useQuery({ queryKey: ['contracts', { employeeId: emp.id }], queryFn: () => contractsApi.list({ employeeId: emp.id }) });
  const payslips = useQuery({ queryKey: ['payslips', emp.id], queryFn: () => payrollApi.employeePayslips(emp.id) });
  const [downloading, setDownloading] = useState<number | null>(null);

  const c = contracts.data?.find((x) => x.status === 'active');
  const currency = c?.currency ?? (emp.country === 'SA' ? 'SAR' : 'BHD');
  const basic = Number(c?.basicSalary ?? 0);
  const allowances = Number(c?.housingAllowance ?? 0) + Number(c?.transportAllowance ?? 0);
  const last = payslips.data?.[0];
  const iban = emp.bankAccountNumber;

  async function download(id: number) {
    setDownloading(id);
    try { await payrollApi.payslipPdf(id); } finally { setDownloading(null); }
  }

  return (
    <div className="space-y-4">
      <Panel title="Salary package (monthly)">
        <ErrorMessage error={contracts.error} />
        {!c ? <p className="text-sm text-slate-500">{contracts.isLoading ? 'Loading…' : 'No active contract, so no salary package.'}</p> : (
          <div className="divide-y divide-slate-100 rounded-lg border border-slate-200 text-sm">
            {[
              ['Basic salary', fmtMoney(basic, currency)],
              ['Housing allowance', fmtMoney(Number(c.housingAllowance ?? 0), currency)],
              ['Transport allowance', fmtMoney(Number(c.transportAllowance ?? 0), currency)],
              ['Gross salary', fmtMoney(basic + allowances, currency)],
            ].map(([label, value], i) => (
              <div key={label} className={`flex justify-between px-4 py-2.5 ${i === 3 ? 'font-semibold text-slate-900' : 'text-slate-700'}`}>
                <span>{label}</span><span>{value}</span>
              </div>
            ))}
            {last && (
              <div className="flex justify-between px-4 py-2.5 text-slate-700">
                <span>Net pay on the last payslip ({monthName(last.run.period)})</span>
                <span className="font-semibold text-slate-900">{fmtMoney(last.netSalary, last.currency)}</span>
              </div>
            )}
          </div>
        )}
        <dl className="mt-4 grid gap-4 sm:grid-cols-3">
          <Item label="Bank" value={[emp.bankName, emp.bankBranch].filter(Boolean).join(' · ')} />
          <Item label="Account holder" value={emp.bankAccountHolder} />
          <Item label="IBAN" value={iban && (
            <span className="flex items-center gap-2">
              <span className="font-mono">{showIban ? iban : `•••• ${iban.slice(-4)}`}</span>
              {!iban.includes('•') && (
                <button type="button" className="text-xs text-brand-600 hover:underline" onClick={() => setShowIban((v) => !v)}>{showIban ? 'Hide' : 'Show'}</button>
              )}
            </span>
          )} />
        </dl>
      </Panel>

      <Panel title="Payslips">
        <ErrorMessage error={payslips.error} />
        {payslips.isLoading ? <p className="text-sm text-slate-500">Loading…</p> : !payslips.data?.length ? (
          <p className="text-sm text-slate-500">No payslips yet. They appear here after each payroll run.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {payslips.data.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 py-2.5 text-sm">
                <span className="text-slate-800">{monthName(p.run.period)}</span>
                <span className="flex items-center gap-3">
                  <span className="text-slate-600">Net {fmtMoney(p.netSalary, p.currency)}</span>
                  <StatusBadge status={p.run.status} />
                  <Button variant="secondary" loading={downloading === p.id} onClick={() => download(p.id)}>Download PDF</Button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
