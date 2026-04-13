'use client';

import { BottomNav } from '@/components/ui/BottomNav';
import { CalendarDays, Users, Banknote } from 'lucide-react';
import { useRequireAuth } from '@/lib/auth';

const staffTabs = [
  { href: '/staff/schedule', label: 'Расписание', icon: CalendarDays },
  { href: '/staff/patients', label: 'Пациенты', icon: Users },
  { href: '/staff/cash', label: 'Касса', icon: Banknote },
];

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  const { loading } = useRequireAuth(['STAFF']);

  if (loading) {
    return <div className="page-container flex items-center justify-center">
      <div className="animate-pulse text-primary font-semibold">Загрузка...</div>
    </div>;
  }

  return (
    <>
      <main className="page-container px-4">{children}</main>
      <BottomNav tabs={staffTabs} />
    </>
  );
}
