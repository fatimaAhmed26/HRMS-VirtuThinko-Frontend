// One employment contract: details, salary package, English PDF, and sending it to the employee for signature
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import * as contractsApi from '../../api/contracts';
import { useAuth } from '../../auth/useAuth';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { ErrorMessage } from '../../components/ui/Feedback';
import { PageHeader } from '../../components/ui/PageHeader';
import { Loading } from '../../components/ui/Spinner';
import { P } from '../../lib/permissions';
import { fmtDate, fmtDateTime, fmtMoney, fullName } from '../../lib/format';
import { packageTotals } from './packageMath';

const TYPE_LABEL: Record<string, string> = { unlimited: 'Unlimited (indefinite)', limited: 'Limited (fixed term)', internship: 'Internship' };
const PROBATION_LABEL = (m: number) => (m > 0 ? `${m} ${m === 1 ? 'month' : 'months'}` : 'None');
const SIGNATURE_LABEL: Record<string, string> = { sent: 'Waiting for the employee to sign', signed: 'Signed', cancelled: 'Signature request cancelled' };

export default function ContractDetail() {
  const id = Number(useParams().id);
  const qc = useQueryClient();
  const { can } = useAuth();
  const [copied, setCopied] = useState(false);
  const [pdfError, setPdfError] = useState<unknown>(null);

  const contract = useQuery({ queryKey: ['contract', id], queryFn: () => contractsApi.get(id), enabled: Number.isInteger(id) && id > 0 });

  const send = useMutation({
    mutationFn: () => contractsApi.sendForSignature(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contract', id] });
      qc.invalidateQueries({ queryKey: ['contracts'] });
    },
  });

  if (contract.isLoading) return <Loading />;
  if (contract.error || !contract.data) return <ErrorMessage error={contract.error} />;
  const c = contract.data;
  const number = c.contractNumber ?? `CT-${c.id}`;
  const terms = c.terms;
  const items = terms?.items ?? [];
  const basic = Number(c.basicSalary ?? 0);
  const housing = Number(c.housingAllowance ?? 0);
  const transport = Number(c.transportAllowance ?? 0);
  const totals = packageTotals({ basic, housing, transport, items });
  const cur = c.currency ?? 'BHD';

  const sig = c.signatureRequest;
  const canSend = can(P.contractManage) && c.status === 'active' && sig?.status !== 'sent' && sig?.status !== 'signed';
  const signingLink = sig?.status === 'sent' && sig.token ? `${window.location.origin}/sign/${sig.token}` : null;

  const downloadPdf = async () => {
    setPdfError(null);
    try {
      await contractsApi.pdfDownload(c.id, `${number}.pdf`);
    } catch (err) {
      setPdfError(err);
    }
  };

  const copyLink = async () => {
    if (!signingLink) return;
    await navigator.clipboard.writeText(signingLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${number} · ${c.title ?? 'Employment contract'}`}
        subtitle={`${fullName(c.employee)}${c.employee ? ` (${c.employee.employeeCode})` : ''} · ${c.displayStatus ?? c.status}`}
        actions={
          <div className="flex gap-2">
            <Link to="/contracts" className="self-center text-sm text-slate-600 hover:underline">Back to contracts</Link>
            <Button variant="secondary" onClick={downloadPdf}>Download PDF (English)</Button>
            {can(P.contractManage) && (
              <Button onClick={() => send.mutate()} loading={send.isPending} disabled={!canSend}>Send for signature</Button>
            )}
          </div>
        }
      />
      {pdfError ? <ErrorMessage error={pdfError} /> : null}
      {send.error ? <ErrorMessage error={send.error} /> : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card title="Contract details">
            <dl className="grid gap-4 text-sm md:grid-cols-2">
              <Detail label="Contract type" value={TYPE_LABEL[c.contractType] ?? c.contractType} />
              <Detail label="Employing entity" value={terms?.employingEntity ?? '-'} />
              <Detail label="Job title" value={c.jobTitle ?? '-'} />
              <Detail label="Working hours / week" value={c.weeklyHours ?? '-'} />
              <Detail label="Start date" value={fmtDate(c.startDate)} />
              <Detail label="End date" value={c.endDate ? fmtDate(c.endDate) : 'Open-ended'} />
              <Detail label="Probation period" value={PROBATION_LABEL(terms?.probationMonths ?? 0)} />
              <Detail label="Notice period" value={terms ? `${terms.noticeDays} days` : '-'} />
              <Detail label="Annual leave" value={terms ? `${terms.annualLeaveDays} days` : '-'} />
            </dl>
          </Card>

          <Card title="Salary package (monthly)">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="px-2 py-2 font-medium">Component</th>
                  <th className="px-2 py-2 font-medium">Type</th>
                  <th className="px-2 py-2 font-medium">Paid</th>
                  <th className="px-2 py-2 text-right font-medium">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <Row label="Basic salary" type="Earning" paid="Monthly" value={fmtMoney(basic, cur)} />
                {housing > 0 && <Row label="Housing allowance" type="Allowance" paid="Monthly" value={fmtMoney(housing, cur)} />}
                {transport > 0 && <Row label="Transport allowance" type="Allowance" paid="Monthly" value={fmtMoney(transport, cur)} />}
                {items.map((i, idx) => (
                  <Row key={idx} label={i.label} type={cap(i.kind)} paid={cap(i.paid)} value={fmtMoney(i.amount, cur)} />
                ))}
                <Row label="Social insurance (SIO), employee share" type="Deduction" paid="Monthly" value="Auto (by payroll rules)" muted />
              </tbody>
            </table>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Summary">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt>Gross salary</dt><dd>{fmtMoney(totals.gross, cur)}</dd></div>
              <div className="flex justify-between"><dt>Monthly deductions</dt><dd>{fmtMoney(totals.deductions, cur)} + SIO</dd></div>
              <div className="flex justify-between font-semibold"><dt>Net monthly pay</dt><dd>{fmtMoney(totals.net, cur)} *</dd></div>
              <div className="flex justify-between"><dt>Yearly bonuses</dt><dd>{fmtMoney(totals.yearlyBonus, cur)}</dd></div>
              <div className="flex justify-between border-t border-slate-200 pt-2 font-semibold"><dt>Total annual package</dt><dd>{fmtMoney(totals.totalAnnual, cur)}</dd></div>
            </dl>
            <p className="mt-3 text-xs text-slate-500">* Before social insurance, which payroll calculates.</p>
          </Card>

          <Card title="Documents and history">
            <div className="space-y-3 text-sm">
              <div>
                <p className="font-medium text-slate-900">Employment contract (English PDF)</p>
                <p className="text-slate-500">{sig ? SIGNATURE_LABEL[sig.status] : 'Not sent to the employee yet'}</p>
                {sig?.status === 'sent' && <p className="text-slate-500">Link valid until {fmtDate(sig.expiresAt)}</p>}
                {sig?.status === 'signed' && (
                  <p className="text-slate-500">Signed by {sig.signerName} on {fmtDateTime(sig.signedAt)}</p>
                )}
              </div>
              {signingLink && (
                <Button variant="secondary" onClick={copyLink}>{copied ? 'Copied' : 'Copy signing link'}</Button>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-medium text-slate-900">{value}</dd>
    </div>
  );
}

function Row({ label, type, paid, value, muted }: { label: string; type: string; paid: string; value: string; muted?: boolean }) {
  return (
    <tr className={muted ? 'text-slate-500' : undefined}>
      <td className="px-2 py-2">{label}</td>
      <td className="px-2 py-2">{type}</td>
      <td className="px-2 py-2">{paid}</td>
      <td className="px-2 py-2 text-right">{value}</td>
    </tr>
  );
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
