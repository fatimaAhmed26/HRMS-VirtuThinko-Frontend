// /api/scanner - reads an ID document with AI (HR only); saving the file uses documents.upload
import { api } from '../lib/api';

export type ScanType = 'cpr' | 'passport' | 'iqama' | 'permit' | 'certificate';

export const SCAN_TYPES: { value: ScanType; label: string }[] = [
  { value: 'cpr', label: 'CPR card' },
  { value: 'passport', label: 'Passport' },
  { value: 'iqama', label: 'Iqama / Saudi ID' },
  { value: 'permit', label: 'Work permit (LMRA)' },
  { value: 'certificate', label: 'Certificate' },
];
export const scanTypeLabel = (t: ScanType) => SCAN_TYPES.find((s) => s.value === t)!.label;

export interface ScannedFields {
  matchesType: boolean;
  readable: boolean;
  fullNameEn: string | null;
  fullNameAr: string | null;
  idNumber: string | null;
  dateOfBirth: string | null;
  placeOfBirth: string | null;
  nationality: string | null;
  sex: 'Male' | 'Female' | null;
  issueDate: string | null;
  expiryDate: string | null;
  placeOfIssue: string | null;
  employer: string | null;
  certificateTitle: string | null;
  issuingBody: string | null;
  notes: string[];
}

export interface ScanResult {
  type: ScanType;
  fields: ScannedFields;
  match: { id: number; employeeCode: string; firstName: string; lastName: string; jobTitle: string | null } | null;
}

export const status = () => api.get<{ ready: boolean }>('/scanner/status').then((r) => r.data);

export function read(type: ScanType, file: File) {
  const form = new FormData();
  form.append('type', type);
  form.append('file', file);
  // reading can take a while; allow up to 90 seconds
  return api.post<ScanResult>('/scanner/read', form, { timeout: 90_000 }).then((r) => r.data);
}
