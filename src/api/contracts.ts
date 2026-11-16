// /api/contracts - one active contract per employee; states Active / Inactive / Ended
import { api } from '../lib/api';
import type { Contract } from '../types';

interface ContractFilters {
  employeeId?: number;
  status?: 'active' | 'expiring_soon' | 'renewed' | 'expired' | 'terminated';
  expiringWithinDays?: number;
  state?: 'Active' | 'Inactive' | 'Ended';
}

export const list = (params: ContractFilters = {}) => api.get<Contract[]>('/contracts', { params }).then((r) => r.data);
export const mine = () => api.get<Contract[]>('/contracts/me').then((r) => r.data); // no salary figures
export const create = (data: Record<string, unknown>) => api.post<Contract>('/contracts', data).then((r) => r.data);
