'use client';

import { BottomNav } from '@/components/ui/BottomNav';
import { LayoutDashboard, Users, ListChecks, Settings } from 'lucide-react';
import { useRequireAuth } from '@/lib/auth';

const ownerTabs = [
  { href: '/owner/dashboard', label: 'Дашборд', icon: LayoutDashboard },
  { href: '/owner/staff', label: 'Персонал', icon: Users },
  { href: '/owner/services', label: 'Услуги', icon: ListChecks },
  { href: '/owner/settings', label: 'Настройки', icon: Settings },
];

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  const { loading } = useRequireAuth(['OWNER']);

  if (loading) {
    return <div className="page-container flex items-center justify-center">
      <div className="animate-pulse text-primary font-semibold">Загрузка...</div>
    </div>;
  }

  return (
    <>
      <main className="page-container px-4">{children}</main>
      <BottomNav tabs={ownerTabs} />
    </>
  );
}
