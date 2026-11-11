// Profile tab "Documents" (design screen 7): stored documents with expiry status, upload, and the onboarding checklist
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useState, type FormEvent } from 'react';
import * as documentsApi from '../../../api/documents';
import { useAuth } from '../../../auth/useAuth';
import { Button } from '../../../components/ui/Button';
import { ErrorMessage } from '../../../components/ui/Feedback';
import { Modal } from '../../../components/ui/Modal';
import { fmtDate, humanize } from '../../../lib/format';
import { P } from '../../../lib/permissions';
import type { Employee, HrDocument } from '../../../types';
import { CHECKLIST } from '../onboarding/formState';
import { Panel } from './ui';

const CATEGORIES = [
  ['id_copy', 'ID / passport / permit'], ['certificate', 'Certificate'], ['contract', 'Contract'],
  ['personal', 'Personal (photo, CV)'], ['other', 'Other'],
] as const;

const CATEGORY_LABEL: Record<string, string> = {
  ...Object.fromEntries(CATEGORIES), leave_attachment: 'Leave attachment', request_attachment: 'Request attachment',
};

// Valid / expiring soon / expired, from the expiry date
function expiryStatus(d: HrDocument) {
  if (!d.expiryDate) return { label: 'On file', cls: 'bg-green-50 text-green-700' };
  const days = dayjs(d.expiryDate).startOf('day').diff(dayjs().startOf('day'), 'day');
  if (days < 0) return { label: 'Expired', cls: 'bg-red-50 text-red-700' };
  if (days <= (d.remindDaysBefore ?? 60)) return { label: `Expires in ${days} day${days === 1 ? '' : 's'}`, cls: 'bg-amber-100 text-amber-800' };
  return { label: 'Valid', cls: 'bg-green-50 text-green-700' };
}

function UploadDialog({ emp, open, onClose }: { emp: Employee; open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<string>('id_copy');
  const [expiryDate, setExpiry] = useState('');
  const [remind, setRemind] = useState(90);
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = useMutation({
    mutationFn: () => documentsApi.upload({
      file: file!, employeeId: emp.id, category, title: title.trim(),
      expiryDate: expiryDate || undefined, remindDaysBefore: expiryDate ? remind : undefined, visibleToEmployee: visible,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['documents'] });
      setFile(null); setTitle(''); setExpiry(''); setVisible(false);
      onClose();
    },
  });

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!file) return setError('Choose a file');
    if (file.size > 5 * 1024 * 1024) return setError('The file is larger than 5 MB');
    if (!title.trim()) return setError('Give the document a title');
    setError(null);
    save.mutate();
  }

  return (
    <Modal title={`Upload a document for ${emp.firstName}`} open={open} onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <label className="block"><span className="label">File (PDF, JPEG or PNG, up to 5 MB)</span>
          <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="input" onChange={(e) => { const f = e.target.files?.[0] ?? null; setFile(f); if (f && !title) setTitle(f.name.replace(/\.\w+$/, '')); }} />
        </label>
        <label className="block"><span className="label">Title</span>
          <input className="input" value={title} maxLength={150} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Passport (photo page)" />
        </label>
        <label className="block"><span className="label">Category</span>
          <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block"><span className="label">Expiry date (if any)</span>
            <input type="date" className="input" value={expiryDate} onChange={(e) => setExpiry(e.target.value)} />
          </label>
          <label className="block"><span className="label">Remind HR</span>
            <select className="input" value={remind} disabled={!expiryDate} onChange={(e) => setRemind(Number(e.target.value))}>
              <option value={90}>3 months before</option><option value={30}>1 month before</option><option value={7}>7 days before</option>
            </select>
          </label>
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" className="accent-brand-600" checked={visible} onChange={(e) => setVisible(e.target.checked)} />
          The employee can see this in My documents
        </label>
        <ErrorMessage error={error || save.error} />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={save.isPending}>Upload</Button>
        </div>
      </form>
    </Modal>
  );
}

export function DocumentsTab({ emp }: { emp: Employee }) {
  const { can } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState<number | null>(null);
  const docs = useQuery({ queryKey: ['documents', { employeeId: emp.id }], queryFn: () => documentsApi.list({ employeeId: emp.id, pageSize: 100 }) });
  const checklist = emp.documentChecklist ?? {};

  async function view(d: HrDocument) {
    setBusy(d.id);
    try { await documentsApi.download(d); } finally { setBusy(null); }
  }

  return (
    <div className="space-y-4">
      <Panel title="Documents" action={can(P.documentUpload) && <Button variant="secondary" onClick={() => setUploading(true)}>Upload</Button>}>
        <ErrorMessage error={docs.error} />
        {docs.isLoading ? <p className="text-sm text-slate-500">Loading…</p> : !docs.data?.items.length ? (
          <p className="text-sm text-slate-500">No documents yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead><tr><th>Document</th><th>Category</th><th>Expiry</th><th>Status</th><th>Employee sees it</th><th /></tr></thead>
              <tbody>
                {docs.data.items.map((d) => {
                  const st = expiryStatus(d);
                  return (
                    <tr key={d.id}>
                      <td>{d.title}<span className="block text-xs text-slate-400">Added {fmtDate(d.createdAt)}</span></td>
                      <td>{CATEGORY_LABEL[d.category] ?? humanize(d.category)}</td>
                      <td>{d.expiryDate ? fmtDate(d.expiryDate) : '—'}</td>
                      <td><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${st.cls}`}>{st.label}</span></td>
                      <td>{d.visibleToEmployee ? 'Yes' : 'No'}</td>
                      <td className="text-right"><Button variant="secondary" loading={busy === d.id} onClick={() => view(d)}>View</Button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Panel title="Onboarding documents checklist">
        <div className="overflow-x-auto">
          <table className="table">
            <thead><tr><th>Document</th><th>Status</th></tr></thead>
            <tbody>
              {CHECKLIST.map((item) => {
                const row = checklist[item.key];
                const status = row?.na ? ['Not applicable', 'bg-slate-100 text-slate-600'] : row?.received ? ['Received', 'bg-green-50 text-green-700'] : ['Waiting', 'bg-amber-100 text-amber-800'];
                return (
                  <tr key={item.key}>
                    <td>{item.label}</td>
                    <td><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${status[1]}`}>{status[0]}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>

      <UploadDialog emp={emp} open={uploading} onClose={() => setUploading(false)} />
    </div>
  );
}
