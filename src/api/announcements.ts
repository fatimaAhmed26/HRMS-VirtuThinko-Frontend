// /api/announcements - everyone reads their own; HR manages
import { api, downloadFile } from '../lib/api';
import type { Announcement } from '../types';

export const forMe = () => api.get<Announcement[]>('/announcements/me').then((r) => r.data);
// Announcement image as a temporary URL for <img> (the file needs the login token, so a plain src won't work)
export const attachmentUrl = (id: number) =>
  api.get(`/announcements/${id}/attachment`, { responseType: 'blob' }).then((r) => URL.createObjectURL(r.data as Blob));

export const downloadAttachment = (a: Pick<Announcement, 'id' | 'attachmentName'>) =>
  downloadFile(`/announcements/${a.id}/attachment`, a.attachmentName ?? 'attachment');
