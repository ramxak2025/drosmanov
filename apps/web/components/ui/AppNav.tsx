'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { BottomNav } from './BottomNav';
import {
  Home, CalendarDays, Users, MapPin, LogIn,
  FileText, User,
  LayoutDashboard, ListChecks, Tag, Settings, UserCog,
} from 'lucide-react';

const publicTabs = [
  { href: '/', label: 'Главная', icon: Home },
  { href: '/price', label: 'Цены', icon: CalendarDays },
  { href: '/doctors', label: 'Врачи', icon: Users },
  { href: '/contacts', label: 'Контакты', icon: MapPin },
  { href: '/login', label: 'ЛК', icon: LogIn },
];

const clientTabs = [
  { href: '/client/home', label: 'Главная', icon: Home },
  { href: '/client/booking', label: 'Запись', icon: CalendarDays },
  { href: '/client/visits', label: 'Визиты', icon: FileText },
  { href: '/client/profile', label: 'Профиль', icon: User },
];

// Без кассы
const staffTabs = [
  { href: '/staff/schedule', label: 'Приёмы', icon: CalendarDays },
  { href: '/staff/patients', label: 'Пациенты', icon: Users },
  { href: '/client/profile', label: 'Профиль', icon: User },
];

const ownerTabs = [
  { href: '/owner/dashboard', label: 'Главная', icon: LayoutDashboard },
  { href: '/owner/services', label: 'Услуги', icon: ListChecks },
  { href: '/owner/doctors', label: 'Врачи', icon: UserCog },
  { href: '/owner/promotions', label: 'Акции', icon: Tag },
  { href: '/owner/settings', label: 'Ещё', icon: Settings },
];

export function AppNav() {
  const pathname = usePathname();
  const [tabs, setTabs] = useState(publicTabs);

  useEffect(() => {
    const isPublic = ['/', '/price', '/doctors', '/promos', '/contacts', '/login', '/booking'].includes(pathname);
    const stored = localStorage.getItem('user');
    if (!stored || isPublic) {
      setTabs(publicTabs);
      return;
    }
    try {
      const user = JSON.parse(stored);
      switch (user.role) {
        case 'OWNER': setTabs(ownerTabs); break;
        case 'STAFF': setTabs(staffTabs); break;
        case 'CLIENT': setTabs(clientTabs); break;
        default: setTabs(publicTabs);
      }
    } catch {
      setTabs(publicTabs);
    }
  }, [pathname]);

  return <BottomNav tabs={tabs} />;
}
