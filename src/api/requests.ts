// /api/requests - HR requests and letters (salary certificate, NOC...)
import { api } from '../lib/api';
import type { EmployeeRequest, Paginated, RequestStatus, RequestType } from '../types';

export const types = () => api.get<RequestType[]>('/requests/types').then((r) => r.data);
export const updateType = (id: number, data: Partial<RequestType> & { template?: string | null }) =>
  api.patch<RequestType>(`/requests/types/${id}`, data).then((r) => r.data);

export const create = (data: { typeId: number; purpose: string; details?: string; addressedTo?: string; attachmentId?: number }) =>
  api.post<EmployeeRequest>('/requests', data).then((r) => r.data);
export const mine = () => api.get<EmployeeRequest[]>('/requests/me').then((r) => r.data);
export const cancel = (id: number) => api.post<EmployeeRequest>(`/requests/${id}/cancel`).then((r) => r.data);

export const list = (params: { status?: RequestStatus; typeId?: number; employeeId?: number; page?: number; pageSize?: number } = {}) =>
  api.get<Paginated<EmployeeRequest>>('/requests', { params }).then((r) => r.data);
export const get = (id: number) => api.get<EmployeeRequest>(`/requests/${id}`).then((r) => r.data);

// HR flow: start -> generate (letters) -> approve -> complete (releases it to the employee)
export const start = (id: number) => api.post<EmployeeRequest>(`/requests/${id}/start`).then((r) => r.data);
export const generate = (id: number) => api.post<EmployeeRequest>(`/requests/${id}/generate`).then((r) => r.data);
export const approve = (id: number, comment?: string) => api.post<EmployeeRequest>(`/requests/${id}/approve`, { comment }).then((r) => r.data);
export const complete = (id: number, data: { documentId?: number; comment?: string } = {}) =>
  api.post<EmployeeRequest>(`/requests/${id}/complete`, data).then((r) => r.data);
export const reject = (id: number, comment: string) => api.post<EmployeeRequest>(`/requests/${id}/reject`, { comment }).then((r) => r.data);
