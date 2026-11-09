import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import * as leaveApi from '../../api/leave';
import { CountryTabs } from '../../components/leave/CountryTabs';
import { useLeaveSetup } from '../../components/leave/useLeaveSetup';
import { Card } from '../../components/ui/Card';
import { ErrorMessage } from '../../components/ui/Feedback';
import { PageHeader } from '../../components/ui/PageHeader';
import { Loading } from '../../components/ui/Spinner';
import { entitlementText, noticeText, payLabel, typeColor } from '../../lib/leave';
import type { Entity, LeaveType } from '../../types';

// Leave policy (design screen 35): types, entitlements, eligibility and notice rules per country
export default function LeavePolicy() {
  const { country: myCountry } = useLeaveSetup();
  const [picked, setPicked] = useState<Entity | null>(null);
  const country = picked ?? myCountry ?? 'BH';
  const { data = [], isLoading, error } = useQuery({ queryKey: ['leave', 'types', country], queryFn: () => leaveApi.types(country) });
  const standard = data.filter((t) => t.allowance === 'yearly');
  const special = data.filter((t) => t.allowance === 'per_event');

  return (
    <>
      <PageHeader title="Leave policy" subtitle={country === 'BH' ? 'Bahrain Labour Law (Law 36 of 2012)' : 'Saudi Labour Law'} />
      <CountryTabs value={country} onChange={setPicked} />
      {isLoading && <Loading />}
      <ErrorMessage error={error} />
      <div className="space-y-6">
        <PolicyTable title="Standard leave (resets every year)" rows={standard} />
        <PolicyTable title="Special leave (per event)" rows={special} />
      </div>
    </>
  );
}

function eligibility(t: LeaveType) {
  const parts = [];
  if (t.gender) parts.push(`${t.gender} only`);
  if (t.minServiceMonths) parts.push(t.minServiceMonths % 12 === 0 ? `${t.minServiceMonths / 12}+ years' service` : `${t.minServiceMonths}+ months' service`);
  if (t.oncePerEmployment) parts.push('Once per employment');
  return parts.length ? parts.join(' · ') : 'All employees';
}

function PolicyTable({ title, rows }: { title: string; rows: LeaveType[] }) {
  if (rows.length === 0) return null;
  return (
    <Card title={title}>
      <div className="-mx-5 -my-5 overflow-x-auto">
        <table className="table">
          <thead><tr><th>Leave type</th><th>Entitlement</th><th>Pay</th><th>Eligibility</th><th>Document</th><th>Notes</th></tr></thead>
          <tbody>
            {rows.map((t) => (
              <tr key={t.id}>
                <td><span className={`mr-2 inline-block h-2.5 w-2.5 rounded-full border ${typeColor(t.code)}`} />{t.name}</td>
                <td className="font-medium">{entitlementText(t)}{t.countWorkingDays && <p className="text-xs font-normal text-slate-500">working days</p>}</td>
                <td className="text-xs">{payLabel(t)}</td>
                <td><span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs">{eligibility(t)}</span></td>
                <td>{t.requiresAttachment ? <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs text-brand-700">Required</span> : 'No'}</td>
                <td className="max-w-xs text-xs text-slate-600">{[t.description, noticeText(t)].filter(Boolean).join('. ')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
