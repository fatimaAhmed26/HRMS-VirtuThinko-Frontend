// /api/contracts - one active contract per employee; states Active / Inactive / Ended
import { api } from '../lib/api';
import type { Contract } from '../types';

export interface ContractFilters {
  employeeId?: number;
  status?: 'active' | 'expiring_soon' | 'renewed' | 'expired' | 'terminated';
  expiringWithinDays?: number;
  state?: 'Active' | 'Inactive' | 'Ended';
}

export const list = (params: ContractFilters = {}) => api.get<Contract[]>('/contracts', { params }).then((r) => r.data);
export const get = (id: number) => api.get<Contract>(`/contracts/${id}`).then((r) => r.data);
export const mine = () => api.get<Contract[]>('/contracts/me').then((r) => r.data); // no salary figures
export const create = (data: Record<string, unknown>) => api.post<Contract>('/contracts', data).then((r) => r.data);
export const expire = (id: number) => api.post<Contract>(`/contracts/${id}/expire`).then((r) => r.data);
export const terminate = (id: number, reason: string) => api.post<Contract>(`/contracts/${id}/terminate`, { reason }).then((r) => r.data);
