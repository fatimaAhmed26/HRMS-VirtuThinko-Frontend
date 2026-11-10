// /api/scanner - Import completed form: reads a filled onboarding form with AI (HR only)
import { api } from '../lib/api';

export const status = () => api.get<{ ready: boolean }>('/scanner/status').then((r) => r.data);

// Import completed form: a filled VTHR-ONB-F01 (Word, PDF or photo), answers in Add employee field names
export interface ImportedForm {
  kind: 'docx' | 'pdf' | 'image';
  fileName: string;
  fields: Record<string, string | boolean>;
  dependants: Record<string, string>[];
  education: Record<string, string>[];
  certifications: Record<string, string>[];
  employers: Record<string, string>[];
  checklistNotApplicable: string[];
  check: { field: string; reason: string }[];
  attachments: { kind: string; picture: { name: string; mime: string; data: string } | null }[];
}

export function importForm(file: File) {
  const form = new FormData();
  form.append('file', file);
  // a long form can take up to a minute to read
  return api.post<ImportedForm>('/scanner/form', form, { timeout: 150_000 }).then((r) => r.data);
}
