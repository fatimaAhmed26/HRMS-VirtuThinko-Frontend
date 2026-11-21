// /api/users - portal accounts. Listing needs user:view; linking an account needs user:manage.
import { api } from '../lib/api';
import type { Paginated } from '../types';

export interface PortalUser {
  id: number;
  username: string;
  email: string;
  status: 'active' | 'inactive';
  lastLoginAt: string | null;
  employee: { id: number; employeeCode: string; firstName: string; lastName: string; status: string } | null;
  roles: { id: number; name: string }[];
}

export const list = (params: { page?: number; pageSize?: number } = {}) =>
  api.get<Paginated<PortalUser>>('/users', { params }).then((r) => r.data);

// null unlinks the account from its employee record
export const linkEmployee = (id: number, employeeId: number | null) =>
  api.patch<PortalUser>(`/users/${id}`, { employeeId }).then((r) => r.data);
