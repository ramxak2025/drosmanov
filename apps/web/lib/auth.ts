'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  name: string;
  role: 'OWNER' | 'STAFF' | 'CLIENT';
  phone: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      setUser(JSON.parse(stored));
    }
    setLoading(false);
  }, []);

  const login = (accessToken: string, userData: User) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);

    switch (userData.role) {
      case 'OWNER': router.push('/owner/dashboard'); break;
      case 'STAFF': router.push('/staff/schedule'); break;
      case 'CLIENT': router.push('/client/home'); break;
    }
  };

  const logout = async () => {
    try {
      const api = (await import('./api')).default;
      await api.post('/auth/logout');
    } catch { /* ignore */ }

    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    setUser(null);
    router.push('/');
  };

  return { user, loading, login, logout };
}

export function useRequireAuth(allowedRoles?: string[]) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
    if (!loading && user && allowedRoles && !allowedRoles.includes(user.role)) {
      router.push('/login');
    }
  }, [user, loading, router, allowedRoles]);

  return { user, loading };
}
