// /api/employees - list, profile, add, edit, deactivate, history, self-service
import { api } from '../lib/api';
import type { Employee, EmployeeListItem, EmploymentType, Entity, Paginated } from '../types';

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
export const history = (id: number) => api.get(`/employees/${id}/history`).then((r) => r.data);
export const create = (data: Partial<Employee>) => api.post<Employee>('/employees', data).then((r) => r.data);
export const update = (id: number, data: Partial<Employee>) => api.patch<Employee>(`/employees/${id}`, data).then((r) => r.data);
export const setStatus = (id: number, status: 'active' | 'inactive', reason?: string) =>
  api.patch<Employee>(`/employees/${id}/status`, { status, reason }).then((r) => r.data);

// self-service: an employee can only change phone, address and emergency contact
export const me = () => api.get<Employee>('/employees/me').then((r) => r.data);
export const updateMe = (data: Pick<Employee, 'phone' | 'address' | 'emergencyName' | 'emergencyPhone'>) =>
  api.patch<Employee>('/employees/me', data).then((r) => r.data);
