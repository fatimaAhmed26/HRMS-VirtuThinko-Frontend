import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import * as documentsApi from '../../api/documents';
import * as employeesApi from '../../api/employees';
import { ErrorMessage } from '../../components/ui/Feedback';
import { Modal } from '../../components/ui/Modal';
import type { InternListItem } from '../../types';
import { INTERN_DOCS, MAX_FILE, docApplies, type InternDocKey } from './internDocs';

export function ChecklistDialog({ intern, canEdit, onClose }: { intern: InternListItem | null; canEdit: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const upload = useMutation({
    mutationFn: async ({ key, file }: { key: InternDocKey; file: File }) => {
      const doc = INTERN_DOCS.find((d) => d.key === key)!;
      await documentsApi.upload({ file, employeeId: intern!.id, category: doc.category, title: doc.label });
      await employeesApi.update(intern!.id, { documentChecklist: { ...(intern!.documentChecklist ?? {}), [key]: { received: true } } });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['interns'] }),
  });

  function pick(key: InternDocKey, file: File | undefined) {
    if (!file) return;
    if (file.size > MAX_FILE) return setError(`"${file.name}" is larger than 5 MB`);
    setError(null);
    upload.mutate({ key, file });
  }

  return (
    <Modal title={intern ? `Documents · ${intern.firstName} ${intern.lastName}` : ''} open={!!intern} onClose={() => { setError(null); upload.reset(); onClose(); }}>
      {intern && (
        <div className="space-y-3">
          <ul className="divide-y divide-slate-100">
            {INTERN_DOCS.filter((d) => docApplies(d, intern.internType)).map((d) => {
              const received = intern.documentChecklist?.[d.key]?.received;
              const busy = upload.isPending && upload.variables?.key === d.key;
              return (
                <li key={d.key} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <span>
                    <span className="text-slate-800">{d.label}</span>
                    <span className={`ml-2 rounded-full px-2 py-0.5 text-xs font-medium ${received ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{received ? 'Received' : 'Missing'}</span>
                  </span>
                  {canEdit && (
                    <label className="cursor-pointer rounded-lg border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50">
                      {busy ? 'Uploading…' : received ? 'Replace' : 'Upload'}
                      <input type="file" accept={d.accept} className="sr-only" disabled={upload.isPending} aria-label={`Upload ${d.label}`}
                        onChange={(e) => { pick(d.key, e.target.files?.[0]); e.target.value = ''; }} />
                    </label>
                  )}
                </li>
              );
            })}
          </ul>
          <ErrorMessage error={error || upload.error} />
        </div>
      )}
    </Modal>
  );
}
