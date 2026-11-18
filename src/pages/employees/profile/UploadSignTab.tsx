// Profile tab "Upload & sign" (design screen 8): onboarding documents the employee must send, and documents sent to sign
import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import * as documentsApi from '../../../api/documents';
import * as signaturesApi from '../../../api/signatures';
import { useAuth } from '../../../auth/useAuth';
import { Button } from '../../../components/ui/Button';
import { ErrorMessage } from '../../../components/ui/Feedback';
import { fmtDate } from '../../../lib/format';
import { P } from '../../../lib/permissions';
import type { Employee } from '../../../types';
import { CHECKLIST } from '../onboarding/formState';
import { Panel } from './ui';

const STATUS = {
  uploaded: ['Uploaded', 'bg-green-50 text-green-700'],
  waiting: ['Waiting', 'bg-amber-100 text-amber-800'],
  notRequired: ['Not required', 'bg-slate-100 text-slate-600'],
} as const;

export function UploadSignTab({ emp }: { emp: Employee }) {
  const { can } = useAuth();
  const [sent, setSent] = useState(false);
  const checklist = emp.documentChecklist ?? {};
  const signatures = useQuery({ queryKey: ['signatures', emp.id], queryFn: () => signaturesApi.list(emp.id) });

  const rows = CHECKLIST.map((item) => {
    const row = checklist[item.key];
    const state: keyof typeof STATUS = row?.na ? 'notRequired' : row?.received ? 'uploaded' : 'waiting';
    return { ...item, state };
  });
  const waiting = rows.filter((r) => r.state === 'waiting').length;

  const remind = useMutation({
    mutationFn: () => documentsApi.remind(emp.id),
    onSuccess: () => setSent(true),
  });

  return (
    <div className="space-y-4">
      <Panel
        title="Documents the employee must upload"
        action={can(P.documentUpload) && (
          <Button variant="secondary" disabled={waiting === 0} loading={remind.isPending} onClick={() => { setSent(false); remind.mutate(); }}>
            Remind employee
          </Button>
        )}
      >
        <div className="overflow-x-auto">
          <table className="table">
            <thead><tr><th>Document</th><th>Required</th><th>Status</th></tr></thead>
            <tbody>
              {rows.map((r) => {
                const [label, cls] = STATUS[r.state];
                return (
                  <tr key={r.key}>
                    <td>{r.label}</td>
                    <td>{r.state === 'notRequired' ? 'No' : 'Yes'}</td>
                    <td><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>{label}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <ErrorMessage error={remind.error} />
        {sent && <p className="mt-3 text-sm text-green-700">Reminder sent to {emp.firstName}.</p>}
      </Panel>

      <Panel title="Documents to sign">
        <ErrorMessage error={signatures.error} />
        {!signatures.data?.length ? (
          <p className="text-sm text-slate-500">Nothing sent for signature yet. Send the acceptance letter or proposal form from the letter page.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead><tr><th>Document</th><th>Sent</th><th>Status</th><th>Signed by</th></tr></thead>
              <tbody>
                {signatures.data.map((s) => {
                  const st = signaturesApi.signatureStatus(s);
                  return (
                    <tr key={s.id}>
                      <td>{s.title}</td>
                      <td>{fmtDate(s.createdAt)}</td>
                      <td><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${st.cls}`}>{st.label}</span></td>
                      <td>{s.signedAt && s.signerName ? `${s.signerName} · ${fmtDate(s.signedAt)}` : '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
