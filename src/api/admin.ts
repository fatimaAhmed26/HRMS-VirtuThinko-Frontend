// /api/users, /api/roles, /api/audit, /api/settings - system administration
import { api } from '../lib/api';
import type { AuditEntry, CompanySettings, Entity, Paginated, Role, UserAccount } from '../types';

export const users = (params: { search?: string; status?: string; page?: number; pageSize?: number } = {}) =>
  api.get<Paginated<UserAccount>>('/users', { params }).then((r) => r.data);
export const user = (id: number) => api.get<UserAccount>(`/users/${id}`).then((r) => r.data);
export const createUser = (data: { username: string; email?: string; employeeId?: number; roleIds: number[]; entityScope?: 'ALL' | Entity; password?: string }) =>
  api.post<UserAccount>('/users', data).then((r) => r.data);
export const updateUser = (id: number, data: { email?: string; entityScope?: 'ALL' | Entity }) =>
  api.patch<UserAccount>(`/users/${id}`, data).then((r) => r.data);
export const setRoles = (id: number, roleIds: number[]) => api.put<UserAccount>(`/users/${id}/roles`, { roleIds }).then((r) => r.data);
export const setUserStatus = (id: number, status: 'active' | 'inactive') =>
  api.patch<UserAccount>(`/users/${id}/status`, { status }).then((r) => r.data);
export const resetPassword = (id: number, password: string) => api.post(`/users/${id}/reset-password`, { password }).then((r) => r.data);

export const roles = () => api.get<Role[]>('/roles').then((r) => r.data);

export const audit = (params: Record<string, string | number | undefined> = {}) =>
  api.get<Paginated<AuditEntry>>('/audit', { params }).then((r) => r.data);

export const publicSettings = () => api.get<CompanySettings>('/settings/public').then((r) => r.data);
export const settings = () => api.get<CompanySettings>('/settings').then((r) => r.data);
export const updateSettings = (data: CompanySettings) => api.patch<CompanySettings>('/settings', data).then((r) => r.data);
export function uploadLogo(file: File) {
  const form = new FormData();
  form.append('file', file);
  return api.post('/settings/logo', form).then((r) => r.data);
}
export const runChecks = () => api.post('/settings/run-checks').then((r) => r.data);
