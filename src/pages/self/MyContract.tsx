import { useQuery } from '@tanstack/react-query';
import { Download } from 'lucide-react';
import * as contractsApi from '../../api/contracts';
import * as documentsApi from '../../api/documents';
import * as employeesApi from '../../api/employees';
import * as leaveApi from '../../api/leave';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EmptyState, ErrorMessage } from '../../components/ui/Feedback';
import { PageHeader } from '../../components/ui/PageHeader';
import { Loading } from '../../components/ui/Spinner';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { fmtDate, humanize } from '../../lib/format';
import type { Contract } from '../../types';

// My contract (design p.70). Read-only, and no salary figures: payroll is HR-only in this system.
export default function MyContract() {
  const { data: contracts = [], isLoading, error } = useQuery({ queryKey: ['contracts', 'me'], queryFn: contractsApi.mine });
  const { data: me } = useQuery({ queryKey: ['employees', 'me'], queryFn: employeesApi.me });
  const { data: leave } = useQuery({ queryKey: ['leave', 'balances', 'me'], queryFn: leaveApi.myBalances });

  const current = contracts.find((c) => c.state === 'Active') ?? contracts[0];
  const previous = contracts.filter((c) => c !== current);
  const annual = leave?.balances.find((b) => b.code === 'ANNUAL');
  const entity = me?.clientCompany ? `VirtuThinko (deployed at ${me.clientCompany.name})` : me?.country === 'SA' ? 'VirtuThinko KSA' : 'VirtuThinko W.L.L.';

  return (
    <>
      <PageHeader title="My contract" subtitle="Read-only. Contact HR to discuss any change." />
      {isLoading && <Loading />}
      <ErrorMessage error={error} />
      {!isLoading && !current && <Card><EmptyState title="No contract on file yet">HR will add your contract here.</EmptyState></Card>}

      {current && (
        <Card>
          <div className="mb-5 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">{current.jobTitle ?? me?.jobTitle ?? 'Employment contract'}</h2>
              <p className="text-sm text-slate-500">{current.contractNumber}</p>
            </div>
            <StatusBadge status={current.displayStatus === 'expiring_soon' ? 'pending' : current.state === 'Active' ? 'active' : current.status} />
          </div>
          <dl className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <Item label="Contract type" value={humanize(current.contractType)} />
            <Item label="Employing entity" value={entity} />
            <Item label="Start date" value={fmtDate(current.startDate)} />
            <Item label="End date" value={current.endDate ? fmtDate(current.endDate) : 'Open-ended'} />
            <Item label="Weekly hours" value={current.weeklyHours ? `${current.weeklyHours} hours` : '-'} />
            <Item label="Annual leave" value={annual?.entitlement != null ? `${annual.entitlement} days` : '-'} />
            {current.daysLeft != null && current.daysLeft >= 0 && <Item label="Time left" value={`${current.daysLeft} days`} />}
          </dl>
          {current.displayStatus === 'expiring_soon' && (
            <p className="mt-4 rounded-lg bg-amber-50 px-4 py-2 text-sm text-amber-800">Your contract ends soon. HR will contact you about renewal.</p>
          )}
          <div className="mt-5">
            {current.document
              ? <Button variant="secondary" onClick={() => documentsApi.download(current.document!)}><Download className="h-4 w-4" /> Download signed contract</Button>
              : <p className="text-xs text-slate-500">The signed copy hasn't been uploaded yet.</p>}
          </div>
        </Card>
      )}

      {previous.length > 0 && (
        <Card title="Earlier contracts" className="mt-6">
          <ul className="divide-y divide-slate-100 text-sm">
            {previous.map((c: Contract) => (
              <li key={c.id} className="flex items-center justify-between py-2.5">
                <span>{c.contractNumber} · {humanize(c.contractType)} · {fmtDate(c.startDate)} – {c.endDate ? fmtDate(c.endDate) : 'open-ended'}</span>
                <span className="text-xs text-slate-500">{c.state}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </>
  );
}

function Item({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="font-medium text-slate-800">{value || '-'}</dd>
    </div>
  );
}
