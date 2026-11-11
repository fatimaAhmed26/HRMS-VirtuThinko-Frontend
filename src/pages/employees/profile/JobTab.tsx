// Profile tab "Job & contract" (design screen 4), plus education and previous employment
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import * as contractsApi from '../../../api/contracts';
import { useAuth } from '../../../auth/useAuth';
import { Button } from '../../../components/ui/Button';
import { ErrorMessage } from '../../../components/ui/Feedback';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { fmtDate, fullName, humanize, yesNo } from '../../../lib/format';
import { P } from '../../../lib/permissions';
import type { Employee } from '../../../types';
import { Grid, Item, Panel } from './ui';

const ENTITY = { BH: 'VirtuThinko W.L.L.', SA: 'VirtuThinko Company' } as const;

export function JobTab({ emp }: { emp: Employee }) {
  const { can } = useAuth();
  const contracts = useQuery({
    queryKey: ['contracts', { employeeId: emp.id }],
    queryFn: () => contractsApi.list({ employeeId: emp.id }),
    enabled: can(P.contractView),
  });
  const current = contracts.data?.find((c) => c.status === 'active') ?? contracts.data?.[0];
  const outsourced = emp.employmentType === 'Outsourced';
  const education = emp.qualifications.filter((q) => q.kind === 'education');

  return (
    <div className="space-y-4">
      <Panel title="Job">
        <Grid>
          <Item label="Job title" value={emp.jobTitle} />
          <Item label="Department" value={emp.department?.name} />
          <Item label="Line manager" value={emp.manager && <Link className="text-brand-600 hover:underline" to={`/employees/${emp.manager.id}`}>{fullName(emp.manager)}</Link>} />
          <Item label="Employing entity" value={ENTITY[emp.country]} />
          <Item label="Team / client" value={outsourced ? `Outsourced · ${emp.clientCompany?.name ?? '-'}` : emp.country === 'SA' ? 'KSA' : 'Bahrain'} />
          <Item label="Work location" value={emp.workLocation} />
          <Item label="Date of joining" value={emp.hireDate && fmtDate(emp.hireDate)} />
          <Item label="Employment type" value={emp.employmentType} />
          <Item label="Probation ends" value={emp.probationEnd && fmtDate(emp.probationEnd)} />
          <Item label="Portal account" value={emp.user ? `${emp.user.username} (${emp.user.status})` : 'No login yet'} />
        </Grid>
      </Panel>

      {outsourced && (
        <Panel title="Client deployment">
          <Grid>
            <Item label="Client company" value={emp.clientCompany?.name} />
            <Item label="Client-side supervisor" value={emp.clientSupervisor} />
            <Item label="PO / contract reference" value={emp.poNumber} />
            <Item label="Deployment start" value={emp.deploymentStart && fmtDate(emp.deploymentStart)} />
            <Item label="Deployment end" value={emp.deploymentEnd ? fmtDate(emp.deploymentEnd) : 'Open-ended'} />
          </Grid>
        </Panel>
      )}

      {can(P.contractView) && (
        <Panel title="Current contract" action={<Link to={`/contracts?employeeId=${emp.id}`}><Button variant="secondary">Open in Contracts</Button></Link>}>
          <ErrorMessage error={contracts.error} />
          {contracts.isLoading ? <p className="text-sm text-slate-500">Loading…</p> : !current ? (
            <p className="text-sm text-slate-500">No contract yet.</p>
          ) : (
            <Grid>
              <Item label="Contract" value={`${current.contractNumber ?? `#${current.id}`} · ${humanize(current.contractType)}`} />
              <Item label="Job title on contract" value={current.jobTitle} />
              <Item label="Period" value={`${fmtDate(current.startDate)} – ${current.endDate ? fmtDate(current.endDate) : 'open-ended'}`} />
              <Item label="Weekly hours" value={current.weeklyHours} />
              <Item label="Status" value={<StatusBadge status={current.displayStatus ?? current.status} />} />
            </Grid>
          )}
          {contracts.data && contracts.data.length > 1 && (
            <p className="mt-3 text-xs text-slate-500">{contracts.data.length - 1} earlier contract(s) in Contracts.</p>
          )}
        </Panel>
      )}

      <Panel title="Education & certifications">
        {emp.qualifications.length === 0 ? <p className="text-sm text-slate-500">None recorded.</p> : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead><tr><th>Qualification</th><th>Institution / issuing body</th><th>Country</th><th>Year / obtained</th><th>Expiry</th></tr></thead>
              <tbody>
                {[...education, ...emp.qualifications.filter((q) => q.kind === 'certification')].map((q, i) => (
                  <tr key={i}>
                    <td>{q.title}{q.grade && <span className="text-slate-500"> · {q.grade}</span>}{q.kind === 'certification' && <span className="ml-2 rounded bg-slate-100 px-1.5 text-xs text-slate-600">Certification</span>}</td>
                    <td>{q.institution ?? '-'}</td>
                    <td>{q.country ?? '-'}</td>
                    <td>{q.year ?? (q.obtainedDate ? fmtDate(q.obtainedDate) : '-')}</td>
                    <td>{q.expiryDate ? fmtDate(q.expiryDate) : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Panel title="Previous employment & references">
        {emp.previousEmployments.length === 0 ? <p className="text-sm text-slate-500">None recorded.</p> : (
          <div className="space-y-3">
            {emp.previousEmployments.map((p, i) => (
              <div key={i} className="rounded-lg border border-slate-200 p-3 text-sm">
                <p className="font-medium text-slate-900">{p.employerName}{p.jobTitle && <span className="font-normal text-slate-600"> · {p.jobTitle}</span>}</p>
                <p className="text-xs text-slate-500">
                  {p.fromDate ? fmtDate(p.fromDate) : '?'} – {p.toDate ? fmtDate(p.toDate) : '?'}{p.reasonForLeaving && ` · Left: ${p.reasonForLeaving}`}
                </p>
                {p.refName && (
                  <p className="mt-1 text-xs text-slate-600">
                    Reference: {p.refName}{p.refJobTitle && ` (${p.refJobTitle})`}{[p.refPhone, p.refEmail].filter(Boolean).map((x) => ` · ${x}`).join('')}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
        <dl className="mt-4 grid gap-4 border-t border-slate-100 pt-4 sm:grid-cols-2">
          <Item label="May contact previous employers" value={yesNo(emp.mayContactEmployers)} />
          <Item label="Non-compete / notice obligation" value={yesNo(emp.hasRestrictiveClauses)} />
        </dl>
      </Panel>
    </div>
  );
}
