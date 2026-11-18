// Employment contracts by state (Active / Inactive / Ended), with a link to create a new one
import { useQuery } from '@tanstack/react-query';
import clsx from 'clsx';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as contractsApi from '../../api/contracts';
import { useAuth } from '../../auth/useAuth';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EmptyState, ErrorMessage } from '../../components/ui/Feedback';
import { PageHeader } from '../../components/ui/PageHeader';
import { Loading } from '../../components/ui/Spinner';
import { P } from '../../lib/permissions';
import { fmtDate, fmtMoney, fullName } from '../../lib/format';

type Tab = 'Active' | 'Inactive' | 'Ended' | 'All';
const TABS: Tab[] = ['Active', 'Inactive', 'Ended', 'All'];

const STATUS: Record<string, { label: string; cls: string }> = {
  active: { label: 'Active', cls: 'bg-green-100 text-green-800' },
  expiring_soon: { label: 'Expiring soon', cls: 'bg-amber-100 text-amber-800' },
  renewed: { label: 'Renewed', cls: 'bg-slate-100 text-slate-600' },
  expired: { label: 'Expired', cls: 'bg-slate-100 text-slate-600' },
  terminated: { label: 'Terminated', cls: 'bg-red-100 text-red-700' },
};

const SIGNATURE: Record<string, string> = { sent: 'Waiting for signature', signed: 'Signed', cancelled: 'Cancelled' };
const TYPE: Record<string, string> = { unlimited: 'Unlimited', limited: 'Limited', internship: 'Internship' };

export default function Contracts() {
  const navigate = useNavigate();
  const { can } = useAuth();
  const [tab, setTab] = useState<Tab>('Active');
  const contracts = useQuery({
    queryKey: ['contracts', tab],
    queryFn: () => contractsApi.list(tab === 'All' ? {} : { state: tab }),
  });

  return (
    <div>
      <PageHeader
        title="Contracts"
        subtitle="Active, inactive and ended employment contracts"
        actions={can(P.contractManage) ? <Button onClick={() => navigate('/contracts/new')}>New contract</Button> : undefined}
      />

      <div className="mb-4 flex gap-2">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={clsx(
              'rounded-lg px-3 py-1.5 text-sm font-medium',
              tab === t ? 'bg-brand-600 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50',
            )}
          >
            {t}
          </button>
        ))}
      </div>

      <Card>
        {contracts.isLoading && <Loading />}
        {contracts.error && <ErrorMessage error={contracts.error} />}
        {contracts.data && contracts.data.length === 0 && <EmptyState title="No contracts here yet" />}
        {contracts.data && contracts.data.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead>
                <tr className="text-left text-slate-500">
                  {['Contract', 'Employee', 'Type', 'Start', 'End', 'Basic salary', 'Status', 'Signature'].map((h) => (
                    <th key={h} className="px-3 py-2 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {contracts.data.map((c) => {
                  const status = STATUS[c.displayStatus ?? c.status] ?? { label: c.status, cls: 'bg-slate-100 text-slate-600' };
                  return (
                    <tr key={c.id} className="hover:bg-slate-50">
                      <td className="px-3 py-2 font-medium">
                        <Link to={`/contracts/${c.id}`} className="text-brand-700 hover:underline">{c.contractNumber}</Link>
                      </td>
                      <td className="px-3 py-2">
                        {fullName(c.employee)} <span className="text-slate-500">{c.employee?.employeeCode}</span>
                      </td>
                      <td className="px-3 py-2">{TYPE[c.contractType] ?? c.contractType}</td>
                      <td className="px-3 py-2">{fmtDate(c.startDate)}</td>
                      <td className="px-3 py-2">{c.endDate ? fmtDate(c.endDate) : 'Open-ended'}</td>
                      <td className="px-3 py-2">{c.basicSalary !== undefined ? fmtMoney(c.basicSalary, c.currency) : '-'}</td>
                      <td className="px-3 py-2">
                        <span className={clsx('rounded-full px-2 py-0.5 text-xs font-medium', status.cls)}>{status.label}</span>
                      </td>
                      <td className="px-3 py-2 text-slate-600">{c.signatureRequest ? SIGNATURE[c.signatureRequest.status] : '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
