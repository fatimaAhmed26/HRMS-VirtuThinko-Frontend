// /api/auth - login, refresh (cookie), logout, current user
import { api, setAccessToken } from '../lib/api';
import type { AuthUser } from '../types';

export interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}

export const login = (identifier: string, password: string) =>
  api.post<LoginResponse>('/auth/login', { identifier, password }).then((r) => r.data);

export const logout = () => api.post('/auth/logout');

export const me = () => api.get<AuthUser & { lastLoginAt: string | null }>('/auth/me').then((r) => r.data);

// Changing the password signs out other devices; this device gets a new token so it stays signed in
export const changeOwnPassword = (currentPassword: string, newPassword: string) =>
  api.patch<{ message: string; accessToken: string }>('/users/me/password', { currentPassword, newPassword }).then((r) => {
    setAccessToken(r.data.accessToken);
    return r.data;
  });
