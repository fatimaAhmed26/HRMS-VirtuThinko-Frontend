// /api/dashboard - HR dashboard (scoped to the user's entity) and employee home (no payroll)
import { api } from '../lib/api';
import type { AdminDashboard, EmployeeHome } from '../types';

export const admin = () => api.get<AdminDashboard>('/dashboard/admin').then((r) => r.data);
export const employeeHome = () => api.get<EmployeeHome>('/dashboard/me').then((r) => r.data);
