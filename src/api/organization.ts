// /api/departments and /api/clients (client companies for outsourced staff)
import { api } from '../lib/api';
import type { ClientCompany, Department } from '../types';

export const departments = () => api.get<Department[]>('/departments').then((r) => r.data);
export const createDepartment = (data: { name: string; managerId?: number | null }) =>
  api.post<Department>('/departments', data).then((r) => r.data);
export const updateDepartment = (id: number, data: { name?: string; managerId?: number | null }) =>
  api.patch<Department>(`/departments/${id}`, data).then((r) => r.data);

export const clients = () => api.get<ClientCompany[]>('/clients').then((r) => r.data);
export const createClient = (data: { name: string; nameAr?: string | null; annualLeaveDays: number }) =>
  api.post<ClientCompany>('/clients', data).then((r) => r.data);
export const updateClient = (id: number, data: Partial<Omit<ClientCompany, 'id'>>) =>
  api.patch<ClientCompany>(`/clients/${id}`, data).then((r) => r.data);
