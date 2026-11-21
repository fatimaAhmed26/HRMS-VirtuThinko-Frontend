// /api/announcements - everyone reads their own; HR manages
import { api, downloadFile } from '../lib/api';
import type { Announcement, AnnouncementAdmin } from '../types';

export const forMe = () => api.get<Announcement[]>('/announcements/me').then((r) => r.data);
// Announcement image as a temporary URL for <img> (the file needs the login token, so a plain src won't work)
export const attachmentUrl = (id: number) =>
  api.get(`/announcements/${id}/attachment`, { responseType: 'blob' }).then((r) => URL.createObjectURL(r.data as Blob));

export const downloadAttachment = (a: Pick<Announcement, 'id' | 'attachmentName'>) =>
  downloadFile(`/announcements/${a.id}/attachment`, a.attachmentName ?? 'attachment');

// HR management. Dates are ISO strings. On update, expiresAt: null removes the end date.
export interface AnnouncementInput {
  title: string;
  body: string;
  priority: 'normal' | 'important' | 'urgent';
  pinned: boolean;
  audience: 'all' | 'departments' | 'employees';
  departmentIds?: number[];
  employeeIds?: number[];
  publishAt?: string;
  expiresAt?: string | null;
}

export const listAll = () => api.get<AnnouncementAdmin[]>('/announcements').then((r) => r.data);
export const create = (data: AnnouncementInput) => api.post<AnnouncementAdmin>('/announcements', data).then((r) => r.data);
export const update = (id: number, data: Partial<AnnouncementInput>) =>
  api.patch<AnnouncementAdmin>(`/announcements/${id}`, data).then((r) => r.data);
export const remove = (id: number) => api.delete(`/announcements/${id}`);

// Banner image or PDF, sent in the "file" field
export function attach(id: number, file: File) {
  const form = new FormData();
  form.append('file', file);
  return api.post<Announcement>(`/announcements/${id}/attachment`, form).then((r) => r.data);
}
