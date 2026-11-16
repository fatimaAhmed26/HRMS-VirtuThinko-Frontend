// /api/departments and /api/clients (client companies for outsourced staff)
import { api } from '../lib/api';
import type { ClientCompany, Department, JobTitle } from '../types';

export const departments = () => api.get<Department[]>('/departments').then((r) => r.data);
export const createDepartment = (data: { name: string; managerId?: number | null; location?: string | null }) =>
  api.post<Department>('/departments', data).then((r) => r.data);
export const updateDepartment = (id: number, data: { name?: string; managerId?: number | null; location?: string | null }) =>
  api.patch<Department>(`/departments/${id}`, data).then((r) => r.data);

export interface JobTitleInput {
  name: string;
  grade?: string | null;
  country: 'BH' | 'SA';
  minSalary?: number | null;
  maxSalary?: number | null;
}
export const jobTitles = (departmentId: number) => api.get<JobTitle[]>(`/job-titles/department/${departmentId}`).then((r) => r.data);
export const createJobTitle = (departmentId: number, data: JobTitleInput) =>
  api.post<JobTitle>(`/job-titles/department/${departmentId}`, data).then((r) => r.data);
export const updateJobTitle = (id: number, data: Partial<JobTitleInput>) => api.patch<JobTitle>(`/job-titles/${id}`, data).then((r) => r.data);
export const deleteJobTitle = (id: number) => api.delete(`/job-titles/${id}`);

export const clients = () => api.get<ClientCompany[]>('/clients').then((r) => r.data);
