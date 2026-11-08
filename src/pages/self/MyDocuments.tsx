import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Download, Upload } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import * as documentsApi from '../../api/documents';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EmptyState, ErrorMessage } from '../../components/ui/Feedback';
import { Modal } from '../../components/ui/Modal';
import { PageHeader } from '../../components/ui/PageHeader';
import { Loading } from '../../components/ui/Spinner';
import { fmtDate } from '../../lib/format';
import { expiryStatus, toneClass } from './docStatus';

const CATEGORY_LABEL: Record<string, string> = {
  id_copy: 'ID copy', certificate: 'Certificate / letter', contract: 'Contract', personal: 'Personal',
  leave_attachment: 'Leave attachment', request_attachment: 'Request attachment', other: 'Other',
};

// My documents (design p.69)
export default function MyDocuments() {
  const [params, setParams] = useSearchParams();
  const uploadOpen = params.get('upload') === '1';
  const setUploadOpen = (open: boolean) => setParams(open ? { upload: '1' } : {}, { replace: true });
  const { data: docs = [], isLoading, error } = useQuery({ queryKey: ['documents', 'me'], queryFn: documentsApi.mine });

  return (
    <>
      <PageHeader title="My documents" subtitle="HR is alerted automatically when a document is close to expiry."
        actions={<Button onClick={() => setUploadOpen(true)}><Upload className="h-4 w-4" /> Upload document</Button>} />

      <Card>
        {isLoading && <Loading />}
        <ErrorMessage error={error} />
        {!isLoading && docs.length === 0 && <EmptyState title="No documents yet">Upload your CPR, passport and certificates so HR has them on file.</EmptyState>}
        <ul className="divide-y divide-slate-100">
          {docs.map((d) => {
            const s = expiryStatus(d);
            return (
              <li key={d.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-900">{d.title}</p>
                  <p className="text-xs text-slate-500">{CATEGORY_LABEL[d.category] ?? d.category} · added {fmtDate(d.createdAt)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-500">
                    {d.expiryDate ? (s.daysLeft! < 0 ? `Expired ${fmtDate(d.expiryDate)}` : s.tone === 'warn' ? `Expires in ${s.daysLeft} days` : `Expires ${fmtDate(d.expiryDate)}`) : '-'}
                  </span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${toneClass[s.tone]}`}>{s.label}</span>
                  {s.tone !== 'ok'
                    ? <Button variant="secondary" className="px-3 py-1" onClick={() => setUploadOpen(true)}>Upload new</Button>
                    : <Button variant="secondary" className="px-3 py-1" onClick={() => documentsApi.download(d)}><Download className="h-4 w-4" /> View</Button>}
                </div>
              </li>
            );
          })}
        </ul>
      </Card>

      <Modal title="Upload a document" open={uploadOpen} onClose={() => setUploadOpen(false)}>
        <UploadForm onDone={() => setUploadOpen(false)} />
      </Modal>
    </>
  );
}

function UploadForm({ onDone }: { onDone: () => void }) {
  const qc = useQueryClient();
  const [title, setTitle] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const upload = useMutation({
    // employees upload as "personal"; HR files it under the right category
    mutationFn: () => documentsApi.upload({ file: file!, category: 'personal', title: title.trim(), expiryDate: expiryDate || undefined }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['documents', 'me'] });
      onDone();
    },
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return setFormError('Give the document a name, e.g. "Passport"');
    if (!file) return setFormError('Choose a file');
    if (file.size > 5 * 1024 * 1024) return setFormError('The file must be 5 MB or smaller');
    setFormError(null);
    upload.mutate();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="label" htmlFor="title">Document name</label>
        <input id="title" className="input" placeholder="e.g. Passport (renewed)" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={150} />
      </div>
      <div>
        <label className="label" htmlFor="expiry">Expiry date (if it has one)</label>
        <input id="expiry" type="date" className="input" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />
      </div>
      <div>
        <label className="label" htmlFor="docfile">File</label>
        <input id="docfile" type="file" accept=".pdf,.jpg,.jpeg,.png" className="text-sm" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        <p className="mt-1 text-xs text-slate-500">PDF, JPEG or PNG, up to 5 MB.</p>
      </div>
      <ErrorMessage error={formError ?? upload.error} />
      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onDone}>Cancel</Button>
        <Button type="submit" loading={upload.isPending}>Upload</Button>
      </div>
    </form>
  );
}
