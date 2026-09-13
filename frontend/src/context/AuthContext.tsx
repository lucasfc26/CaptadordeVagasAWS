// ============================================
// JobWatch - Auth Context
// ============================================

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { User, LoginCredentials, RegisterData } from '@/types';
import { authService } from '@/services';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setIsLoading(false);
      return;
    }

    authService
      .me()
      .then(setUser)
      .catch(() => {
        localStorage.removeItem('auth_token');
        setUser(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    const data = await authService.login(credentials);
    localStorage.setItem('auth_token', data.accessToken);
    setUser(data.user);
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    const response = await authService.register(data);
    localStorage.setItem('auth_token', response.accessToken);
    setUser(response.user);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('auth_token');
    setUser(null);
  }, []);

  const updateUser = useCallback((updated: User) => {
    setUser(updated);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
