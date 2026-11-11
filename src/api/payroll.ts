// /api/payroll - runs per entity (BH / SA), payslips, allowances & deductions. HR and payroll only.
import { api, downloadFile } from '../lib/api';
import type { Entity, PayItem, PayItemType, PayrollRun, Payslip, PayrollStatus } from '../types';

export const runs = (params: { entity?: Entity } = {}) => api.get<PayrollRun[]>('/payroll/runs', { params }).then((r) => r.data);
export const run = (id: number) => api.get<PayrollRun>(`/payroll/runs/${id}`).then((r) => r.data);
export const createRun = (period: string, entity: Entity) => api.post<PayrollRun>('/payroll/runs', { period, entity }).then((r) => r.data);
export const recalculate = (id: number) => api.post<PayrollRun>(`/payroll/runs/${id}/recalculate`).then((r) => r.data);
export const deleteRun = (id: number) => api.delete(`/payroll/runs/${id}`);

// Draft -> Under review -> Approved -> Processed -> Paid  (whoever prepares cannot approve)
export type RunAction = 'submit' | 'approve' | 'return' | 'process' | 'pay';
export const transition = (id: number, action: RunAction, comment?: string) =>
  api.post<PayrollRun>(`/payroll/runs/${id}/${action}`, { comment }).then((r) => r.data);
export const bankFile = (id: number) => downloadFile(`/payroll/runs/${id}/bank-file`, `bank-transfer-${id}.csv`);

// one employee's payslip history (employee profile, HR / payroll only)
export interface PayslipSummary { id: number; currency: string; grossSalary: string; netSalary: string; run: { period: string; status: PayrollStatus } }
export const employeePayslips = (employeeId: number) =>
  api.get<PayslipSummary[]>('/payroll/payslips', { params: { employeeId } }).then((r) => r.data);

export const payslip = (id: number) => api.get<Payslip>(`/payroll/payslips/${id}`).then((r) => r.data);
export const payslipPdf = (id: number) => downloadFile(`/payroll/payslips/${id}/pdf`, `payslip-${id}.pdf`);

export const itemTypes = () => api.get<PayItemType[]>('/payroll/item-types').then((r) => r.data);
export const createItemType = (data: Pick<PayItemType, 'code' | 'name' | 'kind'> & { contributory?: boolean }) =>
  api.post<PayItemType>('/payroll/item-types', data).then((r) => r.data);

export const items = (params: { employeeId?: number; status?: 'pending' | 'approved' | 'rejected' } = {}) =>
  api.get<PayItem[]>('/payroll/items', { params }).then((r) => r.data);
export const createItem = (data: { employeeId: number; typeId: number; amount: number; recurring?: boolean; fromPeriod: string; toPeriod?: string; reason?: string }) =>
  api.post<PayItem>('/payroll/items', data).then((r) => r.data);
export const approveItem = (id: number) => api.post<PayItem>(`/payroll/items/${id}/approve`).then((r) => r.data);
export const rejectItem = (id: number) => api.post<PayItem>(`/payroll/items/${id}/reject`).then((r) => r.data);
export const stopItem = (id: number, toPeriod: string) => api.patch<PayItem>(`/payroll/items/${id}/stop`, { toPeriod }).then((r) => r.data);
export const deleteItem = (id: number) => api.delete(`/payroll/items/${id}`);
