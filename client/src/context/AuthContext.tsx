import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AuthRole, AuthUser } from '../types/medikiosk';
import {
  fetchCurrentUser,
  getAuthToken,
  loginAccount,
  logoutAccount,
  registerAccount,
  setAuthToken,
} from '../utils/api';

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string, expectedRole?: AuthRole) => Promise<AuthUser>;
  register: (payload: {
    name: string;
    email: string;
    password: string;
    role: AuthRole;
    phone?: string;
  }) => Promise<AuthUser>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      setLoading(false);
      return;
    }

    fetchCurrentUser()
      .then((res) => setUser(res.user))
      .catch(() => {
        setAuthToken(null);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string, expectedRole?: AuthRole) => {
    const res = await loginAccount({ email, password, expectedRole });
    setAuthToken(res.token);
    setUser(res.user);
    return res.user;
  }, []);

  const register = useCallback(async (payload: {
    name: string;
    email: string;
    password: string;
    role: AuthRole;
    phone?: string;
  }) => {
    const res = await registerAccount(payload);
    setAuthToken(res.token);
    setUser(res.user);
    return res.user;
  }, []);

  const logout = useCallback(async () => {
    await logoutAccount();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, register, logout }),
    [user, loading, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
