// Links sent to new joiners: copy or cancel a link, and open a submitted form in Add employee
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import clsx from 'clsx';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as onboardingApi from '../../api/onboarding';
import { ErrorMessage } from '../../components/ui/Feedback';
import { Loading } from '../../components/ui/Spinner';
import { fmtDate } from '../../lib/format';
import type { ImportResult } from './import/fromImport';
import { initialForm, type ChecklistKey, type OnboardingForm } from './onboarding/formState';

const STATUS: Record<onboardingApi.OnboardingLinkItem['status'], { label: string; cls: string }> = {
  sent: { label: 'Waiting for employee', cls: 'bg-amber-100 text-amber-800' },
  submitted: { label: 'Submitted', cls: 'bg-green-100 text-green-800' },
  expired: { label: 'Expired', cls: 'bg-slate-100 text-slate-600' },
  cancelled: { label: 'Cancelled', cls: 'bg-slate-100 text-slate-600' },
};

export default function SentForms() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const items = useQuery({ queryKey: ['onboarding-links'], queryFn: onboardingApi.list });

  const cancel = useMutation({
    mutationFn: (id: number) => onboardingApi.cancel(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['onboarding-links'] }),
  });

  // The submitted answers and files become the Add employee form, which HR then completes and saves
  const open = useMutation({
    mutationFn: async (item: onboardingApi.OnboardingLinkItem) => {
      const d = await onboardingApi.details(item.id);
      const form = { ...initialForm(), ...(d.answers ?? {}) } as OnboardingForm;
      const files: Partial<Record<ChecklistKey, File>> = {};
      for (const file of d.files) {
        const blob = await onboardingApi.fileBlob(item.id, file.key);
        files[file.key as ChecklistKey] = new File([blob], file.name, { type: blob.type });
      }
      const imported: ImportResult = { form, files, checks: {}, fileName: `the form submitted ${fmtDate(d.submittedAt ?? d.createdAt)}` };
      return imported;
    },
    onSuccess: (imported) => navigate('/employees/new', { state: { imported } }),
  });

  function copy(item: onboardingApi.OnboardingLinkItem) {
    if (!item.token) return;
    void navigator.clipboard.writeText(`${window.location.origin}/form/${item.token}`);
    setCopiedId(item.id);
  }

  return (
    <div className="mx-auto max-w-5xl space-y-4 pb-10">
      <div>
        <p className="text-xs text-slate-500"><Link to="/employees/new" className="hover:underline">Add employee</Link> / Sent forms</p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-900">Sent forms</h1>
        <p className="mt-1 text-sm text-slate-500">Links sent to new joiners. Open a submitted form to finish adding the employee.</p>
      </div>
      {items.isLoading && <Loading />}
      <ErrorMessage error={items.error || cancel.error || open.error} />
      {items.data && (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="table">
            <thead><tr><th>Sent</th><th>Status</th><th>Submitted</th><th>Valid until</th><th /></tr></thead>
            <tbody>
              {items.data.map((item) => {
                const st = STATUS[item.status];
                return (
                  <tr key={item.id}>
                    <td>{fmtDate(item.createdAt)}</td>
                    <td><span className={clsx('rounded-full px-2 py-0.5 text-xs font-medium', st.cls)}>{st.label}</span></td>
                    <td>{item.submittedAt ? fmtDate(item.submittedAt) : '—'}</td>
                    <td>{fmtDate(item.expiresAt)}</td>
                    <td className="text-right">
                      <div className="flex justify-end gap-3 text-xs">
                        {item.token && (
                          <button type="button" className="text-brand-600 hover:underline" onClick={() => copy(item)}>
                            {copiedId === item.id ? 'Link copied' : 'Copy link'}
                          </button>
                        )}
                        {item.token && (
                          <button type="button" className="text-slate-500 hover:underline" onClick={() => cancel.mutate(item.id)}>Cancel</button>
                        )}
                        {item.status === 'submitted' && (
                          <button type="button" className="text-brand-600 hover:underline" disabled={open.isPending} onClick={() => open.mutate(item)}>
                            Open in Add employee
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {items.data.length === 0 && <p className="p-5 text-sm text-slate-500">No forms sent yet.</p>}
        </div>
      )}
    </div>
  );
}
