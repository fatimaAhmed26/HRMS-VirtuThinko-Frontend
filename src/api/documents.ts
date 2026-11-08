// /api/documents - PDF/JPEG/PNG up to 5 MB
import { api, downloadFile } from '../lib/api';
import type { HrDocument, Paginated } from '../types';

export interface UploadInput {
  file: File;
  employeeId?: number; // HR uploading for someone; leave empty for your own documents
  category: string; // leave_attachment | id_copy | certificate | contract | personal | request_attachment | other
  title: string;
  expiryDate?: string;
  visibleToEmployee?: boolean;
  notes?: string;
}

export function upload(input: UploadInput) {
  const form = new FormData();
  form.append('file', input.file);
  Object.entries(input).forEach(([key, value]) => {
    if (key !== 'file' && value !== undefined && value !== '') form.append(key, String(value));
  });
  return api.post<HrDocument>('/documents', form).then((r) => r.data);
}

export const mine = () => api.get<HrDocument[]>('/documents/me').then((r) => r.data);
export const list = (params: { employeeId?: number; category?: string; page?: number; pageSize?: number } = {}) =>
  api.get<Paginated<HrDocument>>('/documents', { params }).then((r) => r.data);
export const get = (id: number) => api.get<HrDocument>(`/documents/${id}`).then((r) => r.data);
export const download = (doc: Pick<HrDocument, 'id' | 'originalName'>) => downloadFile(`/documents/${doc.id}/download`, doc.originalName);
export const remove = (id: number) => api.delete(`/documents/${id}`);
