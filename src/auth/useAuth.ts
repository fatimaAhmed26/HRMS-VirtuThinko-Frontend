import { createContext, useContext } from 'react';
import type { Permission } from '../lib/permissions';
import type { AuthUser } from '../types';

export interface AuthState {
  user: AuthUser | null;
  loading: boolean; // true while restoring the session after a page reload
  login: (identifier: string, password: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
  can: (...perms: Permission[]) => boolean; // true if the user has ANY of them
  isHr: boolean;
}

export const AuthContext = createContext<AuthState | null>(null);

// Use in any component: const { user, can, logout } = useAuth();
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
