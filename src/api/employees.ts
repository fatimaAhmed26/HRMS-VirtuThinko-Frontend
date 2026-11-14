// /api/employees - list, profile, add, edit, deactivate, history, self-service
import { api, downloadFile } from '../lib/api';
import type { DirectoryEntry, Employee, EmployeeListItem, EmploymentType, Entity, InternListItem, Paginated } from '../types';

export interface EmployeeFilters {
  search?: string;
  departmentId?: number;
  jobTitle?: string;
  employmentType?: EmploymentType;
  clientCompanyId?: number;
  status?: 'active' | 'inactive';
  country?: Entity;
  page?: number;
  pageSize?: number;
}

export const list = (params: EmployeeFilters = {}) =>
  api.get<Paginated<EmployeeListItem>>('/employees', { params }).then((r) => r.data);
export const get = (id: number) => api.get<Employee>(`/employees/${id}`).then((r) => r.data);
export interface HistoryEntry {
  id: number;
  action: string; // employee.create, employee.update, letter.issued, ...
  changes: Record<string, unknown> | null;
  actor: { id: number; username: string | null } | null;
  createdAt: string;
}
export const history = (id: number) => api.get<HistoryEntry[]>(`/employees/${id}/history`).then((r) => r.data);
// the onboarding form sends dependants / qualifications / previousEmployments as arrays
export const create = (data: Record<string, unknown>) => api.post<Employee>('/employees', data).then((r) => r.data);
export const update = (id: number, data: Partial<Employee>) => api.patch<Employee>(`/employees/${id}`, data).then((r) => r.data);
export const setStatus = (id: number, status: 'active' | 'inactive', reason?: string) =>
  api.patch<Employee>(`/employees/${id}/status`, { status, reason }).then((r) => r.data);

// colleague directory for everyone (work contact details only)
export const directory = (search?: string) =>
  api.get<DirectoryEntry[]>('/employees/directory', { params: { search: search || undefined } }).then((r) => r.data);

// self-service: an employee can only change phone, address and emergency contact
export const me = () => api.get<Employee>('/employees/me').then((r) => r.data);
export const updateMe = (data: Pick<Employee, 'phone' | 'address' | 'emergencyName' | 'emergencyPhone'>) =>
  api.patch<Employee>('/employees/me', data).then((r) => r.data);

export const interns = () => api.get<InternListItem[]>('/employees/interns').then((r) => r.data);

export type InternLetter = 'acceptance-letter' | 'proposal-form';
const letterUrl = (id: number, kind: InternLetter, opts: { date?: string; weeks?: number } = {}) => {
  const q = new URLSearchParams();
  if (kind === 'acceptance-letter' && opts.date) q.set('date', opts.date);
  if (kind === 'acceptance-letter' && opts.weeks) q.set('weeks', String(opts.weeks));
  return `/employees/${id}/${kind}${q.size ? `?${q}` : ''}`;
};
export const internLetterBlob = (id: number, kind: InternLetter, opts?: { date?: string; weeks?: number }) =>
  api.get<Blob>(letterUrl(id, kind, opts), { responseType: 'blob' }).then((r) => r.data);
export const internLetterDownload = (id: number, kind: InternLetter, opts?: { date?: string; weeks?: number }) =>
  downloadFile(letterUrl(id, kind, opts), kind === 'proposal-form' ? 'Proposal_Acceptance_Form.pdf' : 'Internship_Acceptance_Letter.pdf');
