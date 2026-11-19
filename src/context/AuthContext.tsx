import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../services/api';
import { User } from '../types';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  isStaff: boolean;
  isAdmin: boolean;
  login: (identifier: string, password: string) => Promise<User>;
  register: (payload: { username: string; password: string }) => Promise<User>;
  completeProfile: (payload: {
    first_name: string;
    last_name: string;
    phone: string;
    address: string;
    house_number: string;
    extra_info?: string;
  }) => Promise<User>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    const token = localStorage.getItem('aqllimahalla_token');
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const res = await api.get<{ user: User }>('/auth/me');
      setUser(res.data.user);
    } catch {
      localStorage.removeItem('aqllimahalla_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (identifier: string, password: string) => {
    const res = await api.post<{ token: string; user: User }>('/auth/login', {
      identifier,
      password,
    });
    localStorage.setItem('aqllimahalla_token', res.data.token);
    setUser(res.data.user);
    return res.data.user;
  };

  const register = async (payload: { username: string; password: string }) => {
    const res = await api.post<{ token: string; user: User }>('/auth/register', payload);
    localStorage.setItem('aqllimahalla_token', res.data.token);
    setUser(res.data.user);
    return res.data.user;
  };

  const completeProfile = async (payload: {
    first_name: string;
    last_name: string;
    phone: string;
    address: string;
    house_number: string;
    extra_info?: string;
  }) => {
    const res = await api.put<{ user: User }>('/auth/profile', payload);
    setUser(res.data.user);
    return res.data.user;
  };

  const logout = () => {
    localStorage.removeItem('aqllimahalla_token');
    setUser(null);
  };

  const isStaff = Boolean(
    user?.roles.some((r) => ['super_admin', 'mahalla_raisi', 'masul_xodim'].includes(r))
  );
  const isAdmin = Boolean(user?.roles.some((r) => ['super_admin', 'mahalla_raisi'].includes(r)));

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isStaff,
        isAdmin,
        login,
        register,
        completeProfile,
        logout,
        refreshUser,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
