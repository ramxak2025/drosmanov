'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { BottomNav } from './BottomNav';
import {
  CalendarDays, Users, Tag, LogIn,
  Home, FileText, User, Banknote,
  LayoutDashboard, ListChecks, Settings,
} from 'lucide-react';

// Публичное меню (без авторизации)
const publicTabs = [
  { href: '/', label: 'Услуги', icon: CalendarDays },
  { href: '/doctors', label: 'Врачи', icon: Users },
  { href: '/promos', label: 'Акции', icon: Tag },
  { href: '/login', label: 'Вход', icon: LogIn },
];

// Меню клиента
const clientTabs = [
  { href: '/client/home', label: 'Главная', icon: Home },
  { href: '/client/booking', label: 'Запись', icon: CalendarDays },
  { href: '/client/visits', label: 'Визиты', icon: FileText },
  { href: '/client/profile', label: 'Профиль', icon: User },
];

// Меню сотрудника
const staffTabs = [
  { href: '/staff/schedule', label: 'Расписание', icon: CalendarDays },
  { href: '/staff/patients', label: 'Пациенты', icon: Users },
  { href: '/staff/cash', label: 'Касса', icon: Banknote },
  { href: '/client/profile', label: 'Профиль', icon: User },
];

// Меню владельца
const ownerTabs = [
  { href: '/owner/dashboard', label: 'Дашборд', icon: LayoutDashboard },
  { href: '/owner/services', label: 'Услуги', icon: ListChecks },
  { href: '/owner/promotions', label: 'Акции', icon: Tag },
  { href: '/owner/settings', label: 'Настройки', icon: Settings },
];

export function AppNav() {
  const pathname = usePathname();
  const [tabs, setTabs] = useState(publicTabs);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!stored) {
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

  // Скрыть навигацию на странице логина
  if (pathname === '/login') return null;

  return <BottomNav tabs={tabs} />;
}
