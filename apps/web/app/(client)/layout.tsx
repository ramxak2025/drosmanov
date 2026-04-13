'use client';

import { BottomNav } from '@/components/ui/BottomNav';
import { Home, CalendarDays, FileText, User } from 'lucide-react';
import { useRequireAuth } from '@/lib/auth';

const clientTabs = [
  { href: '/client/home', label: 'Главная', icon: Home },
  { href: '/client/booking', label: 'Запись', icon: CalendarDays },
  { href: '/client/visits', label: 'Визиты', icon: FileText },
  { href: '/client/profile', label: 'Профиль', icon: User },
];

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const { loading } = useRequireAuth(['CLIENT']);

  if (loading) {
    return <div className="page-container flex items-center justify-center">
      <div className="animate-pulse text-primary font-semibold">Загрузка...</div>
    </div>;
  }

  return (
    <>
      <main className="page-container px-4">{children}</main>
      <BottomNav tabs={clientTabs} />
    </>
  );
}
