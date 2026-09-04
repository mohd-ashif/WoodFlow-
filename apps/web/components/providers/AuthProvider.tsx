'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthUserContext } from '@furniture-os/shared';
import { authService } from '../../services/authService';
import { useRouter, usePathname } from 'next/navigation';

interface AuthContextType {
  user: AuthUserContext | null;
  isLoading: boolean;
  login: (data: Parameters<typeof authService.login>[0]) => Promise<void>;
  register: (data: Parameters<typeof authService.register>[0]) => Promise<void>;
  logout: () => Promise<void>;
  refetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUserContext | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const fetchUser = async () => {
    try {
      const data = await authService.me();
      setUser(data.user);
      if (typeof window !== 'undefined') {
        localStorage.setItem('cached_user', JSON.stringify(data.user));
      }
      
      // Redirect if company is suspended
      if (data.user && !data.user.isPlatformAdmin && data.user.activeMembership?.company?.status === 'SUSPENDED') {
        if (pathname !== '/account-suspended') {
          router.push('/account-suspended');
        }
      }
    } catch {
      setUser(null);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('cached_user');
        localStorage.removeItem('accessToken');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('cached_user');
        if (cached) {
          setUser(JSON.parse(cached));
        }
      } catch {}
    }
    fetchUser();
  }, []);

  const login = async (data: Parameters<typeof authService.login>[0]) => {
    const res = await authService.login(data);
    setUser(res.user);
    if (typeof window !== 'undefined') {
      localStorage.setItem('cached_user', JSON.stringify(res.user));
      if (res.tokens?.accessToken) {
        localStorage.setItem('accessToken', res.tokens.accessToken);
      }
    }
    
    // Redirect logic according to Requirement Section 16 & company suspension status
    if (res.user.isPlatformAdmin) {
      router.push('/admin/dashboard');
    } else if (res.user.activeMembership) {
      if (res.user.activeMembership?.company?.status === 'SUSPENDED') {
        router.push('/account-suspended');
      } else {
        router.push('/dashboard');
      }
    } else {
      router.push('/access-request');
    }
  };

  const register = async (data: Parameters<typeof authService.register>[0]) => {
    const res = await authService.register(data);
    setUser(res.user);
    if (typeof window !== 'undefined') {
      localStorage.setItem('cached_user', JSON.stringify(res.user));
      if (res.tokens?.accessToken) {
        localStorage.setItem('accessToken', res.tokens.accessToken);
      }
    }
    router.push('/access-request');
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('cached_user');
      localStorage.removeItem('accessToken');
    }
    router.push('/login');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
        logout,
        refetchUser: fetchUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
