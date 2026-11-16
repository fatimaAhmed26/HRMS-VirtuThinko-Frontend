// /api/requests - HR requests and letters (salary certificate, NOC...)
import { api } from '../lib/api';
import type { EmployeeRequest, Paginated, RequestStatus, RequestType } from '../types';

export const types = () => api.get<RequestType[]>('/requests/types').then((r) => r.data);

export const create = (data: { typeId: number; purpose: string; details?: string; addressedTo?: string; attachmentId?: number }) =>
  api.post<EmployeeRequest>('/requests', data).then((r) => r.data);
export const mine = () => api.get<EmployeeRequest[]>('/requests/me').then((r) => r.data);
export const cancel = (id: number) => api.post<EmployeeRequest>(`/requests/${id}/cancel`).then((r) => r.data);

export const list = (params: { status?: RequestStatus; typeId?: number; employeeId?: number; page?: number; pageSize?: number } = {}) =>
  api.get<Paginated<EmployeeRequest>>('/requests', { params }).then((r) => r.data);

// HR issues a letter from the employee profile: created, generated and closed in one step
export const issue = (data: { employeeId: number; typeId: number; purpose: string; addressedTo?: string }) =>
  api.post<EmployeeRequest>('/requests/issue', data).then((r) => r.data);
