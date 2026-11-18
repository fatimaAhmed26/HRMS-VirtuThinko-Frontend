// /api/contracts - one active contract per employee; states Active / Inactive / Ended
import { api, downloadFile } from '../lib/api';
import type { Contract, SalaryItem } from '../types';

interface ContractFilters {
  employeeId?: number;
  status?: 'active' | 'expiring_soon' | 'renewed' | 'expired' | 'terminated';
  expiringWithinDays?: number;
  state?: 'Active' | 'Inactive' | 'Ended';
}

// Amounts are numbers in the request; the server stores them as BHD/SAR with 3 (or 2) decimals
export interface ContractInput {
  employeeId: number;
  contractType: 'unlimited' | 'limited';
  title?: string;
  employingEntity?: string;
  jobTitle?: string;
  startDate: string;
  endDate?: string;
  basicSalary: number;
  housingAllowance: number;
  transportAllowance: number;
  weeklyHours?: number;
  probationMonths?: number;
  noticeDays?: number;
  annualLeaveDays?: number;
  items?: SalaryItem[];
  notes?: string;
}

export const list = (params: ContractFilters = {}) => api.get<Contract[]>('/contracts', { params }).then((r) => r.data);
export const get = (id: number) => api.get<Contract>(`/contracts/${id}`).then((r) => r.data);
export const mine = () => api.get<Contract[]>('/contracts/me').then((r) => r.data); // no salary figures
export const create = (data: ContractInput | Record<string, unknown>) => api.post<Contract>('/contracts', data).then((r) => r.data);
export const sendForSignature = (id: number) => api.post<Contract>(`/contracts/${id}/send-for-signature`).then((r) => r.data);
export const pdfDownload = (id: number, fallbackName: string) => downloadFile(`/contracts/${id}/pdf`, fallbackName);
