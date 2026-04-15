'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Phone, LogIn, LogOut, User } from 'lucide-react';
import api from '@/lib/api';

/**
 * Верхний header для ПК — показывается только на экранах ≥ 768px (md).
 * На мобильной версии скрыт.
 */
export function TopNav() {
  const pathname = usePathname();
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);
  const [phone, setPhone] = useState('+7 (8722) 12-34-56');

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch { /* ignore */ }
    }
    // Телефон из настроек клиники
    api.get('/settings')
      .then((r) => { if (r.data.data?.phone) setPhone(r.data.data.phone); })
      .catch(() => {});
  }, [pathname]);

  const logout = async () => {
    try { await api.post('/auth/logout'); } catch { /* ignore */ }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  // Публичные ссылки
  const publicLinks = [
    { href: '/', label: 'Главная' },
    { href: '/price', label: 'Цены' },
    { href: '/doctors', label: 'Врачи' },
    { href: '/promos', label: 'Акции' },
    { href: '/contacts', label: 'Контакты' },
  ];

  // Ссылки ЛК для роли
  const cabinetLinks: Record<string, { href: string; label: string }[]> = {
    CLIENT: [
      { href: '/client/home', label: 'Главная' },
      { href: '/client/booking', label: 'Запись' },
      { href: '/client/visits', label: 'Визиты' },
      { href: '/client/profile', label: 'Профиль' },
    ],
    STAFF: [
      { href: '/staff/schedule', label: 'Приёмы' },
      { href: '/staff/patients', label: 'Пациенты' },
      { href: '/staff/profile', label: 'Профиль' },
    ],
    OWNER: [
      { href: '/owner/schedule', label: 'Приёмы' },
      { href: '/owner/services', label: 'Услуги' },
      { href: '/owner/doctors', label: 'Врачи' },
      { href: '/owner/promotions', label: 'Акции' },
      { href: '/owner/dashboard', label: 'Статистика' },
      { href: '/owner/settings', label: 'Настройки' },
    ],
  };

  // Определяем находимся ли в ЛК или на публичной
  const inCabinet = user && (
    pathname.startsWith('/client/') ||
    pathname.startsWith('/staff/') ||
    pathname.startsWith('/owner/')
  );

  const links = inCabinet && user ? cabinetLinks[user.role] || [] : publicLinks;

  return (
    <header className="hidden md:block fixed top-0 left-0 right-0 z-40 bg-bg/85 backdrop-blur-xl border-b border-line">
      <div className="max-w-[1200px] mx-auto px-8 h-16 flex items-center gap-8">
        {/* Логотип */}
        <Link href={user ? `/${user.role.toLowerCase()}/${user.role === 'OWNER' ? 'schedule' : user.role === 'STAFF' ? 'schedule' : 'home'}` : '/'}
          className="flex items-center gap-2.5 flex-shrink-0">
          <div className="w-9 h-9 rounded-md bg-brand-light flex items-center justify-center">
            <span className="text-[13px] font-extrabold text-brand-dark">DO</span>
          </div>
          <span className="text-[15px] font-extrabold">Dr. Osmanov</span>
        </Link>

        {/* Ссылки */}
        <nav className="flex items-center gap-1 flex-1">
          {links.map((l) => {
            const active = l.href === '/' ? pathname === '/' : pathname.startsWith(l.href);
            return (
              <Link key={l.href} href={l.href}
                className={`px-4 py-2 rounded-md text-[13px] font-semibold transition-colors
                  ${active ? 'bg-brand-subtle text-brand-dark' : 'text-ink-secondary hover:text-ink hover:bg-bg-card'}`}>
                {l.label}
              </Link>
            );
          })}
        </nav>

        {/* Правая часть: телефон + вход/лк */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {!inCabinet && (
            <a href={`tel:${phone.replace(/\D/g, '')}`}
              className="hidden lg:flex items-center gap-2 text-[13px] font-semibold text-ink">
              <Phone size={14} className="text-brand" /> {phone}
            </a>
          )}

          {user ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-bg-card rounded-md shadow-soft">
                <div className="w-7 h-7 rounded-full bg-brand-light flex items-center justify-center">
                  <User size={14} className="text-brand" />
                </div>
                <span className="text-[13px] font-semibold max-w-[140px] truncate">{user.name}</span>
              </div>
              <button onClick={logout}
                className="w-9 h-9 rounded-md bg-bg-card shadow-soft flex items-center justify-center text-status-red
                  hover:scale-105 transition-transform" title="Выйти">
                <LogOut size={15} />
              </button>
            </div>
          ) : (
            <Link href="/login"
              className="flex items-center gap-2 bg-brand text-white px-5 py-2.5 rounded-md text-[13px] font-bold
                shadow-button active:scale-95 transition-transform">
              <LogIn size={14} /> Войти
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
