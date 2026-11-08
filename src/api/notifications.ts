// /api/notifications - each user only sees their own
import { api } from '../lib/api';
import type { AppNotification, Paginated } from '../types';

export const list = (params: { unreadOnly?: boolean; page?: number; pageSize?: number } = {}) =>
  api.get<Paginated<AppNotification> & { unread: number }>('/notifications', { params }).then((r) => r.data);
export const unreadCount = () => api.get<{ unread: number }>('/notifications/unread-count').then((r) => r.data.unread);
export const markRead = (id: number) => api.post(`/notifications/${id}/read`);
export const markAllRead = () => api.post('/notifications/read-all');
