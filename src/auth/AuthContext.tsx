import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import * as authApi from '../api/auth';
import { refreshAccessToken, setAccessToken, setSessionExpiredHandler, api } from '../lib/api';
import { HR_PERMISSIONS, type Permission } from '../lib/permissions';
import type { AuthUser } from '../types';
import { AuthContext, type AuthState } from './useAuth';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  const clear = useCallback(() => {
    setAccessToken(null);
    setUser(null);
    queryClient.clear(); // never show the previous user's data to the next one
  }, [queryClient]);

  // On first load: use the refresh cookie (if any) to get a new access token and the user
  useEffect(() => {
    setSessionExpiredHandler(clear);
    refreshAccessToken()
      .then(() => api.get<AuthUser>('/auth/me'))
      .then((r) => setUser(r.data))
      .catch(() => clear())
      .finally(() => setLoading(false));
  }, [clear]);

  const login = useCallback(async (identifier: string, password: string) => {
    const res = await authApi.login(identifier, password);
    setAccessToken(res.accessToken);
    setUser(res.user);
    return res.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      clear();
    }
  }, [clear]);

  const value = useMemo<AuthState>(() => {
    const can = (...perms: Permission[]) => !!user && perms.some((p) => user.permissions.includes(p));
    return { user, loading, login, logout, can, isHr: can(...HR_PERMISSIONS) };
  }, [user, loading, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
