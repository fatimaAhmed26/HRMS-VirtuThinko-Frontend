// /api/departments and /api/clients (client companies for outsourced staff)
import { api } from '../lib/api';
import type { ClientCompany, Department } from '../types';

export const departments = () => api.get<Department[]>('/departments').then((r) => r.data);
export const createDepartment = (data: { name: string; managerId?: number | null; location?: string | null }) =>
  api.post<Department>('/departments', data).then((r) => r.data);
export const updateDepartment = (id: number, data: { name?: string; managerId?: number | null; location?: string | null }) =>
  api.patch<Department>(`/departments/${id}`, data).then((r) => r.data);

export const clients = () => api.get<ClientCompany[]>('/clients').then((r) => r.data);
