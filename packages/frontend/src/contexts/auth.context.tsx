import { createContext, useContext, useState, ReactNode } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';
import { z } from 'zod';
import { loginRequestSchema, type LoginResponse } from 'shared';

import { apiFetch } from '../lib/api';

// API call (will be moved to api client later or here)
const loginApi = async (credentials: z.infer<typeof loginRequestSchema>): Promise<LoginResponse> => {
  return apiFetch<LoginResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
};

interface AuthContextType {
  isAuthenticated: boolean;
  token: string | null;
  user: string | null;
  login: (credentials: z.infer<typeof loginRequestSchema>) => Promise<LoginResponse>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [user, setUser] = useState<string | null>(localStorage.getItem('user'));
  const router = useRouter();

  const loginMutation = useMutation({
    mutationFn: loginApi,
    onSuccess: (data, variables) => {
      // data 现在是 { success: true, token: "..." } 整个对象
      if (data && data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', variables.username);
        setToken(data.token);
        setUser(variables.username);
        // Redirect to dashboard
        router.navigate({ to: '/' });
      }
    },
  });

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    router.navigate({ to: '/login' });
  };

  const isAuthenticated = !!token;

  return (
    <AuthContext.Provider value={{ isAuthenticated, token, user, login: loginMutation.mutateAsync, logout, isLoading: loginMutation.isPending }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
