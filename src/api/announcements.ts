// /api/announcements - everyone reads their own; HR manages
import { api, downloadFile } from '../lib/api';
import type { Announcement } from '../types';

export const forMe = () => api.get<Announcement[]>('/announcements/me').then((r) => r.data);
export const get = (id: number) => api.get<Announcement>(`/announcements/${id}`).then((r) => r.data);
export const downloadAttachment = (a: Pick<Announcement, 'id' | 'attachmentName'>) =>
  downloadFile(`/announcements/${a.id}/attachment`, a.attachmentName ?? 'attachment');

export const listAll = () => api.get<Announcement[]>('/announcements').then((r) => r.data);
export const create = (data: Partial<Announcement> & { departmentIds?: number[]; employeeIds?: number[] }) =>
  api.post<Announcement>('/announcements', data).then((r) => r.data);
export const update = (id: number, data: Partial<Announcement> & { departmentIds?: number[]; employeeIds?: number[] }) =>
  api.patch<Announcement>(`/announcements/${id}`, data).then((r) => r.data);
export const remove = (id: number) => api.delete(`/announcements/${id}`);
export function uploadAttachment(id: number, file: File) {
  const form = new FormData();
  form.append('file', file);
  return api.post<Announcement>(`/announcements/${id}/attachment`, form).then((r) => r.data);
}
