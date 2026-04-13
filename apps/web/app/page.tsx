'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!stored) {
      router.push('/login');
      return;
    }

    try {
      const user = JSON.parse(stored);
      switch (user.role) {
        case 'OWNER': router.push('/owner/dashboard'); break;
        case 'STAFF': router.push('/staff/schedule'); break;
        case 'CLIENT': router.push('/client/home'); break;
        default: router.push('/login');
      }
    } catch {
      router.push('/login');
    }
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-pulse text-primary text-xl font-semibold">Dr. Osmanov</div>
    </div>
  );
}
