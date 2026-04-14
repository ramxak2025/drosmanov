'use client';

import { LogOut, Phone, User, ChevronRight, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useAuth, useRequireAuth } from '@/lib/auth';

export default function ProfilePage() {
  useRequireAuth();
  const { user, logout } = useAuth();

  return (
    <div className="px-6 pt-12 pb-8">
      <h1 className="text-h2">Профиль</h1>

      {/* Карточка пользователя */}
      <div className="bg-bg-card rounded-lg shadow-card p-6 mt-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-brand-light flex items-center justify-center flex-shrink-0">
            <User size={24} className="text-brand" />
          </div>
          <div>
            <p className="text-[15px] font-bold">{user?.name || 'Пациент'}</p>
            <p className="text-sm text-ink-secondary flex items-center gap-1 mt-1">
              <Phone size={13} /> {user?.phone}
            </p>
          </div>
        </div>
      </div>

      {/* Бонусная программа — анонс */}
      {user?.role === 'CLIENT' && (
        <div className="relative bg-gradient-to-br from-ink via-ink to-brand-dark rounded-lg p-6 mt-4 overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-brand/20 blur-2xl" />
          <div className="relative">
            <div className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-2.5 py-1 rounded-full mb-3">
              <Sparkles size={10} className="text-brand-muted" />
              <p className="text-[9px] font-bold text-white/90 tracking-widest uppercase">Скоро</p>
            </div>
            <p className="text-[18px] font-extrabold text-white leading-tight">
              Бонусная программа
            </p>
            <p className="text-[12px] text-white/60 mt-2 leading-relaxed">
              Мы скоро запустим бонусную систему. Получайте&nbsp;5% с&nbsp;каждого визита.
            </p>
          </div>
        </div>
      )}

      {/* Меню */}
      <div className="mt-6 stack-sm">
        <MenuRow label="Мои визиты" href="/client/visits" />
        <MenuRow label="Записаться на приём" href="/client/booking" />
      </div>

      {/* Выйти */}
      <button onClick={logout}
        className="w-full mt-8 bg-bg-card rounded-lg shadow-card p-4 flex items-center justify-center gap-3 text-status-red
          active:scale-[0.98] transition-transform">
        <LogOut size={18} />
        <span className="text-sm font-semibold">Выйти</span>
      </button>

      <Link href="/" className="block text-center text-sm text-ink-tertiary mt-4 font-medium">
        На главную
      </Link>
    </div>
  );
}

function MenuRow({ label, href }: { label: string; href: string }) {
  return (
    <Link href={href}>
      <div className="bg-bg-card rounded-lg shadow-card p-4 flex items-center justify-between
        active:scale-[0.98] transition-transform">
        <span className="text-sm font-semibold">{label}</span>
        <ChevronRight size={16} className="text-ink-disabled" />
      </div>
    </Link>
  );
}
