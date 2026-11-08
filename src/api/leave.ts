// /api/leave - types, holidays, balances, requests and approvals (Bahrain and Saudi rules)
import { api } from '../lib/api';
import type { Entity, LeaveBalance, LeaveRequest, LeaveStatus, LeaveType, Paginated, PublicHoliday } from '../types';

export const types = (country: Entity) => api.get<LeaveType[]>('/leave/types', { params: { country } }).then((r) => r.data);
export const updateType = (id: number, data: Partial<LeaveType>) => api.patch<LeaveType>(`/leave/types/${id}`, data).then((r) => r.data);

export const holidays = (params: { country?: Entity; year?: number } = {}) =>
  api.get<PublicHoliday[]>('/leave/holidays', { params }).then((r) => r.data);
export const addHoliday = (data: { country: Entity; date: string; name: string }) =>
  api.post<PublicHoliday>('/leave/holidays', data).then((r) => r.data);
export const deleteHoliday = (id: number) => api.delete(`/leave/holidays/${id}`);

export interface BalancesResponse {
  employee: { id: number; firstName: string; lastName: string; country: Entity };
  year: number;
  balances: LeaveBalance[];
}
export const myBalances = () => api.get<BalancesResponse>('/leave/balances/me').then((r) => r.data);
export const employeeBalances = (employeeId: number) =>
  api.get<BalancesResponse>(`/leave/balances/${employeeId}`).then((r) => r.data);

export interface NewLeaveRequest {
  leaveTypeId: number;
  startDate: string; // "2026-12-20"
  endDate: string;
  reason?: string;
  attachmentId?: number; // upload first with documents.upload (category leave_attachment)
}
export const createRequest = (data: NewLeaveRequest) => api.post<LeaveRequest>('/leave/requests', data).then((r) => r.data);
export const myRequests = () => api.get<LeaveRequest[]>('/leave/requests/me').then((r) => r.data);
export const pendingApprovals = () => api.get<LeaveRequest[]>('/leave/requests/pending').then((r) => r.data);
export const listRequests = (params: {
  status?: LeaveStatus; employeeId?: number; leaveTypeId?: number; departmentId?: number; from?: string; to?: string; page?: number; pageSize?: number;
} = {}) => api.get<Paginated<LeaveRequest>>('/leave/requests', { params }).then((r) => r.data);
export const getRequest = (id: number) => api.get<LeaveRequest>(`/leave/requests/${id}`).then((r) => r.data);
export const approve = (id: number, comment?: string) => api.post<LeaveRequest>(`/leave/requests/${id}/approve`, { comment }).then((r) => r.data);
export const reject = (id: number, comment?: string) => api.post<LeaveRequest>(`/leave/requests/${id}/reject`, { comment }).then((r) => r.data);
export const cancel = (id: number) => api.post<LeaveRequest>(`/leave/requests/${id}/cancel`).then((r) => r.data);
