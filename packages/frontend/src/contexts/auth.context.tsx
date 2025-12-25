import { createContext, useContext, useState, ReactNode } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';
import { z } from 'zod';
import { loginRequestSchema, type LoginResponse } from 'shared';

import { apiClient } from '../api/client';

// API call (will be moved to api client later or here)
const loginApi = async (credentials: z.infer<typeof loginRequestSchema>): Promise<LoginResponse> => {
  try {
    const response = await apiClient.post<LoginResponse>('/auth/login', credentials);
    return response.data;
  } catch (error: any) {
    if (error.response && error.response.data && error.response.data.error) {
      throw new Error(error.response.data.error);
    }
    throw new Error('登录失败');
  }
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
      if (data.success && data.token) {
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
