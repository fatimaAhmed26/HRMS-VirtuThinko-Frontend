// /api/auth - login, refresh (cookie), logout, current user
import { api } from '../lib/api';
import type { AuthUser } from '../types';

export interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}

export const login = (identifier: string, password: string) =>
  api.post<LoginResponse>('/auth/login', { identifier, password }).then((r) => r.data);

export const logout = () => api.post('/auth/logout');

export const me = () => api.get<AuthUser & { lastLoginAt: string | null }>('/auth/me').then((r) => r.data);

export const changeOwnPassword = (currentPassword: string, newPassword: string) =>
  api.patch('/users/me/password', { currentPassword, newPassword }).then((r) => r.data);
